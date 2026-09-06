# Collaborate

Collaborate is a modern Next.js App Router application built for individual productivity and team workspace collaboration.

It features workspace onboarding, flexible authentication (credentials supporting username or email + OAuth), hierarchical role-based access control (RBAC), end-to-end real-time collaboration with WebSockets via Pusher, project and task management with automated status and progress cascading, rich text editing, interactive calendar scheduling, team activity tracking, and workspace join request management.

---

## Current State & Capabilities

### Core Implemented Capabilities:

- **Modern Web Foundation**: Built with **Next.js 16 (App Router with Turbopack)**, **React 19**, and **TypeScript** with a fast `pnpm`-based workflow.
- **Database & Data Layer**: **Prisma 7 (PostgreSQL)** with the native PostgreSQL adapter (`@prisma/adapter-pg`) and typed Prisma Client in `generated/prisma`.
- **Authentication (NextAuth v5 / Auth.js)**:
  - Credentials sign-in supporting either **Username or Email**
  - Google OAuth & GitHub OAuth integration
  - Workspace-aware session enrichment (current workspace ID, desk mode, workspace role, workspace name)
- **Hierarchical Role-Based Access Control (RBAC)**:
  - Multi-tiered access model across 4 distinct layers: Desk Mode (`INDIVIDUAL` vs `WORKSPACE`), Workspace Roles (`OWNER`, `ADMIN`, `MEMBER`), Project Roles (`PROJECT_LEAD`, `CONTRIBUTOR`, `VIEWER`), and Task Relations (`CREATOR`, `ASSIGNEE`).
  - Downward authority inheritance / elevation (Owners & Admins manage all projects and tasks; Project Leads manage all child tasks).
  - Detailed architecture guide in [`docs/rbac.md`](docs/rbac.md).
- **End-to-End Real-Time Collaboration (Pusher Channels)**:
  - WebSocket synchronization for tasks, projects, milestones, comments, resources, activities, and notifications.
  - Multi-tier channel topology: `workspace-{id}`, `project-{id}`, `task-{id}`, and `user-{id}`.
  - React real-time hooks: `useWorkspaceRealtime`, `useProjectRealtime`, and `useTaskRealtime`.
  - Zero-latency optimistic UI updates paired with resilient server reconciliation and error rollback.
  - Detailed architecture and sequence diagrams in [`docs/realtime-update-flow.md`](docs/realtime-update-flow.md).
- **Automated Lifecycle & Progress Synchronization**:
  - **Project $\rightarrow$ Tasks & Milestones Cascading**: Marking a project `COMPLETED` automatically sets all child tasks to `COMPLETED`, all child milestones to `DONE`, and progress to 100%. Marking a project `TODO` or `IN_PROGRESS` moves all child tasks and milestones to `IN_PROGRESS`.
  - **Task $\rightarrow$ Milestones Cascading**: Marking a task `COMPLETED` automatically sets all child milestones to `DONE` and attributes completion to the acting user. Marking a task `IN_PROGRESS` or `TODO` resets all child milestones to `NOT_STARTED` ("to do").
  - Automated project progress and task milestone progress calculations.
  - Detailed documentation in [`docs/status-and-progress-updates.md`](docs/status-and-progress-updates.md).
- **Workspace Onboarding & Multi-Tenancy**:
  - Dual desk modes: `INDIVIDUAL` (personal desk) and `WORKSPACE` (team collaboration)
  - Multi-step sign-up flows for individual and team workspaces
  - Auto-generated workspace slugs and multi-workspace switcher (`/sign-in/my-workspaces`)
  - Workspace join requests, invite codes, and admin approval workflows
- **Project & Task Management**:
  - Comprehensive Project listing with grid and tabular views (`@tanstack/react-table`), priority/status badges, and member assignment
  - Single Project detail pages (`/projects/[id]`) and slide-over Project Peek Sheets
  - Single Task detail pages (`/tasks/[id]`) and slide-over Task Peek Sheets
  - Integrated **Tiptap WYSIWYG Rich Text Editor** for project and task descriptions
  - Milestone checklists with progress bars and assignee completion tracking
  - Nested comment discussions with `@mention` hovercards and notifications
  - Resource attachments for projects and tasks
- **Interactive Calendar & Scheduling**:
  - Interactive calendar view (`/calendar`) visualizing task timelines, date ranges, and schedules
- **Activity Logging & Analytics**:
  - Real-time workspace, project, and task audit trail (`/activity`)
  - Interactive dashboard analytics powered by `recharts`
- **UI & Design System**:
  - Styled with Tailwind CSS v4, Radix UI primitives, shadcn/ui patterns, and Lucide icons
  - Smooth page loading progress indicator (`nextjs-toploader`)
  - Toast alerts via `sonner`
  - Transactional email templates rendered via `@react-email/render` and dispatched via Resend

