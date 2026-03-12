'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const isPosted = action === 'posted';

  return (
    <main>
      <div className="success-page">
        <h1>{isPosted ? 'Job Posted!' : 'Application Sent!'}</h1>
        <p>
          {isPosted
            ? 'Your dream job is live. Now let\'s see who wants to help make it real.'
            : 'Thanks for stepping up. The person who posted this job will be in touch.'}
        </p>
        <div className="cta-group">
          <Link href="/jobs" className="btn btn-primary">Browse Jobs</Link>
          {isPosted && <Link href="/post" className="btn btn-secondary">Post Another</Link>}
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
