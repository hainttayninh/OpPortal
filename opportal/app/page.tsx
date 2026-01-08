import { redirect } from 'next/navigation';

// Force dynamic to work with redirect
export const dynamic = 'force-dynamic';

export default function HomePage() {
  // Redirect to login page - the middleware will handle redirecting to dashboard if already logged in
  redirect('/login');
}
