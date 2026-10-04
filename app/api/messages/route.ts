import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthUser() {
    const cookieStore = await cookies();
    const supabaseSSR = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll() { /* middleware refreshes the session */ },
            },
        }
    );
    const { data: { user } } = await supabaseSSR.auth.getUser();
    return user;
}

// Attachment columns only exist after migration 014; fall back gracefully.
const MSG_SELECT_FULL = 'id, sender_id, body, read_at, created_at, attachment_url, attachment_name, attachment_type';
const MSG_SELECT_PLAIN = 'id, sender_id, body, read_at, created_at';

async function fetchMessages(conversationId: string, senderExcluded?: string) {
    let data: any[] | null = null;
    let error: { message?: string } | null = null;
    const res = await supabase
        .from('messages')
        .select(MSG_SELECT_FULL)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200);
    data = res.data as any[] | null;
    error = res.error as { message?: string } | null;
    if (error && /column .* does not exist/i.test(error.message || '')) {
        const res2 = await supabase
            .from('messages')
            .select(MSG_SELECT_PLAIN)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(200);
        data = (res2.data as any[] | null) || [];
        error = (res2.error as { message?: string } | null);
    }
    return { data: data || [], error };
}

function missingTable(error: { message?: string } | null): boolean {
    return /relation .* does not exist|Could not find the table/i.test(error?.message || '');
}

