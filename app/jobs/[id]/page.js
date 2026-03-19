'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../components/AuthProvider';

const RATE_OPTIONS = [
  { key: 'price', field: 'price', label: 'Per hour', type: 'hourly' },
  { key: 'price_half_day', field: 'price_half_day', label: 'Half day', type: 'half_day' },
  { key: 'price_day', field: 'price_day', label: 'Full day', type: 'day' },
  { key: 'price_week', field: 'price_week', label: 'Per week', type: 'week' },
];

export default function JobDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, supabase, loading: authLoading } = useAuth();
  const [job, setJob] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [requestedTime, setRequestedTime] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');

  const isCreator = user && job && user.id === job.user_id;

  useEffect(() => {
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (job) {
      fetchBookings();
      fetchReviews();
    }
  }, [job]);

  // Auto-select first available rate
  useEffect(() => {
    if (job && !selectedRate) {
      const first = RATE_OPTIONS.find(r => job[r.field]);
      if (first) setSelectedRate(first.type);
    }
  }, [job]);

  async function fetchJob() {
    const { data } = await supabase
      .from('jobs')
      .select('*, profiles!jobs_user_id_fkey(name, location, bio, avatar_url)')
      .eq('id', id)
      .single();
    setJob(data);
    setLoading(false);
  }

  async function fetchBookings() {
    const { data } = await supabase
      .from('bookings')
      .select('*, profiles:booker_id(name)')
      .eq('job_id', id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    setBookings(data || []);
  }

  async function fetchReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles:reviewer_id(name, avatar_url)')
      .eq('job_id', id)
      .order('created_at', { ascending: false });
    setReviews(data || []);
  }

  function getAmountForRate(rateType) {
    if (!job) return 0;
    const map = { hourly: 'price', half_day: 'price_half_day', day: 'price_day', week: 'price_week' };
    return job[map[rateType]] || 0;
  }

  function getRateLabel(rateType) {
    const map = { hourly: '/hr', half_day: '/half day', day: '/day', week: '/week' };
    return map[rateType] || '';
  }

  async function handleBook() {
    if (!selectedRate) {
      alert('Please select a rate.');
      return;
    }
    if (job.availability === 'scheduled' && !requestedTime) {
      alert('Please pick a date & time for this session.');
      return;
    }

    const isRequest = job.booking_mode === 'request';
    if (isRequest && !bookingMessage.trim()) {
      alert('Please include a message about what you need.');
      return;
    }

    const amount = getAmountForRate(selectedRate);
    const platformFee = +(amount * 0.20).toFixed(2);
    const workerAmount = +(amount - platformFee).toFixed(2);

    const label = isRequest ? 'Send this booking request' : `Book this person for $${amount}`;
    if (!confirm(`${label}?`)) return;
    setSubmitting(true);

    const booking = {
      job_id: id,
      worker_id: job.user_id,
      booker_id: user.id,
      amount,
      platform_fee: platformFee,
      worker_amount: workerAmount,
      status: isRequest ? 'pending' : 'confirmed',
      rate_type: selectedRate,
      requested_time: requestedTime || null,
      message: isRequest ? bookingMessage : null,
    };

    const { error } = await supabase.from('bookings').insert(booking);

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    // Increment hire_count for instant bookings only
    if (!isRequest) {
      await supabase.from('jobs').update({
        hire_count: (job.hire_count || 0) + 1,
      }).eq('id', id);
    }

    setSubmitting(false);
    router.push(isRequest ? '/success?action=requested' : '/success?action=booked');
  }

  async function handleReview(e) {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      job_id: id,
      booking_id: bookings.find(b => b.booker_id === user.id)?.id || null,
      reviewer_id: user.id,
      reviewed_id: job.user_id,
      rating: reviewRating,
      text: reviewText || null,
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    setShowReviewForm(false);
    setReviewText('');
    setReviewRating(5);
    setSubmitting(false);
    fetchReviews();
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const userHasReviewed = user && reviews.some(r => r.reviewer_id === user.id);
  const userHasBooked = user && bookings.some(b => b.booker_id === user.id);
  const canReview = user && userHasBooked && !userHasReviewed && !isCreator;

  if (loading) return <main><p className="empty">Loading...</p></main>;
  if (!job) return <main><p className="empty">Job not found.</p></main>;

  const isRequest = job.booking_mode === 'request';
  const amount = selectedRate ? getAmountForRate(selectedRate) : 0;
  const availableRates = RATE_OPTIONS.filter(r => job[r.field]);

  return (
    <main>
      <Link href="/jobs" className="back-link">&larr; All Jobs</Link>

      <div className="job-detail">
        {job.photo_url && (
          <div className="job-detail-photo">
            <img src={job.photo_url} alt={job.title} />
          </div>
        )}

        <div className="job-detail-header">
          <div className="card-title-row">
            {job.profiles?.avatar_url && (
              <img src={job.profiles.avatar_url} alt="" className="detail-avatar" />
            )}
            <div>
              <h1>{job.title}</h1>
              {job.profiles?.name && <span className="posted-by">by {job.profiles.name}</span>}
            </div>
          </div>
          <div className="badge-group" style={{ marginTop: '0.75rem' }}>
            {job.availability === 'asap' && <span className="badge badge-now"><span className="now-dot" />Available Now</span>}
            {job.availability === 'scheduled' && <span className="badge">Schedule</span>}
            <span className={`badge ${job.job_type === 'virtual' ? 'badge-virtual' : 'badge-local'}`}>
              {job.job_type === 'virtual' ? 'Virtual' : 'In Person'}
            </span>
            {job.category && <span className="badge">{job.category}</span>}
            <span className={`badge ${isRequest ? 'badge-pending' : 'badge-confirmed'}`}>
              {isRequest ? 'Request to Book' : 'Instant Book'}
            </span>
            {job.hire_count > 0 && (
              <span className="badge badge-hires">Booked {job.hire_count}x</span>
            )}
            {avgRating && (
              <span className="badge badge-rating">{'★'} {avgRating}</span>
            )}
          </div>
        </div>

        <div className="rate-display">
          {job.price && <span className="rate-tag">${job.price}<small>/hr</small></span>}
          {job.price_half_day && <span className="rate-tag">${job.price_half_day}<small>/half day</small></span>}
          {job.price_day && <span className="rate-tag">${job.price_day}<small>/day</small></span>}
          {job.price_week && <span className="rate-tag">${job.price_week}<small>/week</small></span>}
        </div>

        <div className="meta" style={{ marginBottom: '1.5rem' }}>
          {job.location && <span>{job.location}</span>}
        </div>

        <div className="job-description">{job.description}</div>

        {isCreator && (
          <div style={{ marginTop: '1rem' }}>
            <Link href={`/jobs/${id}/edit`} className="btn btn-secondary btn-sm">Edit Job</Link>
          </div>
        )}

        {/* Booking section — for open jobs, non-creators, logged in */}
        {user && !isCreator && job.status === 'open' && (
          <div style={{ marginTop: '2rem' }}>
            {/* Rate tier selector */}
            {availableRates.length > 1 && (
              <div className="field" style={{ marginBottom: '1rem' }}>
                <label>Choose a rate</label>
                <div className="rate-selector">
                  {availableRates.map(r => (
                    <label key={r.type} className={`rate-option ${selectedRate === r.type ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="rate_select"
                        value={r.type}
                        checked={selectedRate === r.type}
                        onChange={() => setSelectedRate(r.type)}
                      />
                      <span className="rate-option-label">{r.label}</span>
                      <span className="rate-option-price">${job[r.field]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date picker for scheduled availability */}
            {job.availability === 'scheduled' && (
              <div className="field" style={{ marginBottom: '1rem' }}>
                <label htmlFor="requested_time">When would you like to do this?</label>
                <input
                  type="datetime-local"
                  id="requested_time"
                  value={requestedTime}
                  onChange={e => setRequestedTime(e.target.value)}
                />
              </div>
            )}

            {/* Message field for request mode */}
            {isRequest && (
              <div className="field" style={{ marginBottom: '1rem' }}>
                <label htmlFor="booking_message">Tell them what you need</label>
                <textarea
                  id="booking_message"
                  className="booking-message"
                  placeholder="What are you looking for? Any boundaries or preferences? The more context, the better."
                  value={bookingMessage}
                  onChange={e => setBookingMessage(e.target.value)}
                />
              </div>
            )}

            {/* Booking breakdown */}
            <div className="booking-breakdown">
              <div className="booking-line">
                <span>Price ({getRateLabel(selectedRate)})</span>
                <span>${amount}</span>
              </div>
              <div className="booking-line">
                <span>Platform fee (20%)</span>
                <span>${(amount * 0.20).toFixed(2)}</span>
              </div>
              <div className="booking-line booking-total">
                <span>Provider gets</span>
                <span>${(amount * 0.80).toFixed(2)}</span>
              </div>
            </div>

            <button className="btn btn-primary btn-full" onClick={handleBook} disabled={submitting}>
              {submitting
                ? (isRequest ? 'Sending request...' : 'Booking...')
                : (isRequest ? 'Request to Book' : 'Book Now')}
            </button>
          </div>
        )}

        {!user && !authLoading && (
          <div style={{ marginTop: '2rem' }}>
            <Link href="/login" className="btn btn-primary">Log in to book</Link>
          </div>
        )}

        {/* Reviews */}
        <div className="reviews-section">
          <h3>Reviews {reviews.length > 0 && `(${reviews.length})`}</h3>

          {canReview && !showReviewForm && (
            <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => setShowReviewForm(true)}>
              Leave a review
            </button>
          )}

          {showReviewForm && (
            <form onSubmit={handleReview} className="review-form">
              <div className="star-select">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`star-btn ${n <= reviewRating ? 'active' : ''}`}
                    onClick={() => setReviewRating(n)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                placeholder="How was the experience?"
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? 'Posting...' : 'Post Review'}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowReviewForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {reviews.length === 0 && !showReviewForm && (
            <p className="description" style={{ marginTop: '0.5rem' }}>No reviews yet.</p>
          )}

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

        {/* Bookings list */}
        {bookings.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3>Bookings ({bookings.length})</h3>
            <div className="pledge-list">
              {bookings.map(b => (
                <div key={b.id} className="pledge-item">
                  <strong>{b.profiles?.name || 'Someone'}</strong> booked &mdash; ${Number(b.amount).toFixed(0)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
