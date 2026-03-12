'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.target);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: form.get('email'),
      password: form.get('password'),
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main>
      <div className="auth-page">
        <h1>You again</h1>
        <p className="subtitle">Welcome back to the weirdest job board on the internet</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input name="email" id="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input name="password" id="password" type="password" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
