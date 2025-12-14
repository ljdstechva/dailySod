import React from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'DailySod',
  description: 'AI Customer Support Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    colors: {
                      orange: {
                        50: '#fff7ed',
                        100: '#ffedd5',
                        200: '#fed7aa',
                        300: '#fdba74',
                        400: '#fb923c',
                        500: '#f97316',
                        600: '#ea580c',
                        700: '#c2410c',
                        800: '#9a3412',
                        900: '#7c2d12',
                      }
                    },
                    animation: {
                      'fade-in': 'fadeIn 0.3s ease-out forwards',
                      'modal-up': 'modalUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                      'slide-in-right': 'slideInRight 0.3s ease-out forwards',
                      'page-enter': 'pageEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                      'slide-up-fade': 'slideUpFade 0.4s ease-out forwards',
                    },
                    keyframes: {
                      fadeIn: {
                        '0%': { opacity: '0' },
                        '100%': { opacity: '1' },
                      },
                      modalUp: {
                        '0%': { transform: 'translateY(24px) scale(0.96)', opacity: '0' },
                        '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
                      },
                      slideInRight: {
                        '0%': { transform: 'translateX(10px)', opacity: '0' },
                        '100%': { transform: 'translateX(0)', opacity: '1' },
                      },
                      pageEnter: {
                        '0%': { transform: 'translateY(10px)', opacity: '0' },
                        '100%': { transform: 'translateY(0)', opacity: '1' },
                      },
                      slideUpFade: {
                        '0%': { transform: 'translateY(10px)', opacity: '0' },
                        '100%': { transform: 'translateY(0)', opacity: '1' },
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}