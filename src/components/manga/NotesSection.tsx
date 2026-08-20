import React, { useState, useEffect } from 'react';
import { StickyNote, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { Manga } from '../../types';
import { useLibrary } from '../../hooks/useLibrary';
import { isReadingMedia } from '../../utils/formatters';

interface NotesSectionProps {
  manga: Manga;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ manga }) => {
  const { getNoteForManga, saveMangaNote, deleteMangaNote } = useLibrary();
  const note = getNoteForManga(manga);

  const isReading = isReadingMedia(manga.type);
  const [content, setContent] = useState<string>(note?.content || '');
  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (note) {
      setContent(note.content);
    }
  }, [note]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    await saveMangaNote(manga.id, content.trim());
    setIsSaving(false);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  const handleDelete = async () => {
    await deleteMangaNote(manga.id);
    setContent('');
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <StickyNote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">Personal Notes</h3>
            <p className="text-xs text-zinc-400">
              {isReading
                ? 'Private to your account (e.g. bookmarks, chapter reminders, personal review)'
                : 'Private to your account (e.g. episode tracking, favorite scenes, personal review)'}
            </p>
          </div>
        </div>

        {savedStatus && (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <textarea
          rows={4}
          placeholder={
            isReading
              ? 'E.g., Stopped at chapter 87. Need to continue after exams, favorite arc starts at chapter 60...'
              : 'E.g., Finished Season 1 Episode 8. Awesome climax, recommend watching with friends...'
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-sky-500 resize-none transition-colors"
        />

        <div className="flex items-center justify-between">
          {note?.updated_at && (
            <span className="text-[11px] text-zinc-500">
              Last saved: {new Date(note.updated_at).toLocaleDateString()}
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {note?.content && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-zinc-950 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Note'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
