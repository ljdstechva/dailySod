'use client';

import React from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface DataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  color = '#3b82f6', 
  height = 200 
}) => {
  const { theme } = useTheme();
  
  const padding = 20;
  const maxValue = Math.max(...data.map(d => d.value)) * 1.1; // 10% headroom
  const barWidthPercent = 60; // Percent of the slot width

  // Helper to get coordinates
  const getY = (value: number) => 100 - (value / maxValue) * 100;

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none" 
        className="w-full h-full overflow-visible"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke={theme === 'dark' ? '#334155' : '#e2e8f0'}
            strokeWidth="0.5"
            strokeDasharray="2"
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const slotWidth = 100 / data.length;
          const x = i * slotWidth + (slotWidth * (100 - barWidthPercent) / 200);
          const barWidth = (slotWidth * barWidthPercent) / 100;
          const barHeight = 100 - getY(d.value);
          
          return (
            <g key={i} className="group">
              <rect
                x={x}
                y={getY(d.value)}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="1"
                className="transition-all duration-500 hover:opacity-80"
              />
              {/* Tooltip hint on hover (simple opacity toggle) */}
              <rect 
                x={x - 2} 
                y={0} 
                width={barWidth + 4} 
                height={100} 
                fill="transparent" 
                className="cursor-pointer"
              />
            </g>
          );
        })}
      </svg>
      
      {/* X-Axis Labels */}
      <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium px-1">
        {data.map((d, i) => (
          <div key={i} className="text-center" style={{ width: `${100 / data.length}%` }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
};
