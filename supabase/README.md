# Supabase Database Schema

This directory contains the database schema for the AI Test Agent application.

## Setup Instructions

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Update Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase URL and anon key:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Run the Schema**
   - Open your Supabase project dashboard
   - Go to the SQL Editor
   - Copy and paste the contents of `schema.sql`
   - Run the query to create all tables and indexes

## Database Structure

### Tables

- **test_suites**: Stores test suite configurations
- **test_runs**: Records of test execution runs
- **test_results**: Individual test results for each viewport
- **ai_analyses**: AI-generated analyses of test results
- **test_code**: Version-controlled test code storage

### Relationships

```
test_suites (1) → (many) test_runs
test_suites (1) → (many) test_code
test_runs (1) → (many) test_results
test_results (1) → (many) ai_analyses
```

## Security

Row Level Security (RLS) is enabled on all tables. The current policies allow all operations for authenticated users. Adjust these policies based on your specific security requirements.

## Real-time Features

The application uses Supabase real-time subscriptions to monitor:
- Test run status changes
- New test results as they're created

See `src/lib/supabase.ts` for the subscription implementations.
