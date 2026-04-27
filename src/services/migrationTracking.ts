import { useState, useEffect } from 'react';

export type MigrationStatus = 'idle' | 'running' | 'completed' | 'error';

export const useMigrationStatus = () => {
  const [status, setStatus] = useState<MigrationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEvent = (e: any) => {
      setStatus(e.detail.status);
      setError(e.detail.error || null);
    };

    window.addEventListener('migration-change', handleEvent);
    return () => window.removeEventListener('migration-change', handleEvent);
  }, []);

  return { status, error };
};

export const updateMigrationStatus = (status: MigrationStatus, error?: string) => {
  window.dispatchEvent(new CustomEvent('migration-change', { 
    detail: { status, error } 
  }));
};
