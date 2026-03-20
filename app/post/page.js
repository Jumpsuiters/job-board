'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';
import { uploadFile } from '../../lib/upload';
import Modal from '../../components/Modal';

const CATEGORIES = [
  'Presence', 'Creativity', 'Support', 'Advice', 'Experimental'
];

export default function PostJob() {
  const { user, loading, supabase } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState('asap');
  const [bookingMode, setBookingMode] = useState('instant');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [nudge, setNudge] = useState(null);
  const [nudgeAcknowledged, setNudgeAcknowledged] = useState(false);
  const [checkingNudge, setCheckingNudge] = useState(false);
  const [modal, setModal] = useState({ open: false, title: '', message: '' });
  const showAlert = (title, message) => setModal({ open: true, title, message });
  const closeModal = () => setModal({ open: false, title: '', message: '' });

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  const checkHumanness = useCallback(async (title, description) => {
    if (!title || title.length < 10) return;
    setCheckingNudge(true);
    try {
      const res = await fetch('/api/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (data.nudge) {
        setNudge(data);
        setNudgeAcknowledged(false);
        setTimeout(() => {
          document.getElementById('nudge-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        setNudge(null);
      }
    } catch {
      // Nudge is optional — don't block posting
    }
    setCheckingNudge(false);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (nudge && !nudgeAcknowledged) {
      document.getElementById('nudge-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!photoFile) {
      showAlert('Missing photo', 'Please add a photo.');
      return;
    }

    const form = new FormData(e.target);
    const hasRate = form.get('price') || form.get('price_half_day') || form.get('price_day') || form.get('price_week');
    if (!hasRate) {
      showAlert('Missing rate', 'Please set at least one rate.');
      return;
    }

    setSubmitting(true);

    let photo_url = null;
    if (photoFile) {
      try {
        photo_url = await uploadFile(supabase, photoFile, 'jobs');
      } catch (err) {
        showAlert('Upload failed', 'Photo upload failed: ' + err.message);
        setSubmitting(false);
        return;
      }
    }

    const job = {
      user_id: user.id,
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
      status: 'open',
    };

    const { error } = await supabase.from('jobs').insert(job);

    if (error) {
      showAlert('Error', 'Something went wrong: ' + error.message);
      setSubmitting(false);
      return;
    }

    router.push('/success?action=posted');
  }

  if (loading) return <main><p className="empty">Loading...</p></main>;

  return (
    <main>
      <h1>Post a job</h1>
      <p className="subtitle">What are you offering the world? Being human is the job.</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">What&apos;s the job? *</label>
          <input
            name="title"
            id="title"
            required
            placeholder="e.g. I'll pick you up from the airport and you can tell me all about your trip"
            onBlur={e => {
              const desc = document.getElementById('description')?.value || '';
              checkHumanness(e.target.value, desc);
            }}
          />
        </div>

        {nudge && !nudgeAcknowledged && (
          <div className="nudge-box" id="nudge-box">
            <p className="nudge-msg">{nudge.message}</p>
            {nudge.suggestion && (
              <p className="nudge-suggestion">
                <strong>Try:</strong> &ldquo;{nudge.suggestion}&rdquo;
              </p>
            )}
            <div className="nudge-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (nudge.suggestion) {
                    document.getElementById('title').value = nudge.suggestion;
                  }
                  setNudge(null);
                  setNudgeAcknowledged(true);
                  document.getElementById('title').focus();
                }}
              >
                Use suggestion
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setNudgeAcknowledged(true);
                  document.getElementById('title').focus();
                }}
              >
                Got it
              </button>
            </div>
          </div>
        )}

        <div className="field">
          <label>Photo *</label>
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
          <label htmlFor="description">Describe what you&apos;ll actually do *</label>
          <textarea
            name="description"
            id="description"
            required
            placeholder="e.g. I'll show up with snacks and good energy. We'll ride together and you can decompress, vent, celebrate — whatever you need after traveling. No small talk required, but I'm great at it."
            onBlur={e => {
              const title = document.getElementById('title')?.value || '';
              if (title.length >= 10) checkHumanness(title, e.target.value);
            }}
          />
        </div>

        <div className="field">
          <label>Type</label>
          <div className="type-toggle">
            <label className="type-option">
              <input type="radio" name="job_type" value="virtual" defaultChecked />
              <span className="type-label">Virtual</span>
              <span className="type-desc">Video, call, or chat</span>
            </label>
            <label className="type-option">
              <input type="radio" name="job_type" value="local" />
              <span className="type-label">In Person</span>
              <span className="type-desc">Meet up IRL</span>
            </label>
          </div>
        </div>

        <div className="field">
          <label>Your rates</label>
          <span className="field-hint">Set at least one. * What is your time and energy worth?</span>
          <div className="rate-grid">
            <div className="rate-field">
              <label htmlFor="price">Per hour</label>
              <div className="rate-input-wrap">
                <span className="rate-dollar">$</span>
                <input name="price" id="price" type="number" min="1" step="0.01" placeholder="0" />
              </div>
            </div>
            <div className="rate-field">
              <label htmlFor="price_half_day">Half day</label>
              <div className="rate-input-wrap">
                <span className="rate-dollar">$</span>
                <input name="price_half_day" id="price_half_day" type="number" min="1" step="0.01" placeholder="0" />
              </div>
            </div>
            <div className="rate-field">
              <label htmlFor="price_day">Full day</label>
              <div className="rate-input-wrap">
                <span className="rate-dollar">$</span>
                <input name="price_day" id="price_day" type="number" min="1" step="0.01" placeholder="0" />
              </div>
            </div>
            <div className="rate-field">
              <label htmlFor="price_week">Per week</label>
              <div className="rate-input-wrap">
                <span className="rate-dollar">$</span>
                <input name="price_week" id="price_week" type="number" min="1" step="0.01" placeholder="0" />
              </div>
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="location">Location *</label>
          <input name="location" id="location" required placeholder="e.g. Nashville, Anywhere, Your couch via Zoom" />
        </div>

        <div className="field">
          <label htmlFor="category">Vibe *</label>
          <select name="category" id="category" required>
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

        <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post it'}
        </button>
      </form>

      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={closeModal} />
    </main>
  );
}
