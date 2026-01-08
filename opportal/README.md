# OpPortal - Hệ thống Quản lý Điều hành

A production-ready serverless Next.js application for enterprise operation management, deployable on Vercel.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with HttpOnly cookies, RBAC + Scope-based access control
- 👥 **User Management**: Full CRUD with role assignment and organization hierarchy
- 🏢 **Organization Hierarchy**: TTVH → BCVH → BCP → Department structure
- 📅 **Shift Scheduling**: Create and assign shifts with workflow states
- ⏰ **Attendance Management**: Check-in/out with approval workflow
- 📊 **KPI Management**: Assigned and self-registered KPIs with weight validation
- ✅ **Approval Workflow**: Generic approval engine for all entities
- 📝 **Audit Logging**: Comprehensive action logging for compliance
- 📱 **PWA Ready**: Mobile-first, installable progressive web app

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL
- **ORM**: Prisma 5.x
- **Authentication**: jose (JWT)
- **State Management**: Zustand
- **Validation**: Zod
- **UI Components**: Radix UI + custom components
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20.x+
- PostgreSQL database (local or cloud: Supabase, Neon, Vercel Postgres)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd opportal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/opportal"
   JWT_SECRET="your-super-secret-key-minimum-32-characters"
   JWT_EXPIRES_IN="7d"
   NODE_ENV="development"
   ```

4. **Set up database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed sample data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000/login
   ```

## Sample Login Credentials

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@opportal.vn      | password123 |
| Manager | manager@opportal.vn    | password123 |
| Leader  | leader1@opportal.vn    | password123 |
| User    | user1@opportal.vn      | password123 |

## Project Structure

```
opportal/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Serverless Functions)
│   │   ├── auth/          # Authentication endpoints
│   │   ├── users/         # User management
│   │   ├── organization-units/
│   │   ├── shifts/
│   │   ├── attendance/
│   │   ├── kpi/
│   │   ├── approvals/
│   │   ├── audit-logs/
│   │   └── dashboard/
│   ├── dashboard/         # Dashboard page
│   ├── users/             # User management page
│   ├── attendance/        # Attendance page
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/               # Base UI components
│   └── layout/           # Layout components (Sidebar, Header)
├── lib/
│   ├── auth/             # Authentication utilities
│   ├── prisma.ts         # Prisma client singleton
│   ├── utils.ts          # Utility functions
│   ├── audit.ts          # Audit logging
│   └── api-utils.ts      # API route helpers
├── store/                # Zustand stores
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── middleware.ts         # Route protection
└── public/
    └── manifest.json     # PWA manifest
```

## Deployment on Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/opportal)

### Manual Deployment

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/opportal.git
   git push -u origin main
   ```

2. **Import in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `NODE_ENV=production`

3. **Configure Database**
   - Use Vercel Postgres, Supabase, or Neon for serverless-compatible PostgreSQL
   - Run migrations: `npx prisma migrate deploy`

4. **Deploy**
   - Vercel will automatically build and deploy

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |
| GET/POST | `/api/users` | List/Create users |
| GET/PUT/DELETE | `/api/users/[id]` | User CRUD |
| GET/POST | `/api/organization-units` | Organization hierarchy |
| GET/POST | `/api/shifts` | Shift management |
| GET/POST | `/api/attendance` | Attendance records |
| GET/POST | `/api/kpi` | KPI management |
| GET/POST | `/api/approvals` | Approval workflow |
| GET | `/api/audit-logs` | Audit logs (Admin/Manager) |
| GET | `/api/dashboard` | Dashboard statistics |

## Role-Based Access

| Role    | Scope | Capabilities |
|---------|-------|--------------|
| Admin   | All   | Full system access |
| Manager | TTVH  | Manage users, shifts, approve requests |
| Leader  | BCVH  | Manage team, approve attendance/KPIs |
| User    | Personal | Check-in, submit KPIs, view own data |

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio
```

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ using Next.js, Prisma, and Tailwind CSS
