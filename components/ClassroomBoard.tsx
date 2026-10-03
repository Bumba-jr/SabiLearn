'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Eraser, Trash2, Download, Type, Pencil } from 'lucide-react';

interface Point { x: number; y: number }
interface StrokeItem {
    id: string;
    kind: 'stroke';
    color: string;
    size: number;
    erase: boolean;
    points: Point[];
}
interface TextItem {
    id: string;
    kind: 'text';
    x: number;
    y: number;
    text: string;
    color: string;
    size: number;
}
type BoardItem = StrokeItem | TextItem;

const COLORS = ['#111827', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b'];
const FONT_SCALE = 9;

// Shared realtime whiteboard: drawing AND typing, synced between tutor and
// student over a Supabase Realtime channel, replayed for late joiners.
export function ClassroomBoard({ classId, enabled }: { classId: string; enabled: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const itemsRef = useRef<BoardItem[]>([]);
    const remoteStrokesRef = useRef<Map<string, StrokeItem>>(new Map());
    const drawingRef = useRef<StrokeItem | null>(null);
    const channelRef = useRef<any>(null);
    const [mode, setMode] = useState<'draw' | 'erase' | 'text'>('draw');
    const [color, setColor] = useState(COLORS[0]);
    const [size, setSize] = useState(3);
    const [textEdit, setTextEdit] = useState<{ x: number; y: number; value: string } | null>(null);
    const textInputRef = useRef<HTMLInputElement | null>(null);

    const ctx = () => canvasRef.current?.getContext('2d') ?? null;

    const drawText = (item: TextItem) => {
        const c = ctx();
        const canvas = canvasRef.current;
        if (!c || !canvas) return;
        c.fillStyle = item.color;
        c.font = `${item.size * FONT_SCALE}px Inter, sans-serif`;
        c.textBaseline = 'top';
        item.text.split('\n').forEach((line, i) => {
            c.fillText(line, item.x * canvas.width, (item.y + i * 0.06) * canvas.height);
        });
    };

    const drawSegment = (from: Point, to: Point, strokeColor: string, strokeSize: number, eraseMode: boolean) => {
        const c = ctx();
        if (!c) return;
        const w = canvasRef.current!.width;
        const h = canvasRef.current!.height;
        c.strokeStyle = eraseMode ? '#ffffff' : strokeColor;
        c.lineWidth = eraseMode ? strokeSize * 6 : strokeSize;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(from.x * w, from.y * h);
        c.lineTo(to.x * w, to.y * h);
        c.stroke();
    };

    const redrawAll = useCallback(() => {
        const c = ctx();
        const canvas = canvasRef.current;
        if (!c || !canvas) return;
        c.fillStyle = '#ffffff';
        c.fillRect(0, 0, canvas.width, canvas.height);
        for (const item of itemsRef.current) {
            if (item.kind === 'stroke') {
                for (let i = 1; i < item.points.length; i++) {
                    drawSegment(item.points[i - 1], item.points[i], item.color, item.size, item.erase);
                }
            } else {
                drawText(item);
            }
        }
    }, []);

    // Channel: receive remote strokes, text, state sync
    useEffect(() => {
        if (!enabled) return;
        const channel = supabase.channel(`class-board-${classId}`);
        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'board-clear' }, () => {
                itemsRef.current = [];
                redrawAll();
            })
            .on('broadcast', { event: 'board-state' }, ({ payload }: any) => {
                if (Array.isArray(payload?.items) && itemsRef.current.length === 0) {
                    itemsRef.current = payload.items;
                    redrawAll();
                }
            })
            .on('broadcast', { event: 'board-request' }, () => {
                if (itemsRef.current.length > 0) {
                    channel.send({
                        type: 'broadcast',
                        event: 'board-state',
                        payload: { items: itemsRef.current },
                    });
                }
            })
            .on('broadcast', { event: 'board-point' }, ({ payload }: any) => {
                if (!payload?.id) return;
                let stroke = remoteStrokesRef.current.get(payload.id);
                if (!stroke) {
                    stroke = { id: payload.id, kind: 'stroke', color: payload.color, size: payload.size, erase: payload.erase, points: [] };
                    remoteStrokesRef.current.set(payload.id, stroke);
                }
                const from = stroke.points[stroke.points.length - 1];
                stroke.points.push({ x: payload.x, y: payload.y });
                if (from) drawSegment(from, { x: payload.x, y: payload.y }, stroke.color, stroke.size, stroke.erase);
            })
            .on('broadcast', { event: 'board-stroke-end' }, ({ payload }: any) => {
                const stroke = remoteStrokesRef.current.get(payload?.id);
                if (stroke) {
                    itemsRef.current.push(stroke);
                    remoteStrokesRef.current.delete(payload.id);
                }
            })
            .on('broadcast', { event: 'board-text' }, ({ payload }: any) => {
                if (!payload?.id || !payload.text) return;
                const item: TextItem = { id: payload.id, kind: 'text', x: payload.x, y: payload.y, text: payload.text, color: payload.color, size: payload.size };
                itemsRef.current.push(item);
                drawText(item);
            })
            .subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    redrawAll();
                    channel.send({ type: 'broadcast', event: 'board-request', payload: {} });
                }
            });

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [enabled, classId, redrawAll]);

    // Canvas sizing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !enabled) return;
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            redrawAll();
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [enabled, redrawAll]);

    const pointFromEvent = (e: React.PointerEvent): Point => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
    };

    const onPointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        const p = pointFromEvent(e);

        // Text mode: place an editor where clicked
        if (mode === 'text') {
            setTextEdit({ x: p.x, y: p.y, value: '' });
            setTimeout(() => textInputRef.current?.focus(), 50);
            return;
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        drawingRef.current = { id, kind: 'stroke', color, size, erase: mode === 'erase', points: [p] };
        canvasRef.current?.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        const stroke = drawingRef.current;
        if (!stroke) return;
        const p = pointFromEvent(e);
        const from = stroke.points[stroke.points.length - 1];
        if (from) drawSegment(from, p, stroke.color, stroke.size, stroke.erase);
        stroke.points.push(p);
        channelRef.current?.send({
            type: 'broadcast',
            event: 'board-point',
            payload: { id: stroke.id, x: p.x, y: p.y, color: stroke.color, size: stroke.size, erase: stroke.erase },
        });
    };

    const onPointerUp = () => {
        const stroke = drawingRef.current;
        if (!stroke) return;
        if (stroke.points.length > 0) itemsRef.current.push(stroke);
        drawingRef.current = null;
        channelRef.current?.send({ type: 'broadcast', event: 'board-stroke-end', payload: { id: stroke.id } });
    };

    const commitText = () => {
        if (!textEdit || !textEdit.value.trim()) {
            setTextEdit(null);
            return;
        }
        const item: TextItem = {
            id: `${Date.now()}-t`,
            kind: 'text',
            x: textEdit.x,
            y: textEdit.y,
            text: textEdit.value,
            color,
            size,
        };
        itemsRef.current.push(item);
        drawText(item);
        channelRef.current?.send({
            type: 'broadcast',
            event: 'board-text',
            payload: { id: item.id, x: item.x, y: item.y, text: item.text, color: item.color, size: item.size },
        });
        setTextEdit(null);
    };

    const clearBoard = () => {
        itemsRef.current = [];
        redrawAll();
        channelRef.current?.send({ type: 'broadcast', event: 'board-clear', payload: {} });
    };

    const downloadBoard = () => {
        const url = canvasRef.current?.toDataURL('image/png');
        if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = `sabilearn-board-${classId.slice(0, 8)}.png`;
            a.click();
        }
    };

    const toolButton = (active: boolean) =>
        `p-2.5 rounded-xl transition-all ${active ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`;

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1.5 border border-white/10">
                    <button onClick={() => setMode('draw')} className={toolButton(mode === 'draw')} title="Draw">
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setMode('text')} className={toolButton(mode === 'text')} title="Add text — click the board, then type">
                        <Type className="w-4 h-4" />
                    </button>
                    <button onClick={() => setMode('erase')} className={toolButton(mode === 'erase')} title="Eraser">
                        <Eraser className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                    {COLORS.map((c) => (
                        <button
                            key={c}
                            onClick={() => { setColor(c); setMode(mode === 'erase' ? 'draw' : mode); }}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${color === c && mode !== 'erase' ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            style={{ backgroundColor: c }}
                            aria-label={`Color ${c}`}
                        />
                    ))}
                    <select
                        value={size}
                        onChange={(e) => setSize(Number(e.target.value))}
                        className="bg-transparent text-white text-xs rounded-lg px-1.5 py-1 outline-none border border-white/10"
                        title="Thickness / font size"
                    >
                        {[2, 3, 5, 8, 12].map((s) => <option key={s} value={s} className="text-gray-900">{s}px</option>)}
                    </select>
                </div>

                <div className="flex-1" />
                <button
                    onClick={downloadBoard}
                    className="flex items-center gap-1.5 text-xs bg-white/10 text-gray-300 hover:bg-white/20 px-3 py-2 rounded-xl transition-colors"
                >
                    <Download className="w-3.5 h-3.5" /> Save PNG
                </button>
                <button
                    onClick={clearBoard}
                    className="flex items-center gap-1.5 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 px-3 py-2 rounded-xl transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
            </div>

            {/* Canvas with text editor overlay */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white shadow-inner">
                <canvas
                    ref={canvasRef}
                    className={`w-full aspect-[4/3] touch-none block ${mode === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
                    style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                />
                {textEdit && (
                    <textarea
                        ref={textInputRef as any}
                        value={textEdit.value}
                        onChange={(e) => setTextEdit((t) => (t ? { ...t, value: e.target.value } : t))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(); }
                            if (e.key === 'Escape') setTextEdit(null);
                        }}
                        placeholder="Type, then press Enter…"
                        rows={2}
                        style={{
                            position: 'absolute',
                            left: `${textEdit.x * 100}%`,
                            top: `${textEdit.y * 100}%`,
                            color,
                            fontSize: `${size * FONT_SCALE}px`,
                            fontFamily: 'Inter, sans-serif',
                            minWidth: '160px',
                        }}
                        className="bg-white/95 border-2 border-green-500 rounded-lg px-2 py-1 outline-none resize-none shadow-lg"
                    />
                )}
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
                Shared board — the tutor and student see every stroke and note instantly. Use the T (text) tool to type anywhere; Enter saves, Esc cancels.
            </p>
        </div>
    );
}
