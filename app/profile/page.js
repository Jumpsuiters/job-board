'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';

export default function Profile() {
  const { user, profile, loading, supabase, fetchProfile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  if (loading || !profile) return <main><p className="empty">Loading...</p></main>;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const form = new FormData(e.target);
    const { error } = await supabase
      .from('profiles')
      .update({
        name: form.get('name'),
        location: form.get('location'),
        bio: form.get('bio'),
      })
      .eq('id', user.id);

    if (error) {
      setMsg('Error: ' + error.message);
    } else {
      setMsg('Profile updated!');
      await fetchProfile(user.id);
    }
    setSaving(false);
  }

  return (
    <main>
      <h1>Your Profile</h1>
      <p className="subtitle">Tell people who you are</p>

      {msg && <div className={msg.startsWith('Error') ? 'error-msg' : 'success-msg'}>{msg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input name="name" id="name" defaultValue={profile.name || ''} />
        </div>
        <div className="field">
          <label htmlFor="location">Location</label>
          <input name="location" id="location" defaultValue={profile.location || ''} placeholder="Where are you based?" />
        </div>
        <div className="field">
          <label htmlFor="bio">Bio</label>
          <textarea name="bio" id="bio" defaultValue={profile.bio || ''} placeholder="A few words about you..." />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </main>
  );
}
