'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { useAuth } from '@/lib/auth/AuthProvider';
import { toast } from 'sonner';
import {
    Loader2, Radio, Users, Clock, CheckCircle2, XCircle, ArrowLeft,
    BookOpen, Timer, Video as VideoIcon, Mic, MicOff, VideoOff, Maximize, Minimize, PenLine,
} from 'lucide-react';
import { useVideoCall } from '@/lib/use-video-call';
import { ClassroomBoard } from '@/components/ClassroomBoard';
import { supabase } from '@/lib/supabase/client';

interface ClassDetail {
    id: string;
    status: string;
    started_at: string;
    ended_at: string | null;
    session: {
        id: string;
        subject: string;
        scheduled_at: string;
        duration_minutes: number;
        notes: string | null;
        student: { id: string; name: string; grade_level: string | null };
        tutor: { id: string; name: string };
    };
}

interface Attendance {
    student_id: string;
    first_joined_at: string;
    last_seen_at: string;
}

export default function ClassroomPage() {
    const params = useParams<{ id: string }>();
    const classId = params.id;
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [klass, setKlass] = useState<ClassDetail | null>(null);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [viewer, setViewer] = useState<{ isTutor: boolean; studentId: string | null }>({ isTutor: false, studentId: null });
    const call = useVideoCall({ classId, isTutor: viewer.isTutor, enabled: !!klass && klass.status === 'live' });
    const [now, setNow] = useState(Date.now());
    const [ending, setEnding] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [theater, setTheater] = useState(false);
    const [showBoard, setShowBoard] = useState(false);
    const showBoardRef = useRef(false);
    const boardSyncRef = useRef<any>(null);

    // Board open/close is shared: one person opens it, everyone sees it open —
    // in real time, including people who join later (request/reply).
    useEffect(() => {
        const channel = supabase.channel(`class-room-${classId}`);
        boardSyncRef.current = channel;
        channel
            .on('broadcast', { event: 'board-visibility' }, ({ payload }: any) => {
                if (typeof payload?.open === 'boolean') setShowBoard(payload.open);
            })
            .on('broadcast', { event: 'board-visibility-request' }, () => {
                if (showBoardRef.current) {
                    channel.send({ type: 'broadcast', event: 'board-visibility', payload: { open: true } });
                }
            })
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    channel.send({ type: 'broadcast', event: 'board-visibility-request', payload: {} });
                }
            });
        return () => {
            channel.unsubscribe();
            boardSyncRef.current = null;
        };
    }, [classId]);

    const toggleBoard = () => {
        setShowBoard((prev) => {
            const next = !prev;
            showBoardRef.current = next;
            boardSyncRef.current?.send({ type: 'broadcast', event: 'board-visibility', payload: { open: next } });
            return next;
        });
    };
    const videoBoxRef = useRef<HTMLDivElement | null>(null);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/classes/${classId}`, { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Could not load the class.');
                return;
            }
            setKlass(data.class);
            setViewer(data.viewer);
            setAttendance(data.attendance || []);
        } catch {
            setError('Could not reach the server.');
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        if (!user) return;
        load();
    }, [user, load]);

    // Live clock
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    // Heartbeat: student-side presence every 20s while class is live
    useEffect(() => {
        if (!klass || klass.status !== 'live' || !viewer.studentId) return;
        const beat = async () => {
            try {
                await fetch(`/api/classes/${classId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId: viewer.studentId }),
                });
            } catch { /* transient */ }
        };
        beat();
        heartbeatRef.current = setInterval(beat, 20000);
        return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
    }, [klass?.status, viewer.studentId, classId]);

    // Poll attendance for the tutor (and everyone) every 15s
    useEffect(() => {
        if (!klass) return;
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, [klass, load]);

    const toggleFullscreen = () => {
        const box = videoBoxRef.current as any;
        const doc = document as any;
        const isNativeFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement);
        if (isNativeFs) {
            const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.webkitCancelFullScreen;
            exit?.call(document);
            setTheater(false);
            return;
        }
        // Theater mode is the fallback: works in every browser (webviews that
        // block the Fullscreen API included) by expanding the video in-page.
        setTheater((prev) => !prev);
        if (box && !theater) {
            try {
                const req = box.requestFullscreen || box.webkitRequestFullscreen || box.webkitRequestFullScreen;
                if (req) {
                    const result = req.call(box);
                    if (result && typeof result.catch === 'function') {
                        result.catch(() => setTheater(true));
                    }
                }
            } catch {
                setTheater(true);
            }
        }
    };

    // Esc exits theater mode
    useEffect(() => {
        if (!theater) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTheater(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [theater]);

    useEffect(() => {
        const doc = document as any;
        const onFs = () => setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement));
        document.addEventListener('fullscreenchange', onFs);
        document.addEventListener('webkitfullscreenchange', onFs);
        return () => {
            document.removeEventListener('fullscreenchange', onFs);
            document.removeEventListener('webkitfullscreenchange', onFs);
        };
    }, []);

    const endClass = async () => {
        if (!confirm('End this class now? The lesson will be marked completed.')) return;
        setEnding(true);
        try {
            const res = await fetch(`/api/classes/${classId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Could not end the class.');
                return;
            }
            toast.success('Class ended — lesson marked completed.');
            await load();
        } catch {
            toast.error('Could not reach the server.');
        } finally {
            setEnding(false);
        }
    };

    // Countdown to the booked end time
    const classEndMs = klass ? new Date(klass.started_at).getTime() + klass.session.duration_minutes * 60_000 : 0;
    const isLiveNow = klass?.status === 'live';
    const remainingMs = klass && isLiveNow ? classEndMs - now : 0;
    const timesUp = isLiveNow && remainingMs <= 0;

    // When the booked time runs out the class ends itself — the tutor's client
    // finalizes it, and everyone sees the ended state.
    const autoEndedRef = useRef(false);
    useEffect(() => {
        if (!klass || klass.status !== 'live' || !viewer.isTutor) return;
        if (classEndMs - now > 0) { autoEndedRef.current = false; return; }
        if (autoEndedRef.current) return;
        autoEndedRef.current = true;
        (async () => {
            try {
                const res = await fetch(`/api/classes/${classId}`, { method: 'DELETE' });
                if (res.ok) {
                    toast('Time is up — the class was ended automatically.');
                    await load();
                } else {
                    autoEndedRef.current = false;
                }
            } catch {
                autoEndedRef.current = false;
            }
        })();
    }, [klass, now, viewer.isTutor, classEndMs, classId, load]);

    if (!user && !loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-600">Sign in to join the class.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-green-600" />
                </div>
            </div>
        );
    }

    if (error || !klass) {
        return (
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F9F8F6' }}>
                <Header />
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="text-center">
                        <p className="text-lg text-gray-600 mb-4">{error || 'Class not found'}</p>
                        <button onClick={() => router.push('/dashboard')} className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold">Back to Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    const isLive = klass.status === 'live';
    const elapsedMs = isLive ? now - new Date(klass.started_at).getTime() : (klass.ended_at ? new Date(klass.ended_at).getTime() - new Date(klass.started_at).getTime() : 0);
    const elapsedMin = Math.max(0, Math.floor(elapsedMs / 60000));
    const elapsedSec = Math.max(0, Math.floor((elapsedMs % 60000) / 1000));
    const scheduled = new Date(klass.session.scheduled_at);
    const isLate = isLive && elapsedMin > klass.session.duration_minutes;

    // Student-side presence
    const studentAttended = attendance.some((a) => {
        if (a.student_id !== klass.session.student.id) return false;
        return now - new Date(a.last_seen_at).getTime() < 90_000; // seen in the last 90s
    });
    const studentEverJoined = attendance.some((a) => a.student_id === klass.session.student.id);

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0f172a' }}>
            <Header />
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 text-white">
                <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                {/* Status bar */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {isLive ? (
                                <span className="flex items-center gap-2 bg-red-500/20 text-red-300 px-4 py-2 rounded-full text-sm font-bold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                    <Radio className="w-4 h-4" /> CLASS IS LIVE
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 bg-gray-500/20 text-gray-300 px-4 py-2 rounded-full text-sm font-bold">
                                    <CheckCircle2 className="w-4 h-4" /> Class ended
                                </span>
                            )}
                            {timesUp && (
                                <span className="flex items-center gap-1.5 bg-orange-500/20 text-orange-300 px-3 py-1.5 rounded-full text-xs font-bold">
                                    <Timer className="w-3.5 h-3.5" /> TIME&apos;S UP — ending class
                                </span>
                            )}
                            {!timesUp && isLate && (
                                <span className="text-xs text-orange-300">Running over the booked {klass.session.duration_minutes} min</span>
                            )}
                        </div>
                        <div className="text-right">
                            <div className={`flex items-center justify-end gap-2 text-3xl font-mono font-bold tabular-nums ${timesUp ? 'text-orange-400' : remainingMs > 0 ? 'text-white' : ''}`}>
                                <Timer className={`w-6 h-6 ${timesUp ? 'text-orange-400' : 'text-green-400'}`} />
                                {isLive && remainingMs > 0
                                    ? `${String(Math.floor(remainingMs / 60000)).padStart(2, '0')}:${String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')}`
                                    : `${String(elapsedMin).padStart(2, '0')}:${String(elapsedSec).padStart(2, '0')}`}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                {isLive && remainingMs > 0 ? 'time left' : isLive ? 'over booked time' : 'total duration'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid sm:grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs text-gray-400 uppercase mb-1">Subject</p>
                            <p className="font-bold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-green-400" /> {klass.session.subject}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase mb-1">Tutor</p>
                            <p className="font-bold text-lg">{klass.session.tutor.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase mb-1">Student</p>
                            <p className="font-bold text-lg">{klass.session.student.name}</p>
                            {klass.session.student.grade_level && <p className="text-xs text-gray-400">{klass.session.student.grade_level}</p>}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Booked: {scheduled.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })} at {scheduled.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>{klass.session.duration_minutes} min lesson</span>
                        {klass.session.notes && <span className="italic">"{klass.session.notes}"</span>}
                    </div>
                </div>

                {/* Attendance / participation */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                        <h2 className="font-bold flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-green-400" /> Who's here</h2>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
                                        {klass.session.tutor.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{klass.session.tutor.name}</p>
                                        <p className="text-xs text-gray-400">Tutor</p>
                                    </div>
                                </div>
                                {isLive && <span className="text-xs text-green-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> here</span>}
                            </div>

                            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                                        {klass.session.student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{klass.session.student.name}</p>
                                        <p className="text-xs text-gray-400">Student</p>
                                    </div>
                                </div>
                                {isLive ? (
                                    studentAttended ? (
                                        <span className="text-xs text-green-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> in class</span>
                                    ) : studentEverJoined ? (
                                        <span className="text-xs text-orange-300">left / disconnected</span>
                                    ) : (
                                        <span className="text-xs text-red-300 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> not in class</span>
                                    )
                                ) : studentEverJoined ? (
                                    <span className="text-xs text-gray-400">attended</span>
                                ) : (
                                    <span className="text-xs text-gray-500">never joined</span>
                                )}
                            </div>
                        </div>

                        {!isLive && (
                            <p className="text-xs text-gray-400 mt-4">
                                This class has ended. It stays here as a record of the lesson.
                            </p>
                        )}
                    </div>

                    {/* Video call */}
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                        <h2 className="font-bold flex items-center gap-2 mb-4">
                            <VideoIcon className="w-5 h-5 text-green-400" /> Live video & audio
                        </h2>
                        {call.mediaError ? (
                            <p className="text-sm text-red-300 bg-red-500/10 rounded-xl p-3">{call.mediaError}</p>
                        ) : (
                            <>
                                <div
                                    ref={videoBoxRef}
                                    className={`relative bg-black overflow-hidden aspect-video mb-3 ${theater ? 'fixed inset-0 z-[200] rounded-none' : 'rounded-2xl'}`}
                                >
                                    <video ref={call.remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                    <button
                                        onClick={toggleFullscreen}
                                        title={(isFullscreen || theater) ? 'Exit fullscreen (Esc)' : 'Open in fullscreen'}
                                        className="absolute top-2 right-2 z-[210] bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
                                    >
                                        {(isFullscreen || theater) ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                                    </button>
                                    {theater && !isFullscreen && (
                                        <span className="absolute top-2 left-2 z-[210] text-[10px] font-semibold text-white/80 bg-black/60 px-2 py-1 rounded">
                                            Theater view — press Esc to exit
                                        </span>
                                    )}
                                    {call.status !== 'connected' && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
                                            <Loader2 className="w-8 h-8 animate-spin" />
                                            <p className="text-sm">
                                                {call.status === 'connecting' ? 'Connecting to the call…' : 'Call not connected'}
                                            </p>
                                        </div>
                                    )}
                                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/60 px-2 py-1 rounded">
                                        {viewer.isTutor ? klass.session.student.name : klass.session.tutor.name}
                                    </span>
                                </div>
                                <div className="relative w-32 bg-black rounded-xl overflow-hidden aspect-video mb-4 ml-auto -mt-16 mr-2 border border-white/20">
                                    <video ref={call.localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                                    <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-black/60 px-1.5 rounded">You</span>
                                    {call.cameraOff && (
                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                                            <VideoOff className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={call.toggleMute}
                                        className={`flex-1 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm ${call.muted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    >
                                        {call.muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                        {call.muted ? 'Unmute' : 'Mute'}
                                    </button>
                                    <button
                                        onClick={call.toggleCamera}
                                        className={`flex-1 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm ${call.cameraOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                    >
                                        <VideoIcon className="w-4 h-4" />
                                        {call.cameraOff ? 'Camera off' : 'Camera on'}
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-2">
                                    {call.status === 'connected'
                                        ? '✓ Call connected — peer-to-peer video and audio.'
                                        : call.status === 'connecting'
                                            ? 'Establishing the peer-to-peer connection…'
                                            : 'Call could not connect. Check your connection and rejoin.'}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 mt-6">
                        <h2 className="font-bold mb-4">Lesson room</h2>
                        {viewer.isTutor ? (
                            <div className="space-y-4">
                                {isLive ? (
                                    <>
                                        <p className="text-sm text-gray-300">
                                            You're running the class. The student's presence updates live — use it to confirm they showed up.
                                        </p>
                                        <button
                                            onClick={endClass}
                                            disabled={ending}
                                            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {ending ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                                            End Class
                                        </button>
                                        <p className="text-xs text-gray-400">Ending marks the lesson completed for the student's progress.</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-300">This class has ended. Total duration: {elapsedMin} minutes.</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {isLive ? (
                                    <>
                                        <p className="text-sm text-green-300 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                            You're in the class — presence is being tracked.
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Keep this page open for the lesson. The tutor and the parents can see the student's attendance live.
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-300">This class has ended.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {/* Shared Board */}
                <div className="mt-8">
                    <button
                        onClick={toggleBoard}
                        className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <PenLine className="w-5 h-5 text-green-400" />
                        {showBoard ? 'Hide the shared board' : 'Open the shared board — write & draw together'}
                    </button>
                    {showBoard && (
                        <div className="mt-4 bg-white/5 border border-white/10 rounded-3xl p-6">
                            <ClassroomBoard classId={classId} enabled />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
