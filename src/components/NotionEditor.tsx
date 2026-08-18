import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Heading1, 
  Heading2, 
  Heading3, 
  Type, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  AlertCircle, 
  Code, 
  Minus, 
  Sparkles, 
  Smile, 
  Tag as TagIcon, 
  Sun, 
  Check, 
  Clock, 
  BookOpen, 
  Loader2, 
  Cloud, 
  Image as ImageIcon,
  MoreHorizontal,
  ChevronDown,
  Calendar as CalendarIcon
} from 'lucide-react';
import { 
  JournalBlock, 
  JournalEntry, 
  BlockType, 
  JournalMood, 
  FontPreference 
} from '../types';
import { 
  formatFriendlyDate, 
  countWordsInBlocks, 
  getTodayDateString, 
  cn 
} from '../lib/utils';
import { saveEntry } from '../lib/storage';

interface NotionEditorProps {
  currentDateString: string;
  entry: JournalEntry | null;
  onEntryUpdated: (entry: JournalEntry) => void;
  fontPreference: FontPreference;
  onAskAIAboutThisDay?: (dateStr: string) => void;
}

interface SlashMenuItem {
  type: BlockType | 'template_gratitude' | 'template_reflection' | 'template_workout';
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'Basic Blocks' | 'Lists & Media' | 'Templates';
}

const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  { type: 'paragraph', label: 'Text', description: 'Just start writing with plain text', icon: <Type className="w-4 h-4 text-slate-400" />, category: 'Basic Blocks' },
  { type: 'h1', label: 'Heading 1', description: 'Big section heading', icon: <Heading1 className="w-4 h-4 text-white" />, category: 'Basic Blocks' },
  { type: 'h2', label: 'Heading 2', description: 'Medium section heading', icon: <Heading2 className="w-4 h-4 text-slate-300" />, category: 'Basic Blocks' },
  { type: 'h3', label: 'Heading 3', description: 'Small section heading', icon: <Heading3 className="w-4 h-4 text-slate-400" />, category: 'Basic Blocks' },
  { type: 'todo', label: 'To-do list', description: 'Track tasks with a to-do list', icon: <CheckSquare className="w-4 h-4 text-amber-400" />, category: 'Lists & Media' },
  { type: 'bullet', label: 'Bulleted list', description: 'Create a simple bulleted list', icon: <List className="w-4 h-4 text-slate-300" />, category: 'Lists & Media' },
  { type: 'numbered', label: 'Numbered list', description: 'Create a list with numbering', icon: <ListOrdered className="w-4 h-4 text-slate-300" />, category: 'Lists & Media' },
  { type: 'quote', label: 'Quote', description: 'Capture a quote or key reflection', icon: <Quote className="w-4 h-4 text-indigo-400" />, category: 'Lists & Media' },
  { type: 'callout', label: 'Callout', description: 'Make writing stand out with an emoji', icon: <AlertCircle className="w-4 h-4 text-amber-400" />, category: 'Lists & Media' },
  { type: 'code', label: 'Code', description: 'Capture a code snippet', icon: <Code className="w-4 h-4 text-emerald-400" />, category: 'Lists & Media' },
  { type: 'divider', label: 'Divider', description: 'Visually divide blocks', icon: <Minus className="w-4 h-4 text-slate-500" />, category: 'Lists & Media' },
  { type: 'template_gratitude', label: 'Daily Gratitude', description: '3 morning gratitudes prompt', icon: <Sparkles className="w-4 h-4 text-amber-400" />, category: 'Templates' },
  { type: 'template_reflection', label: 'Evening Review', description: 'Wins, takeaways, and tomorrow plans', icon: <BookOpen className="w-4 h-4 text-indigo-400" />, category: 'Templates' },
  { type: 'template_workout', label: 'Workout Log', description: 'Exercise, distance, and health stats', icon: <Smile className="w-4 h-4 text-emerald-400" />, category: 'Templates' },
];

