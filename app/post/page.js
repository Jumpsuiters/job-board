'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  'Community', 'Creative', 'Education', 'Environment',
  'Health', 'Tech', 'Other'
];

export default function PostJob() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData(e.target);
    const job = {
      title: form.get('title'),
      description: form.get('description'),
      job_type: form.get('job_type'),
      pay: form.get('pay'),
      location: form.get('location'),
      posted_by: form.get('posted_by'),
      category: form.get('category'),
    };

    const { error } = await supabase.from('jobs').insert(job);

    if (error) {
      alert('Something went wrong: ' + error.message);
      setSubmitting(false);
      return;
    }

    router.push('/success?action=posted');
  }

  return (
    <main>
      <h1>Post a Dream Job</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Describe work that should exist in the world.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Job Title *</label>
          <input name="title" id="title" required placeholder="e.g. Neighborhood Story Collector" />
        </div>

        <div className="field">
          <label htmlFor="description">Description *</label>
          <textarea name="description" id="description" required
            placeholder="What does this job involve? Why does it matter?" />
        </div>

        <div className="field">
          <label>Type *</label>
          <div className="type-toggle">
            <label className="type-option">
              <input type="radio" name="job_type" value="local" defaultChecked />
              <span className="type-label">Local</span>
              <span className="type-desc">In-person, city-based</span>
            </label>
            <label className="type-option">
              <input type="radio" name="job_type" value="virtual" />
              <span className="type-label">Virtual</span>
              <span className="type-desc">Remote, by call or video</span>
            </label>
          </div>
        </div>

        <div className="field">
          <label htmlFor="pay">Pay</label>
          <input name="pay" id="pay" placeholder="e.g. $30/hr, Volunteer, Sliding scale" />
        </div>

        <div className="field">
          <label htmlFor="location">Location</label>
          <input name="location" id="location" placeholder="e.g. Austin TX, Anywhere" />
        </div>

        <div className="field">
          <label htmlFor="posted_by">Your Name</label>
          <input name="posted_by" id="posted_by" placeholder="Who's dreaming this up?" />
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select name="category" id="category">
            <option value="">Pick one...</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post This Job'}
        </button>
      </form>
    </main>
  );
}
