'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { superAdminGateMessage } from '@/lib/admin-permissions';

type AdminSuperAdminGateProps = {
  isSuperAdmin: boolean;
  language: 'en' | 'fr_ht';
  title?: string;
  children: React.ReactNode;
};

export default function AdminSuperAdminGate({
  isSuperAdmin,
  language,
  title,
  children,
}: AdminSuperAdminGateProps) {
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-start gap-3">
        <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {title ||
              (language === 'fr_ht' ? 'Réservé aux super administrateurs' : 'Super administrator only')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{superAdminGateMessage(language)}</p>
        </div>
      </div>
    </div>
  );
}
