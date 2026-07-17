import { Suspense } from 'react';
import AuthForm from '../components/AuthForm';

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="auth-loading">Loading account creation…</main>}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
