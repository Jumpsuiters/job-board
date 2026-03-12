'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const messages = {
  posted: {
    title: 'It exists now.',
    text: "Your made-up job is live. Let's see if the world agrees it should be real.",
  },
  applied: {
    title: 'Hat thrown.',
    text: "You just applied for a job that didn't exist five minutes ago. What a time to be alive.",
  },
  funded: {
    title: 'Money where your mouth is.',
    text: "You just paid to make someone else's dream job real. That's kind of beautiful.",
  },
  hired: {
    title: 'It happened.',
    text: "Someone just got hired for a job that was made up. The future is weird and good.",
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
          <Link href="/jobs" className="btn btn-primary">See more made-up jobs</Link>
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