// GET /api/messages?tutorId=<uuid> — messages with a tutor (creates the conversation lazily)
// GET /api/messages — all conversations for the signed-in user
export async function GET(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const tutorId = searchParams.get('tutorId');
        const conversationId = searchParams.get('conversationId');
        const otherUserId = searchParams.get('userId');
        const withAdmin = searchParams.get('withAdmin') === '1';
        const isAdmin = user.id === process.env.ADMIN_USER_ID;

        if (withAdmin || otherUserId) {
            const targetId = withAdmin ? process.env.ADMIN_USER_ID : otherUserId;
            if (!targetId) {
                return NextResponse.json(withAdmin
                    ? { error: 'Admin account is not configured (ADMIN_USER_ID missing).' }
                    : { error: 'userId is required' }, { status: 400 });
            }
            if (targetId === user.id) {
                return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
            }

            let { data: convo } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant_a.eq.${user.id},participant_b.eq.${targetId}),and(participant_a.eq.${targetId},participant_b.eq.${user.id})`)
                .eq('category', 'support')
                .maybeSingle();

            if (!convo) {
                const { data: created, error: createError } = await supabase
                    .from('conversations')
                    .insert({
                        participant_a: user.id,
                        participant_b: targetId,
                        category: 'support',
                        subject: withAdmin ? 'Support chat' : 'Direct chat',
                    })
                    .select('id')
                    .single();
                if (createError) {
                    console.error('Conversation create error:', createError.message);
                    return NextResponse.json({ error: 'Chat is not available yet. Run migration 009.' }, { status: 500 });
                }
                convo = created;
            }

            const { data: messages } = await fetchMessages((convo as any).id);

            await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('conversation_id', (convo as any).id)
                .neq('sender_id', user.id)
                .is('read_at', null);

            return NextResponse.json({
                conversationId: (convo as any).id,
                messages: messages || [],
            });
        }

        if (conversationId) {
            const { data: convo } = await supabase
                .from('conversations')
                .select('id, participant_a, participant_b, tutor_id')
                .eq('id', conversationId)
                .single();

            if (!convo || (convo.participant_a !== user.id && convo.participant_b !== user.id)) {
                return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
            }

            const otherId = convo.participant_a === user.id ? convo.participant_b : convo.participant_a;
            const { data: messages } = await fetchMessages(convo.id);

            await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('conversation_id', convo.id)
                .neq('sender_id', user.id)
                .is('read_at', null);

            return NextResponse.json({
                conversationId: convo.id,
                messages: messages || [],
            });
        }

        if (tutorId) {
            // Resolve the tutor's auth id
            const { data: tutor, error: tutorError } = await supabase
                .from('tutors')
                .select('id, auth_user_id, user_id, name, avatar_url')
                .eq('id', tutorId)
                .single();
            if (tutorError || !tutor) {
                return NextResponse.json({ error: 'Tutor not found' }, { status: 404 });
            }
            const tutorAuthId = tutor.auth_user_id || tutor.user_id;
            if (tutorAuthId === user.id) {
                return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
            }

            // Find or create the conversation
            let { data: convo, error: convoError } = await supabase
                .from('conversations')
                .select('id')
                .or(`and(participant_a.eq.${user.id},participant_b.eq.${tutorAuthId}),and(participant_a.eq.${tutorAuthId},participant_b.eq.${user.id})`)
                .eq('tutor_id', tutor.id)
                .maybeSingle();

            if (convoError && !missingTable(convoError)) {
                console.error('Conversation lookup error:', convoError.message);
                return NextResponse.json({ error: 'Chat is not available yet. Run migration 008.' }, { status: 500 });
            }

            if (!convo) {
                const { data: created, error: createError } = await supabase
                    .from('conversations')
                    .insert({
                        participant_a: user.id,
                        participant_b: tutorAuthId,
                        tutor_id: tutor.id,
                    })
                    .select('id')
                    .single();
                if (createError) {
                    console.error('Conversation create error:', createError.message);
                    return NextResponse.json({ error: 'Chat is not available yet. Run migration 008.' }, { status: 500 });
                }
                convo = created;
            }

            const { data: messages, error: messagesError } = await supabase
                .from('messages')
                .select('id, sender_id, body, read_at, created_at')
                .eq('conversation_id', (convo as any).id)
                .order('created_at', { ascending: true })
                .limit(200);

            if (messagesError && !missingTable(messagesError)) {
                console.error('Messages fetch error:', messagesError.message);
                return NextResponse.json({ error: 'Chat is not available yet. Run migration 008.' }, { status: 500 });
            }

            // Mark the other party's messages as read
            await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('conversation_id', (convo as any).id)
                .neq('sender_id', user.id)
                .is('read_at', null);

            return NextResponse.json({
                conversationId: (convo as any).id,
                tutor: { id: tutor.id, name: tutor.name, avatar_url: tutor.avatar_url },
                messages: messages || [],
            });
        }

        // Conversation list — admins see all conversations (support inbox)
        let convoQuery = supabase
            .from('conversations')
            .select(`
                id, participant_a, participant_b, tutor_id, category, status, subject, last_message_at,
                messages(body, created_at, sender_id, read_at)
            `);
        if (!isAdmin) {
            convoQuery = convoQuery.or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);
        }
        const { data: convos, error } = await convoQuery
            .order('last_message_at', { ascending: false })
            .limit(100);

        if (error) {
            if (missingTable(error)) {
                return NextResponse.json({ conversations: [], notice: 'Chat tables not created yet (migration 008).' });
            }
            console.error('Conversations fetch error:', error.message);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }

        // Resolve display names/avatars for the other participants
        const otherIds = [...new Set((convos || []).map((c: any) =>
            c.participant_a === user.id ? c.participant_b : c.participant_a))];
        const nameById: Record<string, { name: string; avatarUrl: string | null }> = {};

        if (otherIds.length > 0) {
            const { data: tutorRows } = await supabase
                .from('tutors')
                .select('auth_user_id, user_id, name, avatar_url')
                .or(`auth_user_id.in.(${otherIds.join(',')}),user_id.in.(${otherIds.join(',')})`);
            for (const t of tutorRows || []) {
                const id = (t.auth_user_id || t.user_id) as string;
                if (id && !nameById[id]) nameById[id] = { name: t.name, avatarUrl: t.avatar_url };
            }
            const remaining = otherIds.filter((id) => !nameById[id]);
            if (remaining.length > 0) {
                const { data: studentRows } = await supabase
                    .from('students')
                    .select('user_id, name')
                    .in('user_id', remaining);
                for (const st of studentRows || []) {
                    if (st.user_id && !nameById[st.user_id]) {
                        nameById[st.user_id] = { name: st.name, avatarUrl: null };
                    }
                }
            }
        }

        const conversations = (convos || []).map((c: any) => {
            const other = c.participant_a === user.id ? c.participant_b : c.participant_a;
            const msgs = Array.isArray(c.messages) ? c.messages : [];
            const last = msgs[msgs.length - 1];
            return {
                id: c.id,
                otherUserId: other,
                category: c.category || 'chat',
                status: c.status || 'open',
                subject: c.subject || null,
                otherName: nameById[other]?.name || (c.subject || 'SabiLearn user'),
                otherAvatar: nameById[other]?.avatarUrl || null,
                tutorId: c.tutor_id,
                lastMessage: last?.body || null,
                lastMessageAt: last?.created_at || c.last_message_at,
                unread: msgs.filter((m: any) => m.sender_id !== user.id && !m.read_at).length,
            };
        });

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error('Messages API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/messages — send a message { tutorId, body } or { conversationId, body }
export async function POST(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json();
        const text = (payload?.body || '').toString().trim();

        // Optional attachment (uploaded to the chat-attachments bucket first)
        const att = payload?.attachment || null;
        const attachmentUrl = att?.url ? String(att.url) : null;
        const attachmentName = att?.name ? String(att.name).slice(0, 200) : null;
        const attachmentType = att?.type ? String(att.type).slice(0, 100) : null;
        if (attachmentUrl && !/^https:\/\//i.test(attachmentUrl)) {
            return NextResponse.json({ error: 'Invalid attachment link' }, { status: 400 });
        }
        if (!text && !attachmentUrl) {
            return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
        }
        if (text.length > 2000) {
            return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
        }

        let conversationId = payload?.conversationId as string | undefined;

        if (!conversationId && (payload?.tutorId || payload?.userId || payload?.withAdmin)) {
            // Reuse GET's lazy-create by calling it internally via a fake Request
            const target = payload?.tutorId
                ? `tutorId=${payload.tutorId}`
                : payload?.withAdmin
                    ? 'withAdmin=1'
                    : `userId=${payload.userId}`;
            const lookup = new Request(`http://local/api/messages?${target}`, { headers: req.headers });
            const res = await GET(lookup);
            const data = await res.json();
            if (!res.ok) return NextResponse.json({ error: data.error || 'Chat unavailable' }, { status: res.status });
            conversationId = data.conversationId;
        }

        if (!conversationId) {
            return NextResponse.json({ error: 'conversationId or tutorId is required' }, { status: 400 });
        }

        const { data: convo } = await supabase
            .from('conversations')
            .select('id, participant_a, participant_b')
            .eq('id', conversationId)
            .single();

        if (!convo || (convo.participant_a !== user.id && convo.participant_b !== user.id)) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        const insertRow: Record<string, unknown> = {
            conversation_id: conversationId,
            sender_id: user.id,
            body: text,
        };
        let { data: message, error } = await supabase
            .from('messages')
            .insert(attachmentUrl
                ? { ...insertRow, attachment_url: attachmentUrl, attachment_name: attachmentName, attachment_type: attachmentType }
                : insertRow)
            .select(MSG_SELECT_FULL)
            .single();

        // Migration 014 not applied yet — retry without attachment fields so
        // the text part of the message still goes through.
        if (error && /column .* does not exist/i.test(error.message || '')) {
            ({ data: message, error } = await supabase
                .from('messages')
                .insert(insertRow)
                .select(MSG_SELECT_PLAIN)
                .single());
        }

        if (error) {
            console.error('Message insert error:', error.message);
            return NextResponse.json({ error: 'Could not send message. Run migration 008.' }, { status: 500 });
        }

        await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);

        return NextResponse.json({ message });
    } catch (error) {
        console.error('Messages API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
