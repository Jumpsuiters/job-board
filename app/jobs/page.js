'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';

export default function Jobs() {
  const supabase = createClient();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [typeFilter, setTypeFilter] = useState('all');
  const [nowOnly, setNowOnly] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, profiles!jobs_user_id_fkey(name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Jobs fetch error:', error);
        alert('Error loading jobs: ' + error.message);
      }
      if (data) {
        setJobs(data);
      }
      setLoading(false);
    }
    fetchJobs();
  }, []);

  let filtered = jobs;

  // Type filter
  if (typeFilter !== 'all') {
    filtered = filtered.filter(j => j.job_type === typeFilter);
  }

  // Available Now filter
  if (nowOnly) {
    filtered = filtered.filter(j => j.availability === 'asap');
  }

  // Search
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(j =>
      (j.location && j.location.toLowerCase().includes(q)) ||
      (j.title && j.title.toLowerCase().includes(q)) ||
      (j.description && j.description.toLowerCase().includes(q))
    );
  }

  // Sort
  if (sort === 'price_low') {
    filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sort === 'price_high') {
    filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  if (loading) return <main><p className="empty">Loading jobs...</p></main>;

  return (
    <main>
      <h1>Jobs</h1>
      <p className="subtitle">Human connection, for hire. Browse what people are offering.</p>

      <div className="feed-controls">
        <div className="filter-bar">
          <button className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
          <button className={`filter-btn ${typeFilter === 'virtual' ? 'active' : ''}`} onClick={() => setTypeFilter('virtual')}>Virtual</button>
          <button className={`filter-btn ${typeFilter === 'local' ? 'active' : ''}`} onClick={() => setTypeFilter('local')}>In Person</button>
        </div>
        <button
          className={`filter-btn filter-now ${nowOnly ? 'active' : ''}`}
          onClick={() => setNowOnly(!nowOnly)}
        >
          <span className="now-dot" />Available Now
        </button>
      </div>

      <div className="feed-controls">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search jobs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">
              &times;
            </button>
          )}
        </div>
        <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <p>{search || typeFilter !== 'all' || nowOnly ? 'No jobs match those filters.' : "No jobs yet. Be the first."}</p>
          {!search && typeFilter === 'all' && !nowOnly && (
            <Link href="/post" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
              Post a Job
            </Link>
          )}
        </div>
      ) : (
        filtered.map(job => (
          <Link href={`/jobs/${job.id}`} key={job.id} className="card card-link">
            {job.photo_url && (
              <div className="card-photo">
                <img src={job.photo_url} alt={job.title} />
              </div>
            )}
            <div className="card-body">
              <div className="card-header">
                <div className="card-title-row">
                  {job.profiles?.avatar_url && (
                    <img src={job.profiles.avatar_url} alt="" className="card-avatar" />
                  )}
                  <h3>{job.title}</h3>
                </div>
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
                {job.price && <span>From ${job.price}/hr</span>}
                {!job.price && job.price_half_day && <span>From ${job.price_half_day}/half day</span>}
                {!job.price && !job.price_half_day && job.price_day && <span>From ${job.price_day}/day</span>}
                {!job.price && !job.price_half_day && !job.price_day && job.price_week && <span>From ${job.price_week}/week</span>}
                {job.location && <span>{job.location}</span>}
                {job.profiles?.name && <span>by {job.profiles.name}</span>}
              </div>
              <p className="description">{job.description.slice(0, 150)}{job.description.length > 150 ? '...' : ''}</p>
            </div>
          </Link>
        ))
      )}
    </main>
  );
}
