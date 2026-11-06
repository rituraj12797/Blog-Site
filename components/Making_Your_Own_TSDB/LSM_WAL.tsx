import React from 'react';

const WALTradeoffGraph = () => {
    return (
        <div className="mx-auto w-full max-w-4xl p-6 bg-transparent text-black dark:text-white font-sans">

            {/* Graph Container (No background, border, or shadow) */}
            <div className="relative p-4 md:p-8 flex justify-center bg-transparent">

                {/* Expanded viewBox slightly to safely fit text on the right */}
                <div className="w-full max-w-[650px] aspect-[4/3] relative">
                    <svg
                        className="w-full h-full overflow-visible"
                        viewBox="0 0 650 400"
                        fill="none"
                    >
                        {/* Grid/Helper Lines */}
                        <g className="stroke-gray-300 dark:stroke-gray-700/50" strokeWidth="1" strokeDasharray="4 4">
                            {/* InfluxDB drops */}
                            <path d="M 120,80 L 60,80" />
                            <path d="M 120,80 L 120,340" />
                            {/* PostgreSQL drops (Shifted up and left) */}
                            <path d="M 200,255 L 60,255" />
                            <path d="M 200,255 L 200,340" />
                            {/* VictoriaMetrics drops (Shifted left so text can anchor right) */}
                            <path d="M 450,305 L 60,305" />
                            <path d="M 450,305 L 450,340" />
                        </g>

                        {/* Axes */}
                        <g className="stroke-gray-800 dark:stroke-gray-200" strokeWidth="2">
                            {/* Y-Axis */}
                            <path d="M 60,340 L 60,30" />
                            <polygon points="56,38 64,38 60,26" className="fill-gray-800 dark:fill-gray-200" />
                            {/* X-Axis */}
                            <path d="M 60,340 L 610,340" />
                            <polygon points="602,336 602,344 614,340" className="fill-gray-800 dark:fill-gray-200" />
                        </g>

                        {/* Axis Labels */}
                        <text x="335" y="380" textAnchor="middle" className="fill-gray-600 dark:fill-gray-400 font-bold uppercase tracking-widest text-xs">
                            Query Performance / Write Throughput
                        </text>
                        <text transform="rotate(-90 25 185)" x="25" y="185" textAnchor="middle" className="fill-gray-600 dark:fill-gray-400 font-bold uppercase tracking-widest text-xs">
                            Data Recoverability / Safety
                        </text>

                        {/* Tradeoff Curve (Hyperbolic approximation) */}
                        <path
                            d="M 120,80 C 120,280 230,310 550,310"
                            className="stroke-primary-500 dark:stroke-primary-400"
                            strokeWidth="3"
                            fill="none"
                        />

                        {/* Data Points */}
                        <g>
                            {/* InfluxDB */}
                            <circle cx="120" cy="80" r="6" className="fill-white dark:fill-black stroke-primary-600 dark:stroke-primary-400" strokeWidth="3" />
                            <text x="135" y="72" className="fill-black dark:fill-white font-bold text-xl">InfluxDB</text>
                            <text x="135" y="96" className="fill-gray-500 dark:fill-gray-400 text-sm font-mono">Fsync on every write</text>

                            {/* PostgreSQL */}
                            <circle cx="200" cy="255" r="6" className="fill-white dark:fill-black stroke-primary-600 dark:stroke-primary-400" strokeWidth="3" />
                            <text x="215" y="245" className="fill-black dark:fill-white font-bold text-xl">PostgreSQL</text>
                            <text x="215" y="269" className="fill-gray-500 dark:fill-gray-400 text-sm font-mono">Batched Logging</text>

                            {/* VictoriaMetrics */}
                            <circle cx="450" cy="305" r="6" className="fill-white dark:fill-black stroke-primary-600 dark:stroke-primary-400" strokeWidth="3" />
                            <text x="465" y="300" textAnchor="start" className="fill-black dark:fill-white font-bold text-xl">VictoriaMetrics</text>
                            <text x="465" y="324" textAnchor="start" className="fill-gray-500 dark:fill-gray-400 text-sm font-mono">No WAL</text>
                        </g>

                    </svg>
                </div>
            </div>

        </div>
    );
};

export default WALTradeoffGraph;