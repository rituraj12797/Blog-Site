'use client';

import { useState } from 'react';

const MEMTABLE_LIMIT = 4;
const WAL_BATCH_SIZE = 2;
const COMPACTION_THRESHOLD = 3;
const BLOOM_FILTER_SIZE = 8;
const MAX_LEVELS = 3;

interface SSTable {
  id: string;
  sizeMultiplier: number;
}

const generateUniqueId = () => `sst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export default function LSMTreeVisualizer() {
  const [memtable, setMemtable] = useState<number[]>([]);
  const [activeBloom, setActiveBloom] = useState<number[]>(Array(BLOOM_FILTER_SIZE).fill(0));

  const [osPageCache, setOsPageCache] = useState<number[]>([]);
  const [wal, setWal] = useState<number[][]>([]);

  const [levels, setLevels] = useState<SSTable[][]>([[], [], []]);

  const [keyCounter, setKeyCounter] = useState(1);
  const [isAnimatingMemtable, setIsAnimatingMemtable] = useState(false);
  const [isAnimatingWAL, setIsAnimatingWAL] = useState(false);
  const [compactionMessage, setCompactionMessage] = useState<{ level: number } | null>(null);

  // Tree is only full when ALL levels have reached their max compaction threshold
  const isTreeFull = levels.every((level) => level.length >= COMPACTION_THRESHOLD);

  const handleInsert = () => {
    if (isAnimatingMemtable || isAnimatingWAL || isTreeFull) return;

    const newKey = keyCounter;
    setKeyCounter((prev) => prev + 1);

    const newOsPageCache = [...osPageCache, newKey];

    if (newOsPageCache.length >= WAL_BATCH_SIZE) {
      setOsPageCache(newOsPageCache);
      setIsAnimatingWAL(true);

      setTimeout(() => {
        setWal((prev) => [...prev, newOsPageCache]);
        setOsPageCache([]);
        setIsAnimatingWAL(false);
      }, 500);
    } else {
      setOsPageCache(newOsPageCache);
    }

    const newMemtable = [...memtable, newKey];
    const hashIndex = (newKey * newKey * 17 + newKey * 31) % BLOOM_FILTER_SIZE;
    const newBloom = [...activeBloom];
    newBloom[hashIndex] = 1;

    if (newMemtable.length >= MEMTABLE_LIMIT) {
      setMemtable(newMemtable);
      setActiveBloom(newBloom);
      setIsAnimatingMemtable(true);

      setTimeout(() => {
        handleMemtableFlush();
      }, 800);
    } else {
      setMemtable(newMemtable);
      setActiveBloom(newBloom);
    }
  };

  const handleMemtableFlush = () => {
    const newL0Table: SSTable = { id: generateUniqueId(), sizeMultiplier: 1 };

    setLevels((prev) => {
      const newLevels = [...prev];
      newLevels[0] = [...newLevels[0], newL0Table];
      return newLevels;
    });

    // Reset MemTable & active bloom filter
    setMemtable([]);
    setActiveBloom(Array(BLOOM_FILTER_SIZE).fill(0));
    setIsAnimatingMemtable(false);

    // Truncate/empty WAL and in-memory page cache since data is safely persisted in SSTable
    setWal([]);
    setOsPageCache([]);
    setIsAnimatingWAL(false);

    setTimeout(() => {
      checkCompaction(0);
    }, 400);
  };

  const checkCompaction = (levelIndex: number) => {
    setLevels((prev) => {
      const currentLevels = [...prev];
      if (currentLevels[levelIndex] && currentLevels[levelIndex].length >= COMPACTION_THRESHOLD) {
        // Stop compaction if it's the last level
        if (levelIndex >= MAX_LEVELS - 1) {
          return currentLevels;
        }

        // Stop compaction if the NEXT level is already full (prevents overfilling levels)
        if (currentLevels[levelIndex + 1] && currentLevels[levelIndex + 1].length >= COMPACTION_THRESHOLD) {
          return currentLevels;
        }

        setCompactionMessage({ level: levelIndex });

        setTimeout(() => {
          setLevels((latest) => {
            const next = [...latest];

            // Double-check guards inside timeout to prevent race conditions
            if (!next[levelIndex] || next[levelIndex].length < COMPACTION_THRESHOLD) {
              return latest;
            }
            if (
              levelIndex >= MAX_LEVELS - 1 ||
              (next[levelIndex + 1] && next[levelIndex + 1].length >= COMPACTION_THRESHOLD)
            ) {
              return latest;
            }

            const tablesToMerge = next[levelIndex].slice(0, COMPACTION_THRESHOLD);
            const totalSize = tablesToMerge.reduce((sum, t) => sum + t.sizeMultiplier, 0);

            next[levelIndex] = next[levelIndex].slice(COMPACTION_THRESHOLD);

            if (!next[levelIndex + 1]) {
              next[levelIndex + 1] = [];
            }

            next[levelIndex + 1] = [
              ...next[levelIndex + 1],
              { id: generateUniqueId(), sizeMultiplier: totalSize },
            ];

            return next;
          });
          setCompactionMessage(null);

          setTimeout(() => {
            checkCompaction(levelIndex + 1);
          }, 400);
        }, 1000);
      }
      return currentLevels;
    });
  };

  const handleClear = () => {
    setLevels([[], [], []]);
    setMemtable([]);
    setActiveBloom(Array(BLOOM_FILTER_SIZE).fill(0));
    setOsPageCache([]);
    setWal([]);
    setKeyCounter(1);
    setIsAnimatingMemtable(false);
    setIsAnimatingWAL(false);
    setCompactionMessage(null);
  };

  return (
    <div className="relative flex flex-col gap-6 py-8 w-full max-w-4xl mx-auto bg-transparent font-sans text-black dark:text-white transition-colors duration-300">
      {/* Header & Controls */}
      <div className="flex justify-between items-center px-2 min-h-[60px] relative z-10">
        <h3 className="text-xl font-bold m-0 opacity-90">LSM-Tree Write Path</h3>

        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="px-5 py-2.5 rounded-full font-semibold shadow-md transition-all duration-300 active:scale-95 bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={handleInsert}
            disabled={isAnimatingMemtable || isAnimatingWAL || isTreeFull}
            className={`px-5 py-2.5 rounded-full font-semibold shadow-md transition-all duration-300 active:scale-95 ${isAnimatingMemtable || isAnimatingWAL || isTreeFull
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50 text-gray-500 dark:text-gray-300'
                : 'bg-[#001f7a] text-white hover:bg-[#00175a] dark:bg-white dark:text-black dark:hover:bg-gray-200 hover:shadow-lg cursor-pointer'
              }`}
          >
            {isTreeFull ? 'Tree Full' : '+ Add Entry'}
          </button>
        </div>
      </div>

      {/* Memory (RAM) - Dashed Box */}
      <div className="relative p-6 border-2 border-dashed border-[#001f7a]/50 dark:border-white/50 rounded-2xl min-h-[220px] transition-colors duration-300 flex flex-col md:flex-row gap-8">
        <div className="absolute -top-3 left-4 px-2 bg-transparent backdrop-blur-md">
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">Memory (RAM)</span>
        </div>

        {/* OS Page Cache */}
        <div className="flex flex-col gap-2 w-32 relative">
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 border-b border-[#001f7a]/20 dark:border-white/20 pb-1">
            Log Buffer
          </span>
          <div
            className={`flex flex-col gap-2 transition-all ease-in-out z-20 ${isAnimatingWAL
                ? 'duration-500 translate-y-[200px] opacity-0 scale-75'
                : 'duration-300 translate-y-0 opacity-100 scale-100'
              }`}
          >
            <div className="text-[8px] opacity-50 uppercase text-center">
              Batch: {osPageCache.length}/{WAL_BATCH_SIZE}
            </div>
            <div className="flex gap-1 justify-center p-2 rounded-md border border-[#001f7a]/30 dark:border-white/30 bg-[#001f7a]/5 dark:bg-white/5 min-h-[42px]">
              {Array.from({ length: WAL_BATCH_SIZE }).map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold ${i < osPageCache.length
                      ? 'bg-[#001f7a] text-white dark:bg-white dark:text-black'
                      : 'border border-dashed border-[#001f7a]/30 dark:border-white/30 text-transparent'
                    }`}
                >
                  {i < osPageCache.length ? osPageCache[i] : ''}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Unified Memtable Container */}
        <div className="flex-1 flex flex-col items-center">
          <div
            className={`relative p-5 border-2 border-[#001f7a]/40 dark:border-white/40 rounded-xl bg-[#001f7a]/5 dark:bg-white/5 transition-all ease-in-out z-20 flex flex-col gap-6 ${isAnimatingMemtable
                ? 'duration-700 translate-y-[180px] scale-75 opacity-0'
                : 'duration-300 translate-y-0 scale-100 opacity-100'
              }`}
          >
            <div
              className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-transparent backdrop-blur-md transition-opacity duration-300 ${isAnimatingMemtable ? 'opacity-0' : 'opacity-100'
                }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#001f7a] dark:text-white">
                Memtable
              </span>
            </div>

            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 delay-200 ${isAnimatingMemtable ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
              <div className="px-8 py-3 bg-[#001f7a] text-white dark:bg-white dark:text-black font-bold font-mono tracking-widest rounded shadow-lg text-sm">
                NEW SSTABLE
              </div>
            </div>

            <div
              className={`flex flex-col gap-2 items-center transition-all duration-500 ${isAnimatingMemtable ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
                }`}
            ></div>

            <div
              className={`flex flex-col gap-2 items-center transition-all duration-500 ${isAnimatingMemtable ? '-translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
                }`}
            >
              <span className="text-[9px] font-semibold opacity-70 uppercase tracking-wider">
                Dictionary ({memtable.length}/{MEMTABLE_LIMIT})
              </span>
              <div className="flex gap-2 min-h-[40px]">
                {Array.from({ length: MEMTABLE_LIMIT }).map((_, index) => {
                  const hasData = index < memtable.length;
                  return (
                    <div
                      key={`slot-${index}`}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold transition-all duration-300 ${hasData
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
      </div>

      {/* Secondary Memory (Disk) - Dashed Box */}
      <div className="relative p-6 border-2 border-dashed border-[#001f7a]/50 dark:border-white/50 rounded-2xl min-h-[300px] mt-2 transition-colors duration-300 flex flex-col md:flex-row gap-6">
        <div className="absolute -top-3 left-4 px-2 bg-transparent backdrop-blur-md">
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">Secondary Memory (Disk)</span>
        </div>

        {/* Scrollable WAL Section */}
        <div className="w-full md:w-36 flex flex-col gap-2 border-r-0 md:border-r-2 border-dashed border-[#001f7a]/20 dark:border-white/20 pr-0 md:pr-4 h-[300px] relative z-10 overflow-hidden">
          <div className="pb-2 bg-white dark:bg-black transition-colors duration-300 z-20">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 block text-center">
              Write-Ahead Log
            </span>
          </div>

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-6 pt-1">
            <div className="flex flex-col gap-2 w-full items-center">
              {wal.map((batch, i) => (
                <div
                  key={i}
                  className="w-full max-w-[100px] p-2 border border-[#001f7a]/30 dark:border-white/30 rounded-md bg-[#001f7a]/5 dark:bg-white/5 flex gap-2 justify-center animate-in fade-in zoom-in duration-300"
                >
                  {batch.map((v, j) => (
                    <div
                      key={j}
                      className="w-6 h-6 bg-black text-white dark:bg-[#001f7a] rounded-sm flex items-center justify-center text-[10px] font-bold"
                      title={`Write ${v}`}
                    >
                      {v}
                    </div>
                  ))}
                </div>
              ))}
              {wal.length === 0 && (
                <span className="text-xs opacity-30 text-center italic py-4 block">Empty</span>
              )}
            </div>
          </div>
        </div>

        {/* SSTables Levels Section */}
        <div className="flex-1 flex flex-col gap-6 pl-0 md:pl-2 relative z-10">
          {levels.map((levelTables, levelIndex) => (
            <div key={`level-${levelIndex}`} className="flex flex-col gap-2 relative">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 border-b border-[#001f7a]/20 dark:border-white/20 pb-1">
                Level {levelIndex} (Max {COMPACTION_THRESHOLD})
              </span>

              <div className="flex flex-wrap gap-3 min-h-[48px] items-center">
                {levelTables.length === 0 && (
                  <span className="text-xs opacity-30 italic">No SSTables</span>
                )}

                {levelTables.map((table) => (
                  <div
                    key={table.id}
                    className="flex items-center justify-center font-mono text-[10px] font-bold rounded shadow-sm border border-[#001f7a]/30 dark:border-white/30 bg-[#001f7a] text-white dark:bg-white dark:text-black animate-in fade-in slide-in-from-top-4 duration-500"
                    style={{
                      width: `${Math.min(200, 40 + (table.sizeMultiplier - 1) * 20)}px`,
                      height: `${Math.min(64, 32 + (table.sizeMultiplier - 1) * 8)}px`,
                    }}
                  >
                    SST
                  </div>
                ))}
              </div>

              {compactionMessage?.level === levelIndex && (
                <div className="absolute inset-0 bg-[#001f7a]/20 dark:bg-white/20 backdrop-blur-[2px] rounded-lg flex items-center justify-center z-10 animate-in fade-in duration-300">
                  <span className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black font-bold text-xs uppercase tracking-widest rounded shadow-lg animate-pulse">
                    Compacting Level {levelIndex}...
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}