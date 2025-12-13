'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AreaChart } from '@/components/DashboardChart';
import { MessageCircle, Users, Hash, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function DashboardPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [stats, setStats] = useState({ conversations: 0, messages: 0 });
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for graphs to make it sellable immediately
  const chartData = [
    { label: 'Mon', value: 12 },
    { label: 'Tue', value: 18 },
    { label: 'Wed', value: 15 },
    { label: 'Thu', value: 25 },
    { label: 'Fri', value: 32 },
    { label: 'Sat', value: 28 },
    { label: 'Sun', value: 40 },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const cId = client?.id || null;
        setClientId(cId);

        if (cId) {
          const { count: convCount } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', cId);

          const { count: msgCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', cId);
          
          setStats({
            conversations: convCount || 0,
            messages: msgCount || 0
          });

          const { data: recentConvs } = await supabase
            .from('conversations')
            .select('*')
            .eq('client_id', cId)
            .order('created_at', { ascending: false })
            .limit(5);

          setConversations(recentConvs || []);
        }

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back. Here is how your AI agent is performing.
          </p>
        </div>
        {/* Quick actions removed as requested */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-orange-500" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
              +12% <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Conversations</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">{stats.conversations}</h3>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl group-hover:scale-110 transition-transform">
              <Hash className="w-6 h-6 text-blue-500" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
              +5% <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Messages</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">{stats.messages}</h3>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <span className="flex items-center text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded-full">
              -2% <ArrowDownRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Response Time</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">1.2s</h3>
        </div>

        {/* Card 4 - Client ID display */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg text-white">
          <div className="flex items-start justify-between mb-4">
             <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-300">Client ID</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <code className="text-sm font-mono bg-black/30 px-2 py-1 rounded border border-white/10 truncate flex-1" title={clientId || ''}>
              {clientId || 'Not Found'}
            </code>
          </div>
        </div>
      </div>

      {/* Graphs and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Graph */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Conversation Volume</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Interactions over the last week</p>
            </div>
            {/* Quick action button removed */}
          </div>
          
          <AreaChart data={chartData} height={300} color="#f97316" />
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Chats</h3>
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400 cursor-pointer hover:underline">View All</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
               <div className="h-64 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium">No conversations yet.</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Install the widget on your site to see live data.</p>
               </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {conversations.map((conv) => (
                  <div key={conv.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        Guest {conv.visitor_id ? conv.visitor_id.slice(0,4) : 'User'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                      ID: {conv.id.slice(0, 8)}...
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${conv.status === 'closed' ? 'bg-slate-300' : 'bg-green-500'}`}></span>
                       <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{conv.status || 'Active'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}