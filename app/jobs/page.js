'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';

const STATUS_LABELS = {
  dreaming: 'Dreaming',
  funding: 'Funding',
  hiring: 'Hiring',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function Jobs() {
  const supabase = createClient();
  const [jobs, setJobs] = useState([]);
  const [pledgeTotals, setPledgeTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setJobs(data);

        // Fetch pledge totals for funding jobs
        const fundingIds = data.filter(j => j.funding_goal).map(j => j.id);
        if (fundingIds.length > 0) {
          const { data: pledges } = await supabase
            .from('pledges')
            .select('job_id, amount')
            .in('job_id', fundingIds)
            .eq('status', 'completed');

          if (pledges) {
            const totals = {};
            pledges.forEach(p => {
              totals[p.job_id] = (totals[p.job_id] || 0) + Number(p.amount);
            });
            setPledgeTotals(totals);
          }
        }
      }
      setLoading(false);
    }
    fetchJobs();
  }, []);

  let filtered = typeFilter === 'all' ? jobs : jobs.filter(j => j.job_type === typeFilter);

  if (sort === 'most_funded') {
    filtered = [...filtered].sort((a, b) => (pledgeTotals[b.id] || 0) - (pledgeTotals[a.id] || 0));
  } else if (sort === 'random') {
    filtered = [...filtered].sort(() => Math.random() - 0.5);
  }

  if (loading) return <main><p className="empty">Loading dream jobs...</p></main>;

  return (
    <main>
      <h1>Jobs People Made Up</h1>
      <p className="subtitle">Real money. Imaginary careers. Somehow it works.</p>

      <div className="feed-controls">
        <div className="filter-bar">
          <button className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
          <button className={`filter-btn ${typeFilter === 'local' ? 'active' : ''}`} onClick={() => setTypeFilter('local')}>Local</button>
          <button className={`filter-btn ${typeFilter === 'virtual' ? 'active' : ''}`} onClick={() => setTypeFilter('virtual')}>Virtual</button>
        </div>
        <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="most_funded">Most Funded</option>
          <option value="random">Random</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <p>Nothing here yet. Someone&apos;s gotta go first.</p>
          <Link href="/post" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Make Up a Job
          </Link>
        </div>
      ) : (
        filtered.map(job => {
          const pledged = pledgeTotals[job.id] || 0;
          const progress = job.funding_goal ? Math.min((pledged / job.funding_goal) * 100, 100) : 0;

          return (
            <Link href={`/jobs/${job.id}`} key={job.id} className="card card-link">
              <div className="card-header">
                <h3>{job.title}</h3>
                <div className="badge-group">
                  <span className={`badge badge-status badge-${job.status}`}>
                    {STATUS_LABELS[job.status]}
                  </span>
                  <span className={`badge ${job.job_type === 'virtual' ? 'badge-virtual' : 'badge-local'}`}>
                    {job.job_type === 'virtual' ? 'Virtual' : 'Local'}
                  </span>
                </div>
              </div>
              <div className="meta">
                {job.price && <span>${job.price}/hr</span>}
                {job.location && <span>{job.location}</span>}
                {job.profiles?.name && <span>by {job.profiles.name}</span>}
                {!job.profiles && <span>by The JOB Board</span>}
              </div>
              <p className="description">{job.description.slice(0, 150)}{job.description.length > 150 ? '...' : ''}</p>
              {job.funding_goal && (
                <div className="funding-mini">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="funding-text">${pledged.toFixed(0)} / ${job.funding_goal} funded</span>
                </div>
              )}
            </Link>
          );
        })
      )}
    </main>
  );
}
