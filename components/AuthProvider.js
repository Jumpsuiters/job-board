'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
    } else {
      // Profile missing (trigger may have failed) — create one
      const { data: { user: u } } = await supabase.auth.getUser();
      const name = u?.user_metadata?.name || '';
      const slug = userId.replace(/-/g, '');
      await supabase.from('profiles').insert({
        id: userId,
        name,
        slug,
      });
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(newProfile);
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u }, error }) => {
      if (error || !u) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setUser(u);
      fetchProfile(u.id).finally(() => setLoading(false));
    }).catch(() => {
      setUser(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          await fetchProfile(u.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, supabase, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
