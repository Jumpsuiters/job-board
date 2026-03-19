'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../lib/supabase';

export default function Home() {
  const supabase = createClient();
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    async function fetchFeatured() {
      const { data } = await supabase
        .from('jobs')
        .select('id, title, availability, job_type, price, price_half_day, price_day, price_week, photo_url, profiles!jobs_user_id_fkey!left(name, avatar_url)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(6);

      if (data) {
        // Sort: available now first, then scheduled
        const sorted = data.sort((a, b) => {
          if (a.availability === 'asap' && b.availability !== 'asap') return -1;
          if (a.availability !== 'asap' && b.availability === 'asap') return 1;
          return 0;
        });
        setFeatured(sorted.slice(0, 3));
      }
    }
    fetchFeatured();
  }, []);

  function lowestPrice(job) {
    if (job.price) return `$${job.price}/hr`;
    if (job.price_half_day) return `$${job.price_half_day}/half day`;
    if (job.price_day) return `$${job.price_day}/day`;
    if (job.price_week) return `$${job.price_week}/week`;
    return null;
  }

  return (
    <main>
      <div className="hero">
        <h1>Being human is the job</h1>
        <p>But who&apos;s gonna pay for it? We are.</p>
        <div className="cta-group">
          <Link href="/post" className="btn btn-primary">Offer something</Link>
          <Link href="/jobs" className="btn btn-secondary">Pay for something</Link>
        </div>
      </div>

      <div className="how-it-works">
        <p className="manifesto">
          As AI threatens to take our jobs, so what? We&apos;ll create new ones.
          J.O.B. Board is the human marketplace where we get paid to do the things
          AI could never do. Here&apos;s how it works.
        </p>
        <div className="steps">
          <div className="step">
            <span className="step-num">1</span>
            <h3>Put it out there</h3>
            <p>Offer what you&apos;re happy to do</p>
          </div>
          <div className="step">
            <span className="step-num">2</span>
            <h3>Someone accepts your offer</h3>
            <p>Offers can be in person or virtual, completely up to you</p>
          </div>
          <div className="step">
            <span className="step-num">3</span>
            <h3>Experience the Joy of Being together</h3>
            <p>Thank you for participating in the new human economy</p>
          </div>
        </div>
      </div>

      {featured.length > 0 && (
        <div className="featured-section">
          <div className="featured-grid">
            {featured.map(job => (
              <Link href={`/jobs/${job.id}`} key={job.id} className="featured-card">
                {job.photo_url && (
                  <div className="featured-photo">
                    <img src={job.photo_url} alt={job.title} />
                  </div>
                )}
                <h3>{job.title}</h3>
                <div className="badge-group">
                  {job.availability === 'asap' && (
                    <span className="badge badge-now"><span className="now-dot" />Available Now</span>
                  )}
                  {job.availability === 'scheduled' && (
                    <span className="badge">Schedule</span>
                  )}
                  <span className={`badge ${job.job_type === 'virtual' ? 'badge-virtual' : 'badge-local'}`}>
                    {job.job_type === 'virtual' ? 'Virtual' : 'In Person'}
                  </span>
                </div>
                {job.profiles?.name && (
                  <div className="featured-author">
                    {job.profiles.avatar_url && <img src={job.profiles.avatar_url} alt="" className="featured-author-avatar" />}
                    <span>{job.profiles.name}</span>
                  </div>
                )}
                {lowestPrice(job) && <span className="featured-price">{lowestPrice(job)}</span>}
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link href="/jobs" className="btn btn-secondary">View More</Link>
          </div>
        </div>
      )}

      <div className="roulette-section">
        <h2>Human Roulette</h2>
        <p className="roulette-desc">Enter the price you&apos;re willing to pay</p>
        <form className="roulette-form" onSubmit={e => e.preventDefault()}>
          <div className="roulette-input-row">
            <span className="roulette-dollar">$</span>
            <input type="number" className="roulette-input" placeholder="0" min="1" />
          </div>
          <button type="submit" className="btn btn-primary">Surprise me</button>
        </form>
      </div>
    </main>
  );
}
