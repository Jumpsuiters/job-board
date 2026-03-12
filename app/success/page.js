'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const messages = {
  posted: {
    title: 'Job Posted!',
    text: "Your dream job is live. Now let's see who wants to help make it real.",
  },
  applied: {
    title: 'Application Sent!',
    text: 'Thanks for stepping up. The person who posted this job will review your application.',
  },
  funded: {
    title: 'Pledge Received!',
    text: "You're helping make a dream job real. Every dollar counts.",
  },
  hired: {
    title: 'Someone Got Hired!',
    text: 'Payment recorded. The dream is becoming real.',
  },
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const msg = messages[action] || messages.posted;

  return (
    <main>
      <div className="success-page">
        <h1>{msg.title}</h1>
        <p>{msg.text}</p>
        <div className="cta-group">
          <Link href="/jobs" className="btn btn-primary">Browse Jobs</Link>
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
