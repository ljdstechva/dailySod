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
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const maxValue = Math.max(...data.map(d => d.value)) * 1.2;
  const maxX = data.length - 1;
  
  const getX = (index: number) => (index / maxX) * 100;
  const getY = (value: number) => 100 - (value / maxValue) * 100;

  const points = useMemo(() => data.map((d, i) => [getX(i), getY(d.value)]), [data, maxValue, maxX]);
  
  const linePathDefinition = useMemo(() => svgPath(points, bezierCommand), [points]);
  const areaPathDefinition = `${linePathDefinition} L 100,100 L 0,100 Z`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.round((x / rect.width) * (data.length - 1));
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

        {/* Active Point Highlight - Small Animated Circle */}
        <circle
          cx={hoveredIndex !== null ? getX(hoveredIndex) : 0}
          cy={hoveredIndex !== null ? getY(data[hoveredIndex].value) : 0}
          r="3"
          fill={theme === 'dark' ? '#0f172a' : '#fff'}
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="transition-all duration-200 ease-out"
          style={{ 
            opacity: hoveredIndex !== null ? 1 : 0,
            transform: hoveredIndex !== null ? 'scale(1)' : 'scale(0)',
            transformOrigin: 'center'
          }}
        />
        
        {/* Outer Glow Ring for Active Point */}
        <circle
          cx={hoveredIndex !== null ? getX(hoveredIndex) : 0}
          cy={hoveredIndex !== null ? getY(data[hoveredIndex].value) : 0}
          r="8"
          fill={color}
          className="transition-all duration-200 ease-out"
          style={{ 
            opacity: hoveredIndex !== null ? 0.2 : 0,
            transform: hoveredIndex !== null ? 'scale(1)' : 'scale(0)',
            transformOrigin: 'center'
          }}
        />
      </svg>
      
      {/* Floating Minimalist Tooltip */}
      <div 
        className={`absolute pointer-events-none z-20 transition-all duration-200 ease-out ${
          hoveredIndex !== null ? 'opacity-100 translate-y-[-12px]' : 'opacity-0 translate-y-[0px]'
        }`}
        style={{ 
          left: hoveredIndex !== null ? `${getX(hoveredIndex)}%` : '50%',
          top: hoveredIndex !== null ? `${getY(activeValue)}%` : '50%',
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap">
          <span>{activeValue}</span>
          <span className="opacity-60 border-l border-white/20 dark:border-black/10 pl-2 uppercase tracking-wider text-[10px]">
            {activeLabel}
          </span>
        </div>
        {/* Small Triangle Indicator */}
        <div 
          className="w-2 h-2 bg-slate-900 dark:bg-white rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1 z-10 rounded-[1px]"
        ></div>
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