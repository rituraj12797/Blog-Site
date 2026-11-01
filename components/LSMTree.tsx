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

    // Simulate hashing the key into the active bloom filter
    const hashIndex = (keyCounter * 7) % BLOOM_FILTER_SIZE;
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
    <div className="flex flex-col gap-6 py-8 w-full max-w-2xl mx-auto bg-transparent font-sans">

      {/* Header & Controls */}
      <div className="flex justify-between items-center px-2 min-h-[44px]">
        <h3 className="text-xl font-bold m-0 opacity-80">LSM Tree Flow</h3>

        {isDiskFull ? (
          <button
            onClick={handleClear}
            className="px-5 py-2.5 rounded-full font-semibold shadow-md transition-all duration-300 transform active:scale-95 z-10 bg-red-500 hover:bg-red-400 text-white hover:shadow-lg hover:-translate-y-0.5 animate-in fade-in zoom-in duration-300"
          >
            Clear Disk
          </button>
        ) : (
          <button
            onClick={handleInsert}
            disabled={isFlushing}
            className={`px-5 py-2.5 rounded-full font-semibold shadow-md transition-all duration-300 transform active:scale-95 z-10 ${
              isFlushing
                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            + Add Entry
          </button>
        )}
      </div>

      {/* Memory (RAM) - Dashed Box */}
      <div className="relative p-6 border-2 border-dashed border-gray-400/50 rounded-2xl min-h-[160px] overflow-visible">
        <div className="absolute -top-3 left-4 px-2 bg-transparent backdrop-blur-md">
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">Memory (RAM)</span>
        </div>

        <div
          className={`flex flex-col gap-4 transform transition-all ease-in-out ${
            isFlushing
              ? 'duration-800 translate-y-[120px] scale-75 opacity-0'
              : 'duration-300 translate-y-0 scale-100 opacity-100'
          }`}
        >
          {/* Active Bloom Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold opacity-50 uppercase">Active Bloom Filter</span>
            <div className="flex gap-1">
              {activeBloom.map((bit, i) => (
                <div
                  key={`bloom-${i}`}
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono transition-colors duration-300 ${
                    bit ? 'bg-indigo-500/80 text-white shadow-sm' : 'bg-gray-500/10 border border-gray-500/20 text-transparent'
                  }`}
                >
                  {bit}
                </div>
              ))}
            </div>
          </div>

          {/* Active Memtable */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-semibold opacity-50 uppercase">Memtable Chunks</span>
            </div>
            <div className="flex gap-3 h-12 items-center">
              {Array.from({ length: MEMTABLE_LIMIT }).map((_, index) => {
                const hasData = index < memtable.length;
                return (
                  <div
                    key={`slot-${index}`}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono text-sm font-bold transition-all duration-300 ${
                      hasData
                        ? 'bg-emerald-500 text-white shadow-md scale-100'
                        : 'border-2 border-dashed border-gray-400/30 bg-transparent scale-95'
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
      <div className="relative p-6 border-2 border-dashed border-gray-400/50 rounded-2xl min-h-[200px] mt-2">
        <div className="absolute -top-3 left-4 px-2 bg-transparent backdrop-blur-md flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">Secondary Memory (Disk)</span>
          {isDiskFull && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full animate-pulse">FULL</span>}
        </div>

        {sstables.length === 0 && !isFlushing && (
           <p className="text-sm opacity-40 italic mt-4">Disk is empty. Fill the RAM buffer to trigger a flush.</p>
        )}

        <div className="flex flex-col gap-4 mt-2">
          {sstables.map((table) => (
            <div
              key={table.id}
              className="flex items-center gap-6 p-4 rounded-xl border border-gray-500/30 bg-gray-500/5 shadow-sm animate-in fade-in slide-in-from-top-12 duration-700"
              style={{ animationFillMode: 'both' }}
            >
              <div className="flex gap-2">
                {table.data.map((val, i) => (
                  <div key={i} className="w-10 h-10 rounded-lg bg-slate-600/80 text-white flex items-center justify-center font-mono text-sm shadow-inner">
                    {val}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1 ml-auto border-l border-gray-500/30 pl-6">
                 <span className="text-[9px] font-semibold opacity-40 uppercase tracking-wider">Attached Bloom</span>
                <div className="flex gap-1">
                  {table.bloom.map((bit, i) => (
                    <div
                      key={i}
                      className={`w-3 h-4 rounded-sm ${bit ? 'bg-indigo-400/80 shadow-sm' : 'bg-gray-500/20'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
