'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function ApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job');
  const [job, setJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    async function fetchJob() {
      const { data } = await supabase.from('jobs').select('*').eq('id', jobId).single();
      if (data) setJob(data);
    }
    fetchJob();
  }, [jobId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData(e.target);
    const application = {
      job_id: jobId,
      name: form.get('name'),
      reason: form.get('reason'),
      availability: form.get('availability'),
      contact_info: form.get('contact_info'),
    };

    const { error } = await supabase.from('applications').insert(application);

    if (error) {
      alert('Something went wrong: ' + error.message);
      setSubmitting(false);
      return;
    }

    router.push('/success?action=applied');
  }

  if (!jobId) return <main><p className="empty">No job selected.</p></main>;

  return (
    <main>
      <h1>Help Make This Real</h1>
      {job && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Applying for: <strong style={{ color: 'var(--accent)' }}>{job.title}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Your Name *</label>
          <input name="name" id="name" required placeholder="What should we call you?" />
        </div>

        <div className="field">
          <label htmlFor="reason">Why This Job?</label>
          <textarea name="reason" id="reason"
            placeholder="What draws you to this work?" />
        </div>

        <div className="field">
          <label htmlFor="availability">Availability</label>
          <input name="availability" id="availability"
            placeholder="e.g. Weekends, Full-time, 10 hrs/week" />
        </div>

        <div className="field">
          <label htmlFor="contact_info">How to Reach You *</label>
          <input name="contact_info" id="contact_info" required
            placeholder="Email, phone, or however you prefer" />
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send Application'}
        </button>
      </form>
    </main>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<main><p className="empty">Loading...</p></main>}>
      <ApplyForm />
    </Suspense>
  );
}
