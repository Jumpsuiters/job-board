'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../components/AuthProvider';
import Modal from '../../../components/Modal';
import BookingMessages from '../../../components/BookingMessages';
import { generateICS, getGoogleCalendarURL } from '../../../lib/calendar';

const STATUS_BADGE = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  completed: 'badge-completed',
  declined: 'badge-declined',
  cancelled: 'badge-declined',
};

export default function BookingDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  const [booking, setBooking] = useState(null);
  const [fetched, setFetched] = useState(false);
  const [acting, setActing] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchBooking();
  }, [authLoading, user, id]);

  async function fetchBooking() {
    try {
      const { data } = await supabase
        .from('bookings')
        .select('*, jobs(title, photo_url), booker:booker_id(name, slug), provider:worker_id(name, slug)')
        .eq('id', id)
        .single();

      if (data) setBooking(data);
    } catch (err) {
      console.error('Fetch booking error:', err);
    }
    setFetched(true);
  }

  async function handleCancel() {
    setActing(true);
    await supabase.from('bookings').update({
      status: 'cancelled',
      cancelled_by: user.id,
      cancelled_at: new Date().toISOString(),
      cancel_reason: cancelReason || null,
    }).eq('id', id);

    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'bookingCancelled', bookingId: id }),
    });

    setShowCancel(false);
    setCancelReason('');
    setActing(false);
    fetchBooking();
  }

  async function handleComplete() {
    setActing(true);
    await supabase.from('bookings').update({ status: 'completed' }).eq('id', id);

    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'bookingCompleted', bookingId: id }),
    });

    setActing(false);
    fetchBooking();
  }

  if (authLoading || !fetched) return <main><p className="empty">Loading...</p></main>;
  if (!booking) return <main><p className="empty">Booking not found.</p></main>;

  const isBuyer = user?.id === booking.booker_id;
  const platformFee = Number(booking.platform_fee || 0).toFixed(2);
  const workerAmount = Number(booking.worker_amount || 0).toFixed(2);

  return (
    <main>
      <Link href="/dashboard" className="back-link">&larr; Dashboard</Link>

      <div className="booking-detail">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <h1>{booking.jobs?.title || 'Booking'}</h1>
          <span className={`badge ${STATUS_BADGE[booking.status] || ''}`} style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem' }}>
            {booking.status}
          </span>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="meta" style={{ marginBottom: '0.75rem' }}>
            <span>Buyer: <Link href={`/u/${booking.booker?.slug || ''}`}>{booking.booker?.name || 'Someone'}</Link></span>
            <span>Provider: <Link href={`/u/${booking.provider?.slug || ''}`}>{booking.provider?.name || 'Someone'}</Link></span>
          </div>

          {booking.requested_time && (
            <div className="meta">
              <span>Scheduled: {new Date(booking.requested_time).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
            </div>
          )}

          <div className="booking-breakdown" style={{ margin: '0.75rem 0' }}>
            <div className="booking-line">
              <span>Amount{booking.rate_type ? ` (${booking.rate_type.replace('_', ' ')})` : ''}</span>
              <span>${Number(booking.amount).toFixed(2)}</span>
            </div>
            <div className="booking-line">
              <span>Platform fee (20%)</span>
              <span>${platformFee}</span>
            </div>
            <div className="booking-line booking-total">
              <span>Provider earns</span>
              <span>${workerAmount}</span>
            </div>
          </div>

          {booking.message && (
            <p className="description" style={{ fontStyle: 'italic', marginTop: '0.75rem' }}>&ldquo;{booking.message}&rdquo;</p>
          )}

          <div className="meta" style={{ marginTop: '0.75rem' }}>
            <span>Booked {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          {booking.status === 'cancelled' && booking.cancel_reason && (
            <p className="description" style={{ marginTop: '0.5rem' }}>Cancel reason: &ldquo;{booking.cancel_reason}&rdquo;</p>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {booking.status === 'confirmed' && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCancel(true)} disabled={acting}>
                Cancel Booking
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleComplete} disabled={acting}>
                {acting ? 'Completing...' : 'Mark Complete'}
              </button>
            </>
          )}

          {booking.status === 'pending' && isBuyer && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCancel(true)} disabled={acting}>
              Cancel Request
            </button>
          )}

          {booking.requested_time && ['confirmed', 'pending'].includes(booking.status) && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => generateICS(booking, booking.jobs || {})}>
                Download .ics
              </button>
              <a
                href={getGoogleCalendarURL(booking, booking.jobs || {})}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Google Calendar
              </a>
            </>
          )}

          <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            Print
          </button>
        </div>

        {/* Messages — only for confirmed/completed */}
        {['confirmed', 'completed'].includes(booking.status) && (
          <BookingMessages bookingId={id} />
        )}
      </div>

      {/* Cancel modal */}
      <Modal
        open={showCancel}
        title="Cancel this booking?"
        message="Let the other party know why (optional)."
        onClose={() => { setShowCancel(false); setCancelReason(''); }}
        onConfirm={handleCancel}
        confirmLabel={acting ? 'Cancelling...' : 'Cancel Booking'}
        confirmVariant="primary"
      >
        <textarea
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
          placeholder="Reason (optional)"
          style={{ marginTop: '0.75rem', minHeight: '60px' }}
        />
      </Modal>
    </main>
  );
}
