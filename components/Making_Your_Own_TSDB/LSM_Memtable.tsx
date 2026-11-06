import React from 'react';

const InMemorySetup = () => {
    return (
        <div className="mx-auto w-full max-w-3xl p-6 bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-300">

            {/* RAM Section Container */}
            <div className="relative border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col gap-5">
                <span className="absolute -top-3 left-5 bg-white dark:bg-black px-2 text-gray-400 dark:text-gray-500 tracking-wider text-xs font-bold transition-colors duration-300">
                    IN-MEMORY (RAM)
                </span>

                {/* Bloom Filter Component (Horizontal) */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-gray-900/30 transition-colors duration-300 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-black dark:text-white uppercase tracking-widest text-base">
                            BLOOM FILTER
                        </h3>
                    </div>

                    <div className="flex gap-2">
                        {[0, 1, 0, 0, 1, 0, 1, 0, 0, 1].map((bit, idx) => (
                            <div
                                key={idx}
                                className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-colors duration-300 ${bit
                                    ? 'bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-100'
                                    : 'bg-white dark:bg-transparent border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                                    }`}
                            >
                                {bit}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Memtable Component (Horizontal) */}
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-gray-900/30 transition-colors duration-300 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-black dark:text-white uppercase tracking-widest text-base">
                                MEMTABLE
                            </h3>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {/* Sorted Dictionary Entries */}
                        {[
                            { key: 12, val: 'data_A' },
                            { key: 34, val: 'data_B' },
                            { key: 56, val: 'data_C' },
                            { key: 89, val: 'data_D' },
                        ].map((entry, idx) => (
                            <div key={idx} className="flex flex-col min-w-[80px] border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-gray-800 transition-colors duration-300">
                                <div className="bg-gray-100 dark:bg-gray-900 text-center text-xs font-bold py-1.5 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 tracking-wider">
                                    K: {entry.key}
                                </div>
                                <div className="px-3 py-2 text-sm font-mono font-medium text-black dark:text-white text-center">
                                    {entry.val}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default InMemorySetup;