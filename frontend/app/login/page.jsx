import { Suspense } from 'react';
import AuthForm from '../components/AuthForm';

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth-loading">Loading sign in…</main>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
