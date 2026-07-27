import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type SiteSettings = {
  is_locked: boolean;
  locked_message: string;
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from('site_settings')
        .select('is_locked, locked_message')
        .eq('id', 1)
        .maybeSingle();
      if (!cancelled) {
        if (data) setSettings(data);
        setLoading(false);
      }
    }

    load();

    // live updates via real-time subscription so the lock state reflects
    // immediately when the admin toggles it
    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'site_settings' },
        (payload) => {
          const row = payload.new as SiteSettings;
          setSettings({ is_locked: row.is_locked, locked_message: row.locked_message });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, loading };
}
