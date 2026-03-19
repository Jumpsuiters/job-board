'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../components/AuthProvider';

export default function PublicProfile() {
  const { slug } = useParams();
  const { user, supabase, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStipend, setShowStipend] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!p) {
        setLoading(false);
        return;
      }
      setProfile(p);

      // Fetch their jobs (posted or working)
      const { data: j } = await supabase
        .from('jobs')
        .select('*')
        .or(`user_id.eq.${p.id},worker_id.eq.${p.id}`)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false });
      setJobs(j || []);

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('worker_id', p.id)
        .eq('status', 'completed');
      setTotalBookings(bookings?.length || 0);

      const { data: rev } = await supabase
        .from('reviews')
        .select('*, profiles:reviewer_id(name, avatar_url)')
        .eq('reviewed_id', p.id)
        .order('created_at', { ascending: false });
      setReviews(rev || []);

      setLoading(false);
    }
    fetchProfile();
  }, [slug]);

  async function handleStipend(e) {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData(e.target);
    const amount = parseFloat(form.get('amount'));
    const message = form.get('message') || null;
    const platformFee = +(amount * 0.20).toFixed(2);
    const recipientAmount = +(amount - platformFee).toFixed(2);

    const { error } = await supabase.from('stipends').insert({
      recipient_id: profile.id,
      sender_id: user.id,
      amount,
      message,
      platform_fee: platformFee,
      recipient_amount: recipientAmount,
      status: 'completed',
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    setShowStipend(false);
    setSubmitting(false);
    window.location.href = '/success?action=stipend';
  }

  if (loading) return <main><p className="empty">Loading...</p></main>;
  if (!profile) return <main><p className="empty">Person not found.</p></main>;

  const isOwnProfile = user && user.id === profile.id;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <main>
      <div className="public-profile">
        <div className="profile-header">
          {profile.avatar_url && (
            <img src={profile.avatar_url} alt={profile.name} className="profile-avatar" />
          )}
          <h1>{profile.name || 'Anonymous'}</h1>
          {avgRating && <span className="profile-rating">{'★'} {avgRating} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>}
          {profile.location && <p className="profile-location">{profile.location}</p>}
          {profile.available_type && (
            <span className={`badge ${profile.available_type === 'virtual' ? 'badge-virtual' : profile.available_type === 'irl' ? 'badge-local' : ''}`} style={{ marginTop: '0.5rem', display: 'inline-block' }}>
              {profile.available_type === 'virtual' ? 'Virtual' : profile.available_type === 'irl' ? 'In Person' : 'Virtual & In Person'}
            </span>
          )}
        </div>

        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        {profile.available_for && (
          <div className="profile-available">
            <h3>Available for</h3>
            <p>{profile.available_for}</p>
          </div>
        )}

        <div className="profile-stats">
          {jobs.length > 0 && (
            <div className="stat">
              <span className="stat-num">{jobs.length}</span>
              <span className="stat-label">Active job{jobs.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {totalBookings > 0 && (
            <div className="stat">
              <span className="stat-num">{totalBookings}</span>
              <span className="stat-label">Booking{totalBookings !== 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="stat">
            <span className="stat-num">{new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            <span className="stat-label">Member since</span>
          </div>
        </div>

        {jobs.length > 0 && (
          <div className="profile-section">
            <h2>Jobs</h2>
            {jobs.map(job => (
              <Link href={`/jobs/${job.id}`} key={job.id} className="card card-link">
                <div className="card-header">
                  <h3>{job.title}</h3>
                  <div className="badge-group">
                    {job.availability === 'asap' && <span className="badge badge-now"><span className="now-dot" />Available Now</span>}
                    {job.availability === 'scheduled' && <span className="badge">Schedule</span>}
                    <span className={`badge ${job.job_type === 'virtual' ? 'badge-virtual' : 'badge-local'}`}>
                      {job.job_type === 'virtual' ? 'Virtual' : 'In Person'}
                    </span>
                  </div>
                </div>
                <div className="meta">
                  {job.price && <span>${job.price}</span>}
                  {job.location && <span>{job.location}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {reviews.length > 0 && (
          <div className="profile-section">
            <h2>Reviews ({reviews.length})</h2>
            {reviews.map(r => (
              <div key={r.id} className="review-card">
                <div className="review-header">
                  <div className="review-author">
                    {r.profiles?.avatar_url && <img src={r.profiles.avatar_url} alt="" className="review-avatar" />}
                    <strong>{r.profiles?.name || 'Someone'}</strong>
                  </div>
                  <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.text && <p className="review-text">{r.text}</p>}
              </div>
            ))}
          </div>
        )}

        {!isOwnProfile && (
          <div className="profile-section">
            {user ? (
              <>
                <button className="btn btn-primary" onClick={() => setShowStipend(!showStipend)}>
                  {showStipend ? 'Nevermind' : `Support ${profile.name || 'this person'}`}
                </button>

                {showStipend && (
                  <form onSubmit={handleStipend} className="stipend-form">
                    <div className="field">
                      <label htmlFor="stipend-amount">Amount ($) *</label>
                      <input name="amount" id="stipend-amount" type="number" min="1" step="0.01" required />
                    </div>
                    <div className="field">
                      <label htmlFor="stipend-message">Message (optional)</label>
                      <input name="message" id="stipend-message" placeholder="A few words of encouragement..." />
                    </div>
                    <p className="field-hint">20% platform fee. The rest goes directly to {profile.name || 'them'}.</p>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Sending...' : 'Send Stipend'}
                    </button>
                  </form>
                )}
              </>
            ) : (
              !authLoading && (
                <Link href="/login" className="btn btn-primary">Log in to support {profile.name || 'this person'}</Link>
              )
            )}
          </div>
        )}

        {isOwnProfile && (
          <div className="profile-section">
            <Link href="/profile" className="btn btn-secondary">Edit Profile</Link>
          </div>
        )}
      </div>
    </main>
  );
}
