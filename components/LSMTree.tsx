'use client';

import { useState } from 'react';

const MEMTABLE_LIMIT = 5;
const BLOOM_FILTER_SIZE = 8;
const SSTABLE_LIMIT = 5;

export default function LSMTreeVisualizer() {
  const [memtable, setMemtable] = useState<number[]>([]);
  const [activeBloom, setActiveBloom] = useState<number[]>(Array(BLOOM_FILTER_SIZE).fill(0));
  const [sstables, setSstables] = useState<{ id: number; data: number[]; bloom: number[] }[]>([]);
  const [keyCounter, setKeyCounter] = useState(1);
  const [isFlushing, setIsFlushing] = useState(false);

  const isDiskFull = sstables.length >= SSTABLE_LIMIT;

  const handleInsert = () => {
    if (isFlushing || isDiskFull) return;

    const newMemtable = [...memtable, keyCounter];

    const hashIndex = (keyCounter * keyCounter * 17 + keyCounter * 31) % BLOOM_FILTER_SIZE;

    const newBloom = [...activeBloom];
    newBloom[hashIndex] = 1;

    setKeyCounter((prev) => prev + 1);

    if (newMemtable.length >= MEMTABLE_LIMIT) {
      setMemtable(newMemtable);
      setActiveBloom(newBloom);
      setIsFlushing(true);

      setTimeout(() => {
        setSstables((prev) => [{
          id: Date.now(),
          data: newMemtable,
          bloom: newBloom
        }, ...prev]);

        setMemtable([]);
        setActiveBloom(Array(BLOOM_FILTER_SIZE).fill(0));
        setIsFlushing(false);
      }, 800);
    } else {
      setMemtable(newMemtable);
      setActiveBloom(newBloom);
    }
  };

  const handleClear = () => {
    setSstables([]);
    setMemtable([]);
    setActiveBloom(Array(BLOOM_FILTER_SIZE).fill(0));
    setKeyCounter(1);
    setIsFlushing(false);
  };

  return (
    <div className="flex flex-col gap-6 py-8 w-full max-w-4xl mx-auto bg-transparent font-sans text-black dark:text-white transition-colors duration-300">

      {/* Header & Controls */}
      <div className="flex justify-between items-center px-2 min-h-[44px]">
        <h3 className="text-xl font-bold m-0 opacity-90">LSM Tree Flow</h3>

        {isDiskFull ? (
          <button
            onClick={handleClear}
            className="px-5 py-2.5 rounded-full font-semibold shadow-md transition-all duration-300 transform active:scale-95 z-10 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 animate-in fade-in zoom-in duration-300"
          >
            Clear Disk
          </button>
        ) : (
          <button
            onClick={handleInsert}
            disabled={isFlushing}
            className={`px-5 py-2.5 rounded-full font-semibold shadow-md transition-all duration-300 transform active:scale-95 z-10 ${
              isFlushing
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50 text-gray-500 dark:text-gray-300'
                : 'bg-[#001f7a] text-white hover:bg-[#00175a] dark:bg-white dark:text-black dark:hover:bg-gray-200 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            + Add Entry
          </button>
        )}
      </div>

      {/* Memory (RAM) - Dashed Box */}
      <div className="relative p-6 border-2 border-dashed border-[#001f7a]/50 dark:border-white/50 rounded-2xl min-h-[160px] overflow-visible transition-colors duration-300">
        <div className="absolute -top-3 left-4 px-2 bg-transparent backdrop-blur-md">
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">Memory (RAM)</span>
        </div>

        <div
          className={`flex flex-col gap-6 transform transition-all ease-in-out ${
            isFlushing
              ? 'duration-800 translate-y-[120px] scale-75 opacity-0'
              : 'duration-300 translate-y-0 scale-100 opacity-100'
          }`}
        >
          {/* Active Bloom Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold opacity-70 uppercase">Active Bloom Filter</span>
            <div className="flex gap-1">
              {activeBloom.map((bit, i) => (
                <div
                  key={`bloom-${i}`}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono transition-colors duration-300 ${
                    bit
                      ? 'bg-black text-white shadow-sm dark:bg-[#001f7a]'
                      : 'border border-[#001f7a]/30 dark:border-white/30 bg-transparent text-transparent'
                  }`}
                >
                  {bit}
                </div>
              ))}
            </div>
          </div>

          {/* Active Memtable (Rounded Rectangle Wrapper) */}
          <div className="relative p-4 mt-2 border border-[#001f7a]/30 dark:border-white/30 rounded-xl transition-colors duration-300">
            <div className="absolute -top-2 left-4 px-1 bg-transparent backdrop-blur-md">
              <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">Memtable</span>
            </div>
            <div className="flex gap-3 h-12 items-center">
              {Array.from({ length: MEMTABLE_LIMIT }).map((_, index) => {
                const hasData = index < memtable.length;
                return (
                  <div
                    key={`slot-${index}`}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono text-sm font-bold transition-all duration-300 ${
                      hasData
                        ? 'bg-[#001f7a] text-white shadow-md scale-100 dark:bg-white dark:text-black'
                        : 'border-2 border-dashed border-[#001f7a]/40 dark:border-white/40 bg-transparent scale-95'
                    }`}
                  >
                    {hasData ? memtable[index] : ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Memory (Disk) - Dashed Box */}
      <div className="relative p-6 border-2 border-dashed border-[#001f7a]/50 dark:border-white/50 rounded-2xl min-h-[200px] mt-2 transition-colors duration-300">
        <div className="absolute -top-3 left-4 px-2 bg-transparent backdrop-blur-md flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">Secondary Memory (Disk)</span>
          {isDiskFull && <span className="text-[10px] font-bold text-white bg-black dark:bg-white dark:text-black px-2 py-0.5 rounded-full animate-pulse">FULL</span>}
        </div>

        {sstables.length === 0 && !isFlushing && (
           <p className="text-sm opacity-60 italic mt-4">Disk is empty. Fill the RAM buffer to trigger a flush.</p>
        )}

        <div className="flex flex-col gap-5 mt-4">
          {sstables.map((table, index) => {
            // Calculate sequential table number (oldest is 1, newest is higher)
            const tableNumber = sstables.length - index;

            return (
              <div
                key={table.id}
                className="relative flex items-center gap-6 p-5 rounded-xl border border-[#001f7a]/30 dark:border-white/30 bg-[#001f7a]/5 dark:bg-white/5 shadow-sm animate-in fade-in slide-in-from-top-12 duration-700 transition-colors"
                style={{ animationFillMode: 'both' }}
              >
                <div className="absolute -top-2 left-4 px-1 bg-transparent backdrop-blur-md">
                  <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">SSTable {tableNumber}</span>
                </div>

                <div className="flex gap-2">
                  {table.data.map((val, i) => (
                    <div key={i} className="w-10 h-10 rounded-lg bg-[#001f7a] text-white dark:bg-white dark:text-black flex items-center justify-center font-mono text-sm shadow-inner transition-colors">
                      {val}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1 ml-auto border-l border-[#001f7a]/30 dark:border-white/30 pl-6 transition-colors">
                   <span className="text-[9px] font-semibold opacity-70 uppercase tracking-wider">Attached Bloom</span>
                  <div className="flex gap-1">
                    {table.bloom.map((bit, i) => (
                      <div
                        key={i}
                        className={`w-3 h-4 rounded-sm transition-colors ${
                          bit
                            ? 'bg-black dark:bg-[#001f7a] shadow-sm'
                            : 'border border-[#001f7a]/30 dark:border-white/30 bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
