'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearAdminUiClient, hasAdminUiClient, setAdminUiClient } from '@/lib/admin-cookies';

const AdminUiContext = createContext(false);

export function AdminUiProvider({
  initialIsAdmin,
  children,
}: {
  initialIsAdmin: boolean;
  children: React.ReactNode;
}) {
  const [showAdminNav, setShowAdminNav] = useState(initialIsAdmin || hasAdminUiClient());

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (initialIsAdmin || hasAdminUiClient()) {
        if (!cancelled) {
          setAdminUiClient();
          setShowAdminNav(true);
        }
        return;
      }

      try {
        const res = await fetch('/api/admin/session', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        if (!res.ok) return;

        const data = (await res.json()) as { authed?: boolean };
        if (cancelled) return;

        if (data.authed) {
          setAdminUiClient();
          setShowAdminNav(true);
        } else {
          clearAdminUiClient();
          setShowAdminNav(false);
        }
      } catch {
        // Keep current state on transient network errors.
      }
    };

    void sync();
    window.addEventListener('focus', sync);
    window.addEventListener('pageshow', sync);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', sync);
      window.removeEventListener('pageshow', sync);
    };
  }, [initialIsAdmin]);

  return <AdminUiContext.Provider value={showAdminNav}>{children}</AdminUiContext.Provider>;
}

export function useAdminUi(): boolean {
  return useContext(AdminUiContext);
}
