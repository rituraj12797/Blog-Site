'use client';

import React, { useState, useEffect, useRef } from 'react';

type OpType = 'insert' | 'update' | 'delete';

interface QueryItem {
    id: number;
    text: string;
    op: OpType;
}

interface TableEntry {
    k: number;
    v: string;
    op: OpType;
    id: string;
}

interface Frame {
    query?: QueryItem;
    memTable: TableEntry[];
    level0: TableEntry[][];
    level1: TableEntry[];
    highlightKey?: number;
    mergeBuffer?: TableEntry[];
    isCompacting?: boolean;
    compactionStatus?: string;
    discardedIds: string[];
}

const QUERIES: QueryItem[] = [
    { id: 1, text: 'INSERT K:1 V:4', op: 'insert' },
    { id: 2, text: 'INSERT K:2 V:5', op: 'insert' },
    { id: 3, text: 'INSERT K:3 V:6', op: 'insert' },
    { id: 4, text: 'UPDATE K:1 V:7', op: 'update' },
    { id: 5, text: 'UPDATE K:2 V:8', op: 'update' },
    { id: 6, text: 'UPDATE K:3 V:9', op: 'update' },
    { id: 7, text: 'UPDATE K:1 V:10', op: 'update' },
    { id: 8, text: 'DELETE K:2', op: 'delete' },
    { id: 9, text: 'DELETE K:3', op: 'delete' },
];

const L0_FULL: TableEntry[][] = [
    [
        { k: 1, v: '4', op: 'insert', id: 's1-1' },
        { k: 2, v: '5', op: 'insert', id: 's1-2' },
        { k: 3, v: '6', op: 'insert', id: 's1-3' },
    ],
    [
        { k: 1, v: '7', op: 'update', id: 's2-1' },
        { k: 2, v: '8', op: 'update', id: 's2-2' },
        { k: 3, v: '9', op: 'update', id: 's2-3' },
    ],
    [
        { k: 1, v: '10', op: 'update', id: 's3-1' },
        { k: 2, v: 'DEL', op: 'delete', id: 's3-2' },
        { k: 3, v: 'DEL', op: 'delete', id: 's3-3' },
    ],
];

