'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import Reveal from '../components/motion/Reveal';

export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const { login, signup, user, authLoading } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextPath = searchParams.get('next');
  const destination = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/account';

  useEffect(() => {
    if (!authLoading && user) router.replace(destination);
  }, [authLoading, user, router, destination]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (isSignup && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = isSignup
      ? await signup({ name: form.name, email: form.email, password: form.password })
      : await login({ email: form.email, password: form.password });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace(destination);
  };

  return (
    <main className="auth-page">
      <Reveal as="section" className="auth-aside">
        <Link href="/" className="wordmark">MODÉ<span>®</span></Link>
        <div>
          <p className="eyebrow">A considered wardrobe</p>
          <h1>Made for every<br /><em>version of you.</em></h1>
          <p>Sign in to keep your bag, wishlist, and order history securely connected to your account.</p>
        </div>
      <Link href="/" className="auth-back">← Back to shop</Link>
    </Reveal>
    <Reveal as="section" className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">{isSignup ? 'Create your account' : 'Welcome back'}</p>
          <h2>{isSignup ? 'Join MODÉ.' : 'Sign in.'}</h2>
          <p className="auth-intro">
            {isSignup ? 'Create an account to save your pieces and manage every order.' : 'Use the email and password connected to your MODÉ account.'}
          </p>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup && (
              <label>
                <span>Full name</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  minLength={2}
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              <span>Email address</span>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
                placeholder="you@example.com"
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
                minLength={8}
                placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
              />
            </label>
            {isSignup && (
              <label>
                <span>Confirm password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  required
                  minLength={8}
                  placeholder="Repeat your password"
                />
              </label>
            )}
            <button className="button dark auth-submit" type="submit" disabled={submitting || authLoading}>
              {submitting ? 'Please wait…' : isSignup ? 'Create account →' : 'Sign in →'}
            </button>
          </form>

          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : 'New to MODÉ?'}{' '}
            <Link href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link>
          </p>
        </div>
      </Reveal>
    </main>
  );
}
