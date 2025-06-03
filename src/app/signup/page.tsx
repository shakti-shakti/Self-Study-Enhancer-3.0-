import { AuthForm } from '@/components/auth/auth-form';
import { Suspense } from 'react';
import DashboardLoading from '../dashboard/loading'; // Adjusted path

export default function SignupPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
