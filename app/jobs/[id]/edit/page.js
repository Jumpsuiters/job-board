'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../components/AuthProvider';
import { uploadFile } from '../../../../lib/upload';

const CATEGORIES = [
  'Presence', 'Creativity', 'Support', 'Advice', 'Experimental'
];

export default function EditJob() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading, supabase } = useAuth();
  const [job, setJob] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [availability, setAvailability] = useState('asap');
  const [bookingMode, setBookingMode] = useState('instant');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  useEffect(() => {
    async function fetchJob() {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setJob(data);
        setAvailability(data.availability || 'asap');
        setBookingMode(data.booking_mode || 'instant');
        if (data.photo_url) setPhotoPreview(data.photo_url);
      }
      setFetching(false);
    }
    if (user) fetchJob();
  }, [user, id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    const form = new FormData(e.target);

    let photo_url = job.photo_url || null;
    if (photoFile) {
      try {
        photo_url = await uploadFile(supabase, photoFile, 'jobs');
      } catch (err) {
        setMsg('Photo upload failed: ' + err.message);
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from('jobs')
      .update({
        title: form.get('title'),
        description: form.get('description'),
        category: form.get('category') || null,
        job_type: form.get('job_type'),
        location: form.get('location') || null,
        price: form.get('price') ? parseFloat(form.get('price')) : null,
        price_half_day: form.get('price_half_day') ? parseFloat(form.get('price_half_day')) : null,
        price_day: form.get('price_day') ? parseFloat(form.get('price_day')) : null,
        price_week: form.get('price_week') ? parseFloat(form.get('price_week')) : null,
        availability,
        booking_mode: bookingMode,
        photo_url,
      })
      .eq('id', id);

    if (error) {
      setMsg('Error: ' + error.message);
      setSaving(false);
      return;
    }

    router.push(`/jobs/${id}`);
  }

  async function handleDelete() {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    await supabase.from('jobs').delete().eq('id', id);
    router.push('/dashboard');
  }

  if (loading || fetching) return <main><p className="empty">Loading...</p></main>;
  if (!job) return <main><p className="empty">Job not found.</p></main>;
  if (user?.id !== job.user_id) return <main><p className="empty">You can only edit your own jobs.</p></main>;

  return (
    <main>
      <Link href={`/jobs/${id}`} className="back-link">&larr; Back to job</Link>
      <h1>Edit Job</h1>

      {msg && <div className={msg.startsWith('Error') ? 'error-msg' : 'success-msg'}>{msg}</div>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Photo</label>
          <div className="photo-upload">
            {photoPreview ? (
              <div className="photo-preview">
                <img src={photoPreview} alt="Preview" />
                <button type="button" className="photo-remove" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}>&times;</button>
              </div>
            ) : (
              <label className="photo-dropzone">
                <input type="file" accept="image/*" onChange={e => {
                  const f = e.target.files[0];
                  if (f) {
                    setPhotoFile(f);
                    setPhotoPreview(URL.createObjectURL(f));
                  }
                }} />
                <span>Add a photo of you or your vibe</span>
              </label>
            )}
          </div>
        </div>

        <div className="field">
          <label htmlFor="title">What&apos;s the job? *</label>
          <input name="title" id="title" required defaultValue={job.title} />
        </div>

        <div className="field">
          <label htmlFor="description">Describe what you&apos;ll actually do *</label>
          <textarea name="description" id="description" required defaultValue={job.description} />
        </div>

        <div className="field">
          <label>Type</label>
          <div className="type-toggle">
            <label className="type-option">
              <input type="radio" name="job_type" value="virtual" defaultChecked={job.job_type === 'virtual'} />
              <span className="type-label">Virtual</span>
              <span className="type-desc">Video, call, or chat</span>
            </label>
            <label className="type-option">
              <input type="radio" name="job_type" value="local" defaultChecked={job.job_type === 'local'} />
              <span className="type-label">In Person</span>
              <span className="type-desc">Meet up IRL</span>
            </label>
          </div>
        </div>

        <div className="field">
          <label>Your rates</label>
          <span className="field-hint">Set at least one.</span>
          <div className="rate-grid">
            <div className="rate-field">
              <label htmlFor="price">Per hour</label>
              <div className="rate-input-wrap">
                <span className="rate-dollar">$</span>
                <input name="price" id="price" type="number" min="1" step="0.01" placeholder="0" defaultValue={job.price || ''} />
              </div>
            </div>
            <div className="rate-field">
              <label htmlFor="price_half_day">Half day</label>
              <div className="rate-input-wrap">
                <span className="rate-dollar">$</span>
                <input name="price_half_day" id="price_half_day" type="number" min="1" step="0.01" placeholder="0" defaultValue={job.price_half_day || ''} />
              </div>
            </div>
            <div className="rate-field">
              <label htmlFor="price_day">Full day</label>
              <div className="rate-input-wrap">
                <span className="rate-dollar">$</span>
                <input name="price_day" id="price_day" type="number" min="1" step="0.01" placeholder="0" defaultValue={job.price_day || ''} />
              </div>
            </div>
            <div className="rate-field">
              <label htmlFor="price_week">Per week</label>
              <div className="rate-input-wrap">
                <span className="rate-dollar">$</span>
                <input name="price_week" id="price_week" type="number" min="1" step="0.01" placeholder="0" defaultValue={job.price_week || ''} />
              </div>
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="location">Location</label>
          <input name="location" id="location" defaultValue={job.location || ''} />
        </div>

        <div className="field">
          <label htmlFor="category">Vibe</label>
          <select name="category" id="category" defaultValue={job.category || ''}>
            <option value="">Pick one...</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Availability</label>
          <div className="type-toggle">
            <label className="type-option">
              <input type="radio" name="availability_radio" value="asap" checked={availability === 'asap'} onChange={() => setAvailability('asap')} />
              <span className="type-label">Available Now</span>
              <span className="type-desc">Ready to go — buyers can book immediately</span>
            </label>
            <label className="type-option">
              <input type="radio" name="availability_radio" value="scheduled" checked={availability === 'scheduled'} onChange={() => setAvailability('scheduled')} />
              <span className="type-label">Schedule Only</span>
              <span className="type-desc">Buyers will request a date &amp; time</span>
            </label>
          </div>
        </div>

        <div className="field">
          <label>Booking mode</label>
          <span className="field-hint">Instant Book lets buyers book immediately. Request to Book lets you chat first.</span>
          <div className="type-toggle">
            <label className="type-option">
              <input type="radio" name="booking_mode_radio" value="instant" checked={bookingMode === 'instant'} onChange={() => setBookingMode('instant')} />
              <span className="type-label">Instant Book</span>
              <span className="type-desc">Buyers can book you right away</span>
            </label>
            <label className="type-option">
              <input type="radio" name="booking_mode_radio" value="request" checked={bookingMode === 'request'} onChange={() => setBookingMode('request')} />
              <span className="type-label">Request to Book</span>
              <span className="type-desc">You review requests before accepting</span>
            </label>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-secondary" onClick={handleDelete} style={{ color: 'var(--red)' }}>
          Delete this job
        </button>
      </div>
    </main>
  );
}
