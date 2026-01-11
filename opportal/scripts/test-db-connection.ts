
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing DB Access...');
        const user = await prisma.user.findFirst({
            where: {
                username: 'admin' // Attempting to find the admin user shown in screenshot
            },
            include: {
                role: true,
                organizationUnit: true
            }
        });

        if (user) {
            console.log('User found:', user.username);
            // Check if new fields are accessible (this will fail at compile time or run time if client is old)
            console.log('EmployeeId:', (user as any).employeeId);
            console.log('ContractType:', (user as any).contractType);
        } else {
            console.log('User admin not found.');
        }

        console.log('DB Connection Successful.');
    } catch (e) {
        console.error('DB Connection Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
