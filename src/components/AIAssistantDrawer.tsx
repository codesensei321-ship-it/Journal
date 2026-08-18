import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Calendar, 
  ChevronRight,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { ChatMessage, JournalEntry } from '../types';
import { processJournalQuery } from '../lib/ai-assistant';
import { formatShortDate, cn } from '../lib/utils';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Record<string, JournalEntry>;
  onSelectDate: (dateStr: string) => void;
  initialPrompt?: string;
}

const DEFAULT_SUGGESTIONS = [
  'When did I talk about architecture and tech?',
  'When did I talk about my workout or running?',
  'Summarize my reflections from this week with key takeaways',
  'Calculate my consistency and word count stats',
  'What are recurring themes in my thoughts?'
];

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  entries,
  onSelectDate,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello Zaid! I'm your **Gemini 2.5 Flash** Journal Assistant.\n\nI can analyze your past entries, format insights with **bold highlights**, lists, mathematical statistics (via $\\KaTeX$), and link directly to your journal dates.\n\nWhat would you like to explore today?",
      timestamp: Date.now(),
      referencedDates: [],
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputValue).trim();
    if (!textToSend || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await processJournalQuery(textToSend, entries);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: Date.now(),
        referencedDates: response.referencedDates,
        quotes: response.quotes,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Failed to get Gemini response:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'I ran into an issue scanning your journal entries. Please try asking again in a slightly different way!',
          timestamp: Date.now(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in cursor-pointer"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-[#09090b] h-full shadow-2xl border-l border-white/10 flex flex-col z-10 animate-in slide-in-from-right duration-200 text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#09090b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white">Gemini 2.5 Flash</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  LaTeX & Markdown
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Connected to {Object.keys(entries).length} Firestore documents
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2.5 text-xs sm:text-sm animate-in fade-in',
                  isUser ? 'justify-end' : 'justify-start'
                )}
              >
                {/* Message Body */}
                <div
                  className={cn(
                    'max-w-[90%] rounded-2xl p-4 leading-relaxed text-xs sm:text-[13px] relative group',
                    isUser
                      ? 'bg-indigo-600/25 p-3.5 rounded-2xl rounded-tr-none border border-indigo-500/30 text-white ml-4'
                      : 'bg-[#18181b] p-4 rounded-2xl rounded-tl-none border border-white/10 text-slate-200 mr-4 shadow-md'
                  )}
                >
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="absolute top-2.5 right-2.5 p-1 rounded-md bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {isUser ? (
                    <div className="whitespace-pre-wrap font-sans font-medium">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="markdown-container text-slate-200 leading-relaxed space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          strong: ({ children }) => (
                            <strong className="font-bold text-indigo-300">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-slate-300">
                              {children}
                            </em>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-base font-bold text-white mt-3 mb-1 border-b border-white/10 pb-1">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-sm font-bold text-white mt-2.5 mb-1">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xs font-bold text-slate-200 mt-2 mb-0.5">
                              {children}
                            </h3>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-4 space-y-1 my-1 text-slate-300">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-4 space-y-1 my-1 text-slate-300 font-sans">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="leading-normal">
                              {children}
                            </li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-indigo-500 pl-3 py-0.5 my-2 italic text-slate-400 bg-white/5 rounded-r">
                              {children}
                            </blockquote>
                          ),
                          code: ({ inline, className, children, ...props }: any) => {
                            return inline ? (
                              <code
                                className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono text-[11px] border border-white/5"
                                {...props}
                              >
                                {children}
                              </code>
                            ) : (
                              <div className="my-2 rounded-xl bg-black/50 p-3 font-mono text-xs text-emerald-300 border border-white/10 overflow-x-auto">
                                <code>{children}</code>
                              </div>
                            );
                          },
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-2 rounded-lg border border-white/10">
                              <table className="min-w-full text-xs text-left">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="bg-white/5 px-2.5 py-1.5 font-semibold text-white border-b border-white/10">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-2.5 py-1.5 border-b border-white/5 text-slate-300">
                              {children}
                            </td>
                          ),
                          p: ({ children }) => (
                            <p className="mb-1.5 last:mb-0 leading-relaxed">
                              {children}
                            </p>
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Referenced Dates Jump Cards */}
                  {msg.referencedDates && msg.referencedDates.length > 0 && (
                    <div className="mt-3.5 pt-2.5 border-t border-white/10 space-y-1.5">
                      <div className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Referenced Dates in Journal:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.referencedDates.map((dateStr) => {
                          const formatted = formatShortDate(dateStr);
                          const entryForDate = entries[dateStr];

                          return (
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => {
                                onSelectDate(dateStr);
                                onClose();
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-slate-200 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all group cursor-pointer"
                            >
                              <span>{formatted}</span>
                              {entryForDate?.title && (
                                <span className="text-[10px] text-slate-400 max-w-[120px] truncate group-hover:text-indigo-200">
                                  ({entryForDate.title})
                                </span>
                              )}
                              <ChevronRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 text-xs items-center animate-in fade-in">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <div className="bg-[#18181b] p-3 rounded-2xl rounded-tl-none border border-white/10 text-slate-300 text-xs flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span>Gemini 2.5 Flash is thinking & compiling insights...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Inquiries */}
        <div className="px-4 py-2.5 bg-[#18181b] border-t border-white/10">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Quick Inquiries
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {DEFAULT_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(sug)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-[#09090b]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Gemini (supports Math $\LaTeX$, summaries, insights)..."
              className="flex-1 bg-[#18181b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-40 shrink-0 cursor-pointer shadow-md shadow-indigo-600/30"
              title="Send to Gemini"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
