'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';

export default function Signup() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.target);
    const email = form.get('email');
    const name = form.get('name');
    const { data: signUpData, error: err } = await supabase.auth.signUp({
      email,
      password: form.get('password'),
      options: {
        data: { name },
      },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // Save email to profile
    if (signUpData?.user?.id) {
      await supabase.from('profiles').update({ email }).eq('id', signUpData.user.id);
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main>
      <div className="auth-page">
        <h1>Get on the board</h1>
        <p className="subtitle">Make up jobs. Fund them into existence. Get hired for things that didn&apos;t exist yesterday.</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input name="name" id="name" required placeholder="Your name (or your alter ego)" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input name="email" id="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input name="password" id="password" type="password" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
