import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://vgmflkoykskpqxryrdsp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbWZsa295a3NrcHF4cnlyZHNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI4ODk3NywiZXhwIjoyMDg3ODY0OTc3fQ.aTaXWV795XVtSjUETbKzlpL2lVmvi29MNEEpfPzVlVs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runMigration() {
    console.log('🔄 Applying migration: Add experiences column...');

    try {
        // First, let's check if the column already exists
        const { data: existingTutors, error: checkError } = await supabase
            .from('tutors')
            .select('*')
            .limit(1);

        if (checkError) {
            console.error('❌ Error checking tutors table:', checkError);
            process.exit(1);
        }

        console.log('✅ Connected to database');
        console.log('📊 Sample tutor columns:', existingTutors?.[0] ? Object.keys(existingTutors[0]) : 'No tutors found');

        // Check if experiences column exists
        const hasExperiences = existingTutors?.[0] && 'experiences' in existingTutors[0];

        if (hasExperiences) {
            console.log('✅ experiences column already exists!');
        } else {
            console.log('⚠️  experiences column does NOT exist - manual migration needed');
            console.log('\nPlease run this SQL in Supabase SQL Editor:');
            console.log('---');
            console.log(readFileSync('supabase/migrations/004_add_experiences_to_tutors.sql', 'utf-8'));
            console.log('---');
        }

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

runMigration();
