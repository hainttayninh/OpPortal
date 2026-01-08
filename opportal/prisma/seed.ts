import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.approvalRequest.deleteMany();
    await prisma.kPIEvaluation.deleteMany();
    await prisma.kPIItem.deleteMany();
    await prisma.kPI.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.shiftAssignment.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.user.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();
    await prisma.organizationUnit.deleteMany();

    // Create Roles
    console.log('Creating roles...');
    const adminRole = await prisma.role.create({
        data: { name: 'Admin', description: 'System Administrator', level: 0 },
    });
    const managerRole = await prisma.role.create({
        data: { name: 'Manager', description: 'TTVH Manager', level: 1 },
    });
    const leaderRole = await prisma.role.create({
        data: { name: 'Leader', description: 'BCVH/BCP Leader', level: 2 },
    });
    const userRole = await prisma.role.create({
        data: { name: 'User', description: 'Regular Employee', level: 3 },
    });

    // Create Organization Hierarchy
    console.log('Creating organization hierarchy...');

    // TTVH - Top level
    const ttvh = await prisma.organizationUnit.create({
        data: {
            code: 'TTVH-HN',
            name: 'Trung tâm Vận hành Hà Nội',
            type: 'TTVH',
            address: '123 Hoàng Quốc Việt, Hà Nội',
            phone: '024-1234-5678',
        },
    });

    // BCVH - Belongs to TTVH
    const bcvh1 = await prisma.organizationUnit.create({
        data: {
            code: 'BCVH-CG',
            name: 'Bưu cục Vận hành Cầu Giấy',
            type: 'BCVH',
            parentId: ttvh.id,
            address: '45 Xuân Thủy, Cầu Giấy',
        },
    });

    const bcvh2 = await prisma.organizationUnit.create({
        data: {
            code: 'BCVH-TX',
            name: 'Bưu cục Vận hành Thanh Xuân',
            type: 'BCVH',
            parentId: ttvh.id,
            address: '78 Nguyễn Trãi, Thanh Xuân',
        },
    });

    const bcvh3 = await prisma.organizationUnit.create({
        data: {
            code: 'BCVH-HM',
            name: 'Bưu cục Vận hành Hoàng Mai',
            type: 'BCVH',
            parentId: ttvh.id,
            address: '99 Giải Phóng, Hoàng Mai',
        },
    });

    // BCP - Belongs to BCVH
    const bcp1 = await prisma.organizationUnit.create({
        data: {
            code: 'BCP-DH',
            name: 'Bưu cục Phát Dịch Vọng Hậu',
            type: 'BCP',
            parentId: bcvh1.id,
        },
    });

    const bcp2 = await prisma.organizationUnit.create({
        data: {
            code: 'BCP-NT',
            name: 'Bưu cục Phát Nghĩa Tân',
            type: 'BCP',
            parentId: bcvh1.id,
        },
    });

    // Department - Belongs to BCP
    const dept1 = await prisma.organizationUnit.create({
        data: {
            code: 'DEPT-GH1',
            name: 'Tổ Giao hàng 1',
            type: 'DEPARTMENT',
            parentId: bcp1.id,
        },
    });

    const dept2 = await prisma.organizationUnit.create({
        data: {
            code: 'DEPT-GH2',
            name: 'Tổ Giao hàng 2',
            type: 'DEPARTMENT',
            parentId: bcp1.id,
        },
    });

    // Create Users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Admin
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@opportal.vn',
            username: 'admin',
            password: hashedPassword,
            name: 'Nguyễn Văn Admin',
            phone: '0901234567',
            roleId: adminRole.id,
            organizationUnitId: ttvh.id,
        },
    });

    // Manager
    const managerUser = await prisma.user.create({
        data: {
            email: 'manager@opportal.vn',
            username: 'manager',
            password: hashedPassword,
            name: 'Trần Thị Manager',
            phone: '0901234568',
            roleId: managerRole.id,
            organizationUnitId: ttvh.id,
        },
    });

    // Leaders
    const leader1 = await prisma.user.create({
        data: {
            email: 'leader1@opportal.vn',
            username: 'leader1',
            password: hashedPassword,
            name: 'Lê Văn Leader',
            phone: '0901234569',
            roleId: leaderRole.id,
            organizationUnitId: bcvh1.id,
        },
    });

    const leader2 = await prisma.user.create({
        data: {
            email: 'leader2@opportal.vn',
            username: 'leader2',
            password: hashedPassword,
            name: 'Phạm Thị Hoa',
            phone: '0901234570',
            roleId: leaderRole.id,
            organizationUnitId: bcvh2.id,
        },
    });

    // Regular Users
    const users = [];
    for (let i = 1; i <= 10; i++) {
        const user = await prisma.user.create({
            data: {
                email: `user${i}@opportal.vn`,
                username: `user${i}`,
                password: hashedPassword,
                name: `Nhân viên ${i}`,
                phone: `090123457${i}`,
                roleId: userRole.id,
                organizationUnitId: i <= 5 ? bcp1.id : bcp2.id,
            },
        });
        users.push(user);
    }

    // Create Shifts
    console.log('Creating shifts...');
    const shift1 = await prisma.shift.create({
        data: {
            name: 'Ca sáng',
            code: 'SHIFT-SANG',
            startTime: '06:00',
            endTime: '14:00',
            breakMinutes: 30,
            organizationUnitId: bcvh1.id,
            status: 'ACTIVE',
        },
    });

    const shift2 = await prisma.shift.create({
        data: {
            name: 'Ca chiều',
            code: 'SHIFT-CHIEU',
            startTime: '14:00',
            endTime: '22:00',
            breakMinutes: 30,
            organizationUnitId: bcvh1.id,
            status: 'ACTIVE',
        },
    });

    const shift3 = await prisma.shift.create({
        data: {
            name: 'Ca hành chính',
            code: 'SHIFT-HC',
            startTime: '08:00',
            endTime: '17:00',
            breakMinutes: 60,
            organizationUnitId: bcvh1.id,
            status: 'ACTIVE',
        },
    });

    // Create Shift Assignments for this week
    console.log('Creating shift assignments...');
    const today = new Date();
    for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        date.setHours(0, 0, 0, 0);

        for (let j = 0; j < users.length; j++) {
            const shift = j % 2 === 0 ? shift1 : shift2;
            await prisma.shiftAssignment.create({
                data: {
                    userId: users[j].id,
                    shiftId: shift.id,
                    date: date,
                    status: 'ASSIGNED',
                },
            });
        }
    }

    // Create Sample Attendance
    console.log('Creating sample attendance records...');
    for (let i = -5; i < 0; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        date.setHours(0, 0, 0, 0);

        for (const user of users.slice(0, 5)) {
            const checkIn = new Date(date);
            checkIn.setHours(6, Math.floor(Math.random() * 15), 0);

            const checkOut = new Date(date);
            checkOut.setHours(14, Math.floor(Math.random() * 30), 0);

            await prisma.attendance.create({
                data: {
                    userId: user.id,
                    date: date,
                    checkIn: checkIn,
                    checkOut: checkOut,
                    workingMinutes: Math.floor((checkOut.getTime() - checkIn.getTime()) / 60000),
                    status: 'CONFIRMED',
                },
            });
        }
    }

    // Create Sample KPIs
    console.log('Creating sample KPIs...');
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    for (const user of users.slice(0, 3)) {
        await prisma.kPI.create({
            data: {
                title: `KPI Tháng ${today.getMonth() + 1}/${today.getFullYear()}`,
                type: 'ASSIGNED',
                period: 'MONTHLY',
                startDate: startOfMonth,
                endDate: endOfMonth,
                userId: user.id,
                status: 'IN_PROGRESS',
                totalWeight: 100,
                items: {
                    create: [
                        { description: 'Hoàn thành đơn giao hàng', weight: 40, target: '100 đơn/ngày' },
                        { description: 'Tỷ lệ giao thành công', weight: 30, target: '95%' },
                        { description: 'Đánh giá khách hàng', weight: 30, target: '4.5/5 sao' },
                    ],
                },
            },
        });
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('----------------------------');
    console.log('Admin:   admin@opportal.vn / password123');
    console.log('Manager: manager@opportal.vn / password123');
    console.log('Leader:  leader1@opportal.vn / password123');
    console.log('User:    user1@opportal.vn / password123');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
