'use client';

import React, { useState } from 'react';

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

const MOCK_MEMTABLE = [92, 93, 94, 95, 96, 97, 98, 99];
const MEMTABLE_BLOOM = createBloom(MOCK_MEMTABLE);

const MOCK_LEVELS: SSTableData[][] = [
    // Level 0 (5 sorted entries)
    [
        { id: 'sst-l0-1', name: 'SST #1', data: [80, 82, 84, 86, 88], bloom: createBloom([80, 82, 84, 86, 88]) },
        { id: 'sst-l0-2', name: 'SST #2', data: [85, 87, 89, 90, 91], bloom: createBloom([85, 87, 89, 90, 91]) },
    ],
    // Level 1 (7 sorted entries)
    [
        { id: 'sst-l1-1', name: 'SST #3', data: [50, 52, 54, 56, 58, 60, 62], bloom: createBloom([50, 52, 54, 56, 58, 60, 62]) },
        { id: 'sst-l1-2', name: 'SST #4', data: [30, 32, 34, 36, 38, 40, 42], bloom: createBloom([30, 32, 34, 36, 38, 40, 42]) },
    ],
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LSMTreeReadVisualizer() {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState(false);

    // Animation states
    const [activeContainer, setActiveContainer] = useState<string | null>(null);
    const [activeSubstep, setActiveSubstep] = useState<'footer' | 'load_meta' | 'check_bloom' | 'check_index' | 'load_page' | 'scan_page' | null>(null);
    const [bloomFailed, setBloomFailed] = useState<boolean>(false);
    const [traversedContainers, setTraversedContainers] = useState<string[]>([]);
    const [statusText, setStatusText] = useState<string>('');

    // Primary Memory Staging Buffer State
    const [ramLoadedMeta, setRamLoadedMeta] = useState<{ sstName: string } | null>(null);
    const [ramLoadedPage, setRamLoadedPage] = useState<number[]>([]);

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
        setBloomFailed(false);
        setRamLoadedMeta(null);
        setRamLoadedPage([]);

        const currentHash = hash(key);

        // ----------------------------------------------------
        // STEP 1: MEMTABLE SEARCH (IN-MEMORY RAM)
        // ----------------------------------------------------
        setActiveContainer('memtable');
        setActiveSubstep('check_bloom');
        setStatusText('RAM: Checking Memtable Bloom Filter...');
        await sleep(400);

        if (MEMTABLE_BLOOM[currentHash] === 1) {
            setActiveSubstep('scan_page');
            setStatusText('RAM: Bloom hit. Scanning Memtable...');
            await sleep(400);

            if (MOCK_MEMTABLE.includes(key)) {
                setSearchResult('found');
                setFoundData({ container: 'memtable', key });
                setStatusText(`Found key ${key} in Memtable!`);
                setIsSearching(false);
                return;
            }
        } else {
            setStatusText('RAM: Bloom miss. Key not in Memtable.');
            await sleep(300);
        }

        setTraversedContainers((prev) => [...prev, 'memtable']);
        setActiveSubstep(null);

        // ----------------------------------------------------
        // STEP 2: SECONDARY MEMORY (SSTABLES VIA RAM BUFFER)
        // ----------------------------------------------------
        for (let l = 0; l < MOCK_LEVELS.length; l++) {
            for (const sst of MOCK_LEVELS[l]) {
                setActiveContainer(sst.id);
                setBloomFailed(false);
                setRamLoadedMeta(null);
                setRamLoadedPage([]);

                // 1. Read Footer
                setActiveSubstep('footer');
                setStatusText(`Disk (${sst.name}): Step 1 - Reading Meta Data footer...`);
                await sleep(350);

                // 2. Load Bloom Filter & Sparse Index into RAM
                setActiveSubstep('load_meta');
                setRamLoadedMeta({ sstName: sst.name });
                setStatusText(`RAM Cache: Step 2 - Loaded ${sst.name} Bloom Filter & Sparse Index into RAM!`);
                await sleep(450);

                // 3. Check Bloom Filter in RAM
                setActiveSubstep('check_bloom');
                setStatusText(`RAM Cache: Probing Bloom Filter for key ${key}...`);
                await sleep(400);

                if (sst.bloom[currentHash] === 0) {
                    setBloomFailed(true);
                    setStatusText(`RAM Cache: Bloom negative! Key certainly absent. Evicting from RAM...`);
                    await sleep(500);
                    setTraversedContainers((prev) => [...prev, sst.id]);
                    setRamLoadedMeta(null);
                    setActiveSubstep(null);
                    continue;
                }

                // 4. Query Sparse Index in RAM
                setActiveSubstep('check_index');
                setStatusText(`RAM Cache: Step 3 - Bloom hit! Sparse Index narrowed page range.`);
                await sleep(450);

                // 5. Pull only 2 neighbouring keys into RAM
                setActiveSubstep('load_page');
                let sliceIdx = sst.data.findIndex((k) => k >= key);
                if (sliceIdx === -1) sliceIdx = sst.data.length - 2;
                else if (sliceIdx > sst.data.length - 2) sliceIdx = sst.data.length - 2;
                if (sliceIdx < 0) sliceIdx = 0;

                const targetSlice = sst.data.slice(sliceIdx, sliceIdx + 2);
                setRamLoadedPage(targetSlice);
                setStatusText(`RAM Cache: Step 4 - Pulled target 2-key slice [${targetSlice.join(', ')}] from Disk!`);
                await sleep(550);

                // 6. Scan page in RAM
                setActiveSubstep('scan_page');
                setStatusText(`RAM Cache: Step 5 - Scanning memory slice...`);
                await sleep(400);

                if (targetSlice.includes(key)) {
                    setSearchResult('found');
                    setFoundData({ container: sst.id, key });
                    setStatusText(`Success: Found key ${key} in ${sst.name}!`);
                    setIsSearching(false);
                    return;
                }

                // Clean up RAM slot for next iteration
                await sleep(350);
                setTraversedContainers((prev) => [...prev, sst.id]);
                setRamLoadedMeta(null);
                setRamLoadedPage([]);
                setActiveSubstep(null);
            }
        }

        // Finished without finding
        setActiveContainer(null);
        setActiveSubstep(null);
        setRamLoadedMeta(null);
        setRamLoadedPage([]);
        setSearchResult('not-found');
        setStatusText(`Key ${key} does not exist in database.`);
        setIsSearching(false);
    };

    return (
        <div className="relative flex flex-col gap-8 py-8 w-full max-w-6xl mx-auto bg-transparent font-sans text-black dark:text-white transition-colors duration-300">

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
                        placeholder="Enter key (e.g. 95, 84, 56, 999)"
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

            {/* PRIMARY MEMORY (RAM): Memtable + RAM Staging Slot */}
            <div className="relative p-6 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl flex flex-col gap-4">
                <span className="absolute -top-3 left-4 px-2 bg-white dark:bg-black text-xs font-bold uppercase tracking-widest text-gray-500">
                    Primary Memory (RAM)
                </span>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

                    {/* 1. Memtable (7 cols) */}
                    <div
                        className={`lg:col-span-7 relative p-4 border-2 rounded-xl transition-all duration-300 flex flex-col justify-between ${traversedContainers.includes('memtable')
                                ? 'border-gray-300 dark:border-gray-800 opacity-40'
                                : activeContainer === 'memtable'
                                    ? 'border-black dark:border-white bg-white dark:bg-black shadow-lg'
                                    : 'border-gray-300 dark:border-gray-800 bg-transparent'
                            }`}
                    >
                        <span className="absolute -top-3 left-4 px-2 bg-white dark:bg-black text-[11px] font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300">
                            Memtable
                        </span>

                        <div className="flex items-center gap-4 mt-1">
                            <div
                                className={`px-3 py-2 border rounded-md text-xs font-mono font-bold uppercase transition-all duration-300 ${activeContainer === 'memtable' && activeSubstep === 'check_bloom'
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-500 ring-2 ring-primary-500/50 scale-105'
                                        : 'border-gray-200 dark:border-gray-800 text-gray-400'
                                    }`}
                            >
                                Bloom Filter
                            </div>

                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-800" />

                            <div
                                className={`flex flex-wrap gap-1.5 p-1.5 rounded-lg transition-all duration-300 ${activeContainer === 'memtable' && activeSubstep === 'scan_page'
                                        ? 'bg-primary-50/50 dark:bg-primary-950/20 ring-2 ring-primary-500/50'
                                        : ''
                                    }`}
                            >
                                {MOCK_MEMTABLE.map((val) => {
                                    const isFound = foundData?.container === 'memtable' && val === foundData.key;
                                    return (
                                        <div
                                            key={val}
                                            className={`w-9 h-9 rounded-md flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 border ${isFound
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

                    {/* 2. RAM Staging Buffer (OS Page Cache Slot) (5 cols) */}
                    <div
                        className={`lg:col-span-5 relative p-4 border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col justify-between ${ramLoadedMeta
                                ? 'border-primary-500/80 bg-primary-50/10 dark:bg-primary-950/20'
                                : 'border-gray-300 dark:border-gray-800 bg-transparent'
                            }`}
                    >
                        <span className="absolute -top-3 left-4 px-2 bg-white dark:bg-black text-[11px] font-bold uppercase tracking-widest text-primary-500">
                            RAM Staging Buffer (OS Page Cache)
                        </span>

                        {ramLoadedMeta ? (
                            <div className="flex flex-col gap-2.5 mt-1 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-gray-400 uppercase font-bold">
                                        Target: {ramLoadedMeta.sstName}
                                    </span>
                                    {activeSubstep === 'load_page' && (
                                        <span className="text-[9px] font-mono text-primary-500 uppercase font-bold animate-pulse">
                                            Pulling Page...
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Bloom Filter loaded in RAM */}
                                    <div
                                        className={`flex-1 py-1.5 px-2 rounded border text-center font-mono text-[10px] uppercase font-bold transition-all duration-300 ${activeSubstep === 'check_bloom'
                                                ? bloomFailed
                                                    ? 'border-red-500 bg-red-500/10 text-red-500 ring-2 ring-red-500/50'
                                                    : 'border-primary-500 bg-primary-500/20 text-primary-500 ring-2 ring-primary-500/50 scale-105'
                                                : 'border-gray-300 dark:border-gray-700 text-gray-400'
                                            }`}
                                    >
                                        Bloom Filter
                                    </div>

                                    {/* Sparse Index loaded in RAM */}
                                    <div
                                        className={`flex-1 py-1.5 px-2 rounded border text-center font-mono text-[10px] uppercase font-bold transition-all duration-300 ${activeSubstep === 'check_index'
                                                ? 'border-primary-500 bg-primary-500/20 text-primary-500 ring-2 ring-primary-500/50 scale-105'
                                                : 'border-gray-300 dark:border-gray-700 text-gray-400'
                                            }`}
                                    >
                                        Sparse Index
                                    </div>
                                </div>

                                {/* Pulled 2 Neighbouring Keys Slot */}
                                <div className="flex items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-800">
                                    <span className="text-[9px] font-mono uppercase text-gray-400 font-bold">Data Page:</span>
                                    <div className="flex gap-2">
                                        {ramLoadedPage.length > 0 ? (
                                            ramLoadedPage.map((val) => {
                                                const isFound = foundData && val === foundData.key;
                                                return (
                                                    <div
                                                        key={val}
                                                        className={`px-2.5 py-1 rounded border font-mono text-xs font-bold transition-all duration-300 ${isFound
                                                                ? 'bg-green-500 border-green-600 text-white scale-110 shadow-lg'
                                                                : 'border-primary-500 bg-white dark:bg-black text-black dark:text-white'
                                                            }`}
                                                    >
                                                        K:{val}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span className="text-[10px] font-mono text-gray-400 italic">No page loaded</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <span className="text-[11px] font-mono text-gray-400 italic">
                                    Empty / Awaiting SSTable Offsets
                                </span>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* SECONDARY MEMORY (DISK) */}
            <div className="relative p-6 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl flex flex-col gap-6">
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
                                        {/* Top Row: Bloom Filter (w), Sparse Index (w), Data Sequence (8w) */}
                                        <div className="flex flex-row gap-2.5 p-3 h-20 items-center">

                                            {/* 1. Bloom Filter */}
                                            <div
                                                className={`flex-[1] h-full rounded-lg border flex items-center justify-center p-1.5 text-center transition-all duration-300 ${isCurrent && (activeSubstep === 'load_meta' || activeSubstep === 'check_bloom')
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-500 font-bold scale-105'
                                                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black text-gray-400'
                                                    }`}
                                            >
                                                <span className="text-[11px] font-bold uppercase font-mono leading-tight">
                                                    Bloom Filter
                                                </span>
                                            </div>

                                            {/* 2. Sparse Index Table */}
                                            <div
                                                className={`flex-[1] h-full rounded-lg border flex items-center justify-center p-1.5 text-center transition-all duration-300 ${isCurrent && (activeSubstep === 'load_meta' || activeSubstep === 'check_index')
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-500 font-bold scale-105'
                                                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black text-gray-400'
                                                    }`}
                                            >
                                                <span className="text-[11px] font-bold uppercase font-mono leading-tight">
                                                    Sparse Index
                                                </span>
                                            </div>

                                            {/* 3. Data Sequence */}
                                            <div
                                                className={`flex-[8] h-full rounded-lg border flex items-center px-3 gap-2 overflow-x-auto no-scrollbar transition-all duration-300 ${isCurrent && (activeSubstep === 'load_page' || activeSubstep === 'scan_page')
                                                        ? 'border-primary-500/80 bg-primary-50/20 dark:bg-primary-950/20'
                                                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-black'
                                                    }`}
                                            >
                                                {sst.data.map((val) => {
                                                    const isBeingPulled = isCurrent && ramLoadedPage.includes(val);
                                                    const isFound = foundData?.container === sst.id && val === foundData.key;
                                                    return (
                                                        <div
                                                            key={val}
                                                            className={`flex-1 min-w-[52px] h-11 flex items-center justify-center rounded-md border text-sm font-mono font-bold transition-all duration-300 ${isFound
                                                                    ? 'bg-green-500 border-green-600 text-white scale-110 shadow-lg z-10'
                                                                    : isBeingPulled
                                                                        ? 'border-primary-500 ring-2 ring-primary-500/50 bg-primary-50 dark:bg-primary-950/40 text-primary-500 font-bold scale-105'
                                                                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-black text-black dark:text-white'
                                                                }`}
                                                        >
                                                            <span>K:{val}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                        </div>

                                        {/* Bottom Row: Meta Data Footer */}
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