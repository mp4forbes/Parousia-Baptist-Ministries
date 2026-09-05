'use client';

import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, FileText } from 'lucide-react';
import { useCoordinatorSession } from '@/lib/CoordinatorSessionContext';
import { useLanguage } from '@/lib/LanguageContext';
import { contentCoordinatorIsAllowed, type ContentCoordinatorKind } from '@/lib/registrant-scope';
import CoordinatorBlogManager from '@/components/CoordinatorBlogManager';
import CoordinatorDevotionalManager from '@/components/CoordinatorDevotionalManager';
import CoordinatorEventsManager from '@/components/CoordinatorEventsManager';
import CoordinatorSchedulesManager from '@/components/CoordinatorSchedulesManager';

interface CoordinatorContentManagerButtonProps {
  kind: ContentCoordinatorKind;
  isLight: boolean;
  label?: string;
}

const KIND_META: Record<ContentCoordinatorKind, { icon: typeof FileText; labelKey: 'coordinatorManageBlog' | 'coordinatorManageDevotional' | 'coordinatorManageEvents' | 'coordinatorManageSchedules' }> = {
  blog: { icon: FileText, labelKey: 'coordinatorManageBlog' },
  devotional: { icon: BookOpen, labelKey: 'coordinatorManageDevotional' },
  events: { icon: Calendar, labelKey: 'coordinatorManageEvents' },
  schedules: { icon: Clock, labelKey: 'coordinatorManageSchedules' },
};

export default function CoordinatorContentManagerButton({ kind, isLight, label }: CoordinatorContentManagerButtonProps) {
  const { t } = useLanguage();
  const { access } = useCoordinatorSession();
  const [open, setOpen] = useState(false);

  if (!contentCoordinatorIsAllowed(kind, access)) return null;

  const meta = KIND_META[kind];
  const Icon = meta.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
      >
        <Icon className="w-4 h-4" />
        {label || t[meta.labelKey]}
      </button>

      {kind === 'blog' && <CoordinatorBlogManager open={open} isLight={isLight} onClose={() => setOpen(false)} />}
      {kind === 'devotional' && <CoordinatorDevotionalManager open={open} isLight={isLight} onClose={() => setOpen(false)} />}
      {kind === 'events' && <CoordinatorEventsManager open={open} isLight={isLight} onClose={() => setOpen(false)} />}
      {kind === 'schedules' && <CoordinatorSchedulesManager open={open} isLight={isLight} onClose={() => setOpen(false)} />}
    </>
  );
}
