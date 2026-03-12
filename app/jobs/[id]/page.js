'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../components/AuthProvider';

const STATUS_LABELS = {
  dreaming: 'Dreaming',
  funding: 'Funding',
  hiring: 'Hiring',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function JobDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, supabase, loading: authLoading } = useAuth();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [showFund, setShowFund] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isCreator = user && job && user.id === job.user_id;
  const pledgeTotal = pledges.reduce((sum, p) => sum + Number(p.amount), 0);
  const fundingProgress = job?.funding_goal ? Math.min((pledgeTotal / job.funding_goal) * 100, 100) : 0;

  useEffect(() => {
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (job && user) {
      if (isCreator) fetchApplications();
      fetchPledges();
    }
  }, [job, user]);

  async function fetchJob() {
    const { data } = await supabase
      .from('jobs')
      .select('*, profiles(name, location, bio)')
      .eq('id', id)
      .single();
    setJob(data);
    setLoading(false);

    // Fetch pledges publicly
    const { data: p } = await supabase
      .from('pledges')
      .select('*, profiles(name)')
      .eq('job_id', id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    setPledges(p || []);
  }

  async function fetchApplications() {
    const { data } = await supabase
      .from('applications')
      .select('*, profiles(name, location)')
      .eq('job_id', id)
      .order('created_at', { ascending: false });
    setApplications(data || []);
  }

  async function fetchPledges() {
    const { data } = await supabase
      .from('pledges')
      .select('*, profiles(name)')
      .eq('job_id', id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    setPledges(data || []);
  }

  async function handleApply(e) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.target);

    const { error } = await supabase.from('applications').insert({
      job_id: id,
      user_id: user.id,
      message: form.get('message'),
      availability: form.get('availability'),
      proposed_rate: form.get('proposed_rate') ? parseFloat(form.get('proposed_rate')) : null,
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    setShowApply(false);
    setSubmitting(false);
    router.push('/success?action=applied');
  }

  async function handleFund(e) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.target);
    const amount = parseFloat(form.get('amount'));

    const { error } = await supabase.from('pledges').insert({
      job_id: id,
      user_id: user.id,
      amount,
      message: form.get('message') || null,
      status: 'completed',
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    // Check if funding goal is now met
    const newTotal = pledgeTotal + amount;
    if (job.funding_goal && newTotal >= job.funding_goal && job.status === 'funding') {
      await supabase.from('jobs').update({ status: 'hiring' }).eq('id', id);
    }

    setShowFund(false);
    setSubmitting(false);
    router.push('/success?action=funded');
  }

  async function handleHire(application) {
    if (!confirm(`Hire ${application.profiles?.name || 'this person'}? You're about to make someone's dream job real.`)) return;

    const amount = job.price || 0;
    const platformFee = +(amount * 0.15).toFixed(2);
    const workerAmount = +(amount - platformFee).toFixed(2);

    // Create payment record
    await supabase.from('payments').insert({
      job_id: id,
      application_id: application.id,
      payer_id: user.id,
      payee_id: application.user_id,
      amount,
      platform_fee: platformFee,
      worker_amount: workerAmount,
      status: 'completed',
    });

    // Update application status
    await supabase.from('applications').update({ status: 'accepted' }).eq('id', application.id);

    // Update job status
    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', id);

    router.push('/success?action=hired');
  }

  if (loading) return <main><p className="empty">Loading...</p></main>;
  if (!job) return <main><p className="empty">Job not found.</p></main>;

  return (
    <main>
      <Link href="/jobs" className="back-link">&larr; All Jobs</Link>

      <div className="job-detail">
        <div className="job-detail-header">
          <h1>{job.title}</h1>
          <div className="badge-group">
            <span className={`badge badge-status badge-${job.status}`}>
              {STATUS_LABELS[job.status]}
            </span>
            <span className={`badge ${job.job_type === 'virtual' ? 'badge-virtual' : 'badge-local'}`}>
              {job.job_type === 'virtual' ? 'Virtual' : 'Local'}
            </span>
            {job.category && <span className="badge">{job.category}</span>}
          </div>
        </div>

        <div className="meta" style={{ marginBottom: '1.5rem' }}>
          {job.price && <span>${job.price}/hr</span>}
          {job.location && <span>{job.location}</span>}
          {job.profiles?.name && <span>Posted by {job.profiles.name}</span>}
          {!job.profiles && <span>Posted by The JOB Board</span>}
        </div>

        <div className="job-description">{job.description}</div>

        {/* Funding section */}
        {job.funding_goal && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3>Making it real</h3>
            <div className="funding-detail">
              <div className="progress-bar progress-bar-lg">
                <div className="progress-fill" style={{ width: `${fundingProgress}%` }} />
              </div>
              <div className="funding-stats">
                <span className="funding-amount">${pledgeTotal.toFixed(0)} in the pot</span>
                <span className="funding-goal">${job.funding_goal} to make it real</span>
              </div>
            </div>

            {pledges.length > 0 && (
              <div className="pledge-list">
                {pledges.map(p => (
                  <div key={p.id} className="pledge-item">
                    <strong>{p.profiles?.name || 'Someone'}</strong> pledged ${Number(p.amount).toFixed(0)}
                    {p.message && <span className="pledge-msg"> &mdash; &ldquo;{p.message}&rdquo;</span>}
                  </div>
                ))}
              </div>
            )}

            {user && !isCreator && (
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setShowFund(!showFund)}>
                {showFund ? 'Nevermind' : 'Throw Money At This'}
              </button>
            )}

            {showFund && (
              <form onSubmit={handleFund} style={{ marginTop: '1rem' }}>
                <div className="field">
                  <label htmlFor="amount">How much? ($) *</label>
                  <input name="amount" id="amount" type="number" min="1" step="0.01" required />
                </div>
                <div className="field">
                  <label htmlFor="fund-message">Say something (optional)</label>
                  <input name="message" id="fund-message" placeholder="Why does this job need to exist?" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Throwing...' : 'Make it rain'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Apply section */}
        {user && !isCreator && (job.status === 'hiring' || job.status === 'dreaming') && (
          <div style={{ marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={() => setShowApply(!showApply)}>
              {showApply ? 'Nevermind' : 'I want this job'}
            </button>

            {showApply && (
              <form onSubmit={handleApply} className="card" style={{ marginTop: '1rem' }}>
                <h3>Convince them</h3>
                <div className="field">
                  <label htmlFor="message">Why should you get this made-up job?</label>
                  <textarea name="message" id="message" placeholder="What makes you the one?" />
                </div>
                <div className="field">
                  <label htmlFor="availability">When are you free?</label>
                  <input name="availability" id="availability" placeholder="e.g. Weekends, Tuesday afternoons, always" />
                </div>
                <div className="field">
                  <label htmlFor="proposed_rate">Proposed Rate ($/hr, optional)</label>
                  <input name="proposed_rate" id="proposed_rate" type="number" min="0" step="0.01" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Throw your hat in'}
                </button>
              </form>
            )}
          </div>
        )}

        {!user && !authLoading && (
          <div style={{ marginTop: '2rem' }}>
            <Link href="/login" className="btn btn-primary">Log in to get in on this</Link>
          </div>
        )}

        {/* Applications section (creator only) */}
        {isCreator && (
          <div style={{ marginTop: '2rem' }}>
            <h2>People who want this job ({applications.length})</h2>
            {applications.length === 0 ? (
              <p className="empty">Nobody&apos;s applied yet. Give it time.</p>
            ) : (
              applications.map(app => (
                <div key={app.id} className="card">
                  <div className="card-header">
                    <h3>{app.profiles?.name || 'Anonymous'}</h3>
                    <span className={`badge badge-status badge-${app.status === 'accepted' ? 'in_progress' : app.status === 'rejected' ? 'completed' : 'dreaming'}`}>
                      {app.status}
                    </span>
                  </div>
                  {app.profiles?.location && <div className="meta"><span>{app.profiles.location}</span></div>}
                  {app.message && <p className="description">{app.message}</p>}
                  <div className="meta">
                    {app.availability && <span>Available: {app.availability}</span>}
                    {app.proposed_rate && <span>Rate: ${app.proposed_rate}/hr</span>}
                  </div>
                  {app.status === 'pending' && job.status !== 'completed' && (
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => handleHire(app)}>
                      Hire{job.price ? ` — $${job.price} (you pay) → $${(job.price * 0.85).toFixed(2)} (they get)` : ''}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
