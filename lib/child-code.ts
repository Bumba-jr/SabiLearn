import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generates a unique shareable child code, e.g. SB-4K7Q2M
// (no look-alike characters: no I, L, O, 0, 1).
export async function generateChildCode(): Promise<string> {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 10; attempt++) {
        let suffix = '';
        for (let i = 0; i < 6; i++) {
            suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        const code = `SB-${suffix}`;
        const { data: existing } = await supabase
            .from('students')
            .select('id')
            .eq('child_code', code)
            .maybeSingle();
        if (!existing) return code;
    }
    throw new Error('Could not generate a unique child code');
}
