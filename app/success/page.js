'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const messages = {
  posted: {
    title: 'You\'re live.',
    text: "Your job is out there. Now let's see who shows up.",
  },
  booked: {
    title: 'Booked.',
    text: "You just booked someone for their thing. They're going to love this.",
  },
  requested: {
    title: 'Request sent.',
    text: "The provider will review your request and get back to you. Sit tight.",
  },
  stipend: {
    title: 'Generosity unlocked.',
    text: "You just sent someone a stipend. That's the kind of support that changes things.",
  },
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const bookingId = searchParams.get('bookingId');
  const msg = messages[action] || messages.posted;

  return (
    <main>
      <div className="success-page">
        <h1>{msg.title}</h1>
        <p>{msg.text}</p>
        <div className="cta-group">
          {bookingId && (
            <Link href={`/bookings/${bookingId}`} className="btn btn-primary">View booking details</Link>
          )}
          <Link href="/jobs" className={bookingId ? 'btn btn-secondary' : 'btn btn-primary'}>Browse more jobs</Link>
          <Link href="/dashboard" className="btn btn-secondary">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<main><p className="empty">Loading...</p></main>}>
      <SuccessContent />
    </Suspense>
  );
}
