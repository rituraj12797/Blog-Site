'use client';

import React, { useState, useRef } from 'react';

const BLOOM_SIZE = 16;
const hash = (key: number) => Math.abs(Math.imul(key, 2654435761) >>> 28) % BLOOM_SIZE;

const createBloom = (data: number[]) => {
    const b = Array(BLOOM_SIZE).fill(0);
    data.forEach((k) => (b[hash(k)] = 1));
    return b;
};

interface SSTableData {
    id: string;
    name: string;
    data: number[];
    bloom: number[];
}

// 8 entries in Memtable (Direct O(log N) RAM index lookup)
const MOCK_MEMTABLE = [92, 93, 94, 95, 96, 97, 98, 99];

const MOCK_LEVELS: SSTableData[][] = [
    // Level 0 (5 entries each)
    [
        { id: 'sst-l0-1', name: 'SST #1', data: [80, 82, 84, 86, 88], bloom: createBloom([80, 82, 84, 86, 88]) },
        { id: 'sst-l0-2', name: 'SST #2', data: [85, 87, 89, 90, 91], bloom: createBloom([85, 87, 89, 90, 91]) },
    ],
    // Level 1 (7 entries each)
    [
        { id: 'sst-l1-1', name: 'SST #3', data: [50, 52, 54, 56, 58, 60, 62], bloom: createBloom([50, 52, 54, 56, 58, 60, 62]) },
        { id: 'sst-l1-2', name: 'SST #4', data: [30, 32, 34, 36, 38, 40, 42], bloom: createBloom([30, 32, 34, 36, 38, 40, 42]) },
    ],
];

// Speed multipliers (Base default slowed down by an extra 0.5x)
const SPEED_CONFIG: Record<string, number> = {
    '0.5x': 2.0,
    '1x': 1.0,
    '2x': 0.5,
};

