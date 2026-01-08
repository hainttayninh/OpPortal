import LoginPageContent from './LoginClient';

// This is a Server Component - dynamic config works here
export const dynamic = 'force-dynamic';

export default function LoginPage() {
    return <LoginPageContent />;
}