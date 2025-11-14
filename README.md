# AI Test Agent - Pathfinder

An intelligent automated testing platform powered by AI, Playwright, and Next.js.

## Tech Stack

- **Next.js 16** (App Router with Turbopack)
- **TypeScript** (Strict mode)
- **Tailwind CSS 4** (Custom design system)
- **Framer Motion** (Animations)
- **Supabase** (Backend & Database)
- **Lucide React** (Icons)
- **Playwright** (Test execution - to be integrated)
- **Gemini AI** (AI analysis - to be integrated)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Update `.env.local` with your credentials (already configured in your project):

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Set Up Database

Run the SQL schema from `supabase/schema.sql` in your Supabase SQL Editor to create all required tables.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

**Note**: Next.js automatically handles port conflicts. If port 3000 is in use, it will use the next available port (3001, 3002, etc.).

If you encounter a lock file error:
```bash
npm run dev:clean
```

## Configuration

### Turbopack Root

The project is configured with an explicit Turbopack root in `next.config.ts` to handle monorepo scenarios and prevent workspace warnings.

### Available Scripts

- `npm run dev` - Start development server
- `npm run dev:clean` - Clear lock files and start dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
