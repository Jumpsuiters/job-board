'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthProvider';

const STATUS_LABELS = {
  dreaming: 'Dreaming',
  funding: 'Funding',
  hiring: 'Hiring',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function Dashboard() {
  const { user, profile, loading, supabase } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('jobs');
  const [myJobs, setMyJobs] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      const [jobsRes, appsRes, paymentsRes] = await Promise.all([
        supabase.from('jobs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('applications').select('*, jobs(title, status)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('payments').select('*, jobs(title)').or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`).order('created_at', { ascending: false }),
      ]);

      setMyJobs(jobsRes.data || []);
      setMyApps(appsRes.data || []);
      setMyPayments(paymentsRes.data || []);
      setFetching(false);
    }
    fetchData();
  }, [user]);

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
        <button className={`tab-btn ${tab === 'apps' ? 'active' : ''}`} onClick={() => setTab('apps')}>
          Applications ({myApps.length})
        </button>
        <button className={`tab-btn ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>
          Payments ({myPayments.length})
        </button>
      </div>

      {tab === 'jobs' && (
        <div>
          {myJobs.length === 0 ? (
            <div className="empty">
              <p>You haven&apos;t made up any jobs yet. Go on.</p>
              <Link href="/post" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Make one up
              </Link>
            </div>
          ) : (
            myJobs.map(job => (
              <Link href={`/jobs/${job.id}`} key={job.id} className="card card-link">
                <div className="card-header">
                  <h3>{job.title}</h3>
                  <span className={`badge badge-status badge-${job.status}`}>{STATUS_LABELS[job.status]}</span>
                </div>
                <div className="meta">
                  {job.price && <span>${job.price}/hr</span>}
                  {job.location && <span>{job.location}</span>}
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'apps' && (
        <div>
          {myApps.length === 0 ? (
            <div className="empty">
              <p>You haven&apos;t applied to anything yet. Feeling shy?</p>
              <Link href="/jobs" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Browse the board
              </Link>
            </div>
          ) : (
            myApps.map(app => (
              <Link href={`/jobs/${app.job_id}`} key={app.id} className="card card-link">
                <div className="card-header">
                  <h3>{app.jobs?.title || 'Job'}</h3>
                  <span className={`badge badge-status badge-${app.status === 'accepted' ? 'in_progress' : app.status === 'rejected' ? 'completed' : 'dreaming'}`}>
                    {app.status}
                  </span>
                </div>
                {app.message && <p className="description">{app.message.slice(0, 100)}...</p>}
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div>
          {myPayments.length === 0 ? (
            <div className="empty"><p>No money moved yet. Stay tuned.</p></div>
          ) : (
            myPayments.map(p => (
              <div key={p.id} className="card">
                <div className="card-header">
                  <h3>{p.jobs?.title || 'Job'}</h3>
                  <span className={`badge badge-status badge-${p.status === 'completed' ? 'in_progress' : 'dreaming'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="meta">
                  <span>Total: ${Number(p.amount).toFixed(2)}</span>
                  <span>Platform fee: ${Number(p.platform_fee).toFixed(2)}</span>
                  <span>
                    {p.payee_id === user.id
                      ? `You earned: $${Number(p.worker_amount).toFixed(2)}`
                      : `Worker gets: $${Number(p.worker_amount).toFixed(2)}`
                    }
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
