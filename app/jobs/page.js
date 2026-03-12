'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.job_type === filter);

  if (loading) return <main><p className="empty">Loading dream jobs...</p></main>;

  return (
    <main>
      <h1>Dream Jobs</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Work worth doing, posted by people who care.
      </p>

      <div className="filter-bar">
        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button className={`filter-btn ${filter === 'local' ? 'active' : ''}`} onClick={() => setFilter('local')}>Local</button>
        <button className={`filter-btn ${filter === 'virtual' ? 'active' : ''}`} onClick={() => setFilter('virtual')}>Virtual</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <p>No jobs yet. Be the first to dream one up!</p>
          <Link href="/post" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Post a Dream Job
          </Link>
        </div>
      ) : (
        filtered.map(job => (
          <div key={job.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h3>{job.title}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge ${job.job_type === 'virtual' ? 'badge-virtual' : 'badge-local'}`}>
                  {job.job_type === 'virtual' ? 'Virtual' : 'Local'}
                </span>
                {job.category && <span className="badge">{job.category}</span>}
              </div>
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
