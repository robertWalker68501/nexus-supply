# NexusSupply

NexusSupply is a multi-business supply chain management platform. It is
designed for an operator that manages inventory, orders, suppliers, and
fulfillment for one or more client businesses from a single workspace.

The product aims to replace disconnected spreadsheets and status updates with
a shared, secure view of every client operation while keeping each business
logically separate.

## Product direction

- Manage multiple client businesses from one command center
- Track inventory across warehouses and locations
- Coordinate purchasing, suppliers, orders, and fulfillment
- Monitor delivery status and operational performance
- Give team members role-appropriate access
- Keep client workspaces and data securely separated

The current application includes the public landing experience, responsive
navigation, light and dark themes, account registration, sign-in, social
authentication, session management, and role-ready user records. The broader
supply chain workflows are under active development.

## Technology

- [Next.js 16](https://nextjs.org/) with the App Router
- [React 19](https://react.dev/) and TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Base UI](https://base-ui.com/) and shadcn components
- [Better Auth](https://www.better-auth.com/) for email/password and social authentication
- [Prisma](https://www.prisma.io/) with PostgreSQL
- [Lucide](https://lucide.dev/) icons

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- A PostgreSQL database
- Optional GitHub and Google OAuth applications for social sign-in

### Installation

Clone the repository and install its dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"

GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Generate the Prisma client and apply the database schema:

```bash
npx prisma generate
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

- `npm run dev` starts the local development server.
- `npm run build` creates an optimized production build.
- `npm run start` serves the production build.
- `npm run lint` checks the project with ESLint.

## Project structure

```text
app/
  (auth)/             Sign-in and registration routes
  (root)/             Public application routes
  api/auth/           Better Auth request handler
  generated/prisma/   Generated Prisma client
components/
  auth/               Authentication controls
  layout/             Shared page structure
  navigation/         Desktop and mobile navigation
  ui/                 Reusable interface components
lib/
  auth.ts             Server authentication configuration
  auth-client.ts      Browser authentication client
  prisma.ts           PostgreSQL client
prisma/
  schema.prisma       Database models and user roles
```

## Authentication and roles

NexusSupply supports email/password, GitHub, and Google authentication through
Better Auth. The database currently defines `USER`, `MANAGER`, `CUSTOMER`, and
`CSR` roles as the foundation for future access control.

Never commit real credentials or production secrets. Use separate OAuth
applications, secrets, and databases for development and production.
