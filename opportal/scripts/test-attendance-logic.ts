
// Types
interface Attendance {
    user: { id: string };
    date: string; // YYYY-MM-DD
    notes: string | null;
    status: string;
}

// Logic to test
function calculateTotalWork(attendances: Attendance[], userId: string): number {
    const userAttendances = attendances.filter(a => a.user.id === userId);
    let total = 0;

    userAttendances.forEach(att => {
        let code = '';
        if (att.notes) {
            // Logic copying from AttendanceManagementTab
            const noteContent = att.notes.split(';').pop()?.trim() || att.notes;
            const codes = ['X', '1/2', 'NP', 'NL', 'NB', 'NO', 'CD', 'TS', 'TN', 'HN', 'KL'];

            if (codes.includes(noteContent)) {
                code = noteContent;
            } else {
                const parts = noteContent.split(':');
                if (parts.length > 1 && codes.includes(parts[1].trim())) {
                    code = parts[1].trim();
                }
            }
        }

        // Fallback
        if (!code && att.status === 'CONFIRMED') {
            code = 'X';
        }

        if (code === 'X') total += 1;
        else if (code === '1/2') total += 0.5;
    });

    return total;
}

// Mock Data
const mockAttendances: Attendance[] = [
    { user: { id: 'user1' }, date: '2024-01-01', notes: 'X', status: 'CONFIRMED' },      // +1
    { user: { id: 'user1' }, date: '2024-01-02', notes: '1/2', status: 'CONFIRMED' },    // +0.5
    { user: { id: 'user1' }, date: '2024-01-03', notes: 'NP', status: 'CONFIRMED' },     // +0
    { user: { id: 'user1' }, date: '2024-01-04', notes: 'Invalid', status: 'PENDING' },  // +0
    { user: { id: 'user1' }, date: '2024-01-05', notes: 'Chấm công: X', status: 'CONFIRMED' }, // +1 (Checking parsing)
    { user: { id: 'user1' }, date: '2024-01-06', notes: null, status: 'CONFIRMED' },     // +1 (Fallback)
];

// Run Test
console.log('Testing Attendance Calculation Logic...');
const total = calculateTotalWork(mockAttendances, 'user1');
console.log(`Expected Total: 3.5 (1 + 0.5 + 0 + 0 + 1 + 1)`);
console.log(`Calculated Total: ${total}`);

if (total === 3.5) {
    console.log('TEST PASSED');
} else {
    console.log('TEST FAILED');
}
