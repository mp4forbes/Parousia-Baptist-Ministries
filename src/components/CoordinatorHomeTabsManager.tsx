'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { getSettings } from '@/lib/actions';
import CoordinatorContentPanel from '@/components/CoordinatorContentPanel';
import HomePageTabsEditor from '@/components/HomePageTabsEditor';

interface CoordinatorHomeTabsManagerProps {
  open: boolean;
  isLight: boolean;
  onClose: () => void;
}

export default function CoordinatorHomeTabsManager({ open, isLight, onClose }: CoordinatorHomeTabsManagerProps) {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getSettings();
      setSettings(rows);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setMessage(null);
      load();
    }
  }, [open, load]);

  const handleNotify = (text: string, type: 'success' | 'error') => {
    setMessage({ type, text });
  };

  return (
    <CoordinatorContentPanel
      open={open}
      isLight={isLight}
      onClose={onClose}
      title={t.coordinatorManageHomeTabs}
      subtitle={t.coordinatorContentModalHint}
    >
      <div className="space-y-4">
        {message && (
          <p
            className={`text-xs font-semibold px-3 py-2 rounded-xl border ${
              message.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
            }`}
          >
            {message.text}
          </p>
        )}
        {loading ? (
          <p className="text-xs text-slate-400">{t.coordinatorLoading}</p>
        ) : (
          <HomePageTabsEditor
            initialSettings={settings}
            variant="coordinator"
            showHeader={false}
            onNotify={handleNotify}
          />
        )}
      </div>
    </CoordinatorContentPanel>
  );
}
