import React from 'react';

const LSMTreeLevels = () => {
    return (
        <div className="mx-auto w-full max-w-4xl p-6 bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-300">


            {/* Main Container */}
            <div className="flex flex-col  rounded-xl bg-white dark:bg-black transition-colors duration-300 p-8 items-center">


                {/* LEVEL 1 (8 small chunks) */}
                <div className="w-full flex flex-col items-center mb-4">
                    <div className="w-full max-w-[504px] flex justify-between items-end mb-3">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">Level 0</h3>
                    </div>
                    {/* 8 chunks of w-14 (56px) + 7 gaps of 8px = Exactly 504px */}
                    <div className="flex gap-2 w-full max-w-[504px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={`l1-${i}`} className="w-14 h-10 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black flex items-center justify-center font-bold text-xs  transition-colors duration-300">
                                SST
                            </div>
                        ))}
                    </div>
                </div>

                {/* LEVEL 2 (4 bigger chunks, 2x wide) */}
                <div className="w-full flex flex-col items-center mb-4">
                    <div className="w-full max-w-[504px] flex justify-between items-end mb-3">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">Level 1</h3>
                    </div>
                    {/* 4 chunks of 120px + 3 gaps of 8px = Exactly 504px */}
                    <div className="flex gap-2 w-full max-w-[504px]">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={`l2-${i}`} className="w-[120px] h-12 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black flex items-center justify-center font-bold text-sm  transition-colors duration-300">
                                SST
                            </div>
                        ))}
                    </div>
                </div>

                {/* LEVEL 3 (2 biggest chunks, 4x wide) */}
                <div className="w-full flex flex-col items-center">
                    <div className="w-full max-w-[504px] flex justify-between items-end mb-3">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">Level 2</h3>
                    </div>
                    {/* 2 chunks of 248px + 1 gap of 8px = Exactly 504px */}
                    <div className="flex gap-2 w-full max-w-[504px]">
                        {[1, 2].map((i) => (
                            <div key={`l3-${i}`} className="w-[248px] h-14 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-black flex items-center justify-center font-bold text-base  transition-colors duration-300">
                                SST
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LSMTreeLevels;