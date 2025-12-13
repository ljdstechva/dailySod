'use client';

import React, { useState } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function KnowledgePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setStatus('saving');

    try {
      const res = await fetch('/api/kb/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) throw new Error('Upload failed');

      setStatus('success');
      setTitle('');
      setContent('');
      
      // Reset success status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Add documents to train your AI assistant. It will reference this data when chatting with visitors.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Return Policy"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the text content here..."
              rows={12}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow resize-y font-mono text-sm leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {status === 'success' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium animate-in fade-in slide-in-from-left-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Saved successfully!
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-left-2">
                  <AlertCircle className="w-5 h-5" />
                  Failed to save. Please try again.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'saving'}
              className="flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
            >
              <Save className="w-5 h-5" />
              {status === 'saving' ? 'Saving...' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
