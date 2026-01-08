import UsersClient from './UsersClient';

// This is a Server Component - dynamic config works here
export const dynamic = 'force-dynamic';

export default function UsersPage() {
    return <UsersClient />;
}
