'use client';

import { useState } from 'react';

const BLOOM_SIZE = 8;
const hash = (key: number) => (key * key * 17 + key * 31) % BLOOM_SIZE;

const createBloom = (data: number[]) => {
    const b = Array(BLOOM_SIZE).fill(0);
    data.forEach(k => b[hash(k)] = 1);
    return b;
};

const MOCK_MEMTABLE = [95, 96, 97, 98];
const MEMTABLE_BLOOM = createBloom(MOCK_MEMTABLE);

const MOCK_LEVELS = [
    // Level 0 (2 SSTables, 3 elements each)
    [
        { id: 'sst-l0-1', data: [85, 86, 87], bloom: createBloom([85, 86, 87]) },
        { id: 'sst-l0-2', data: [90, 91, 92], bloom: createBloom([90, 91, 92]) }
    ],
    // Level 1 (2 SSTables, 6 elements each)
    [
        { id: 'sst-l1-1', data: [50, 52, 54, 56, 58, 60], bloom: createBloom([50, 52, 54, 56, 58, 60]) },
        { id: 'sst-l1-2', data: [30, 32, 34, 36, 38, 40], bloom: createBloom([30, 32, 34, 36, 38, 40]) }
    ]
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LSMTreeReadVisualizer() {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState(false);

    // Animation states
    const [activeContainer, setActiveContainer] = useState<string | null>(null);
    const [activeSubstep, setActiveSubstep] = useState<'bloom' | 'data' | null>(null);
    const [targetHashIndex, setTargetHashIndex] = useState<number | null>(null);
    const [traversedContainers, setTraversedContainers] = useState<string[]>([]);

    // Result states
    const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(null);
    const [foundData, setFoundData] = useState<{ container: string, key: number } | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const key = parseInt(searchQuery);
        if (isNaN(key)) return;

        // Reset UI
        setIsSearching(true);
        setSearchResult(null);
        setFoundData(null);
        setTraversedContainers([]);

        const currentHash = hash(key);
        setTargetHashIndex(currentHash);

        // STEP 1: Check Memtable
        setActiveContainer('memtable');
        setActiveSubstep('bloom');
        await sleep(400);

        if (MEMTABLE_BLOOM[currentHash] === 1) {
            setActiveSubstep('data');
            await sleep(400);

            if (MOCK_MEMTABLE.includes(key)) {
                setSearchResult('found');
                setFoundData({ container: 'memtable', key });
                setIsSearching(false);
                return;
            }
        }

        // Mark as traversed and not found
        setTraversedContainers(prev => [...prev, 'memtable']);

        // STEP 2: Check SSTables Level by Level
        for (let i = 0; i < MOCK_LEVELS.length; i++) {
            for (const sst of MOCK_LEVELS[i]) {
                setActiveContainer(sst.id);
                setActiveSubstep('bloom');
                await sleep(400);

                if (sst.bloom[currentHash] === 1) {
                    setActiveSubstep('data');
                    await sleep(400);

                    if (sst.data.includes(key)) {
                        setSearchResult('found');
                        setFoundData({ container: sst.id, key });
                        setIsSearching(false);
                        return;
                    }
                }

                // Mark as traversed and not found
                setTraversedContainers(prev => [...prev, sst.id]);
            }
        }

        // STEP 3: Not Found Anywhere
        setActiveContainer(null);
        setActiveSubstep(null);
        setSearchResult('not-found');
        setIsSearching(false);
    };

    return (
        <div className="relative flex flex-col gap-6 py-8 w-full max-w-4xl mx-auto bg-transparent font-sans text-black dark:text-white transition-colors duration-300">

            {/* User Input & Result Indicator */}
            <div className="flex justify-center relative z-10 mb-2">
                <form onSubmit={handleSearch} className="flex items-center gap-4 w-full max-w-md">

                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                        {searchResult === 'found' && (
                            <svg className="w-8 h-8 text-green-600 animate-in zoom-in spin-in-12 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                        {searchResult === 'not-found' && (
                            <svg className="w-8 h-8 text-red-600 animate-in zoom-in duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                    </div>

                    <input
                        type="number"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={isSearching}
                        placeholder="Enter key (e.g. 95, 30, 999)"
                        className="flex-1 px-4 py-2 rounded-full border-2 border-[#001f7a]/30 dark:border-white/30 bg-white dark:bg-black focus:outline-none focus:border-[#001f7a] dark:focus:border-white transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={isSearching || !searchQuery}
                        className={`px-6 py-2 rounded-full font-bold shadow-md transition-all duration-300 active:scale-95 ${isSearching || !searchQuery
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-[#001f7a] text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200'
                            }`}
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Memory (RAM) */}
            <div className={`relative p-6 border-2 border-dashed rounded-2xl transition-all duration-500 flex justify-center ${activeContainer === 'memtable'
                ? 'border-[#001f7a] dark:border-white shadow-[0_0_20px_rgba(0,31,122,0.15)] dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] bg-[#001f7a]/5 dark:bg-white/5'
                : 'border-[#001f7a]/30 dark:border-white/30'
                }`}>
                <div className="absolute -top-3 left-4 px-2 bg-transparent backdrop-blur-md">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">Memory (RAM)</span>
                </div>

                <div className={`relative px-6 py-4 border-2 rounded-xl transition-all duration-300 flex flex-row items-center gap-6 w-auto ${traversedContainers.includes('memtable')
                    ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 opacity-60 grayscale-[50%]'
                    : activeContainer === 'memtable'
                        ? 'border-[#001f7a] dark:border-white bg-white dark:bg-black shadow-lg scale-[1.02]'
                        : 'border-[#001f7a]/20 dark:border-white/20 bg-transparent'
                    }`}>
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-transparent backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-[#001f7a] dark:text-white">
                        Memtable
                    </span>

                    <div className="flex flex-col gap-1.5 items-center">
                        <span className="text-[9px] font-semibold opacity-70 uppercase tracking-wider">Bloom Filter</span>
                        <div className="flex gap-1">
                            {MEMTABLE_BLOOM.map((bit, i) => {
                                const isTargetBit = activeContainer === 'memtable' && targetHashIndex === i;
                                return (
                                    <div key={i} className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono transition-all duration-300 ${isTargetBit && activeSubstep === 'bloom'
                                        ? 'bg-yellow-400 text-black scale-110 shadow-md ring-2 ring-yellow-500'
                                        : bit
                                            ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-black'
                                            : 'border border-gray-300 dark:border-gray-700 text-transparent'
                                        }`}>
                                        {bit}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-px h-8 bg-[#001f7a]/20 dark:bg-white/20" />

                    <div className="flex flex-col gap-1.5 items-center">
                        <span className="text-[9px] font-semibold opacity-70 uppercase tracking-wider">Mem Buffer</span>
                        <div className={`flex gap-2 p-1.5 rounded-lg transition-colors ${activeContainer === 'memtable' && activeSubstep === 'data' ? 'bg-[#001f7a]/10 dark:bg-white/10 ring-1 ring-[#001f7a]/50 dark:ring-white/50' : ''}`}>
                            {MOCK_MEMTABLE.map((val) => {
                                const isFound = foundData?.container === 'memtable' && val === foundData.key;
                                return (
                                    <div key={val} className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold transition-all duration-300 border ${isFound
                                        ? 'bg-green-500 border-green-600 text-white scale-110 shadow-lg z-10'
                                        : 'bg-white dark:bg-black border-[#001f7a]/30 dark:border-white/30 text-black dark:text-white'
                                        }`}>
                                        {val}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Memory (Disk) */}
            <div className={`relative p-6 border-2 border-dashed rounded-2xl transition-all duration-500 flex flex-col gap-6 ${activeContainer && activeContainer !== 'memtable'
                ? 'border-[#001f7a] dark:border-white shadow-[0_0_20px_rgba(0,31,122,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-[#001f7a]/5 dark:bg-white/5'
                : 'border-[#001f7a]/30 dark:border-white/30'
                }`}>
                <div className="absolute -top-3 left-4 px-2 bg-transparent backdrop-blur-md">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">Secondary Memory (Disk)</span>
                </div>

                {MOCK_LEVELS.map((levelTables, levelIndex) => (
                    <div key={`level-${levelIndex}`} className="flex flex-col gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 border-b border-[#001f7a]/20 dark:border-white/20 pb-1">
                            Level {levelIndex}
                        </span>

                        <div className="flex flex-wrap gap-4 items-start mt-1">
                            {levelTables.map((table) => {
                                const isCurrentTable = activeContainer === table.id;
                                const isTraversed = traversedContainers.includes(table.id);

                                return (
                                    <div
                                        key={table.id}
                                        className={`flex flex-row items-center gap-3 p-2.5 rounded-xl border-2 transition-all duration-300 ${isTraversed
                                            ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 opacity-60 grayscale-[50%]'
                                            : isCurrentTable
                                                ? 'border-[#001f7a] dark:border-white bg-white dark:bg-black shadow-lg scale-[1.02] z-10'
                                                : 'border-[#001f7a]/20 dark:border-white/20 bg-transparent'
                                            }`}
                                    >
                                        {/* SSTable Bloom Filter */}
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className="text-[7px] font-semibold opacity-60 uppercase tracking-widest">Bloom</span>
                                            <div className="flex gap-0.5">
                                                {table.bloom.map((bit, i) => {
                                                    const isTargetBit = isCurrentTable && targetHashIndex === i;
                                                    return (
                                                        <div key={i} className={`w-3 h-4 rounded-[2px] flex items-center justify-center text-[7px] font-mono transition-all duration-300 ${isTargetBit && activeSubstep === 'bloom'
                                                            ? 'bg-yellow-400 text-black scale-125 shadow-md ring-1 ring-yellow-500 z-10'
                                                            : bit
                                                                ? 'bg-gray-600 text-white dark:bg-gray-400 dark:text-black'
                                                                : 'border border-gray-300 dark:border-gray-700 text-transparent'
                                                            }`}>
                                                            {bit}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="w-px h-6 bg-[#001f7a]/20 dark:bg-white/20" />

                                        {/* SSTable Data */}
                                        <div className={`flex gap-1.5 p-1 rounded-lg transition-colors ${isCurrentTable && activeSubstep === 'data' ? 'bg-[#001f7a]/10 dark:bg-white/10 ring-1 ring-[#001f7a]/50 dark:ring-white/50' : ''}`}>
                                            {table.data.map((val) => {
                                                const isFound = foundData?.container === table.id && val === foundData.key;
                                                return (
                                                    <div key={val} className={`w-8 h-8 rounded-md flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 border ${isFound
                                                        ? 'bg-green-500 border-green-600 text-white scale-110 shadow-md z-10'
                                                        : 'bg-white dark:bg-black border-[#001f7a]/30 dark:border-white/30 text-black dark:text-white'
                                                        }`}>
                                                        {val}
                                                    </div>
                                                );
                                            })}
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