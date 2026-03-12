'use client';

import Link from 'next/link';
import { useAuth } from './AuthProvider';

export default function Nav() {
  const { user, profile, loading, signOut } = useAuth();

  return (
    <nav>
      <Link href="/" className="logo">The JOB Board</Link>
      <div className="links">
        <Link href="/jobs">Jobs</Link>
        <Link href="/post">Make Up a Job</Link>
        {!loading && (
          user ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <button onClick={signOut} className="nav-btn">Log out</button>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}
