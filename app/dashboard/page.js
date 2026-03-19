'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';

const STATUS_BADGE = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  completed: 'badge-completed',
  declined: 'badge-declined',
  cancelled: 'badge-declined',
};

export default function Dashboard() {
  const { user, profile, loading, supabase } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('jobs');
  const [bookingView, setBookingView] = useState('buyer');
  const [myJobs, setMyJobs] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  useEffect(() => {
    if (!user) {
      if (!loading) setFetching(false);
      return;
    }
    fetchData();
  }, [user, loading]);

  async function fetchData() {
    const [jobsRes, bookingsRes] = await Promise.all([
      supabase.from('jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*, jobs!bookings_job_id_fkey(title), booker:booker_id(name), provider:worker_id(name)').or(`booker_id.eq.${user.id},worker_id.eq.${user.id}`).order('created_at', { ascending: false }),
    ]);

    setMyJobs(jobsRes.data || []);
    setMyBookings(bookingsRes.data || []);
    setFetching(false);
  }

  async function handleApprove(bookingId, jobId) {
    setActing(bookingId);
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);

    // Increment hire_count on approval
    const job = myJobs.find(j => j.id === jobId);
    if (job) {
      await supabase.from('jobs').update({ hire_count: (job.hire_count || 0) + 1 }).eq('id', jobId);
    }

    setActing(null);
    fetchData();
  }

  async function handleDecline(bookingId) {
    setActing(bookingId);
    await supabase.from('bookings').update({ status: 'declined' }).eq('id', bookingId);
    setActing(null);
    fetchData();
  }

  async function handleComplete(bookingId) {
    setActing(bookingId);
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
    setActing(null);
    fetchData();
  }

  const buyerBookings = myBookings.filter(b => b.booker_id === user?.id);
  const providerBookings = myBookings.filter(b => b.worker_id === user?.id);

  if (loading || fetching) return <main><p className="empty">Loading...</p></main>;

  return (
    <main>
      <div className="dashboard-header">
        <div>
          <h1>Hey, {profile?.name || 'there'}</h1>
          <p className="subtitle">Your corner of the board</p>
        </div>
        <Link href="/profile" className="btn btn-secondary btn-sm">Edit Profile</Link>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'jobs' ? 'active' : ''}`} onClick={() => setTab('jobs')}>
          My Jobs ({myJobs.length})
        </button>
        <button className={`tab-btn ${tab === 'bookings' ? 'active' : ''}`} onClick={() => setTab('bookings')}>
          Bookings ({myBookings.length})
        </button>
      </div>

      {tab === 'jobs' && (
        <div>
          {myJobs.length === 0 ? (
            <div className="empty">
              <p>You haven&apos;t posted any jobs yet.</p>
              <Link href="/post" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Post a job
              </Link>
            </div>
          ) : (
            myJobs.map(job => (
              <Link href={`/jobs/${job.id}`} key={job.id} className="card card-link">
                <div className="card-header">
                  <h3>{job.title}</h3>
                  <div className="badge-group">
                    {job.availability === 'asap' && <span className="badge badge-now"><span className="now-dot" />Available Now</span>}
                    {job.availability === 'scheduled' && <span className="badge">Schedule</span>}
                    <span className={`badge ${job.job_type === 'virtual' ? 'badge-virtual' : 'badge-local'}`}>
                      {job.job_type === 'virtual' ? 'Virtual' : 'In Person'}
                    </span>
                    <span className={`badge ${job.booking_mode === 'request' ? 'badge-pending' : 'badge-confirmed'}`}>
                      {job.booking_mode === 'request' ? 'Request' : 'Instant'}
                    </span>
                    {job.hire_count > 0 && (
                      <span className="badge badge-hires">Booked {job.hire_count}x</span>
                    )}
                  </div>
                </div>
                <div className="meta">
                  {job.price && <span>${job.price}</span>}
                  {job.location && <span>{job.location}</span>}
                  <span>You posted this</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'bookings' && (
        <div>
          <div className="tab-bar" style={{ marginTop: 0 }}>
            <button className={`tab-btn ${bookingView === 'buyer' ? 'active' : ''}`} onClick={() => setBookingView('buyer')}>
              As Buyer ({buyerBookings.length})
            </button>
            <button className={`tab-btn ${bookingView === 'provider' ? 'active' : ''}`} onClick={() => setBookingView('provider')}>
              As Provider ({providerBookings.length})
            </button>
          </div>

          {bookingView === 'buyer' && (
            <div>
              {buyerBookings.length === 0 ? (
                <div className="empty"><p>No bookings yet. <Link href="/jobs">Browse jobs</Link></p></div>
              ) : (
                buyerBookings.map(b => (
                  <div key={b.id} className="card request-card">
                    <div className="card-header">
                      <h3>{b.jobs?.title || 'Job'}</h3>
                      <span className={`badge ${STATUS_BADGE[b.status] || ''}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="meta">
                      <span>Provider: {b.provider?.name || 'Someone'}</span>
                      <span>${Number(b.amount).toFixed(2)}{b.rate_type ? ` (${b.rate_type.replace('_', ' ')})` : ''}</span>
                      {b.requested_time && <span>{new Date(b.requested_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>}
                    </div>
                    {b.message && <p className="description" style={{ fontStyle: 'italic', marginTop: '0.5rem' }}>&ldquo;{b.message}&rdquo;</p>}
                    {b.status === 'confirmed' && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleComplete(b.id)}
                          disabled={acting === b.id}
                        >
                          {acting === b.id ? 'Completing...' : 'Mark Complete'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {bookingView === 'provider' && (
            <div>
              {providerBookings.length === 0 ? (
                <div className="empty"><p>No bookings for your jobs yet.</p></div>
              ) : (
                providerBookings.map(b => (
                  <div key={b.id} className="card request-card">
                    <div className="card-header">
                      <h3>{b.jobs?.title || 'Job'}</h3>
                      <span className={`badge ${STATUS_BADGE[b.status] || ''}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="meta">
                      <span>Buyer: {b.booker?.name || 'Someone'}</span>
                      <span>${Number(b.amount).toFixed(2)}{b.rate_type ? ` (${b.rate_type.replace('_', ' ')})` : ''}</span>
                      <span>You earn: ${Number(b.worker_amount).toFixed(2)}</span>
                      {b.requested_time && <span>{new Date(b.requested_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>}
                    </div>
                    {b.message && <p className="description" style={{ fontStyle: 'italic', marginTop: '0.5rem' }}>&ldquo;{b.message}&rdquo;</p>}
                    {b.status === 'pending' && (
                      <div className="request-actions" style={{ marginTop: '0.75rem' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApprove(b.id, b.job_id)}
                          disabled={acting === b.id}
                        >
                          {acting === b.id ? '...' : 'Approve'}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDecline(b.id)}
                          disabled={acting === b.id}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {b.status === 'confirmed' && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleComplete(b.id)}
                          disabled={acting === b.id}
                        >
                          {acting === b.id ? 'Completing...' : 'Mark Complete'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
