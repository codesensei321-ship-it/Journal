import React, { useState } from 'react';
import { X, Download, FileJson, FileText, Copy, Check, Printer } from 'lucide-react';
import { JournalEntry } from '../types';
import { formatFriendlyDate } from '../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Record<string, JournalEntry>;
  currentEntry: JournalEntry | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentEntry,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `zaid_journal_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const convertEntryToMarkdown = (entry: JournalEntry): string => {
    let md = `# ${entry.title || 'Untitled Entry'}\n`;
    md += `**Date:** ${formatFriendlyDate(entry.date)}\n`;
    if (entry.mood) md += `**Mood:** ${entry.mood}\n`;
    if (entry.tags && entry.tags.length > 0) md += `**Tags:** ${entry.tags.map(t => `#${t}`).join(', ')}\n`;
    md += `\n---\n\n`;

    for (const block of entry.blocks) {
      if (block.type === 'h1') md += `# ${block.content}\n\n`;
      else if (block.type === 'h2') md += `## ${block.content}\n\n`;
      else if (block.type === 'h3') md += `### ${block.content}\n\n`;
      else if (block.type === 'bullet') md += `- ${block.content}\n`;
      else if (block.type === 'numbered') md += `1. ${block.content}\n`;
      else if (block.type === 'todo') md += `- [${block.checked ? 'x' : ' '}] ${block.content}\n`;
      else if (block.type === 'quote') md += `> ${block.content}\n\n`;
      else if (block.type === 'callout') md += `> ${block.calloutEmoji || '💡'} ${block.content}\n\n`;
      else if (block.type === 'code') md += `\`\`\`${block.codeLanguage || ''}\n${block.content}\n\`\`\`\n\n`;
      else if (block.type === 'divider') md += `---\n\n`;
      else md += `${block.content}\n\n`;
    }
    return md;
  };

  const handleExportCurrentMarkdown = () => {
    if (!currentEntry) return;
    const md = convertEntryToMarkdown(currentEntry);
    const dataStr = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `journal_${currentEntry.date}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyMarkdown = () => {
    if (!currentEntry) return;
    const md = convertEntryToMarkdown(currentEntry);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#18181b] border border-white/10 rounded-2xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150 text-slate-200">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Export & Backups
              </h2>
              <p className="text-xs text-slate-400">
                Download your private thoughts in open formats
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={handleExportJSON}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#09090b] border border-white/5 hover:border-white/20 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  Full Journal JSON Backup
                </div>
                <div className="text-[11px] text-slate-400">
                  All {Object.keys(entries).length} entries with blocks & metadata
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>

          <button
            type="button"
            onClick={handleExportCurrentMarkdown}
            disabled={!currentEntry}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#09090b] border border-white/5 hover:border-white/20 transition-colors text-left group disabled:opacity-40"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  Active Day as Markdown (.md)
                </div>
                <div className="text-[11px] text-slate-400">
                  Formatted for Obsidian, Notion, or GitHub
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              disabled={!currentEntry}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#09090b] border border-white/5 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
              <span>{copied ? 'Copied MD!' : 'Copy Markdown'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#09090b] border border-white/5 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Print Page</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
