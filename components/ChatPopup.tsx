'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { SignInModal } from '@/components/SignInModal';

interface ChatMessage {
    id: string;
    sender_id: string;
    body: string;
    created_at: string;
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

    const send = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setSending(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    conversationId ? { conversationId, body: text }
                    : withAdmin ? { withAdmin: true, body: text }
                    : userId ? { userId, body: text }
                    : { tutorId, body: text }
                ),
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

    const time = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <div className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed z-[100] bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[380px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col h-[70vh] sm:h-[520px] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                    {tutorAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tutorAvatar} alt={tutorName} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                            {tutorName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">Chat with {tutorName}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> SabiLearn messaging
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Close chat">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
                    {!user ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                            <p className="text-sm text-gray-500">Sign in to send {tutorName} a message.</p>
                            <button
                                onClick={() => setShowSignIn(true)}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                            >
                                Sign In
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
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
                            return (
                                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${
                                            mine
                                                ? 'bg-green-600 text-white rounded-br-md'
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                        <p className={`text-[10px] mt-1 ${mine ? 'text-green-100' : 'text-gray-400'}`}>
                                            {time(m.created_at)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-3 py-3 border-t border-gray-100 bg-white">
                    {user ? (
                        <div className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                                placeholder={`Message ${tutorName}…`}
                                maxLength={2000}
                                className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/20 transition-all"
                            />
                            <button
                                onClick={send}
                                disabled={sending || !input.trim()}
                                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-2.5 rounded-full transition-colors"
                                aria-label="Send message"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
