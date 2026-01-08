import DashboardClient from './DashboardClient';

// This is a Server Component - dynamic config works here
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
    return <DashboardClient />;
}
