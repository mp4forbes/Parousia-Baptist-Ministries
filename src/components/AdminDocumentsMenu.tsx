'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FileText, ChevronDown, ExternalLink } from 'lucide-react';
import { ADMIN_DOCUMENTS, getAdminDocumentTitle } from '@/lib/admin-documents';

interface AdminDocumentsMenuProps {
  language: 'en' | 'fr_ht';
}

export default function AdminDocumentsMenu({ language }: AdminDocumentsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const guides = ADMIN_DOCUMENTS.filter((doc) => doc.kind === 'guide');
  const letters = ADMIN_DOCUMENTS.filter((doc) => doc.kind === 'letter');
  const isHt = language === 'fr_ht';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-semibold hover:border-amber-500 text-amber-400 cursor-pointer"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>{isHt ? 'Dokiman' : 'Documents'}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-950 shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isHt ? 'Gid & Dokiman Ofisyèl' : 'Official Guides & Documents'}
            </p>
          </div>

          <div className="py-2">
            <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isHt ? 'Gid Administrasyon' : 'Administration Guides'}
            </p>
            {guides.map((doc) => (
              <a
                key={doc.id}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-900 hover:text-amber-400 transition-colors"
              >
                <span className="font-semibold leading-relaxed">{getAdminDocumentTitle(doc, language)}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              </a>
            ))}
          </div>

          <div className="py-2 border-t border-slate-800">
            <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isHt ? 'Lèt Pwojè' : 'Project Letters'}
            </p>
            {letters.map((doc) => (
              <a
                key={doc.id}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-900 hover:text-amber-400 transition-colors"
              >
                <span className="font-semibold leading-relaxed">{getAdminDocumentTitle(doc, language)}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