const FRAMES: Frame[] = [
    // 1. Initial State
    { memTable: [], level0: [], level1: [], discardedIds: [] },

    // Batch 1: Inserts
    {
        query: QUERIES[0],
        memTable: [{ k: 1, v: '4', op: 'insert', id: 's1-1' }],
        level0: [],
        level1: [],
        discardedIds: [],
    },
    {
        query: QUERIES[1],
        memTable: [
            { k: 1, v: '4', op: 'insert', id: 's1-1' },
            { k: 2, v: '5', op: 'insert', id: 's1-2' },
        ],
        level0: [],
        level1: [],
        discardedIds: [],
    },
    {
        query: QUERIES[2],
        memTable: [
            { k: 1, v: '4', op: 'insert', id: 's1-1' },
            { k: 2, v: '5', op: 'insert', id: 's1-2' },
            { k: 3, v: '6', op: 'insert', id: 's1-3' },
        ],
        level0: [],
        level1: [],
        discardedIds: [],
    },
    // Flush 1 -> SST #1 in L0
    {
        memTable: [],
        level0: [L0_FULL[0]],
        level1: [],
        discardedIds: [],
    },

    // Batch 2: Updates
    {
        query: QUERIES[3],
        memTable: [{ k: 1, v: '7', op: 'update', id: 's2-1' }],
        level0: [L0_FULL[0]],
        level1: [],
        discardedIds: [],
    },
    {
        query: QUERIES[4],
        memTable: [
            { k: 1, v: '7', op: 'update', id: 's2-1' },
            { k: 2, v: '8', op: 'update', id: 's2-2' },
        ],
        level0: [L0_FULL[0]],
        level1: [],
        discardedIds: [],
    },
    {
        query: QUERIES[5],
        memTable: [
            { k: 1, v: '7', op: 'update', id: 's2-1' },
            { k: 2, v: '8', op: 'update', id: 's2-2' },
            { k: 3, v: '9', op: 'update', id: 's2-3' },
        ],
        level0: [L0_FULL[0]],
        level1: [],
        discardedIds: [],
    },
    // Flush 2 -> SST #2 in L0
    {
        memTable: [],
        level0: [L0_FULL[0], L0_FULL[1]],
        level1: [],
        discardedIds: [],
    },

    // Batch 3: Updates & Deletes
    {
        query: QUERIES[6],
        memTable: [{ k: 1, v: '10', op: 'update', id: 's3-1' }],
        level0: [L0_FULL[0], L0_FULL[1]],
        level1: [],
        discardedIds: [],
    },
    {
        query: QUERIES[7],
        memTable: [
            { k: 1, v: '10', op: 'update', id: 's3-1' },
            { k: 2, v: 'DEL', op: 'delete', id: 's3-2' },
        ],
        level0: [L0_FULL[0], L0_FULL[1]],
        level1: [],
        discardedIds: [],
    },
    {
        query: QUERIES[8],
        memTable: [
            { k: 1, v: '10', op: 'update', id: 's3-1' },
            { k: 2, v: 'DEL', op: 'delete', id: 's3-2' },
            { k: 3, v: 'DEL', op: 'delete', id: 's3-3' },
        ],
        level0: [L0_FULL[0], L0_FULL[1]],
        level1: [],
        discardedIds: [],
    },
    // Flush 3 -> All 3 SSTables now in L0
    {
        memTable: [],
        level0: L0_FULL,
        level1: [],
        discardedIds: [],
    },

    // --- MERGE SORT 1: Key 1 ---
    {
        memTable: [],
        level0: L0_FULL,
        level1: [],
        isCompacting: true,
        highlightKey: 1,
        mergeBuffer: [{ k: 1, v: '10', op: 'update', id: 'b-1' }],
        compactionStatus: 'Evaluating Key 1: Retained latest state (1:10), discarding stale versions.',
        discardedIds: ['s1-1', 's2-1'],
    },

    // --- MERGE SORT 2: Key 2 ---
    {
        memTable: [],
        level0: L0_FULL,
        level1: [],
        isCompacting: true,
        highlightKey: 2,
        mergeBuffer: [{ k: 1, v: '10', op: 'update', id: 'b-1' }],
        compactionStatus: 'Evaluating Key 2: Latest state is Tombstone (DEL), discarding entry.',
        discardedIds: ['s1-1', 's2-1', 's1-2', 's2-2', 's3-2'],
    },

    // --- MERGE SORT 3: Key 3 ---
    {
        memTable: [],
        level0: L0_FULL,
        level1: [],
        isCompacting: true,
        highlightKey: 3,
        mergeBuffer: [{ k: 1, v: '10', op: 'update', id: 'b-1' }],
        compactionStatus: 'Evaluating Key 3: Latest state is Tombstone (DEL), discarding entry.',
        discardedIds: ['s1-1', 's2-1', 's1-2', 's2-2', 's3-2', 's1-3', 's2-3', 's3-3'],
    },

    // --- MERGE SORT COMPLETE: Transition into Level 1 ---
    {
        memTable: [],
        level0: [],
        level1: [{ k: 1, v: '10', op: 'update', id: 'l1-final' }],
        isCompacting: false,
        discardedIds: [],
    },
];

// Sped up all intervals by 1.5x (e.g. 1800ms -> 1200ms)
const SPEED_OPTIONS = [
    { label: '0.5x', interval: 2133 },
    { label: '1x', interval: 1200 },
    { label: '2x', interval: 600 },
];

