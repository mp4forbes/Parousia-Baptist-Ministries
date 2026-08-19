'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearCoordinatorUiClient } from '@/lib/coordinator-cookies';
import { getRegistrantAccess, logoutCoordinator } from '@/lib/coordinator-session';
import { EMPTY_REGISTRANT_ACCESS, type RegistrantAccess } from '@/lib/registrant-scope';

interface CoordinatorSessionValue {
  access: RegistrantAccess;
  loginOpen: boolean;
  setLoginOpen: (open: boolean) => void;
  applyAccess: (next: RegistrantAccess) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const CoordinatorSessionContext = createContext<CoordinatorSessionValue>({
  access: EMPTY_REGISTRANT_ACCESS,
  loginOpen: false,
  setLoginOpen: () => undefined,
  applyAccess: () => undefined,
  refresh: async () => undefined,
  signOut: async () => undefined,
});

export function CoordinatorSessionProvider({
  initialAccess,
  children,
}: {
  initialAccess: RegistrantAccess;
  children: React.ReactNode;
}) {
  const [access, setAccess] = useState<RegistrantAccess>(initialAccess);
  const [loginOpen, setLoginOpen] = useState(initialAccess.needsPasswordSetup);

  const applyAccess = useCallback((next: RegistrantAccess) => {
    setAccess(next);
    if (next.needsPasswordSetup) setLoginOpen(true);
  }, []);

  const refresh = useCallback(async () => {
    const next = await getRegistrantAccess();
    setAccess((current) => {
      if (current.email && !next.email) return current;
      return next;
    });
    if (next.needsPasswordSetup) setLoginOpen(true);
  }, []);

  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  useEffect(() => {
    if (access.needsPasswordSetup) setLoginOpen(true);
  }, [access.needsPasswordSetup]);

  const signOut = useCallback(async () => {
    await logoutCoordinator();
    clearCoordinatorUiClient();
    setAccess(EMPTY_REGISTRANT_ACCESS);
    setLoginOpen(false);
  }, []);

  const value = useMemo(
    () => ({ access, loginOpen, setLoginOpen, applyAccess, refresh, signOut }),
    [access, loginOpen, applyAccess, refresh, signOut]
  );

  return (
    <CoordinatorSessionContext.Provider value={value}>
      {children}
    </CoordinatorSessionContext.Provider>
  );
}

export function useCoordinatorSession(): CoordinatorSessionValue {
  return useContext(CoordinatorSessionContext);
}
