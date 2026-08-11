# Collaborate

Collaborate is a modern Next.js App Router application built for individual productivity and team workspace collaboration.

It features workspace onboarding, flexible authentication (credentials supporting username or email + OAuth), role-aware dashboard routing, project and task management with rich text editing, interactive calendar scheduling, team activity tracking, and workspace join request management.

## Current State (Overview)

This README reflects the codebase state as of August 2026.

### Core Implemented Capabilities:

- **Next.js 16 + React 19 + TypeScript** setup with a fast `pnpm`-based workflow.
- **Prisma 7 (PostgreSQL)** with PostgreSQL adapter (`@prisma/adapter-pg`) and generated client in `generated/prisma`.
- **NextAuth v5 (Auth.js)** integration:
  - Credentials sign-in supporting both **Username or Email**
  - Google OAuth & GitHub OAuth integration
  - Workspace-aware session enrichment (current workspace ID, mode, role, workspace name)
- **Route Protection & Access Control**:
  - Edge proxy middleware (`src/proxy.ts`) and centralized route configuration (`routes.ts`)
- **Flexible Workspace Modes**:
  - `INDIVIDUAL` mode for personal task and project tracking
  - `WORKSPACE` mode for multi-member team collaboration
- **Onboarding & Workspace Management**:
  - Sign in & multi-step sign up (individual vs workspace auth branches)
  - Workspace creation with auto-generated slugs
  - Join workspace flow (request submissions, invite codes, admin approval/rejection)
  - Workspace switcher (`/sign-in/my-workspaces`)
- **Project & Task Management**:
  - Comprehensive Project listing with grid and tabular views (`@tanstack/react-table`), priority/status badges, and assignee management
  - Single Project detail pages (`/projects/[id]`) featuring dedicated tabs: Overview, Tasks, Milestones, Comments, Resources, Activity, and Members
  - Integrated **Tiptap WYSIWYG Rich Text Editor** for project description formatting
  - Task management dialogs (`isDialogView`) with priority levels (`URGENT`, `HIGH`, `MEDIUM`, `LOW`, `NO_PRIORITY`) and status handling (`TODO`, `IN_PROGRESS`, `ON_HOLD`, `COMPLETED`, `CANCELLED`)
  - Milestone progress tracking (`NOT_STARTED`, `IN_PROGRESS`, `DONE`)
  - Nested comment discussions on projects and tasks
  - Resource link attachments for projects and tasks
- **Interactive Calendar**:
  - Interactive calendar view (`/calendar`) for visualizing task timelines and scheduling
- **Activity Logging & Analytics**:
  - Workspace, project, and task activity feed (`/activity`)
  - Dashboard analytics powered by `recharts`
- **UI & UX Foundation**:
  - Styled with Tailwind CSS v4, Radix UI primitives, shadcn/ui design patterns, and Lucide icons
  - Smooth page loading progress indicator (`nextjs-toploader`)
  - Toast notification alerts (`sonner`)
  - Email notification templates rendered via `@react-email/render` and dispatched via `resend`

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Library**: React 19
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS v4, Radix UI, shadcn/ui, Lucide Icons
- **Rich Text Editor**: Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`)
- **Data Tables**: TanStack Table (`@tanstack/react-table`)
- **Data Visualization**: Recharts
- **Auth**: NextAuth v5 (Auth.js) + Prisma Adapter
- **Database & ORM**: PostgreSQL + Prisma 7 ORM (`@prisma/adapter-pg`)
- **Validation**: Zod + React Hook Form
- **Email Delivery**: Resend + React Email

## Project Structure

```text
src/
  app/
    (auth)/             # Sign in, sign up, username setup subflows
    (private)/          # Dashboard, projects, calendar, tasks, members, activity, requests, settings, teams
      projects/
        [id]/           # Single project detail view with tabbed navigation
    (public)/           # Public landing and external pages
    (workspace)/        # Workspace creation and join flows
    api/                # NextAuth and Resend API endpoints
  components/
    forms/              # Reusable form components (auth, projects, tasks, workspace)
    pages/              # Page-specific views (project overview, calendar, tables)
    shared/             # Shared app UI (task dialogs, progress bars, header/sidebar)
    ui/                 # Radix / shadcn base components & Tiptap WYSIWYG editor
  hooks/                # Custom React hooks
  lib/
    services/           # Business logic & Prisma services (auth, project, task, workspace, activity, member)
    schemas/            # Zod validation schemas
prisma/                 # Prisma schema definition & migrations
generated/prisma/       # Generated Prisma Client
public/                 # Static assets & public resources
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database

## Environment Variables

Create a `.env.local` file in the project root and populate the required environment variables:

```bash
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/collaborate?schema=public"

# NextAuth Configuration
AUTH_SECRET="your-nextauth-secret-key"
AUTH_URL="http://localhost:4242"

# OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Services (Resend)
RESEND_API_KEY="re_123456789"
SENDER_EMAIL="noreply@yourdomain.com"
NEXT_PUBLIC_BASE_URL="http://localhost:4242"
```

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

The application will run locally at `http://localhost:4242`.

## Useful Commands

```bash
pnpm dev             # Start dev server with Turbopack on port 4242
pnpm build           # Build production application
pnpm start           # Start production server
pnpm lint            # Run ESLint checks
pnpm dlx prisma generate # Regenerate Prisma Client
```

## Routing & Access Control Model

- **Public Routes**: `/`, `/join-workspace`
- **Auth Routes**: `/sign-in`, `/sign-up`, `/sign-up/individual-auth`, `/sign-up/workspace-auth`, username setup subflows
- **Workspace Onboarding Routes**: `/create-workspace`, `/join-workspace`, `/sign-in/my-workspaces`
- **Protected Workspace Routes**:
  - `/dashboard` — Role-branching dashboard for OWNER, ADMIN, MEMBER, and INDIVIDUAL modes
  - `/projects` & `/projects/[id]` — Projects listing table/grid & project workspace hub
  - `/tasks` — Task list and dialog management
  - `/calendar` — Task scheduling and calendar view
  - `/activity` — Real-time workspace activity logger
  - `/members` — Team member management & roles
  - `/requests` — Workspace join request approvals
  - `/teams` — Workspace teams breakdown
  - `/notifications` — User notifications center
  - `/settings` — Workspace and user profile settings

Access control and automatic redirects are enforced at the edge via `src/proxy.ts`.

## Data Model Summary

Core Prisma database models defined in `prisma/schema.prisma`:

- **Authentication & User**: `User`, `Account`
- **Workspace & Organization**: `Workspace`, `Member`, `Team`, `JoinRequest`, `inviteCode`
- **Project & Execution**: `Project`, `ProjectMember`, `Task`, `TaskMember`, `MileStone`, `Comment`, `Resource`
- **Activity Logging**: `Activity`

Workspace modes supported:
- `INDIVIDUAL` (personal desk workspace)
- `WORKSPACE` (team collaboration workspace)

