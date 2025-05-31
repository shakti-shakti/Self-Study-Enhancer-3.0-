
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
  // The redirect function should be called unconditionally at the top.
  // No other JSX should be returned as the redirect will prevent it from rendering.
  // return null; // Or an empty fragment, though redirect() typically handles this.
}
