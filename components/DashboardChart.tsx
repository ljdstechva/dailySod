'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface DataPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
}

// Utility to generate "nice" axis steps
const niceNumber = (range: number, round: boolean) => {
  if (range === 0) return 1;
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
};

// --- Smoothing Logic ---
const line = (pointA: number[], pointB: number[]) => {
  const lengthX = pointB[0] - pointA[0];
  const lengthY = pointB[1] - pointA[1];
  return {
    length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
    angle: Math.atan2(lengthY, lengthX)
  };
};

const controlPoint = (current: number[], previous: number[], next: number[], reverse?: boolean) => {
  const p = previous || current;
  const n = next || current;
  const smoothing = 0.2; // Adjust for curve smoothness
  const o = line(p, n);
  const angle = o.angle + (reverse ? Math.PI : 0);
  const length = o.length * smoothing;
  const x = current[0] + Math.cos(angle) * length;
  const y = current[1] + Math.sin(angle) * length;
  return [x, y];
};

const bezierCommand = (point: number[], i: number, a: number[][]) => {
  const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
  const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
  return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`;
};

const svgPath = (points: number[][], command: (point: number[], i: number, a: number[][]) => string) => {
  return points.reduce((acc, point, i, a) => i === 0 
    ? `M ${point[0]},${point[1]}` 
    : `${acc} ${command(point, i, a)}`, ''
  );
};
// -----------------------

export const AreaChart: React.FC<AreaChartProps> = ({ 
  data, 
  color = '#f97316', 
  height = 200 
}) => {
  const { theme } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!data.length) return;
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [data.length]);
  
  if (!data.length) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full min-h-[160px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-600 rounded-lg border border-dashed border-slate-200 dark:border-slate-800"
      >
        No data
      </div>
    );
  }

  const rawMaxValue = Math.max(...data.map(d => d.value)) || 0;
  const targetGridLines = 4;
  const step = niceNumber(rawMaxValue / targetGridLines || 1, true);
  const niceMaxValue = Math.max(step * Math.ceil((rawMaxValue || 1) / step), step);
  const maxValue = niceMaxValue || 1;
  const maxX = Math.max(data.length - 1, 1);
  const gridValues = useMemo(
    () => Array.from({ length: Math.ceil(maxValue / step) }, (_, i) => (i + 1) * step),
    [maxValue, step]
  );
  
  const getX = (index: number) => (index / maxX) * 100;
  const getY = (value: number) => 100 - (value / maxValue) * 100;

  const points = useMemo(() => data.map((d, i) => [getX(i), getY(d.value)]), [data, maxValue, maxX]);
  
  const linePathDefinition = useMemo(() => svgPath(points, bezierCommand), [points]);
  const areaPathDefinition = `${linePathDefinition} L 100,100 L 0,100 Z`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const xPercent = (x / rect.width) * 100;
    const clampedXPercent = Math.min(98, Math.max(2, xPercent));
    const index = Math.round((clampedXPercent / 100) * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    setHoveredIndex(clampedIndex);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const activeValue = hoveredIndex !== null ? data[hoveredIndex].value : 0;
  const activeLabel = hoveredIndex !== null ? data[hoveredIndex].label : '';

  return (
    <div 
      ref={containerRef}
      className="w-full relative cursor-crosshair touch-none select-none group" 
      style={{ height: `${height}px` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        <g className="transition-opacity duration-300" style={{ opacity: isVisible ? 1 : 0 }}>
          {gridValues.map((value) => (
            <line
              key={value}
              x1="0"
              x2="100"
              y1={getY(value)}
              y2={getY(value)}
              stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'}
              strokeWidth="0.5"
              strokeDasharray="2 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        {/* Animated Group */}
        <g 
          style={{ 
            clipPath: isVisible ? 'inset(0 -20% 0 -20%)' : 'inset(0 100% 0 0)',
            transition: 'clip-path 1.2s cubic-bezier(0.25, 1, 0.5, 1)' 
          }}
        >
          {/* Fill Area */}
          <path
            d={areaPathDefinition}
            fill={`url(#gradient-${color})`}
            className="transition-opacity duration-1000"
            style={{ opacity: isVisible ? 1 : 0 }}
          />

          {/* Stroke Line */}
          <path
            d={linePathDefinition}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="drop-shadow-sm"
          />
        </g>

        {/* Hover crosshair line */}
        <line
          x1={hoveredIndex !== null ? getX(hoveredIndex) : 0}
          y1="0"
          x2={hoveredIndex !== null ? getX(hoveredIndex) : 0}
          y2="100"
          stroke={color}
          strokeWidth="0.8"
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
          className="transition-opacity duration-150"
          style={{ opacity: hoveredIndex !== null ? 0.6 : 0 }}
        />
      </svg>

      {/* Active dot overlay to keep circle crisp regardless of aspect ratio */}
      {hoveredIndex !== null && (
        <div
          className="pointer-events-none absolute rounded-full shadow-sm border"
          style={{
            width: 10,
            height: 10,
            borderColor: color,
            backgroundColor: theme === 'dark' ? '#0f172a' : '#fff',
            left: `${getX(hoveredIndex)}%`,
            top: `${getY(data[hoveredIndex].value)}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
      
      {/* Floating Minimalist Tooltip */}
      <div 
        className={`absolute pointer-events-none z-20 transition-all duration-200 ease-out ${
          hoveredIndex !== null ? 'opacity-100 translate-y-[-6px]' : 'opacity-0 translate-y-[6px]'
        }`}
        style={{ 
          left: hoveredIndex !== null ? `${getX(hoveredIndex)}%` : '50%',
          top: hoveredIndex !== null ? `${getY(activeValue)}%` : '50%',
          transform: 'translate(10px, -50%)',
        }}
      >
        <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap">
          <span>{activeValue}</span>
          <span className="opacity-60 border-l border-white/20 dark:border-black/10 pl-2 uppercase tracking-wider text-[10px]">
            {activeLabel}
          </span>
        </div>
      </div>

      {/* Grid value labels */}
      <div className="absolute inset-0 pointer-events-none">
        {gridValues.map((value) => (
          <div
            key={`label-${value}`}
            className="absolute text-[10px] font-semibold text-slate-400 dark:text-slate-600 px-1"
            style={{ 
              top: `${getY(value)}%`,
              transform: 'translateY(-50%)',
              left: 0
            }}
          >
            {value}
          </div>
        ))}
      </div>

      {/* Minimalist X-Axis Labels */}
      <div className="flex justify-between mt-6 text-[10px] uppercase tracking-wider font-bold text-slate-300 dark:text-slate-600 select-none">
        {data.map((d, i) => (
          <div 
            key={i} 
            className="transition-all duration-300 flex flex-col items-center gap-1"
            style={{ 
              color: hoveredIndex === i ? color : undefined,
              opacity: hoveredIndex === i ? 1 : 0.6,
              transform: hoveredIndex === i ? 'translateY(-2px)' : 'translateY(0)',
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
};
