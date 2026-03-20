'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase';
import Modal from '../../components/Modal';

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, title: '', message: '' });
  const showAlert = (title, message) => setModal({ open: true, title, message });
  const closeModal = () => setModal({ open: false, title: '', message: '' });

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
          <a href="#" onClick={async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            if (!email) { showAlert('Missing email', 'Enter your email first.'); return; }
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin + '/login',
            });
            if (error) showAlert('Error', error.message);
            else showAlert('Check your email', 'Check your email for a reset link.');
          }}>Forgot password?</a>
        </p>

        <p className="auth-switch">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </p>
      </div>

      <Modal open={modal.open} title={modal.title} message={modal.message} onClose={closeModal} />
    </main>
  );
}
