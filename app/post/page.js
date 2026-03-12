'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';

const CATEGORIES = [
  'Community', 'Creative', 'Education', 'Environment',
  'Health', 'Tech', 'Other'
];

export default function PostJob() {
  const { user, loading, supabase } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [hasFunding, setHasFunding] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData(e.target);
    const fundingGoal = form.get('funding_goal');
    const job = {
      user_id: user.id,
      title: form.get('title'),
      description: form.get('description'),
      category: form.get('category') || null,
      job_type: form.get('job_type'),
      location: form.get('location') || null,
      price: form.get('price') ? parseFloat(form.get('price')) : null,
      funding_goal: fundingGoal ? parseFloat(fundingGoal) : null,
      status: fundingGoal ? 'funding' : 'dreaming',
    };

    const { error } = await supabase.from('jobs').insert(job);

    if (error) {
      alert('Something went wrong: ' + error.message);
      setSubmitting(false);
      return;
    }

    router.push('/success?action=posted');
  }

  if (loading) return <main><p className="empty">Loading...</p></main>;

  return (
    <main>
      <h1>Make up a job</h1>
      <p className="subtitle">If you could hire anyone to do anything, what would the job posting look like?</p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">What&apos;s the job called? *</label>
          <input name="title" id="title" required placeholder="e.g. Professional Sunset Watcher" />
        </div>

        <div className="field">
          <label htmlFor="description">What would this person actually do? *</label>
          <textarea name="description" id="description" required
            placeholder="Paint us a picture. What does a day look like in this job?" />
        </div>

        <div className="field">
          <label>Type</label>
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
          <label htmlFor="price">What should this pay? ($/hr)</label>
          <input name="price" id="price" type="number" min="0" step="0.01" placeholder="e.g. 30" />
        </div>

        <div className="field">
          <label htmlFor="location">Where in the world?</label>
          <input name="location" id="location" placeholder="e.g. Austin TX, Your neighborhood, The forest" />
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

        <div className="field">
          <label className="checkbox-label">
            <input type="checkbox" checked={hasFunding} onChange={e => setHasFunding(e.target.checked)} />
            This job needs people to crowdfund it into existence
          </label>
        </div>

        {hasFunding && (
          <div className="field">
            <label htmlFor="funding_goal">How much does the world need to chip in? ($)</label>
            <input name="funding_goal" id="funding_goal" type="number" min="1" step="0.01" placeholder="e.g. 500" />
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
          {submitting ? 'Sending it...' : 'Put it out there'}
        </button>
      </form>
    </main>
  );
}