const EMOJI_PICKER_OPTIONS = ['📝', '💡', '🧠', '⚡', '🎯', '🚀', '🌿', '☕', '🏃', '📚', '🌙', '✨', '🔥', '🧘', '🌊'];

const COVER_GRADIENTS = [
  'bg-gradient-to-r from-zinc-800 via-stone-900 to-zinc-950',
  'bg-gradient-to-r from-slate-900 via-indigo-950 to-zinc-950',
  'bg-gradient-to-r from-emerald-950 via-teal-950 to-zinc-950',
  'bg-gradient-to-r from-amber-950 via-zinc-900 to-neutral-950',
  'bg-gradient-to-r from-rose-950 via-purple-950 to-zinc-950',
];

const MOODS: { mood: JournalMood; label: string; emoji: string }[] = [
  { mood: 'inspired', label: 'Inspired', emoji: '⚡' },
  { mood: 'great', label: 'Great', emoji: '😄' },
  { mood: 'good', label: 'Good', emoji: '😊' },
  { mood: 'neutral', label: 'Neutral', emoji: '😐' },
  { mood: 'tired', label: 'Tired', emoji: '😴' },
  { mood: 'stressed', label: 'Stressed', emoji: '🌧️' },
];

export const NotionEditor: React.FC<NotionEditorProps> = ({
  currentDateString,
  entry,
  onEntryUpdated,
  fontPreference,
  onAskAIAboutThisDay,
}) => {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('📝');
  const [coverImage, setCoverImage] = useState<string>('');
  const [blocks, setBlocks] = useState<JournalBlock[]>([]);
  const [mood, setMood] = useState<JournalMood | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [weather, setWeather] = useState<string>('');
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Firestore Sync & Auto-save Status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('just now');

  // Slash command state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [slashFilter, setSlashFilter] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const blockInputRefs = useRef<{ [key: string]: HTMLTextAreaElement | HTMLInputElement | null }>({});

  // Initialize or load selected entry from Firestore
  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setIcon(entry.icon || '📝');
      setCoverImage(entry.coverImage || '');
      setBlocks(entry.blocks && entry.blocks.length > 0 ? entry.blocks : createDefaultBlocks());
      setMood(entry.mood);
      setTags(entry.tags || []);
      setWeather(entry.weather || '');
    } else {
      // 0 Scratch: Fresh clean page ready to write
      setTitle('');
      setIcon('📝');
      setCoverImage('');
      setBlocks(createDefaultBlocks());
      setMood(undefined);
      setTags([]);
      setWeather('');
    }
    setSaveStatus('saved');
    setLastSavedTime('just now');
  }, [currentDateString, entry?.id]);

  function createDefaultBlocks(): JournalBlock[] {
    return [
      {
        id: `b-${Date.now()}-1`,
        type: 'paragraph',
        content: '',
      }
    ];
  }

  const performSave = useCallback((
    newTitle: string,
    newBlocks: JournalBlock[],
    newIcon: string,
    newCover: string,
    newMood?: JournalMood,
    newTags?: string[],
    newWeather?: string
  ) => {
    const words = countWordsInBlocks(newBlocks);
    
    const updated: JournalEntry = {
      id: currentDateString,
      date: currentDateString,
      title: newTitle,
      icon: newIcon,
      coverImage: newCover,
      blocks: newBlocks,
      mood: newMood,
      tags: newTags || tags,
      weather: newWeather || weather,
      wordCount: words,
      readingTime: Math.max(1, Math.ceil(words / 200)),
      createdAt: entry?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    saveEntry(updated);
    onEntryUpdated(updated);

    const now = new Date();
    setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setSaveStatus('saved');
  }, [currentDateString, entry?.createdAt, tags, weather, onEntryUpdated]);

  const triggerSaveDebounced = useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = (
    newTitle: string,
    newBlocks: JournalBlock[],
    newIcon: string = icon,
    newCover: string = coverImage,
    newMood: JournalMood | undefined = mood,
    newTags: string[] = tags,
    newWeather: string = weather
  ) => {
    setSaveStatus('saving');
    setTitle(newTitle);
    setBlocks(newBlocks);
    setIcon(newIcon);
    setCoverImage(newCover);
    setMood(newMood);
    setTags(newTags);
    setWeather(newWeather);

    if (triggerSaveDebounced.current) {
      clearTimeout(triggerSaveDebounced.current);
    }
    triggerSaveDebounced.current = setTimeout(() => {
      performSave(newTitle, newBlocks, newIcon, newCover, newMood, newTags, newWeather);
    }, 450);
  };

  const updateBlock = (index: number, updates: Partial<JournalBlock>) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], ...updates };
    handleContentChange(title, updated, icon, coverImage, mood, tags, weather);
  };

  const addBlockBelow = (index: number, type: BlockType = 'paragraph', content = '') => {
    const newBlock: JournalBlock = {
      id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      content,
      checked: type === 'todo' ? false : undefined,
      calloutEmoji: type === 'callout' ? '💡' : undefined,
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, newBlock);
    handleContentChange(title, updated, icon, coverImage, mood, tags, weather);

    setTimeout(() => {
      const ref = blockInputRefs.current[newBlock.id];
      if (ref) ref.focus();
    }, 50);
  };

  const removeBlock = (index: number) => {
    if (blocks.length <= 1) {
      updateBlock(0, { type: 'paragraph', content: '' });
      return;
    }
    const updated = [...blocks];
    const prevBlockId = index > 0 ? blocks[index - 1].id : null;
    updated.splice(index, 1);
    handleContentChange(title, updated, icon, coverImage, mood, tags, weather);

    if (prevBlockId) {
      setTimeout(() => {
        const ref = blockInputRefs.current[prevBlockId];
        if (ref) ref.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, block: JournalBlock) => {
    if (slashMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenuIndex((prev) => (prev + 1) % filteredMenuItems.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenuIndex((prev) => (prev - 1 + filteredMenuItems.length) % filteredMenuItems.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredMenuItems[slashMenuIndex]) {
          applySlashItem(filteredMenuItems[slashMenuIndex].type, index);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashMenuOpen(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (block.type === 'bullet' || block.type === 'numbered' || block.type === 'todo') {
        if (block.content.trim() === '') {
          updateBlock(index, { type: 'paragraph' });
        } else {
          addBlockBelow(index, block.type);
        }
      } else {
        addBlockBelow(index, 'paragraph');
      }
    } else if (e.key === 'Backspace' && block.content === '') {
      if (block.type !== 'paragraph') {
        e.preventDefault();
        updateBlock(index, { type: 'paragraph' });
      } else if (blocks.length > 1) {
        e.preventDefault();
        removeBlock(index);
      }
    } else if (e.key === '/') {
      setActiveBlockIndex(index);
      setSlashFilter('');
      setSlashMenuIndex(0);
      
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const containerRect = editorContainerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
      
      setMenuPosition({
        top: rect.bottom - containerRect.top + 8,
        left: Math.min(rect.left - containerRect.left, 240),
      });
      setSlashMenuOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, index: number) => {
    const val = e.target.value;
    
    if (slashMenuOpen && activeBlockIndex === index) {
      if (val.includes('/')) {
        const afterSlash = val.substring(val.lastIndexOf('/') + 1);
        setSlashFilter(afterSlash.toLowerCase());
      } else {
        setSlashMenuOpen(false);
      }
    }

    updateBlock(index, { content: val });
  };

  const applySlashItem = (type: SlashMenuItem['type'], index: number) => {
    const currentContent = blocks[index].content.replace(/\/[a-zA-Z0-9]*$/, '').trim();

    if (type === 'template_gratitude') {
      const templateBlocks: JournalBlock[] = [
        { id: `b-${Date.now()}-1`, type: 'h2', content: '🌟 3 Daily Gratitudes' },
        { id: `b-${Date.now()}-2`, type: 'numbered', content: 'What made you smile today?' },
        { id: `b-${Date.now()}-3`, type: 'numbered', content: 'An accomplishment or progress made' },
        { id: `b-${Date.now()}-4`, type: 'numbered', content: 'A person or moment you are thankful for' },
        { id: `b-${Date.now()}-5`, type: 'paragraph', content: '' }
      ];
      const updated = [...blocks];
      updated.splice(index, 1, ...templateBlocks);
      handleContentChange(title, updated);
    } else if (type === 'template_reflection') {
      const templateBlocks: JournalBlock[] = [
        { id: `b-${Date.now()}-1`, type: 'h2', content: '🌙 Daily Reflection & Review' },
        { id: `b-${Date.now()}-2`, type: 'callout', content: 'Big Win: What went really well today?', calloutEmoji: '🏆' },
        { id: `b-${Date.now()}-3`, type: 'todo', content: 'Key lesson or insight to remember', checked: true },
        { id: `b-${Date.now()}-4`, type: 'todo', content: 'Top priority for tomorrow', checked: false },
        { id: `b-${Date.now()}-5`, type: 'paragraph', content: '' }
      ];
      const updated = [...blocks];
      updated.splice(index, 1, ...templateBlocks);
      handleContentChange(title, updated);
    } else if (type === 'template_workout') {
      const templateBlocks: JournalBlock[] = [
        { id: `b-${Date.now()}-1`, type: 'h2', content: '🏃 Fitness & Health Log' },
        { id: `b-${Date.now()}-2`, type: 'bullet', content: 'Activity / Routine: ' },
        { id: `b-${Date.now()}-3`, type: 'bullet', content: 'Duration / Pace: ' },
        { id: `b-${Date.now()}-4`, type: 'bullet', content: 'Hydration & Feeling: ' },
        { id: `b-${Date.now()}-5`, type: 'paragraph', content: '' }
      ];
      const updated = [...blocks];
      updated.splice(index, 1, ...templateBlocks);
      handleContentChange(title, updated);
    } else {
      updateBlock(index, {
        type: type as BlockType,
        content: currentContent,
        checked: type === 'todo' ? false : undefined,
        calloutEmoji: type === 'callout' ? '💡' : undefined,
      });
    }

    setSlashMenuOpen(false);
    setSlashFilter('');

    setTimeout(() => {
      const ref = blockInputRefs.current[blocks[index]?.id];
      if (ref) ref.focus();
    }, 50);
  };

  const filteredMenuItems = SLASH_MENU_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(slashFilter) ||
    item.description.toLowerCase().includes(slashFilter) ||
    item.type.toLowerCase().includes(slashFilter)
  );

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim() && !tags.includes(newTagInput.trim().toLowerCase())) {
      const updatedTags = [...tags, newTagInput.trim().toLowerCase()];
      handleContentChange(title, blocks, icon, coverImage, mood, updatedTags);
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);
    handleContentChange(title, blocks, icon, coverImage, mood, updatedTags);
  };

  const wordCount = countWordsInBlocks(blocks);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const isTodayDate = currentDateString === getTodayDateString();

  const fontClass = 
    fontPreference === 'serif' ? 'font-serif' : 
    fontPreference === 'mono' ? 'font-mono' : 'font-sans';

  return (
    <div 
      ref={editorContainerRef}
      className={cn(
        'relative w-full max-w-4xl mx-auto bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl text-slate-200 transition-all overflow-hidden',
        fontClass
      )}
    >
      {/* Notion Cover Header */}
      {coverImage ? (
        <div className={cn('h-36 w-full relative group transition-all', coverImage)}>
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextCover = COVER_GRADIENTS[(COVER_GRADIENTS.indexOf(coverImage) + 1) % COVER_GRADIENTS.length];
                handleContentChange(title, blocks, icon, nextCover);
              }}
              className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
            >
              Change Cover
            </button>
            <button
              type="button"
              onClick={() => handleContentChange(title, blocks, icon, '')}
              className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-rose-300 text-xs font-medium backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="h-4 w-full" />
      )}

      <div className="p-6 sm:p-10 pt-4 sm:pt-6">
        {/* Notion Page Icon & Quick Actions Bar */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-12 h-12 text-2xl flex items-center justify-center rounded-2xl bg-[#18181b] hover:bg-white/10 border border-white/10 transition-all cursor-pointer shadow-md"
              title="Change icon"
            >
              {icon}
            </button>

            {/* Emoji Picker Dropdown */}
            {showEmojiPicker && (
              <div className="absolute top-full left-0 mt-2 p-2 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-40 grid grid-cols-5 gap-1 w-52 animate-in fade-in zoom-in-95">
                {EMOJI_PICKER_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      handleContentChange(title, blocks, e);
                      setShowEmojiPicker(false);
                    }}
                    className="w-9 h-9 flex items-center justify-center text-lg rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cover & AI trigger button */}
          <div className="flex items-center gap-2">
            {!coverImage && (
              <button
                type="button"
                onClick={() => handleContentChange(title, blocks, icon, COVER_GRADIENTS[0])}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Add Cover</span>
              </button>
            )}

            {onAskAIAboutThisDay && (
              <button
                type="button"
                onClick={() => onAskAIAboutThisDay(currentDateString)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors cursor-pointer"
                title="Ask Gemini 2.5 Flash about this day"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gemini Analysis</span>
              </button>
            )}
          </div>
        </div>

        {/* Page Title (Border-free Notion Style) */}
        <div className="mb-6">
          <input
            id="journal-entry-title"
            type="text"
            value={title}
            onChange={(e) => handleContentChange(e.target.value, blocks)}
            placeholder="Untitled"
            className="w-full text-3xl sm:text-4xl font-bold tracking-tight text-white outline-none bg-transparent placeholder-slate-700 font-sans"
          />
        </div>

        {/* Notion Page Properties Table */}
        <div className="border-t border-b border-white/5 py-3 mb-8 space-y-2 text-xs">
          {/* Property: Date */}
          <div className="flex items-center">
            <div className="w-28 text-slate-500 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Date</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <span>{formatFriendlyDate(currentDateString)}</span>
              {isTodayDate && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold border border-indigo-500/30">
                  Today
                </span>
              )}
            </div>
          </div>

          {/* Property: Mood */}
          <div className="flex items-center">
            <div className="w-28 text-slate-500 flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5" />
              <span>Mood</span>
            </div>
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              >
                {mood ? (
                  <span>{MOODS.find(m => m.mood === mood)?.emoji} {MOODS.find(m => m.mood === mood)?.label}</span>
                ) : (
                  <span className="text-slate-500">Empty</span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              <div className="absolute left-0 top-full mt-1 w-40 p-1.5 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-30 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                {MOODS.map((m) => (
                  <button
                    key={m.mood}
                    type="button"
                    onClick={() => handleContentChange(title, blocks, icon, coverImage, m.mood)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors',
                      mood === m.mood ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-white/5 text-slate-300'
                    )}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Property: Tags */}
          <div className="flex items-center">
            <div className="w-28 text-slate-500 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5" />
              <span>Tags</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#18181b] border border-white/5 text-slate-300 text-[11px] group"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                  >
                    ×
                  </button>
                </span>
              ))}

              {isAddingTag ? (
                <form onSubmit={handleAddTag} className="inline-flex items-center">
                  <input
                    type="text"
                    autoFocus
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onBlur={() => setIsAddingTag(false)}
                    placeholder="tag..."
                    className="px-1.5 py-0.5 text-xs bg-[#18181b] border border-indigo-500 rounded text-white focus:outline-none w-16"
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="px-1.5 py-0.5 rounded border border-dashed border-white/10 text-slate-500 hover:text-white text-[11px] transition-colors"
                >
                  + Add Tag
                </button>
              )}
            </div>
          </div>

          {/* Property: Stats */}
          <div className="flex items-center">
            <div className="w-28 text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Word Count</span>
            </div>
            <div className="text-slate-400">
              {wordCount} words • {readingTime} min read
            </div>
          </div>
        </div>

        {/* Notion Blocks Canvas */}
        <div className="space-y-1.5 relative min-h-[360px]">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className="group relative flex items-start gap-2 py-1 -mx-2 px-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {/* Block Hover Grip Handle & Quick Add Button */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 mt-1 shrink-0 select-none transition-opacity">
                <button
                  type="button"
                  onClick={() => addBlockBelow(index, 'paragraph')}
                  className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/10"
                  title="Add block below (or press Enter)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => removeBlock(index)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-white/10"
                  title="Delete block"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Block Content Renderer */}
              <div className="flex-1 w-full min-w-0">
                {block.type === 'h1' && (
                  <input
                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                    type="text"
                    value={block.content}
                    onChange={(e) => handleInputChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index, block)}
                    placeholder="Heading 1..."
                    className="w-full font-bold text-2xl sm:text-3xl text-white bg-transparent border-none focus:outline-none placeholder-slate-700 tracking-tight"
                  />
                )}

                {block.type === 'h2' && (
                  <input
                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                    type="text"
                    value={block.content}
                    onChange={(e) => handleInputChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index, block)}
                    placeholder="Heading 2..."
                    className="w-full font-bold text-xl sm:text-2xl text-white bg-transparent border-none focus:outline-none placeholder-slate-700 tracking-tight mt-1"
                  />
                )}

                {block.type === 'h3' && (
                  <input
                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                    type="text"
                    value={block.content}
                    onChange={(e) => handleInputChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index, block)}
                    placeholder="Heading 3..."
                    className="w-full font-semibold text-lg text-slate-100 bg-transparent border-none focus:outline-none placeholder-slate-700"
                  />
                )}

                {block.type === 'paragraph' && (
                  <textarea
                    ref={(el) => { blockInputRefs.current[block.id] = el; }}
                    rows={1}
                    value={block.content}
                    onChange={(e) => {
                      handleInputChange(e, index);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => handleKeyDown(e, index, block)}
                    placeholder="Type '/' for Notion commands..."
                    className="w-full text-base leading-relaxed text-slate-300 bg-transparent border-none focus:outline-none placeholder-slate-600 resize-none overflow-hidden"
                  />
                )}

                {block.type === 'bullet' && (
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5 shrink-0" />
                    <textarea
                      ref={(el) => { blockInputRefs.current[block.id] = el; }}
                      rows={1}
                      value={block.content}
                      onChange={(e) => {
                        handleInputChange(e, index);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                      placeholder="List item..."
                      className="w-full text-base text-slate-300 bg-transparent border-none focus:outline-none placeholder-slate-600 resize-none overflow-hidden"
                    />
                  </div>
                )}

                {block.type === 'numbered' && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-sm font-semibold text-slate-500 mt-0.5 shrink-0 w-4">
                      {index + 1}.
                    </span>
                    <textarea
                      ref={(el) => { blockInputRefs.current[block.id] = el; }}
                      rows={1}
                      value={block.content}
                      onChange={(e) => {
                        handleInputChange(e, index);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                      placeholder="Numbered item..."
                      className="w-full text-base text-slate-300 bg-transparent border-none focus:outline-none placeholder-slate-600 resize-none overflow-hidden"
                    />
                  </div>
                )}

                {block.type === 'todo' && (
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={block.checked || false}
                      onChange={(e) => updateBlock(index, { checked: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-white/20 bg-[#18181b] text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                    <textarea
                      ref={(el) => { blockInputRefs.current[block.id] = el; }}
                      rows={1}
                      value={block.content}
                      onChange={(e) => {
                        handleInputChange(e, index);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                      placeholder="To-do item..."
                      className={cn(
                        'w-full text-base text-slate-300 bg-transparent border-none focus:outline-none placeholder-slate-600 resize-none overflow-hidden',
                        block.checked && 'line-through text-slate-600'
                      )}
                    />
                  </div>
                )}

                {block.type === 'quote' && (
                  <div className="border-l-4 border-indigo-500 pl-4 py-1 italic">
                    <textarea
                      ref={(el) => { blockInputRefs.current[block.id] = el; }}
                      rows={1}
                      value={block.content}
                      onChange={(e) => {
                        handleInputChange(e, index);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                      placeholder="Quote or reflection..."
                      className="w-full text-base text-slate-300 bg-transparent border-none focus:outline-none placeholder-slate-600 resize-none overflow-hidden italic"
                    />
                  </div>
                )}

                {block.type === 'callout' && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 text-white">
                    <span className="text-lg shrink-0 select-none">
                      {block.calloutEmoji || '💡'}
                    </span>
                    <textarea
                      ref={(el) => { blockInputRefs.current[block.id] = el; }}
                      rows={1}
                      value={block.content}
                      onChange={(e) => {
                        handleInputChange(e, index);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                      placeholder="Highlight or key takeaway..."
                      className="w-full text-sm font-medium bg-transparent border-none focus:outline-none placeholder-slate-500 resize-none overflow-hidden"
                    />
                  </div>
                )}

                {block.type === 'code' && (
                  <div className="rounded-xl bg-[#18181b] p-4 font-mono text-sm text-slate-200 border border-white/10">
                    <div className="flex justify-between items-center text-xs text-slate-500 pb-2 mb-2 border-b border-white/5">
                      <span>{block.codeLanguage || 'markdown / notes'}</span>
                      <span>Code Snippet</span>
                    </div>
                    <textarea
                      ref={(el) => { blockInputRefs.current[block.id] = el; }}
                      rows={2}
                      value={block.content}
                      onChange={(e) => {
                        handleInputChange(e, index);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                      placeholder="// write code snippet..."
                      className="w-full font-mono text-sm bg-transparent border-none text-emerald-400 focus:outline-none resize-none overflow-hidden"
                    />
                  </div>
                )}

                {block.type === 'divider' && (
                  <div className="py-3">
                    <hr className="border-t border-white/10" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Floating Notion Slash Command Menu */}
        {slashMenuOpen && activeBlockIndex !== null && (
          <div 
            className="absolute z-50 w-64 max-h-80 overflow-y-auto bg-[#18181b] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
          >
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white/5">
              Notion Blocks
            </div>

            <div className="flex flex-col">
              {filteredMenuItems.length === 0 ? (
                <div className="p-3 text-xs text-center text-slate-500">
                  No matching command
                </div>
              ) : (
                filteredMenuItems.map((item, idx) => (
                  <button
                    key={`${item.type}-${idx}`}
                    type="button"
                    onClick={() => applySlashItem(item.type, activeBlockIndex)}
                    className={cn(
                      'flex items-center gap-3 px-3.5 py-2 text-sm transition-colors text-white text-left',
                      slashMenuIndex === idx ? 'bg-indigo-600' : 'hover:bg-white/5'
                    )}
                  >
                    <span className="w-7 h-7 rounded bg-white/10 flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs text-white">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Bottom Bar: Help text and Live Firebase Saved Toast Indicator */}
        <div className="mt-12 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Type <code className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px] text-slate-300">/</code> for Notion blocks</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Firestore Auto-Save Indicator */}
            <div
              id="editor-save-toast"
              aria-live="polite"
              className={cn(
                'px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-2 shadow-lg transition-all duration-300',
                saveStatus === 'saving'
                  ? 'bg-[#18181b] border-amber-500/30 text-amber-300 ring-1 ring-amber-500/20'
                  : 'bg-[#18181b] border-emerald-500/20 text-emerald-400'
              )}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                  <span>Saving to Firebase...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Firebase Synced</span>
                  <span className="text-[10px] text-slate-500 font-normal">({lastSavedTime})</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => addBlockBelow(blocks.length - 1, 'paragraph')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer border border-white/5"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add Block</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
