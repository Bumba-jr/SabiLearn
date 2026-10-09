'use client';

// Peer-to-peer video + audio for 1-on-1 lessons, signaled over a Supabase
// Realtime broadcast channel (no external service needed). The tutor is the
// offerer; the student answers.
//
// Reliability rules that make the call actually connect:
// - Broadcast has no persistence, so a one-time "student-ready" is easily
//   missed. The student therefore re-announces every ~2.5s until connected,
//   and the tutor answers EVERY announcement with a fresh offer (guarded
//   against glare so duplicate offers are ignored).
// - ICE candidates that arrive before the remote description are queued and
//   flushed afterwards instead of being dropped.
// - Streams are re-attached to the <video> elements whenever they or the
//   elements change, and play() is called explicitly (autoplay policies).
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export type CallStatus = 'idle' | 'connecting' | 'connected' | 'failed';

interface UseVideoCallOptions {
    classId: string;
    isTutor: boolean;
    enabled: boolean;
}

export function useVideoCall({ classId, isTutor, enabled }: UseVideoCallOptions) {
    const [status, setStatus] = useState<CallStatus>('idle');
    const [mediaError, setMediaError] = useState<string | null>(null);
    const [muted, setMuted] = useState(false);
    const [cameraOff, setCameraOff] = useState(false);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const channelRef = useRef<any>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
    const lastOfferSdpRef = useRef<string | null>(null);
    const connectedRef = useRef(false);

    const sendSignal = useCallback((payload: any) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'signal',
            payload,
        });
    }, []);

    // (Re)attach the local preview whenever the element or stream changes;
    // the remote stream is attached in pc.ontrack.
    const attachStreams = useCallback(() => {
        const local = localStreamRef.current;
        const el = localVideoRef.current;
        if (local && el && el.srcObject !== local) {
            el.srcObject = local;
            el.play?.().catch(() => {});
        }
    }, []);

    // Cleanup on unmount / disable
    useEffect(() => {
        if (enabled) return;
        return () => {
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
            pcRef.current?.close();
            pcRef.current = null;
            channelRef.current?.unsubscribe();
            channelRef.current = null;
            setStatus('idle');
            connectedRef.current = false;
        };
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        let readyTimer: ReturnType<typeof setInterval> | null = null;
        setStatus('connecting');
        connectedRef.current = false;

        async function run() {
            try {
                // 1. Camera + microphone
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                localStreamRef.current = stream;
                attachStreams();

                // 2. Peer connection
                const pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' },
                    ],
                });
                pcRef.current = pc;
                stream.getTracks().forEach((track) => pc.addTrack(track, stream));

                pc.ontrack = (event) => {
                    const el = remoteVideoRef.current;
                    if (el && event.streams[0]) {
                        el.srcObject = event.streams[0];
                        el.play?.().catch(() => {});
                    }
                };

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        sendSignal({ type: 'ice', candidate: event.candidate.toJSON() });
                    }
                };

                pc.onconnectionstatechange = () => {
                    if (pc.connectionState === 'connected') {
                        connectedRef.current = true;
                        setStatus('connected');
                    }
                    if (pc.connectionState === 'failed') {
                        setStatus('failed');
                    }
                };

                const flushIce = async () => {
                    const queued = pendingIceRef.current;
                    pendingIceRef.current = [];
                    for (const c of queued) {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(c));
                        } catch { /* stale candidates are normal */ }
                    }
                };

                // 3. Signaling channel
                const channel = supabase.channel(`class-video-${classId}`, {
                    config: { broadcast: { self: false } },
                });
                channelRef.current = channel;

                channel.on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
                    if (cancelled || !pcRef.current) return;
                    const pc = pcRef.current;
                    try {
                        if (payload.type === 'offer' && !isTutor) {
                            // Ignore duplicate offers (same SDP) — the tutor may
                            // answer several student-ready announcements.
                            if (lastOfferSdpRef.current === payload.sdp?.sdp) return;
                            lastOfferSdpRef.current = payload.sdp?.sdp || null;
                            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                            await flushIce();
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            sendSignal({ type: 'answer', sdp: answer });
                        } else if (payload.type === 'answer' && isTutor) {
                            if (pc.signalingState !== 'have-local-offer') return;
                            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                            await flushIce();
                        } else if (payload.type === 'ice' && payload.candidate) {
                            if (!pc.remoteDescription || !pc.remoteDescription.type) {
                                // Remote description not set yet — buffer it.
                                pendingIceRef.current.push(payload.candidate);
                            } else {
                                try {
                                    await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                                } catch { /* stale candidates are normal */ }
                            }
                        }
                    } catch (err) {
                        console.warn('WebRTC signal error:', err);
                    }
                });

                if (isTutor) {
                    // The tutor answers EVERY student announcement with an offer
                    // (as long as we're not mid-negotiation), so retries are safe.
                    channel.on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
                        if (cancelled || payload?.type !== 'student-ready' || !pcRef.current) return;
                        const pc = pcRef.current;
                        if (pc.signalingState !== 'stable') return;
                        try {
                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);
                            sendSignal({ type: 'offer', sdp: offer });
                        } catch (err) {
                            console.warn('Offer error:', err);
                        }
                    });
                }

                await channel.subscribe(async (subStatus: string) => {
                    if (subStatus !== 'SUBSCRIBED' || cancelled) return;
                    if (!isTutor) {
                        // Students announce readiness repeatedly until the call is
                        // connected — broadcast has no persistence, so a single
                        // announcement gets lost if the tutor subscribes later.
                        sendSignal({ type: 'student-ready' });
                        readyTimer = setInterval(() => {
                            if (cancelled || connectedRef.current) {
                                if (readyTimer) { clearInterval(readyTimer); readyTimer = null; }
                                return;
                            }
                            sendSignal({ type: 'student-ready' });
                        }, 2500);
                    }
                });
            } catch (err: any) {
                if (cancelled) return;
                if (/permission|denied|not allowed/i.test(err?.message || '')) {
                    setMediaError('Camera/microphone access was denied. Allow it in your browser settings and rejoin.');
                } else if (/NotFound|not found|Requested device/i.test(err?.message || '')) {
                    setMediaError('No camera or microphone found on this device.');
                } else {
                    setMediaError(err?.message || 'Could not start the call.');
                }
                setStatus('failed');
            }
        }

        run();

        return () => {
            cancelled = true;
            if (readyTimer) clearInterval(readyTimer);
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
            pcRef.current?.close();
            pcRef.current = null;
            channelRef.current?.unsubscribe();
            channelRef.current = null;
            pendingIceRef.current = [];
            lastOfferSdpRef.current = null;
        };
    }, [enabled, classId, isTutor, sendSignal, attachStreams]);

    // Keep the local preview attached as elements mount/unmount.
    useEffect(() => {
        attachStreams();
    }, [status, attachStreams]);

    const toggleMute = useCallback(() => {
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setMuted(!track.enabled);
        }
    }, []);

    const toggleCamera = useCallback(() => {
        const track = localStreamRef.current?.getVideoTracks()[0];
        if (track) {
            track.enabled = !track.enabled;
            setCameraOff(!track.enabled);
        }
    }, []);

    return { status, mediaError, muted, cameraOff, toggleMute, toggleCamera, localVideoRef, remoteVideoRef };
}
