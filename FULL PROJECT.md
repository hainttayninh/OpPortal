{
  "role": "Principal Software Architect & Enterprise Full-Stack Engineer",
  "task": "Generate a full production-ready serverless web application using Next.js, deployable on Vercel",
  "system_name": "Hệ thống Quản lý Điều hành",
  "deployment_target": "Vercel (Serverless + Edge Ready)",

  "scale": {
    "users": 200,
    "platform": ["Web", "Mobile PWA"],
    "usage": "Enterprise internal operation management"
  },

  "architecture": {
    "style": "Serverless Fullstack Architecture",
    "frontend": "Next.js App Router",
    "backend": "Next.js API Routes (Serverless Functions)",
    "auth": "JWT-based Authentication",
    "database_access": "Server-side only (no direct client DB access)"
  },

  "technology_stack": {
    "framework": "Next.js (latest stable)",
    "language": "TypeScript",
    "ui": "Modern component-based UI (Tailwind CSS)",
    "state_management": "Client-side store where needed",
    "database": "PostgreSQL",
    "orm": "Prisma ORM",
    "deployment": "Vercel"
  },

  "authentication_authorization": {
    "authentication": {
      "method": "JWT",
      "storage": "HttpOnly Cookies",
      "login_flow": "Email/Username + Password"
    },
    "authorization": {
      "model": "RBAC + Scope-based Access Control",
      "roles": ["Admin", "Manager", "Leader", "User"],
      "actions": ["View", "Create", "Update", "Delete", "Approve", "Lock"],
      "scope_levels": ["TTVH", "BCVH", "BCP", "Department", "Personal"],
      "enforcement": "Must be enforced inside API routes (server-side)"
    }
  },

  "organization_hierarchy": {
    "TTVH": "Top-level operation center",
    "BCVH": "Belongs to TTVH",
    "BCP": "Belongs to BCVH",
    "Department": "Belongs to BCVH or BCP"
  },

  "core_modules": [
    "Authentication & Session Management",
    "User & Role Management",
    "Organization Hierarchy Management",
    "Attendance Management",
    "Shift Scheduling",
    "KPI Management",
    "Approval Workflow Engine",
    "Dashboard & Analytics",
    "Audit Logging"
  ],

  "attendance_management": {
    "input_method": "Manual attendance via web/mobile",
    "workflow": ["Pending", "Confirmed", "Adjusted", "Locked"],
    "rules": [
      "One check-in/check-out per user per day",
      "Attendance must match assigned shift",
      "Locked attendance cannot be edited"
    ]
  },

  "shift_management": {
    "workflow": ["Draft", "Assigned", "Active", "Completed", "Locked"],
    "rules": [
      "No overlapping shifts",
      "Shift locked by Manager only"
    ]
  },

  "kpi_management": {
    "types": [
      "Assigned KPI (Monthly / Quarterly)",
      "Self-registered KPI (Weekly / Monthly)"
    ],
    "workflow": [
      "Draft",
      "Submitted",
      "Approved",
      "In Progress",
      "Evaluated",
      "Closed"
    ],
    "rules": [
      "Total KPI weight must be exactly 100%",
      "Leader approval required",
      "KPI impacts salary/bonus",
      "Closed KPI is read-only"
    ]
  },

  "approval_engine": {
    "applies_to": [
      "Attendance adjustments",
      "Shift assignments",
      "KPI registration and evaluation"
    ],
    "rules": [
      "Approval must follow organizational scope",
      "Every approval must be logged"
    ]
  },

  "dashboard_design": {
    "Manager": {
      "scope": "TTVH",
      "widgets": [
        "Overall KPI performance",
        "Attendance compliance",
        "BCVH comparison",
        "Bonus estimation"
      ]
    },
    "Leader": {
      "scope": "BCVH",
      "widgets": [
        "Daily attendance",
        "Shift gaps",
        "Pending approvals",
        "Employee KPI status"
      ]
    },
    "User": {
      "widgets": [
        "Personal attendance",
        "Assigned shifts",
        "KPI progress"
      ]
    }
  },

  "database_design": {
    "orm": "Prisma",
    "entities": [
      "User",
      "Role",
      "Permission",
      "OrganizationUnit",
      "Shift",
      "ShiftAssignment",
      "Attendance",
      "KPI",
      "KPIItem",
      "KPIEvaluation",
      "AuditLog"
    ],
    "constraints": [
      "Use soft delete",
      "Use foreign keys",
      "Use status fields for workflow"
    ]
  },

  "audit_logging": {
    "mandatory_for": [
      "Create",
      "Update",
      "Delete",
      "Approve",
      "Lock"
    ],
    "fields": [
      "actor_id",
      "role",
      "action",
      "entity",
      "before_data",
      "after_data",
      "timestamp"
    ]
  },

  "project_structure": {
    "root": [
      "app/",
      "app/api/",
      "components/",
      "lib/",
      "services/",
      "store/",
      "prisma/",
      "middleware.ts",
      "README.md"
    ]
  },

  "pwa_requirements": [
    "Offline shell",
    "Installable",
    "Mobile-first UI"
  ],

  "deployment_requirements": {
    "platform": "Vercel",
    "env": [
      "DATABASE_URL",
      "JWT_SECRET",
      "NODE_ENV"
    ],
    "serverless_constraints": [
      "No long-running background jobs",
      "Stateless API design"
    ]
  },

  "strict_rules": [
    "No mock or demo logic",
    "All authorization enforced server-side",
    "No data leakage outside user scope",
    "All workflows must be state-driven",
    "Audit logs cannot be bypassed",
    "Code must be readable, modular, and production-ready"
  ],

  "output_expectations": [
    "Full Next.js project source code",
    "Prisma schema and migrations",
    "Role-based routing and middleware",
    "Fully implemented API routes",
    "Dashboard UI per role",
    "Seed data",
    "README with Vercel deployment steps"
  ]
}
