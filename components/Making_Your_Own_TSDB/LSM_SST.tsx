import React from 'react';

const SSTableComponent = () => {
    return (
        <div className="mx-auto w-full max-w-4xl p-6 bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-300">


            {/* Main SSTable Container */}
            <div className="flex flex-col border-2 border-gray-300 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-black  transition-colors duration-300">

                {/* TOP ROW: Content grows naturally based on data */}
                <div className="flex flex-row gap-4 p-4">

                    {/* 1. Bloom Filter (Smaller Width) */}
                    <div className="flex-[1.5] border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black rounded-xl p-3 flex flex-col transition-colors duration-300">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase mb-3 text-center border-b border-gray-200 dark:border-gray-800 pb-2">
                            Bloom Filter
                        </h3>
                        <div className="flex-1 flex flex-wrap gap-2 items-center justify-center content-center">
                            {[0, 1, 0, 0, 1, 1, 0, 1, 0, 0].map((bit, i) => (
                                <div key={i} className={`w-7 h-7 text-xs flex items-center justify-center font-bold rounded-md ${bit ? 'bg-primary-500 text-white' : 'bg-white dark:bg-black border border-gray-200 dark:border-gray-800 text-gray-400'
                                    }`}>
                                    {bit}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Sparse Index (Smaller Width) */}
                    <div className="flex-[2] border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black rounded-xl p-3 flex flex-col transition-colors duration-300">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase mb-3 text-center border-b border-gray-200 dark:border-gray-800 pb-2">
                            Sparse Index
                        </h3>
                        <div className="flex-1 flex flex-col justify-center gap-3 px-3 text-xs font-mono text-gray-600 dark:text-gray-300">
                            <div className="flex justify-between bg-white dark:bg-black px-3 py-1.5 rounded border border-gray-200 dark:border-gray-800  ">
                                <span>12</span> <span className="text-primary-600 dark:text-primary-400">0x00</span>
                            </div>
                            <div className="flex justify-between bg-white dark:bg-black px-3 py-1.5 rounded border border-gray-200 dark:border-gray-800  ">
                                <span>56</span> <span className="text-primary-600 dark:text-primary-400">0x4F</span>
                            </div>
                            <div className="flex justify-between bg-white dark:bg-black px-3 py-1.5 rounded border border-gray-200 dark:border-gray-800  ">
                                <span>89</span> <span className="text-primary-600 dark:text-primary-400">0x9A</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Data Table (Largest Width) */}
                    <div className="flex-[6] border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black rounded-xl p-3 flex flex-col transition-colors duration-300">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase mb-3 text-center border-b border-gray-200 dark:border-gray-800 pb-2">
                            Data Table (Sorted Sequence)
                        </h3>
                        <div className="flex-1 flex flex-wrap items-center justify-center content-center gap-3 px-2 py-1">
                            {/* Data Blocks - Simple Rectangles */}
                            {[
                                { k: 12, v: 'data_A' },
                                { k: 24, v: 'data_B' },
                                { k: 34, v: 'data_C' },
                                { k: 45, v: 'data_D' },
                                { k: 56, v: 'data_E' },
                                { k: 67, v: 'data_F' },
                                { k: 71, v: 'data_G' },
                                { k: 82, v: 'data_H' },
                                { k: 89, v: 'data_I' },
                                { k: 95, v: 'data_J' },
                            ].map((entry, i) => (
                                <div key={i} className="flex items-center px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-md bg-white dark:bg-black transition-colors duration-300   text-sm font-mono">
                                    <span className="text-gray-400 dark:text-gray-500 font-bold mr-2">{entry.k} :</span>
                                    <span className="font-medium text-black dark:text-gray-200">{entry.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* BOTTOM ROW: Meta Data Footer */}
                <div className="bg-gray-100 dark:bg-black border-t-2 border-gray-300 dark:border-gray-800 flex items-center px-8 py-4 justify-between transition-colors duration-300">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-widest text-black dark:text-white">
                            Meta Data Footer
                        </span>
                    </div>

                    <div className="flex gap-8 text-xs font-mono text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 dark:text-gray-500">Range:</span>
                            <span className="font-bold bg-white dark:bg-black px-2 py-1 rounded border border-gray-200 dark:border-gray-800   text-black dark:text-gray-200">[12 - 95]</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 dark:text-gray-500">Size:</span>
                            <span className="font-bold bg-white dark:bg-black px-2 py-1 rounded border border-gray-200 dark:border-gray-800   text-black dark:text-gray-200">4 MB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 dark:text-gray-500">CRC:</span>
                            <span className="font-bold bg-white dark:bg-black px-2 py-1 rounded border border-gray-200 dark:border-gray-800   text-black dark:text-gray-200">0x8F2A</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SSTableComponent;