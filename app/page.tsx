'use client';

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MessageSquare, ShieldCheck, Zap, ArrowRight, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-orange-500/30">
      
      {/* Abstract Background Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-soft-light"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-slate-900 dark:text-white">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            DailySod
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-6">
              <Link 
                href="/login" 
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Log in
              </Link>
              <Link 
                href="/register" 
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative z-10">
        <section className="pt-28 pb-32 flex flex-col items-center text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold tracking-wide uppercase mb-8 border border-orange-100 dark:border-orange-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            New: GPT-5 Integration
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-slate-900 dark:text-white">
            Turn Website Chats Into Real Customers <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">while you sleep.</span>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed antialiased">
            An AI chat widget that answers questions, captures leads, and supports customers in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
            <Link 
              href="/register" 
              className="w-full sm:w-auto bg-orange-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 group"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
            >
              View Demo
            </Link>
          </div>
          
          <div className="mt-12 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-500">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-950"></div>
              ))}
            </div>
            <p>Trusted by 500+ companies</p>
          </div>
        </section>

        {/* Features Cards */}
        <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/50">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <MessageSquare className="w-6 h-6 text-orange-500" />,
                  title: 'Contextual AI Chat',
                  desc: 'It doesn\'t just match keywords. It understands intent and answers complex queries naturally.'
                },
                {
                  icon: <BarChart3 className="w-6 h-6 text-orange-500" />,
                  title: 'Real-time Analytics',
                  desc: 'Track resolution rates, sentiment, and volume in a beautiful real-time dashboard.'
                },
                {
                  icon: <Zap className="w-6 h-6 text-orange-500" />,
                  title: 'One-click Install',
                  desc: 'Drop our lightweight Javascript snippet into your site and you are live instantly.'
                }
              ].map((feature, i) => (
                <div key={i} className="group p-8 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-orange-500/20 hover:shadow-lg dark:hover:shadow-orange-900/10 transition-all duration-300">
                  <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white">
              <Zap className="w-3 h-3 fill-current" />
            </div>
            DailySod
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} DailySod Inc. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#" className="hover:text-orange-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Terms</a>
            <a href="#" className="hover:text-orange-500 transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
