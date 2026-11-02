import React from 'react';

const LSMTreeStatic = () => {
    return (
        <div className="mx-auto w-full max-w-3xl p-6 bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-300">
            <h2 className="text-2xl flex justify-center font-bold mb-6 text-gray-800 dark:text-gray-100">LSM Tree</h2>

            {/* RAM Section */}
            <div className="relative border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 mb-8">
                <span className="absolute -top-2 left-5 bg-white dark:bg-black px-2 text-gray-400 dark:text-gray-500 tracking-wider text-[10px] font-medium transition-colors duration-300">
                    MEMORY (RAM)
                </span>

                {/* Memtable - Horizontal Layout */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/30 transition-colors duration-300 flex items-center justify-between">
                    <h3 className="font-bold text-black dark:text-white uppercase tracking-widest text-sm ml-4">
                        MEMTABLE
                    </h3>

                    <div className="flex gap-10 mr-4">
                        {/* Bloom Filter mock */}
                        <div>
                            <div className="text-[10px] mb-2 text-gray-400 dark:text-gray-500 font-medium tracking-wide">BLOOM FILTER</div>
                            <div className="flex gap-2">
                                {[0, 0, 0, 0, 1, 0, 1, 0].map((v, i) => (
                                    <div
                                        key={i}
                                        className={`w-6 h-6 rounded transition-colors duration-300 ${v
                                            ? 'bg-gray-400 dark:bg-gray-600'
                                            : 'bg-white dark:bg-transparent border border-gray-200 dark:border-gray-700'
                                            }`}
                                    ></div>
                                ))}
                            </div>
                        </div>

                        {/* Dictionary mock */}
                        <div>
                            <div className="text-[10px] mb-2 text-gray-400 dark:text-gray-500 font-medium tracking-wide">DICTIONARY (2/4)</div>
                            <div className="flex gap-2.5 text-gray-500 dark:text-gray-400">
                                <div className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center rounded font-medium text-sm">5</div>
                                <div className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center rounded font-medium text-sm">6</div>
                                <div className="w-10 h-10 border border-dashed border-gray-200 dark:border-gray-700 rounded"></div>
                                <div className="w-10 h-10 border border-dashed border-gray-200 dark:border-gray-700 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DISK Section */}
            <div className="relative border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 flex gap-6">
                <span className="absolute -top-2 left-5 bg-white dark:bg-black px-2 text-gray-400 dark:text-gray-500 tracking-wider text-[10px] font-medium transition-colors duration-300">
                    SECONDARY MEMORY (DISK)
                </span>

                {/* Write-Ahead Log (WAL) */}
                <div className="w-40 border-r border-dashed border-gray-200 dark:border-gray-800 pr-6 py-3 transition-colors duration-300">
                    <h3 className="font-bold text-black dark:text-white uppercase tracking-widest text-sm mb-4">
                        WRITE-AHEAD LOG
                    </h3>
                    <div className="flex flex-col gap-3">
                        {[[1, 2], [3, 4], [5, 6]].map((pair, idx) => (
                            <div key={idx} className="flex gap-2 justify-center border border-gray-100 dark:border-gray-800 rounded-lg p-2 bg-gray-50 dark:bg-gray-900/30 transition-colors duration-300 text-gray-500 dark:text-gray-400">
                                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded font-medium text-xs">{pair[0]}</div>
                                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded font-medium text-xs">{pair[1]}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SSTable Levels & Compaction */}
                <div className="flex-1 py-3 pl-3 relative flex flex-col">

                    {/* Level Divider Line (Absolute) positioned between circle and return path */}
                    <div className="absolute top-[175px] left-3 right-0 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300"></div>

                    {/* Level 0 */}
                    <div className="relative z-10 flex gap-4 mt-6">
                        <div className="w-20 h-10 bg-white dark:bg-gray-100 text-black shadow-sm font-bold uppercase tracking-widest flex items-center justify-center rounded-sm text-sm border border-gray-200 dark:border-transparent">SST</div>
                        <div className="w-20 h-10 bg-white dark:bg-gray-100 text-black shadow-sm font-bold uppercase tracking-widest flex items-center justify-center rounded-sm text-sm border border-gray-200 dark:border-transparent">SST</div>
                        <div className="w-20 h-10 bg-white dark:bg-gray-100 text-black shadow-sm font-bold uppercase tracking-widest flex items-center justify-center rounded-sm text-sm border border-gray-200 dark:border-transparent">SST</div>
                    </div>

                    {/* Connection SVG */}
                    <div className="relative w-[420px] h-[160px] -mt-1 -mb-1">
                        <svg
                            className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none"
                            viewBox="0 0 420 160"
                            fill="none"
                        >
                            <g>
                                {/* Vertical drops from SST centers (x=40, 136, 232) */}
                                <path d="M 40,0 L 40,50" className="stroke-primary-500 dark:stroke-primary-400" strokeWidth="2.5" strokeDasharray="4 4" />
                                <path d="M 136,0 L 136,50" className="stroke-primary-500 dark:stroke-primary-400" strokeWidth="2.5" strokeDasharray="4 4" />
                                <path d="M 232,0 L 232,50" className="stroke-primary-500 dark:stroke-primary-400" strokeWidth="2.5" strokeDasharray="4 4" />

                                {/* Horizontal collector towards the right */}
                                <path d="M 40,50 L 310,50" className="stroke-primary-500 dark:stroke-primary-400" strokeWidth="2.5" strokeDasharray="4 4" />
                                <polygon points="310,46 318,50 310,54" className="fill-primary-500 dark:fill-primary-400" />

                                {/* Dark Circle for Compaction */}
                                <circle cx="365" cy="50" r="45" className="fill-black dark:fill-white" />
                                <text x="365" y="54" textAnchor="middle" className="fill-white dark:fill-black font-bold uppercase tracking-widest text-xs">
                                    COMPACTION
                                </text>

                                {/* Arrow exiting circle and routing back to Level 1 */}
                                <path d="M 365,95 L 365,125 L 136,125 L 136,155" className="stroke-primary-500 dark:stroke-primary-400" strokeWidth="2.5" strokeDasharray="4 4" />
                                <polygon points="132,152 140,152 136,158" className="fill-primary-500 dark:fill-primary-400" />
                            </g>
                        </svg>
                    </div>

                    {/* Level 1 (Compacted) */}
                    <div className="relative z-10 flex mt-1">
                        {/* Vertically aligned with center SST (x=136), with a larger width (112px). Center offset = 136 - 56 = 80px */}
                        <div className="ml-[80px] w-28 h-14 border-2 border-dashed border-primary-500 text-black dark:text-white font-bold uppercase tracking-widest flex items-center justify-center rounded-sm bg-primary-50 dark:bg-primary-950/20 transition-colors duration-300 text-base">
                            SST
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LSMTreeStatic;