export default function CompactionAnimation() {
    const [frameIdx, setFrameIdx] = useState(0);
    const [speedIdx, setSpeedIdx] = useState(1);
    const [executedQueries, setExecutedQueries] = useState<QueryItem[]>([]);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setFrameIdx((prev) => {
                const next = (prev + 1) % FRAMES.length;
                if (next === 0) {
                    setExecutedQueries([]);
                }
                return next;
            });
        }, SPEED_OPTIONS[speedIdx].interval);

        return () => clearInterval(timer);
    }, [speedIdx]);

    useEffect(() => {
        const q = FRAMES[frameIdx].query;
        if (q) {
            setExecutedQueries((prev) => {
                if (prev.some((item) => item.id === q.id)) return prev;
                return [...prev, q];
            });
        }
    }, [frameIdx]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [executedQueries]);

    const frame = FRAMES[frameIdx];

    const getEntryBadge = (entry: TableEntry, isDiscarded: boolean, isHighlighted: boolean) => {
        if (isDiscarded) {
            return 'opacity-20 line-through border-gray-300 dark:border-gray-800 bg-transparent text-gray-500';
        }
        if (isHighlighted) {
            return 'border-primary-500 ring-2 ring-primary-500/50 bg-primary-500/20 text-primary-400 font-bold scale-105';
        }
        if (entry.op === 'delete' || entry.v === 'DEL') {
            return 'border-red-500/80 bg-red-500/10 text-red-500 font-bold';
        }
        if (entry.op === 'update') {
            return 'border-amber-500/80 bg-amber-500/10 text-amber-500 font-bold';
        }
        return 'border-emerald-500/80 bg-emerald-500/10 text-emerald-500 font-bold';
    };

    return (
        <div className="mx-auto w-full max-w-6xl p-6 bg-transparent text-black dark:text-white font-sans transition-colors duration-300">
            {/* Header & Speed Controls */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="h-5">
                        {frame.compactionStatus && (
                            <p className="text-xs text-primary-500 dark:text-primary-400 font-mono font-bold">
                                → {frame.compactionStatus}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg p-1">
                    {SPEED_OPTIONS.map((opt, i) => (
                        <button
                            key={opt.label}
                            onClick={() => setSpeedIdx(i)}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${speedIdx === i
                                ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                                : 'text-gray-500 hover:text-black dark:hover:text-white'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Grid: Architecture on left, Query Stream on right */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Core Architecture */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* MEMTABLE */}
                    <div className="relative border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 transition-colors duration-300">
                        <span className="absolute -top-3 left-4 bg-white dark:bg-black px-2 text-gray-400 dark:text-gray-500 tracking-wider text-xs font-bold uppercase">
                            MEMTABLE
                        </span>

                        <div className="flex items-center gap-3 min-h-[50px]">
                            {frame.memTable.map((entry) => (
                                <div
                                    key={entry.id}
                                    className={`flex items-center px-4 py-2 border rounded-md text-base font-mono transition-all duration-300 ${getEntryBadge(
                                        entry,
                                        false,
                                        false
                                    )}`}
                                >
                                    <span>
                                        {entry.k} : {entry.v}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECONDARY MEMORY (DISK) - Fixed Height */}
                    <div className="relative h-[360px] border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between transition-colors duration-300">
                        <span className="absolute -top-3 left-4 bg-white dark:bg-black px-2 text-gray-400 dark:text-gray-500 tracking-wider text-xs font-bold uppercase">
                            SECONDARY MEMORY (DISK)
                        </span>

                        {/* LEVEL 0 */}
                        <div>
                            <div className="text-sm font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-2">
                                LEVEL 0
                            </div>

                            <div className="flex flex-row items-center gap-3 h-[74px]">
                                {frame.level0.map((sst, sstIdx) => (
                                    <div
                                        key={sstIdx}
                                        className="flex-1 min-w-[200px] flex flex-col border border-gray-300 dark:border-gray-800 rounded-lg p-2 bg-gray-50 dark:bg-black transition-all duration-300"
                                    >
                                        <div className="text-[10px] font-mono text-gray-400 mb-1 uppercase font-bold">
                                            SST #{sstIdx + 1}
                                        </div>
                                        <div className="flex gap-1.5">
                                            {sst.map((entry) => {
                                                const isDiscarded = frame.discardedIds.includes(entry.id);
                                                const isHighlighted = frame.highlightKey === entry.k && !isDiscarded;

                                                return (
                                                    <div
                                                        key={entry.id}
                                                        className={`flex-1 flex items-center justify-center py-1.5 px-1 border rounded text-xs font-mono transition-all duration-300 ${getEntryBadge(
                                                            entry,
                                                            isDiscarded,
                                                            isHighlighted
                                                        )}`}
                                                    >
                                                        <span>
                                                            {entry.k} : {entry.v}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* IN-PROGRESS MERGE BUFFER SLOT */}
                        <div className="h-[74px] flex items-center">
                            <div
                                className={`w-full border border-dashed border-primary-500/80 rounded-lg px-4 py-2 bg-primary-500/5 transition-all duration-500 flex flex-col justify-center ${frame.mergeBuffer
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-95 pointer-events-none'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-primary-500">
                                        MERGE BUFFER (IN-PROGRESS)
                                    </span>
                                    <span className="text-[9px] font-mono text-gray-400">
                                        Scanning Key: {frame.highlightKey ?? ''}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2 items-center">
                                        {(frame.mergeBuffer || []).map((entry) => (
                                            <div
                                                key={entry.id}
                                                className="flex items-center px-3 py-1 border border-primary-500 rounded text-xs font-mono font-bold bg-white dark:bg-black text-black dark:text-white shadow-sm"
                                            >
                                                <span>
                                                    {entry.k} : {entry.v}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Blinking Compaction Going On text */}
                                    <span className="animate-[pulse_1.5s_ease-in-out_infinite] text-[10px] font-mono font-bold uppercase tracking-wider text-primary-500 bg-primary-500/10 border border-primary-500/30 px-2 py-0.5 rounded">
                                        COMPACTION GOING ON...
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* LEVEL 1 */}
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400">
                                    LEVEL 1
                                </span>
                                {frame.isCompacting && (
                                    <span className="animate-[pulse_2s_ease-in-out_infinite] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary-500 bg-primary-500/10 border border-primary-500/30 rounded">
                                        COMPACTION IN PROGRESS...
                                    </span>
                                )}
                            </div>

                            <div className="h-[68px] flex items-center">
                                <div
                                    className={`flex flex-col border border-primary-500 rounded-lg p-2.5 bg-primary-50/20 dark:bg-primary-950/20 transition-all duration-700 ease-out ${frame.level1.length > 0
                                        ? 'opacity-100 translate-y-0 scale-100'
                                        : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                                        }`}
                                >
                                    <div className="text-[10px] font-mono text-primary-500 mb-1 uppercase font-bold">
                                        RESOLVED SSTABLE
                                    </div>
                                    <div className="flex gap-2">
                                        {(frame.level1.length > 0
                                            ? frame.level1
                                            : [{ k: 1, v: '10', op: 'update' as OpType, id: 'placeholder' }]
                                        ).map((entry) => (
                                            <div
                                                key={entry.id}
                                                className="flex items-center px-4 py-1.5 border border-primary-500 rounded text-sm font-mono font-bold bg-white dark:bg-black text-black dark:text-white"
                                            >
                                                <span>
                                                    {entry.k} : {entry.v}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Query Stream Log Panel */}
                <div className="lg:col-span-1 border border-gray-300 dark:border-gray-800 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-950/20 flex flex-col h-[468px]">
                    <div className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 pb-3 border-b border-gray-200 dark:border-gray-800">
                        QUERY STREAM
                    </div>

                    <div
                        ref={logContainerRef}
                        className="flex-1 overflow-y-auto flex flex-col gap-2 pt-3 font-mono text-xs no-scrollbar"
                    >
                        {executedQueries.map((q) => (
                            <div
                                key={q.id}
                                className={`px-2.5 py-1.5 rounded border transition-all duration-300 ${q.op === 'delete'
                                    ? 'border-red-500/50 bg-red-500/10 text-red-500'
                                    : q.op === 'update'
                                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
                                        : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500'
                                    }`}
                            >
                                {q.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}