'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 focus:outline-none ring-offset-2 focus:ring-2 ring-orange-500/50"
      aria-label="Toggle Theme"
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out ${
            theme === 'dark' 
              ? 'opacity-0 rotate-90 scale-50' 
              : 'opacity-100 rotate-0 scale-100'
          }`} 
        />
        <Moon 
          className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-50'
          }`} 
        />
      </div>
    </button>
  );
};