export default function LSMTreeReadVisualizer() {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState(false);
    const [speed, setSpeed] = useState<'0.5x' | '1x' | '2x'>('1x');

    // Ref keeps track of the active speed multiplier dynamically during async sleep
    const speedRef = useRef<number>(SPEED_CONFIG['1x']);

    const handleSpeedChange = (newSpeed: '0.5x' | '1x' | '2x') => {
        setSpeed(newSpeed);
        speedRef.current = SPEED_CONFIG[newSpeed];
    };

    // Base sleep multiplier: slowed by an additional 1.5x factor by default
    const sleep = (baseMs: number) =>
        new Promise((resolve) => setTimeout(resolve, baseMs * 1.5 * speedRef.current));

    // Animation states
    const [activeContainer, setActiveContainer] = useState<string | null>(null);
    const [activeSubstep, setActiveSubstep] = useState<'footer' | 'bloom' | 'index' | 'data' | null>(null);
    const [bloomFailedContainer, setBloomFailedContainer] = useState<string | null>(null);
    const [traversedContainers, setTraversedContainers] = useState<string[]>([]);
    const [statusText, setStatusText] = useState<string>('');

    // Result states
    const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(null);
    const [foundData, setFoundData] = useState<{ container: string; key: number } | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const key = parseInt(searchQuery, 10);
        if (isNaN(key)) return;

        // Reset UI
        setIsSearching(true);
        setSearchResult(null);
        setFoundData(null);
        setTraversedContainers([]);
        setBloomFailedContainer(null);

        const currentHash = hash(key);

        // ----------------------------------------------------
        // MEMTABLE SEARCH (Direct in-memory index scan)
        // ----------------------------------------------------
        setActiveContainer('memtable');
        setActiveSubstep('data');
        setStatusText('RAM: Searching Memtable directly (in-memory lookup)...');
        await sleep(450);

        if (MOCK_MEMTABLE.includes(key)) {
            setSearchResult('found');
            setFoundData({ container: 'memtable', key });
            setStatusText(`Found key ${key} in Memtable!`);
            setIsSearching(false);
            return;
        }

        setStatusText('RAM: Key not found in Memtable. Probing Disk SSTables...');
        await sleep(350);
        setTraversedContainers((prev) => [...prev, 'memtable']);
        setActiveSubstep(null);

        // ----------------------------------------------------
        // SECONDARY MEMORY (SSTABLE LEVEL BY LEVEL)
        // ----------------------------------------------------
        for (let l = 0; l < MOCK_LEVELS.length; l++) {
            for (const sst of MOCK_LEVELS[l]) {
                setActiveContainer(sst.id);

                // 1. Read Footer (Meta Data)
                setActiveSubstep('footer');
                setStatusText(`Disk (${sst.name}): Reading Meta Data footer...`);
                await sleep(350);

                // 2. Check Bloom Filter
                setActiveSubstep('bloom');
                setStatusText(`Disk (${sst.name}): Checking Bloom Filter...`);
                await sleep(350);

                if (sst.bloom[currentHash] === 0) {
                    setBloomFailedContainer(sst.id);
                    setStatusText(`Disk (${sst.name}): Bloom miss (key absent). Skipping table.`);
                    await sleep(400);
                    setTraversedContainers((prev) => [...prev, sst.id]);
                    setActiveSubstep(null);
                    continue;
                }

                // 3. Sparse Index Lookup
                setActiveSubstep('index');
                setStatusText(`Disk (${sst.name}): Bloom hit. Querying Sparse Index...`);
                await sleep(350);

                // 4 & 5. Load Data Page & Scan
                setActiveSubstep('data');
                setStatusText(`Disk (${sst.name}): Scanning Data Sequence...`);
                await sleep(400);

                if (sst.data.includes(key)) {
                    setSearchResult('found');
                    setFoundData({ container: sst.id, key });
                    setStatusText(`Found key ${key} in ${sst.name}!`);
                    setIsSearching(false);
                    return;
                }

                setTraversedContainers((prev) => [...prev, sst.id]);
                setActiveSubstep(null);
            }
        }

        // Not found anywhere
        setActiveContainer(null);
        setActiveSubstep(null);
        setSearchResult('not-found');
        setStatusText(`Key ${key} does not exist in the database.`);
        setIsSearching(false);
    };

    return (
        <div className="relative flex flex-col gap-8 py-8 w-full max-w-5xl mx-auto bg-transparent font-sans text-black dark:text-white transition-colors duration-300">

            {/* Top Header Row with Speed Selection on Top-Right */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold uppercase tracking-widest text-black dark:text-white">
                        LSM Read Path
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                        Hierarchical Key Lookup Flow
                    </p>
                </div>

                {/* Speed Controls */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg p-1 shadow-sm">
                    {(['0.5x', '1x', '2x'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => handleSpeedChange(s)}
                            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${speed === s
                                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm'
                                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Input Bar */}
            <div className="flex flex-col items-center gap-3">
                <form onSubmit={handleSearch} className="flex items-center gap-4 w-full max-w-lg">
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                        {searchResult === 'found' && (
                            <svg className="w-9 h-9 text-green-500 animate-in zoom-in duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {searchResult === 'not-found' && (
                            <svg className="w-9 h-9 text-red-500 animate-in zoom-in duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>

                    <input
                        type="number"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={isSearching}
                        placeholder="Enter key (e.g. 95, 88, 56, 999)"
                        className="flex-1 px-5 py-2.5 rounded-full border-2 border-gray-300 dark:border-gray-800 bg-white dark:bg-black focus:outline-none focus:border-[#001f7a] dark:focus:border-white transition-colors text-base font-mono"
                    />
                    <button
                        type="submit"
                        disabled={isSearching || !searchQuery}
                        className={`px-7 py-2.5 rounded-full font-bold text-base shadow-md transition-all duration-300 active:scale-95 ${isSearching || !searchQuery
                                ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90 cursor-pointer'
                            }`}
                    >
                        Search
                    </button>
                </form>

                <div className="h-6 text-center">
                    {statusText && (
                        <span className="text-sm font-mono font-bold text-primary-500 dark:text-primary-400">
                            → {statusText}
                        </span>
                    )}
                </div>
            </div>

            {/* Memory (RAM) */}
            <div
                className={`relative p-6 border-2 border-dashed rounded-2xl transition-all duration-300 flex justify-center ${activeContainer === 'memtable'
                        ? 'border-gray-800 dark:border-gray-200 bg-gray-50/50 dark:bg-gray-950/20'
                        : 'border-gray-300 dark:border-gray-800'
                    }`}
            >
                <span className="absolute -top-3 left-4 px-2 bg-white dark:bg-black text-xs font-bold uppercase tracking-widest text-gray-500">
                    Memory (RAM)
                </span>

                <div
                    className={`relative px-7 py-5 border-2 rounded-xl transition-all duration-300 flex flex-col items-center gap-3 ${traversedContainers.includes('memtable')
                            ? 'border-gray-300 dark:border-gray-800 opacity-40'
                            : activeContainer === 'memtable'
                                ? 'border-black dark:border-white bg-white dark:bg-black shadow-lg scale-[1.01]'
                                : 'border-gray-300 dark:border-gray-800 bg-transparent'
                        }`}
                >
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-white dark:bg-black text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300">
                        Memtable
                    </span>

                    {/* 8 sorted items in Memtable */}
                    <div
                        className={`flex flex-wrap gap-2 p-2 rounded-lg transition-all duration-300 ${activeContainer === 'memtable' && activeSubstep === 'data'
                                ? 'bg-primary-50/50 dark:bg-primary-950/20 ring-2 ring-primary-500/50'
                                : ''
                            }`}
                    >
                        {MOCK_MEMTABLE.map((val) => {
                            const isFound = foundData?.container === 'memtable' && val === foundData.key;
                            return (
                                <div
                                    key={val}
                                    className={`w-11 h-11 rounded-lg flex items-center justify-center font-mono text-sm font-bold transition-all duration-300 border ${isFound
                                            ? 'bg-green-500 border-green-600 text-white scale-110 shadow-lg z-10'
                                            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-black dark:text-white'
                                        }`}
                                >
                                    {val}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Secondary Memory (Disk) */}
            <div
                className={`relative p-6 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col gap-6 ${activeContainer && activeContainer !== 'memtable'
                        ? 'border-gray-800 dark:border-gray-200 bg-gray-50/50 dark:bg-gray-950/20'
                        : 'border-gray-300 dark:border-gray-800'
                    }`}
            >
                <span className="absolute -top-3 left-4 px-2 bg-white dark:bg-black text-xs font-bold uppercase tracking-widest text-gray-500">
                    Secondary Memory (Disk)
                </span>

                {MOCK_LEVELS.map((levelTables, levelIndex) => (
                    <div key={`level-${levelIndex}`} className="flex flex-col gap-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200 dark:border-gray-800 pb-1">
                            Level {levelIndex}
                        </span>

                        <div className="flex flex-col md:flex-row gap-4 items-stretch">
                            {levelTables.map((sst) => {
                                const isCurrent = activeContainer === sst.id;
                                const isTraversed = traversedContainers.includes(sst.id);
                                const isBloomMiss = bloomFailedContainer === sst.id;

                                return (
                                    <div
                                        key={sst.id}
                                        className={`flex-1 flex flex-col border-2 rounded-xl overflow-hidden transition-all duration-300 ${isTraversed
                                                ? 'border-gray-300 dark:border-gray-800 opacity-40 grayscale-[40%]'
                                                : isCurrent
                                                    ? 'border-black dark:border-white shadow-lg'
                                                    : 'border-gray-300 dark:border-gray-800 bg-transparent'
                                            }`}
                                    >
                                        {/* TOP ROW: Height H with 3 horizontal components (w + w + 8w) */}
                                        <div className="flex flex-row gap-2.5 p-3 h-20 items-center">

                                            {/* 1. Bloom Filter (width: w) */}
                                            <div
                                                className={`flex-[1] h-full rounded-lg border flex items-center justify-center p-1.5 text-center transition-all duration-300 ${isCurrent && activeSubstep === 'bloom'
                                                        ? isBloomMiss
                                                            ? 'border-red-500 bg-red-500/10 text-red-500 font-bold ring-2 ring-red-500/50'
                                                            : 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-500 font-bold ring-2 ring-primary-500/50 scale-105'
                                                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black text-gray-400'
                                                    }`}
                                            >
                                                <span className="text-[11px] font-bold uppercase font-mono leading-tight">
                                                    Bloom
                                                </span>
                                            </div>

                                            {/* 2. Sparse Index Table (width: w) */}
                                            <div
                                                className={`flex-[1] h-full rounded-lg border flex items-center justify-center p-1.5 text-center transition-all duration-300 ${isCurrent && activeSubstep === 'index'
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-500 font-bold ring-2 ring-primary-500/50 scale-105'
                                                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black text-gray-400'
                                                    }`}
                                            >
                                                <span className="text-[11px] font-bold uppercase font-mono leading-tight">
                                                    Index
                                                </span>
                                            </div>

                                            {/* 3. Data Sequence (width: 8w, 5 items in L0 / 7 items in L1) */}
                                            <div
                                                className={`flex-[8] h-full rounded-lg border flex items-center px-3 gap-2 overflow-x-auto no-scrollbar transition-all duration-300 ${isCurrent && activeSubstep === 'data'
                                                        ? 'border-primary-500/80 bg-primary-50/20 dark:bg-primary-950/20 ring-2 ring-primary-500/50'
                                                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-black'
                                                    }`}
                                            >
                                                {sst.data.map((val) => {
                                                    const isFound = foundData?.container === sst.id && val === foundData.key;
                                                    return (
                                                        <div
                                                            key={val}
                                                            className={`flex-1 min-w-[52px] h-11 flex items-center justify-center rounded-md border text-sm font-mono font-bold transition-all duration-300 ${isFound
                                                                    ? 'bg-green-500 border-green-600 text-white scale-110 shadow-lg z-10'
                                                                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-black dark:text-white'
                                                                }`}
                                                        >
                                                            <span>K:{val}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                        </div>

                                        {/* BOTTOM ROW: Clean Meta Data Footer */}
                                        <div
                                            className={`h-7 border-t flex items-center justify-center px-4 transition-all duration-300 ${isCurrent && activeSubstep === 'footer'
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-bold'
                                                    : 'border-gray-200 dark:border-gray-800 bg-gray-100/60 dark:bg-gray-950 text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            <span className="text-xs font-mono font-bold uppercase tracking-widest">
                                                Meta Data Footer
                                            </span>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

            </div>

        </div>
    );
}