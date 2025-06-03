import { AuthForm } from '@/components/auth/auth-form';
import { Suspense } from 'react';
import DashboardLoading from '../dashboard/loading'; // Adjusted path

export default function LoginPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