---

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Library**: React 19
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Styling & Components**: Tailwind CSS v4, Radix UI, shadcn/ui, Lucide Icons
- **Real-Time WebSockets**: Pusher Channels (`pusher`, `pusher-js`)
- **Rich Text Editor**: Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`)
- **Data Tables**: TanStack Table (`@tanstack/react-table`)
- **Data Visualization**: Recharts
- **Authentication**: NextAuth v5 (Auth.js) + Prisma Adapter
- **Database & ORM**: PostgreSQL + Prisma 7 ORM (`@prisma/adapter-pg`)
- **Validation**: Zod + React Hook Form
- **Email Delivery**: Resend + React Email

---

## Documentation Links

Comprehensive documentation for core platform systems is available in the [`docs/`](docs/) directory:

- [**Role-Based Access Control (RBAC) Architecture**](docs/rbac.md): Hierarchy, desk modes, role definitions, permissions matrix, and containment rules.
- [**Status & Progress Lifecycle**](docs/status-and-progress-updates.md): Manual updates, automated status cascading (Project $\rightarrow$ Task $\rightarrow$ Milestone), and progress bar calculations.
- [**Real-Time Update Flow & Architecture**](docs/realtime-update-flow.md): Pusher WebSocket architecture, channel topologies, event schemas, React hooks, optimistic UI patterns, and sequence diagrams.

---

## Project Structure

```text
collaborate/
├── docs/                   # Architecture and technical documentation
│   ├── rbac.md
│   ├── realtime-update-flow.md
│   └── status-and-progress-updates.md
├── prisma/                 # Prisma schema definition & migrations
│   └── schema.prisma
├── generated/prisma/       # Generated Prisma Client
├── public/                 # Static assets & icons
├── src/
│   ├── app/
│   │   ├── (auth)/         # Sign-in, sign-up, username setup subflows
│   │   ├── (private)/      # Dashboard, projects, calendar, tasks, members, activity, requests, settings, teams
│   │   │   ├── projects/
│   │   │   │   └── [id]/   # Single project detail page
│   │   │   └── tasks/
│   │   │       └── [id]/   # Single task detail page
│   │   ├── (public)/       # Public landing and external pages
│   │   ├── (workspace)/    # Workspace creation and join flows
│   │   └── api/            # NextAuth, Pusher auth, and Resend endpoints
│   ├── components/
│   │   ├── forms/          # Form components (auth, projects, tasks, workspace)
│   │   ├── pages/          # Full page views (project, task, calendar, tables, peek sheets)
│   │   ├── providers/      # Context providers (Pusher, Auth, Theme)
│   │   ├── shared/         # Shared UI (navigation, sidebars, progress bars, dialogs)
│   │   └── ui/             # Radix / shadcn base components & Tiptap editor
│   ├── hooks/              # Custom React hooks (useTaskRealtime, useProjectRealtime, useWorkspaceRealtime, etc.)
│   └── lib/
│       ├── permissions/    # Dynamic RBAC calculation helpers (project & task permissions)
│       ├── pusher/         # Pusher client, server, and event channel helpers
│       ├── schemas/        # Zod validation schemas
│       └── services/       # Server actions & Prisma database queries
```

---

## Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database

---

## Environment Variables

Create a `.env.local` file in the project root with the following configuration:

```bash
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/collaborate?schema=public"

# NextAuth Configuration
AUTH_SECRET="your-nextauth-secret-key"
AUTH_URL="http://localhost:4242"

# OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Pusher Channels (Real-Time WebSockets)
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="your-pusher-cluster"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="your-pusher-cluster"

# Email Services (Resend)
RESEND_API_KEY="re_123456789"
SENDER_EMAIL="noreply@yourdomain.com"
NEXT_PUBLIC_BASE_URL="http://localhost:4242"
```

---

## Getting Started

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Generate Prisma client**:

   ```bash
   pnpm dlx prisma generate
   ```

3. **Run database migrations (or push schema)**:

   ```bash
   pnpm dlx prisma db push
   ```

4. **Start the development server**:

   ```bash
   pnpm dev
   ```

The application runs locally at `http://localhost:4242`.

---

## Useful Commands

```bash
pnpm dev                 # Start dev server with Turbopack on port 4242
pnpm build               # Build production application
pnpm start               # Start production server
pnpm lint                # Run ESLint checks
pnpm dlx prisma generate # Regenerate Prisma Client
pnpm dlx prisma studio   # Open Prisma Studio to inspect the database
```

---

## Routing & Access Control Model

- **Public Routes**: `/`, `/join-workspace`
- **Auth Routes**: `/sign-in`, `/sign-up`, `/sign-up/individual-auth`, `/sign-up/workspace-auth`, username setup subflows
- **Workspace Onboarding Routes**: `/create-workspace`, `/join-workspace`, `/sign-in/my-workspaces`
- **Protected Workspace Routes**:
  - `/dashboard` — Role-branching dashboard for OWNER, ADMIN, MEMBER, and INDIVIDUAL modes
  - `/projects` & `/projects/[id]` — Projects listing table/grid & project workspace hub
  - `/tasks` & `/tasks/[id]` — Tasks listing table/board & single task view
  - `/calendar` — Task scheduling and calendar view
  - `/activity` — Real-time workspace audit and activity feed
  - `/members` — Team member management & role assignment
  - `/requests` — Workspace join request approvals
  - `/teams` — Workspace teams breakdown
  - `/notifications` — User notifications center
  - `/settings` — Workspace and user profile settings

Access control and automatic route redirection are enforced at the edge via `src/proxy.ts`.
