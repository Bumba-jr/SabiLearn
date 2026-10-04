'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Send, Loader2, MessageCircle, FileText, Download } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { SignInModal } from '@/components/SignInModal';

interface ChatMessage {
    id: string;
    sender_id: string;
    body: string;
    created_at: string;
    attachment_url?: string | null;
    attachment_name?: string | null;
    attachment_type?: string | null;
}

interface ChatPopupProps {
    isOpen: boolean;
    onClose: () => void;
    // One of: tutorId (tutor conversation), conversationId (existing thread),
    // userId (direct chat with any user), or withAdmin (message the admin team)
    tutorId?: string;
    conversationId?: string;
    userId?: string;
    withAdmin?: boolean;
    tutorName: string;
    tutorAvatar?: string | null;
}

// Compares message lists by id + body so unchanged polls don't re-render.
function sameMessages(a: ChatMessage[], b: ChatMessage[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((m, i) => m.id === b[i].id && m.body === b[i].body);
}

// Floating chat window for messaging a tutor from anywhere.
export function ChatPopup({ isOpen, onClose, tutorId, conversationId, userId, withAdmin, tutorName, tutorAvatar }: ChatPopupProps) {
    const { user } = useAuth();
    const [showSignIn, setShowSignIn] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        if (!isOpen) {
            hasLoadedRef.current = false;
        }
    }, [isOpen, tutorId]);

    useEffect(() => {
        if (!isOpen || !user) return;
        let active = true;

        async function load() {
            // Only the first load shows the full-screen loader; background
            // polls refresh silently so the thread doesn't flicker.
            if (!hasLoadedRef.current) setLoading(true);
            try {
                const qs = conversationId
                    ? `conversationId=${conversationId}`
                    : withAdmin
                        ? 'withAdmin=1'
                        : userId
                            ? `userId=${userId}`
                            : `tutorId=${tutorId}`;
                const res = await fetch(`/api/messages?${qs}`);
                const data = await res.json();
                if (!active) return;
                if (!res.ok) {
                    if (!hasLoadedRef.current) setError(data.error || 'Chat is unavailable right now.');
                    return;
                }
                hasLoadedRef.current = true;
                setError(null);
                setMessages((prev) => {
                    const next = data.messages || [];
                    // Skip the state update when nothing changed, so open
                    // composer text and scroll position stay untouched.
                    return sameMessages(prev, next) ? prev : next;
                });
            } catch {
                if (active && !hasLoadedRef.current) setError('Could not reach the chat service.');
            } finally {
                if (active) setLoading(false);
            }
        }
        load();
        // Light polling keeps the thread fresh without a realtime dependency
        const timer = setInterval(load, 8000);
        return () => { active = false; clearInterval(timer); };
    }, [isOpen, user, tutorId, conversationId, userId, withAdmin]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    if (!isOpen) return null;

    const send = async (attachment?: { url: string; name: string; type: string }) => {
        const text = input.trim();
        if ((!text && !attachment) || sending) return;
        setSending(true);
        try {
            const base = conversationId ? { conversationId }
                : withAdmin ? { withAdmin: true }
                : userId ? { userId }
                : { tutorId };
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...base, body: text, ...(attachment ? { attachment } : {}) }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Could not send the message.');
                return;
            }
            setMessages((prev) => [...prev, data.message]);
            setInput('');
            setError(null);
        } catch {
            setError('Could not reach the chat service.');
        } finally {
            setSending(false);
        }
    };

    // File sharing: upload to the chat-attachments bucket, then send the link.
    const handleFilePicked = async (file: File | null | undefined) => {
        if (!file || uploading) return;
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Files are limited to 10 MB.');
            return;
        }
        setUploading(true);
        try {
            const path = `${user?.id || 'anon'}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`;
            const { error: upErr } = await supabase.storage
                .from('chat-attachments')
                .upload(path, file);
            if (upErr) {
                toast.error('File sharing is not enabled yet (run migration 014).');
                return;
            }
            const { data: pub } = supabase.storage.from('chat-attachments').getPublicUrl(path);
            await send({ url: pub.publicUrl, name: file.name, type: file.type || 'application/octet-stream' });
        } catch {
            toast.error('Could not upload the file.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const time = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <div className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed z-[100] bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 flex flex-col h-[70vh] sm:h-[540px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-white">
                    {tutorAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tutorAvatar} alt={tutorName} className="w-12 h-12 rounded-full object-cover bg-blue-100 flex-shrink-0" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-lg flex-shrink-0">
                            {tutorName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-lg truncate" style={{ fontFamily: 'var(--font-outfit)' }}>
                            {tutorName}
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <p className="text-sm text-emerald-600 font-medium">
                                Online
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close chat">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Messages — dotted paper background from the homepage design */}
                <div
                    className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255, 107, 53, 0.15) 1px, transparent 1px)',
                        backgroundSize: '15px 15px',
                    }}
                >
                    {!user ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                            <p className="text-sm text-gray-500">Sign in to send {tutorName} a message.</p>
                            <button
                                onClick={() => setShowSignIn(true)}
                                className="bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                            >
                                Sign In
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="h-full flex items-center justify-center px-6 text-center">
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-6">
                            <MessageCircle className="w-10 h-10 text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">
                                Say hello! Ask {tutorName} about subjects, pricing, or availability.
                            </p>
                        </div>
                    ) : (
                        messages.map((m) => {
                            const mine = m.sender_id === user?.id;
                            return mine ? (
                                <div key={m.id} className="flex flex-col items-end">
                                    <div className="bg-primary text-white rounded-3xl rounded-tr-md px-5 py-4 max-w-[85%]">
                                        {m.attachment_url && (
                                            m.attachment_type?.startsWith('image/') ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={m.attachment_url} alt={m.attachment_name || 'attachment'} className="rounded-2xl mb-2 max-h-52 w-auto" />
                                            ) : (
                                                <a href={m.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 mb-2 text-sm font-medium hover:bg-white/25 transition-colors">
                                                    <FileText className="w-4 h-4" /> <span className="truncate max-w-[180px]">{m.attachment_name || 'Attachment'}</span>
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            )
                                        )}
                                        {m.body && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>}
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 mr-2">
                                        <span className="text-xs text-gray-400">{time(m.created_at)}</span>
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <svg className="w-4 h-4 text-primary -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            ) : (
                                <div key={m.id} className="flex flex-col items-start">
                                    <div className="bg-gray-100 text-gray-900 rounded-3xl rounded-tl-md px-5 py-4 max-w-[85%]">
                                        {m.attachment_url && (
                                            m.attachment_type?.startsWith('image/') ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={m.attachment_url} alt={m.attachment_name || 'attachment'} className="rounded-2xl mb-2 max-h-52 w-auto" />
                                            ) : (
                                                <a href={m.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 mb-2 text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200">
                                                    <FileText className="w-4 h-4" /> <span className="truncate max-w-[180px]">{m.attachment_name || 'Attachment'}</span>
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            )
                                        )}
                                        {m.body && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>}
                                    </div>
                                    <span className="text-xs text-gray-400 mt-1 ml-2">{time(m.created_at)}</span>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => handleFilePicked(e.target.files?.[0])}
                                />
                                <button
                                    type="button"
                                    title="Share a file (images, PDFs, assignments — up to 10 MB)"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                                >
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    )}
                                </button>
                            </>
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                                placeholder="Type a message or tap + to share a file..."
                                maxLength={2000}
                                className="flex-1 bg-white border border-gray-200 rounded-full px-5 py-3 text-sm outline-none focus:border-primary transition-colors"
                            />
                            <button
                                onClick={() => send()}
                                disabled={sending || !input.trim()}
                                className="w-12 h-12 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0"
                                aria-label="Send message"
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Send className="w-5 h-5 text-white" />}
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            <SignInModal
                isOpen={showSignIn}
                onClose={() => setShowSignIn(false)}
                onSuccess={() => setShowSignIn(false)}
            />
        </>
    );
}
