'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setJobs(data || []);
      setLoading(false);
    }
    fetchJobs();
  }, []);

  if (loading) return <main><p className="empty">Loading dream jobs...</p></main>;

  return (
    <main>
      <h1>Dream Jobs</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Work worth doing, posted by people who care.
      </p>

      {jobs.length === 0 ? (
        <div className="empty">
          <p>No jobs yet. Be the first to dream one up!</p>
          <Link href="/post" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Post a Dream Job
          </Link>
        </div>
      ) : (
        jobs.map(job => (
          <div key={job.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h3>{job.title}</h3>
              {job.category && <span className="badge">{job.category}</span>}
            </div>
            <div className="meta">
              {job.pay && <span>{job.pay}</span>}
              {job.location && <span>{job.location}</span>}
              {job.posted_by && <span>by {job.posted_by}</span>}
            </div>
            <p className="description">{job.description}</p>
            <Link href={`/apply?job=${job.id}`} className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              Help Make This Real
            </Link>
          </div>
        ))
      )}
    </main>
  );
}
