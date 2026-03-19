'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthProvider';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function weekStart(weeksBack) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() - (weeksBack * 7));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function AdminDashboard() {
  const { user, loading, supabase } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user]);

  useEffect(() => {
    if (!user) {
      if (!loading) setFetching(false);
      return;
    }
    fetchAll();
  }, [user, loading]);

  async function fetchAll() {
    try {
      // Jobs and reviews are publicly readable (RLS allows SELECT for all)
      // Bookings may be restricted — fetch what we can
      const jobsRes = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
      if (jobsRes.error) { setError('Jobs: ' + jobsRes.error.message); setFetching(false); return; }

      const bookingsRes = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (bookingsRes.error) { setError('Bookings: ' + bookingsRes.error.message); setFetching(false); return; }

      const reviewsRes = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (reviewsRes.error) { setError('Reviews: ' + reviewsRes.error.message); setFetching(false); return; }

      const jobs = jobsRes.data || [];
      const bookings = bookingsRes.data || [];
      const reviews = reviewsRes.data || [];

      const now = new Date();
      const thisWeekStart = weekStart(0);
      const lastWeekStart = weekStart(1);

      // === MARKETPLACE PULSE ===

      const activeListings = jobs.filter(j => j.status === 'open' && j.created_at > daysAgo(30)).length;
      const totalOpen = jobs.filter(j => j.status === 'open').length;
      const newJobsThisWeek = jobs.filter(j => j.created_at >= thisWeekStart).length;
      const newJobsLastWeek = jobs.filter(j => j.created_at >= lastWeekStart && j.created_at < thisWeekStart).length;

      const bookingsThisWeek = bookings.filter(b => b.created_at >= thisWeekStart).length;
      const bookingsLastWeek = bookings.filter(b => b.created_at >= lastWeekStart && b.created_at < thisWeekStart).length;

      // Request-to-Book conversion
      const requestBookings = bookings.filter(b => b.message);
      const requestConfirmed = requestBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length;
      const requestDeclined = requestBookings.filter(b => b.status === 'declined').length;
      const requestPending = requestBookings.filter(b => b.status === 'pending').length;
      const requestConversion = (requestConfirmed + requestDeclined) > 0
        ? Math.round((requestConfirmed / (requestConfirmed + requestDeclined)) * 100)
        : null;

      // Time to first booking per job
      const jobFirstBooking = {};
      bookings.forEach(b => {
        if (!jobFirstBooking[b.job_id] || b.created_at < jobFirstBooking[b.job_id]) {
          jobFirstBooking[b.job_id] = b.created_at;
        }
      });
      const timeToFirstBookings = jobs
        .filter(j => jobFirstBooking[j.id])
        .map(j => {
          const posted = new Date(j.created_at);
          const firstBook = new Date(jobFirstBooking[j.id]);
          return (firstBook - posted) / (1000 * 60 * 60);
        });
      const avgTimeToFirstBooking = timeToFirstBookings.length > 0
        ? timeToFirstBookings.reduce((a, b) => a + b, 0) / timeToFirstBookings.length
        : null;

      // Total hire count from jobs (always available, public data)
      const totalHires = jobs.reduce((s, j) => s + (j.hire_count || 0), 0);

      // === HUMAN SIGNAL ===

      const confirmed = bookings.filter(b => b.status === 'confirmed').length;
      const completed = bookings.filter(b => b.status === 'completed').length;
      const completionRate = (confirmed + completed) > 0
        ? Math.round((completed / (confirmed + completed)) * 100)
        : null;

      // Repeat bookings
      const pairCounts = {};
      bookings.forEach(b => {
        const key = `${b.booker_id}→${b.worker_id}`;
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      });
      const repeatPairs = Object.values(pairCounts).filter(c => c > 1).length;
      const totalPairs = Object.keys(pairCounts).length;

      // Review rate
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const bookingsWithReview = new Set(reviews.map(r => r.booking_id).filter(Boolean));
      const reviewRate = completedBookings.length > 0
        ? Math.round((bookingsWithReview.size / completedBookings.length) * 100)
        : null;

      const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

      // Message depth
      const messages = bookings.filter(b => b.message).map(b => b.message);
      const avgMessageLength = messages.length > 0
        ? Math.round(messages.reduce((s, m) => s + m.length, 0) / messages.length)
        : null;

      // === SUPPLY HEALTH ===

      const openJobs = jobs.filter(j => j.status === 'open');

      const categoryCount = {};
      openJobs.forEach(j => {
        const cat = j.category || 'Uncategorized';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const instantCount = openJobs.filter(j => j.booking_mode !== 'request').length;
      const requestCount = openJobs.filter(j => j.booking_mode === 'request').length;

      const virtualCount = openJobs.filter(j => j.job_type === 'virtual').length;
      const localCount = openJobs.filter(j => j.job_type === 'local').length;

      const uniqueLocations = new Set(openJobs.map(j => j.location).filter(Boolean)).size;

      // Provider return rate
      const providerJobCounts = {};
      jobs.forEach(j => {
        if (j.user_id) providerJobCounts[j.user_id] = (providerJobCounts[j.user_id] || 0) + 1;
      });
      const totalProviders = Object.keys(providerJobCounts).length;
      const returningProviders = Object.values(providerJobCounts).filter(c => c > 1).length;

      // === ECONOMICS ===

      const totalGMV = bookings.reduce((s, b) => s + Number(b.amount || 0), 0);
      const totalFees = bookings.reduce((s, b) => s + Number(b.platform_fee || 0), 0);
      const gmvThisWeek = bookings
        .filter(b => b.created_at >= thisWeekStart)
        .reduce((s, b) => s + Number(b.amount || 0), 0);

      const avgBookingValue = bookings.length > 0
        ? (totalGMV / bookings.length).toFixed(2)
        : 0;

      // Rate tier distribution
      const rateTierCount = {};
      bookings.forEach(b => {
        const tier = b.rate_type || 'unknown';
        rateTierCount[tier] = (rateTierCount[tier] || 0) + 1;
      });

      // Price distribution of open jobs (hourly)
      const prices = openJobs.map(j => j.price).filter(Boolean).sort((a, b) => a - b);
      const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : null;
      const minPrice = prices.length > 0 ? prices[0] : null;
      const maxPrice = prices.length > 0 ? prices[prices.length - 1] : null;

      setData({
        activeListings, totalOpen, newJobsThisWeek, newJobsLastWeek,
        bookingsThisWeek, bookingsLastWeek, totalHires,
        requestConversion, requestPending, requestConfirmed, requestDeclined,
        avgTimeToFirstBooking,
        completionRate, completed, confirmed,
        repeatPairs, totalPairs,
        reviewRate, avgRating, totalReviews: reviews.length,
        avgMessageLength, totalMessages: messages.length,
        categoryCount, instantCount, requestCount,
        virtualCount, localCount, uniqueLocations,
        totalProviders, returningProviders,
        totalGMV, totalFees, gmvThisWeek, avgBookingValue,
        rateTierCount, medianPrice, minPrice, maxPrice,
        totalBookings: bookings.length, totalJobs: jobs.length,
      });
    } catch (err) {
      setError(err.message);
    }
    setFetching(false);
  }

  if (loading) return <main><p className="empty">Checking auth...</p></main>;
  if (!user) return <main><p className="empty">Please <a href="/login">log in</a> to view the dashboard.</p></main>;
  if (fetching) return <main><p className="empty">Loading dashboard...</p></main>;
  if (error) return <main><p className="error-msg">Error: {error}</p></main>;
  if (!data) return <main><p className="empty">No data.</p></main>;

  return (
    <main>
      <h1>The Board — Pulse</h1>
      <p className="subtitle">Is the board alive? Let&apos;s see.</p>

      {/* MARKETPLACE PULSE */}
      <section className="admin-section">
        <h2>Marketplace Pulse</h2>
        <div className="stat-grid">
          <Stat label="Open listings" value={data.totalOpen} />
          <Stat label="Active (last 30d)" value={data.activeListings} />
          <Stat
            label="New jobs this week"
            value={data.newJobsThisWeek}
            trend={data.newJobsThisWeek - data.newJobsLastWeek}
          />
          <Stat
            label="Bookings this week"
            value={data.bookingsThisWeek}
            trend={data.bookingsThisWeek - data.bookingsLastWeek}
          />
          <Stat label="Total hires" value={data.totalHires} />
          <Stat
            label="Request → Confirmed"
            value={data.requestConversion !== null ? `${data.requestConversion}%` : '—'}
            sub={data.requestConfirmed + data.requestDeclined > 0
              ? `${data.requestConfirmed} yes / ${data.requestDeclined} no / ${data.requestPending} pending`
              : 'No request bookings yet'}
          />
          <Stat
            label="Avg time to first booking"
            value={data.avgTimeToFirstBooking !== null
              ? (data.avgTimeToFirstBooking < 24
                ? `${Math.round(data.avgTimeToFirstBooking)}h`
                : `${(data.avgTimeToFirstBooking / 24).toFixed(1)}d`)
              : '—'}
          />
        </div>
      </section>

      {/* HUMAN SIGNAL */}
      <section className="admin-section">
        <h2>Human Signal</h2>
        <p className="section-desc">Is real connection happening?</p>
        <div className="stat-grid">
          <Stat
            label="Completion rate"
            value={data.completionRate !== null ? `${data.completionRate}%` : '—'}
            sub={`${data.completed} completed / ${data.confirmed} in progress`}
          />
          <Stat
            label="Repeat connections"
            value={data.repeatPairs}
            sub={`out of ${data.totalPairs} unique pairs`}
          />
          <Stat
            label="Review rate"
            value={data.reviewRate !== null ? `${data.reviewRate}%` : '—'}
            sub={`${data.totalReviews} total reviews`}
          />
          <Stat
            label="Avg rating"
            value={data.avgRating ? `★ ${data.avgRating}` : '—'}
          />
          <Stat
            label="Avg message depth"
            value={data.avgMessageLength ? `${data.avgMessageLength} chars` : '—'}
            sub={`${data.totalMessages} request messages`}
          />
        </div>
      </section>

      {/* SUPPLY HEALTH */}
      <section className="admin-section">
        <h2>Supply Health</h2>
        <p className="section-desc">Is the board diverse and growing?</p>
        <div className="stat-grid">
          <Stat
            label="Vibe mix"
            value={Object.keys(data.categoryCount).length + ' categories'}
            sub={Object.entries(data.categoryCount).map(([k, v]) => `${k}: ${v}`).join(' · ')}
          />
          <Stat
            label="Booking mode split"
            value={`${data.instantCount} / ${data.requestCount}`}
            sub="Instant / Request"
          />
          <Stat
            label="Type split"
            value={`${data.virtualCount} / ${data.localCount}`}
            sub="Virtual / In Person"
          />
          <Stat label="Unique locations" value={data.uniqueLocations} />
          <Stat
            label="Returning providers"
            value={data.returningProviders}
            sub={`out of ${data.totalProviders} total`}
          />
        </div>
      </section>

      {/* ECONOMICS */}
      <section className="admin-section">
        <h2>Economics</h2>
        <div className="stat-grid">
          <Stat label="Total GMV" value={`$${data.totalGMV.toFixed(0)}`} />
          <Stat label="GMV this week" value={`$${data.gmvThisWeek.toFixed(0)}`} />
          <Stat label="Platform fees earned" value={`$${data.totalFees.toFixed(0)}`} />
          <Stat
            label="Avg booking value"
            value={`$${data.avgBookingValue}`}
            sub={`${data.totalBookings} total bookings`}
          />
          <Stat
            label="Hourly price range"
            value={data.medianPrice ? `$${data.minPrice}–$${data.maxPrice}` : '—'}
            sub={data.medianPrice ? `Median: $${data.medianPrice}` : ''}
          />
          {Object.keys(data.rateTierCount).length > 0 && (
            <Stat
              label="Rate tier usage"
              value={`${Object.keys(data.rateTierCount).length} tiers`}
              sub={Object.entries(data.rateTierCount).map(([k, v]) => `${k.replace('_', ' ')}: ${v}`).join(' · ')}
            />
          )}
        </div>
      </section>

      <p className="description" style={{ marginTop: '2rem', textAlign: 'center' }}>
        {data.totalJobs} jobs · {data.totalBookings} bookings · {data.totalReviews} reviews
      </p>
    </main>
  );
}

function Stat({ label, value, sub, trend }) {
  return (
    <div className="admin-stat">
      <span className="admin-stat-value">
        {value}
        {trend !== undefined && trend !== 0 && (
          <span className={`admin-trend ${trend > 0 ? 'up' : 'down'}`}>
            {trend > 0 ? '+' : ''}{trend}
          </span>
        )}
      </span>
      <span className="admin-stat-label">{label}</span>
      {sub && <span className="admin-stat-sub">{sub}</span>}
    </div>
  );
}
