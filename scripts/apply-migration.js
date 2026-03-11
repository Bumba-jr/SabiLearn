const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vgmflkoykskpqxryrdsp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbWZsa295a3NrcHF4cnlyZHNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI4ODk3NywiZXhwIjoyMDg3ODY0OTc3fQ.aTaXWV795XVtSjUETbKzlpL2lVmvi29MNEEpfPzVlVs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('Applying migration: Add experiences column to tutors table...');

    try {
        // Add experiences column
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE tutors ADD COLUMN IF NOT EXISTS experiences JSONB DEFAULT '[]'::jsonb;
                CREATE INDEX IF NOT EXISTS idx_tutors_experiences ON tutors USING GIN (experiences);
            `
        });

        if (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }

        console.log('✅ Migration applied successfully!');

        // Verify the column exists
        const { data: tutors, error: fetchError } = await supabase
            .from('tutors')
            .select('id, experiences')
            .limit(1);

        if (fetchError) {
            console.error('Verification failed:', fetchError);
        } else {
            console.log('✅ Verified: experiences column exists');
            console.log('Sample data:', tutors);
        }

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

applyMigration();
