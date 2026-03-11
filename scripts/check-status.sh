#!/bin/bash

echo "🔍 Checking SabiLearn Status..."
echo ""

# Check if dev server is running
echo "1️⃣  Checking if dev server is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Dev server is running"
else
    echo "   ❌ Dev server is NOT running"
    echo "   Run: pnpm dev"
    exit 1
fi
echo ""

# Check Supabase connection
echo "2️⃣  Checking Supabase connection..."
SUPABASE_TEST=$(curl -s http://localhost:3000/api/test-supabase)
if echo "$SUPABASE_TEST" | grep -q '"success":true'; then
    echo "   ✅ Supabase connection working"
else
    echo "   ❌ Supabase connection failed"
    echo "   Response: $SUPABASE_TEST"
    echo "   Action: Restart dev server (Ctrl+C then pnpm dev)"
fi
echo ""

# Check tutors API
echo "3️⃣  Checking tutors API..."
TUTORS_API=$(curl -s http://localhost:3000/api/tutors)
if echo "$TUTORS_API" | grep -q '"tutors"'; then
    TUTOR_COUNT=$(echo "$TUTORS_API" | grep -o '"id"' | wc -l | tr -d ' ')
    echo "   ✅ Tutors API working - Found $TUTOR_COUNT tutors"
else
    echo "   ❌ Tutors API failed"
    echo "   Response: $TUTORS_API"
fi
echo ""

# Check if experiences column exists
echo "4️⃣  Checking if experiences column exists..."
node scripts/run-migration.mjs 2>&1 | grep -q "already exists"
if [ $? -eq 0 ]; then
    echo "   ✅ Experiences column exists"
else
    echo "   ⚠️  Experiences column missing"
    echo "   Action: Run SQL in Supabase Dashboard (see RUN_IN_SUPABASE_SQL_EDITOR.sql)"
fi
echo ""

# Check find-tutors page
echo "5️⃣  Checking find-tutors page..."
FIND_TUTORS=$(curl -s http://localhost:3000/find-tutors)
if echo "$FIND_TUTORS" | grep -q "Find the perfect tutor"; then
    echo "   ✅ Find-tutors page loads"
else
    echo "   ❌ Find-tutors page has issues"
fi
echo ""

echo "📊 Summary:"
echo "   - If Supabase connection failed: Restart dev server"
echo "   - If experiences column missing: Run migration SQL"
echo "   - If tutors API failed: Check server logs"
echo ""
echo "📖 See FIND_TUTORS_FIX_SUMMARY.md for detailed instructions"
