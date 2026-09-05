'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Edit, FileText, Plus, Save, Trash2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { BlogPost } from '@/lib/db';
import {
  deleteBlogPost,
  getBlogPosts,
  saveBlogPost,
  translateBlogContentAction,
} from '@/lib/actions';
import AdminBilingualTranslateBar from '@/components/AdminBilingualTranslateBar';
import CoordinatorContentPanel from '@/components/CoordinatorContentPanel';
import { resolveTranslateSourceLang, type TranslateDirection } from '@/lib/admin-translate';

interface CoordinatorBlogManagerProps {
  open: boolean;
  isLight: boolean;
  onClose: () => void;
}

export default function CoordinatorBlogManager({ open, isLight, onClose }: CoordinatorBlogManagerProps) {
  const { language, t } = useLanguage();
  const isHt = language === 'fr_ht';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [bilingualTranslateDirection, setBilingualTranslateDirection] = useState<TranslateDirection>('auto');
  const [isTranslating, setIsTranslating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    title_english: '',
    title_kreyol: '',
    content_english: '',
    content_kreyol: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fieldClass = `w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
  }`;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getBlogPosts();
      setPosts(list);
    } catch {
      setMessage({ type: 'error', text: t.coordinatorLoadError });
    } finally {
      setLoading(false);
    }
  }, [t.coordinatorLoadError]);

  useEffect(() => {
    if (open) {
      loadPosts();
      setEditingId(null);
      setMessage(null);
    }
  }, [open, loadPosts]);

  const startCreate = () => {
    setEditingId(0);
    setForm({
      title_english: '',
      title_kreyol: '',
      content_english: '',
      content_kreyol: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const startEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title_english: post.title_english,
      title_kreyol: post.title_kreyol,
      content_english: post.content_english,
      content_kreyol: post.content_kreyol,
      date: post.date,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await saveBlogPost(
        editingId === 0 ? null : editingId,
        form.title_kreyol,
        form.title_english,
        form.content_kreyol,
        form.content_english,
        form.date
      );
      if (!res.success) {
        setMessage({ type: 'error', text: res.error || t.coordinatorSaveError });
        return;
      }
      setMessage({ type: 'success', text: isHt ? 'Article enregistré.' : 'Post saved.' });
      setEditingId(null);
      await loadPosts();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t.coordinatorSaveError });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(isHt ? 'Supprimer cet article ?' : 'Delete this blog post?')) return;
    setMessage(null);
    const res = await deleteBlogPost(id);
    if (!res.success) {
      setMessage({ type: 'error', text: res.error || t.coordinatorDeleteError });
      return;
    }
    setMessage({ type: 'success', text: isHt ? 'Article supprimé.' : 'Post deleted.' });
    if (editingId === id) setEditingId(null);
    await loadPosts();
  };

  const handleAutoTranslate = async () => {
    const fromLang = resolveTranslateSourceLang(
      bilingualTranslateDirection,
      `${form.title_kreyol}\n${form.content_kreyol}`,
      `${form.title_english}\n${form.content_english}`,
      language
    );
    if (!fromLang) {
      setMessage({
        type: 'error',
        text: isHt
          ? 'Veuillez saisir du texte dans la langue source avant de traduire.'
          : 'Please enter source-language text before translating.',
      });
      return;
    }

    setIsTranslating(true);
    setMessage(null);
    try {
      const sourceTitle = fromLang === 'en' ? form.title_english : form.title_kreyol;
      const sourceContent = fromLang === 'en' ? form.content_english : form.content_kreyol;
      const res = await translateBlogContentAction(sourceTitle, sourceContent, fromLang);
      if (!res.success || !res.translatedTitle || !res.translatedContent) {
        setMessage({ type: 'error', text: res.error || (isHt ? 'Échec de la traduction.' : 'Translation failed.') });
        return;
      }
      if (fromLang === 'en') {
        setForm((prev) => ({
          ...prev,
          title_kreyol: res.translatedTitle!,
          content_kreyol: res.translatedContent!,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          title_english: res.translatedTitle!,
          content_english: res.translatedContent!,
        }));
      }
      setMessage({ type: 'success', text: isHt ? 'Traduction terminée.' : 'Translation completed.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || (isHt ? 'Erreur de traduction.' : 'Translation error.') });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <CoordinatorContentPanel
      open={open}
      title={t.coordinatorManageBlog}
      subtitle={t.coordinatorContentModalHint}
      isLight={isLight}
      onClose={onClose}
    >
      <div className="space-y-4">
        {editingId === null ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t.adminBlogBtnCreate}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className={`p-4 rounded-2xl border space-y-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800'}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-500" />
                {editingId === 0 ? t.adminBlogNewTitle : t.adminBlogEditTitle}
              </h3>
              <button type="button" onClick={() => setEditingId(null)} className="text-xs font-bold text-slate-500 cursor-pointer">
                {t.btnCancel}
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.adminBlogFieldDate}</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className={fieldClass}
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.adminBlogFieldTitleHt}</label>
                <input
                  type="text"
                  value={form.title_kreyol}
                  onChange={(e) => setForm((prev) => ({ ...prev, title_kreyol: e.target.value }))}
                  className={fieldClass}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.adminBlogFieldTitleEn}</label>
                <input
                  type="text"
                  value={form.title_english}
                  onChange={(e) => setForm((prev) => ({ ...prev, title_english: e.target.value }))}
                  className={fieldClass}
                  required
                />
              </div>
            </div>

            <AdminBilingualTranslateBar
              language={language}
              direction={bilingualTranslateDirection}
              onDirectionChange={setBilingualTranslateDirection}
              onTranslate={handleAutoTranslate}
              isTranslating={isTranslating}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.adminBlogFieldContentHt}</label>
                <textarea
                  rows={8}
                  value={form.content_kreyol}
                  onChange={(e) => setForm((prev) => ({ ...prev, content_kreyol: e.target.value }))}
                  className={`${fieldClass} font-serif leading-relaxed`}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{t.adminBlogFieldContentEn}</label>
                <textarea
                  rows={8}
                  value={form.content_english}
                  onChange={(e) => setForm((prev) => ({ ...prev, content_english: e.target.value }))}
                  className={`${fieldClass} font-serif leading-relaxed`}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer">
                <Save className="w-4 h-4" />
                {t.adminBlogSaveBtn}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">{t.coordinatorLoading}</p>
        ) : editingId === null ? (
          <div className={`rounded-2xl border overflow-hidden ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            {posts.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">{t.adminBlogEmpty}</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className={isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-900 text-slate-400'}>
                  <tr>
                    <th className="px-4 py-3 font-bold">{t.adminBlogColTitle}</th>
                    <th className="px-4 py-3 font-bold">{t.adminBlogColDate}</th>
                    <th className="px-4 py-3 font-bold text-right">{t.coordinatorActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {posts.map((post) => (
                    <tr key={post.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/40'}>
                      <td className="px-4 py-3 font-medium">{isHt ? post.title_kreyol : post.title_english}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{post.date}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => startEdit(post)} className="p-1.5 rounded-lg mr-1 text-amber-600 cursor-pointer" title={t.btnEdit}>
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg text-rose-500 cursor-pointer" title={t.btnDelete}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}

        {message && (
          <p className={`text-xs ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>{message.text}</p>
        )}
      </div>
    </CoordinatorContentPanel>
  );
}
