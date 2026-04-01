# Collaborate

Collaborate is a Next.js App Router project for individual productivity and team collaboration.
It supports account creation, authentication (credentials + OAuth), workspace onboarding, and role-aware dashboard routing.

## Current State (Overview)

This README reflects the current codebase state as of April 2026.

Implemented and working:

- Next.js 16 + React 19 + TypeScript setup
- pnpm-based workflow
- Prisma (PostgreSQL) with generated client in `generated/prisma`
- NextAuth v5 beta integration
    - Credentials auth
    - Google OAuth
    - GitHub OAuth
- Route protection and redirect logic via `src/proxy.ts`
- Workspace-aware session enrichment (current workspace id, mode, role, name)
- Initial onboarding flows:
    - Sign in
    - Sign up (individual/workspace branches)
    - Workspace creation
    - Join workspace request flow
    - Workspace selection (`/sign-in/my-workspaces`)
- Dashboard role branching for OWNER / ADMIN / MEMBER and INDIVIDUAL mode
- UI foundation with Tailwind v4 + shadcn/ui components

## Tech Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- Package manager: pnpm
- UI: Tailwind CSS v4, Radix UI, shadcn/ui patterns
- Auth: NextAuth v5 beta + Prisma Adapter
- Database: PostgreSQL + Prisma ORM
- Validation: Zod + React Hook Form

## Project Structure

```text
src/
	app/
		(auth)/
		(private)/
		(public)/
		(workspace)/
		api/
	components/
		forms/
		pages/
		shared/
		ui/
	hooks/
	lib/
		schemas/
		services/
prisma/
generated/prisma/
public/resources/
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database

## Environment Variables

Create `.env.local` and provide at least:

```bash
DATABASE_URL=

# NextAuth
AUTH_SECRET=
AUTH_URL=http://localhost:4242

# OAuth providers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Notes:

- `DATABASE_URL` is required by Prisma and the custom Prisma adapter setup.
- Credentials auth works without OAuth keys, but Google/GitHub sign-in require their env vars.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Generate Prisma client (also runs automatically on postinstall):

```bash
pnpm dlx prisma generate
```

Run development server:

```bash
pnpm dev
```

App runs on:

- `http://localhost:4242`

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm dlx prisma generate
```

## Routing Model

- Public route: `/`
- Auth routes: `/sign-in`, `/sign-up`, auth subflows
- Workspace onboarding routes: `/create-workspace`, `/join-workspace`
- Protected routes: `/dashboard`, `/activity`, `/calendar`, `/members`, `/notifications`, `/projects`, `/requests`, `/settings`, `/tasks`

Access and redirect behavior is handled in `src/proxy.ts` using `routes.ts` definitions.

## Data Model Summary

Core Prisma models include:

- User, Account
- Workspace, Member, JoinRequest, inviteCode
- Project, Task, MileStone, Comment, Resource
- Activity

The app supports both:

- `INDIVIDUAL` workspaces (personal desk)
- `WORKSPACE` mode (team collaboration)
