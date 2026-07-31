'use client';

import { useEffect } from 'react';

function isExtensionNoise(err: unknown, filename?: string) {
  const message = err instanceof Error ? err.message : String(err ?? '');
  const stack = err instanceof Error ? err.stack : '';
  const blob = [message, stack, filename].filter(Boolean).join(' ');
  return /-extension:\/\//.test(blob) || /Failed to connect to MetaMask/i.test(blob);
}

export default function DevExtensionNoiseFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const onRejection = (event: PromiseRejectionEvent) => {
      if (isExtensionNoise(event.reason)) event.preventDefault();
    };

    const onError = (event: ErrorEvent) => {
      if (isExtensionNoise(event.error, event.filename)) event.preventDefault();
    };

    window.addEventListener('unhandledrejection', onRejection, true);
    window.addEventListener('error', onError, true);

    return () => {
      window.removeEventListener('unhandledrejection', onRejection, true);
      window.removeEventListener('error', onError, true);
    };
  }, []);

  return null;
}
