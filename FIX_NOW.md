# Fix Database Error - Simple Steps

## Step 1: Run First SQL Script

1. Open file: `RUN_THIS_SQL_FIRST.sql`
2. Copy ALL the content
3. Go to Supabase Dashboard → SQL Editor
4. Paste and click "Run"
5. Should see: "Step 1 complete: Trigger removed!"

## Step 2: Run Second SQL Script

1. Open file: `RUN_THIS_SQL_SECOND.sql`
2. Copy ALL the content
3. Go to Supabase Dashboard → SQL Editor
4. Paste and click "Run"
5. Should see: "Step 2 complete: Policies updated!"

## Step 3: Restart Dev Server

In terminal:
```bash
# Press Ctrl+C to stop
# Then run:
pnpm dev
```

## Step 4: Clear Browser & Test

1. Clear browser cache (Cmd+Shift+Delete) OR use Incognito
2. Go to: http://localhost:3000/sign-up
3. Sign up with email/password
4. Should work now!

---

**Important**: Copy the ENTIRE content of each .sql file, including the comments at the top. Don't copy any markdown formatting like ```sql or backticks.
