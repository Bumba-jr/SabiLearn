'use client';

// Peer-to-peer video + audio for 1-on-1 lessons, signaled over a Supabase
// Realtime broadcast channel (no external service needed). The tutor is the
// offerer; the student answers. ICE candidates flow both ways.
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

    const sendSignal = useCallback((payload: any) => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'signal',
            payload,
        });
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
        };
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        setStatus('connecting');

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
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // 2. Peer connection
                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
                });
                pcRef.current = pc;
                stream.getTracks().forEach((track) => pc.addTrack(track, stream));

                pc.ontrack = (event) => {
                    if (remoteVideoRef.current && event.streams[0]) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        sendSignal({ type: 'ice', candidate: event.candidate.toJSON() });
                    }
                };
                pc.onconnectionstatechange = () => {
                    if (pc.connectionState === 'connected') setStatus('connected');
                    if (pc.connectionState === 'failed') setStatus('failed');
                };

                // 3. Signaling channel
                const channel = supabase.channel(`class-video-${classId}`, {
                    config: { broadcast: { self: false } },
                });
                channelRef.current = channel;

                channel.on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
                    if (!pcRef.current) return;
                    if (payload.type === 'offer' && !isTutor) {
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                        const answer = await pcRef.current.createAnswer();
                        await pcRef.current.setLocalDescription(answer);
                        sendSignal({ type: 'answer', sdp: answer });
                    } else if (payload.type === 'answer' && isTutor) {
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                    } else if (payload.type === 'ice' && payload.candidate) {
                        try {
                            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                        } catch { /* stale candidates are normal */ }
                    }
                });

                await channel.subscribe(async (status: string) => {
                    if (status !== 'SUBSCRIBED' || cancelled) return;
                    if (isTutor) {
                        // Tutor waits for the student to announce readiness
                        channel.on('broadcast', { event: 'student-ready' }, async () => {
                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);
                            sendSignal({ type: 'offer', sdp: offer });
                        });
                    } else {
                        sendSignal({ type: 'student-ready' });
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
            localStreamRef.current?.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
            pcRef.current?.close();
            pcRef.current = null;
            channelRef.current?.unsubscribe();
            channelRef.current = null;
        };
    }, [enabled, classId, isTutor, sendSignal]);

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
