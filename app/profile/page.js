'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';
import { uploadFile } from '../../lib/upload';

export default function Profile() {
  const { user, profile, loading, supabase, fetchProfile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  if (loading) return <main><p className="empty">Loading...</p></main>;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const form = new FormData(e.target);

    let avatar_url = profile?.avatar_url || null;
    if (avatarFile) {
      try {
        avatar_url = await uploadFile(supabase, avatarFile, 'avatars');
      } catch (err) {
        setMsg('Error uploading photo: ' + err.message);
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        name: form.get('name'),
        location: form.get('location'),
        bio: form.get('bio'),
        slug: form.get('slug'),
        available_for: form.get('available_for'),
        available_type: form.get('available_type'),
        avatar_url,
      });

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
      <p className="subtitle">Tell people who you are and what you're offering</p>

      {msg && <div className={msg.startsWith('Error') ? 'error-msg' : 'success-msg'}>{msg}</div>}

      {profile?.slug && (
        <div className="profile-link-box">
          Your public page: <Link href={`/u/${profile.slug}`}>/u/{profile.slug}</Link>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Photo</label>
          <div className="avatar-upload">
            {(avatarPreview || profile?.avatar_url) ? (
              <div className="avatar-preview">
                <img src={avatarPreview || profile?.avatar_url} alt="Avatar" />
                <label className="avatar-change">
                  <input type="file" accept="image/*" onChange={e => {
                    const f = e.target.files[0];
                    if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                  }} />
                  Change
                </label>
              </div>
            ) : (
              <label className="photo-dropzone">
                <input type="file" accept="image/*" onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                }} />
                <span>Add a profile photo</span>
              </label>
            )}
          </div>
        </div>

        <div className="field">
          <label htmlFor="name">Name</label>
          <input name="name" id="name" defaultValue={profile?.name || ''} />
        </div>
        <div className="field">
          <label htmlFor="slug">Profile URL slug</label>
          <input name="slug" id="slug" defaultValue={profile?.slug || ''} placeholder="your-unique-slug" />
          <span className="field-hint">This creates your public page at /u/your-slug</span>
        </div>
        <div className="field">
          <label htmlFor="available_for">What are you available for?</label>
          <textarea name="available_for" id="available_for" defaultValue={profile?.available_for || ''} placeholder="e.g. Listening, hype sessions, walks, drawing, singing, advice..." />
          <span className="field-hint">Free text — describe what you're willing to do for people</span>
        </div>
        <div className="field">
          <label>How do you work?</label>
          <div className="type-toggle">
            <label className="type-option">
              <input type="radio" name="available_type" value="virtual" defaultChecked={profile?.available_type === 'virtual'} />
              <span className="type-label">Virtual</span>
            </label>
            <label className="type-option">
              <input type="radio" name="available_type" value="irl" defaultChecked={profile?.available_type === 'irl'} />
              <span className="type-label">In Person</span>
            </label>
            <label className="type-option">
              <input type="radio" name="available_type" value="both" defaultChecked={!profile?.available_type || profile?.available_type === 'both'} />
              <span className="type-label">Both</span>
            </label>
          </div>
        </div>
        <div className="field">
          <label htmlFor="location">Location</label>
          <input name="location" id="location" defaultValue={profile?.location || ''} placeholder="Where are you based?" />
        </div>
        <div className="field">
          <label htmlFor="bio">Bio</label>
          <textarea name="bio" id="bio" defaultValue={profile?.bio || ''} placeholder="A few words about you..." />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </main>
  );
}
