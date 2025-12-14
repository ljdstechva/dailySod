"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AreaChart } from "@/components/DashboardChart";
import {
  MessageCircle,
  Users,
  Hash,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Conversation = {
  id: string;
  client_id: string;
  session_id: string;
  page_url: string | null;
  user_agent: string | null;
  created_at: string;
  last_message_at: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender: "user" | "assistant";
  content: string;
  created_at?: string;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toISO(d: Date) {
  return d.toISOString();
}

function dayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export default function DashboardPage() {
  const [clientId, setClientId] = useState<string | null>(null);

  const [stats, setStats] = useState({
    conversations: 0,
    messages: 0,
  });

  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [chatModalOpen, setChatModalOpen] = useState(false);

  // Accordion state
  const [openConvId, setOpenConvId] = useState<string | null>(null);

  // Messages state
  const [messagesByConv, setMessagesByConv] = useState<Record<string, MessageRow[]>>({});
  const [loadingMsgs, setLoadingMsgs] = useState<Record<string, boolean>>({});
  const [msgLimitByConv, setMsgLimitByConv] = useState<Record<string, number>>({});

  // Pagination for modal list
  const [visibleChatCount, setVisibleChatCount] = useState(4);

  // Modal ref for outside clicks
  const modalRef = useRef<HTMLDivElement>(null);

  // Prevent double fetch
  const pendingFetchRef = useRef<Record<string, boolean>>({});

  // ---- Data Loading ----
  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr) throw userErr;
        if (!user) return;

        const { data: client, error: clientErr } = await supabase
          .from("clients")
          .select("id")
          .eq("owner_user_id", user.id)
          .single();

        if (clientErr) throw clientErr;

        const cId = client?.id ?? null;
        setClientId(cId);

        if (!cId) return;

        // Chart Data (Last 7 Days)
        const today = startOfDay(new Date());
        const from = new Date(today);
        from.setDate(from.getDate() - 6);

        const { data: convs7d, error: conv7dErr } = await supabase
          .from("conversations")
          .select("id, client_id, session_id, page_url, user_agent, created_at, last_message_at")
          .eq("client_id", cId)
          .gte("created_at", toISO(from))
          .lte("created_at", toISO(new Date()))
          .order("created_at", { ascending: true });

        if (conv7dErr) throw conv7dErr;

        const convRows = (convs7d ?? []) as Conversation[];

        const dayCounts = new Map<string, number>();
        for (let i = 0; i < 7; i++) {
          const d = new Date(from);
          d.setDate(from.getDate() + i);
          dayCounts.set(startOfDay(d).toISOString(), 0);
        }

        for (const c of convRows) {
          const d = startOfDay(new Date(c.created_at)).toISOString();
          if (dayCounts.has(d)) dayCounts.set(d, (dayCounts.get(d) || 0) + 1);
        }

        setChartData(
          Array.from(dayCounts.entries()).map(([iso, count]) => ({
            label: dayLabel(new Date(iso)),
            value: count,
          }))
        );

        const convCount7d = convRows.length;
        const convIds7d = convRows.map((c) => c.id);
        let msgCount7d = 0;

        if (convIds7d.length > 0) {
          const { count: mCount, error: mErr } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .in("conversation_id", convIds7d);

          if (mErr) throw mErr;
          msgCount7d = mCount || 0;
        }

        setStats({ conversations: convCount7d, messages: msgCount7d });

        // Recent conversations for list/modal
        const { data: recent, error: recentErr } = await supabase
          .from("conversations")
          .select("id, client_id, session_id, page_url, user_agent, created_at, last_message_at")
          .eq("client_id", cId)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(50);

        if (recentErr) throw recentErr;

        setRecentConversations((recent ?? []) as Conversation[]);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  // ---- Modal & Interaction ----
  const openModal = useCallback(() => setChatModalOpen(true), []);
  const closeModal = useCallback(() => {
    setChatModalOpen(false);
    setOpenConvId(null);
    setVisibleChatCount(4);
  }, []);

  useEffect(() => {
    if (!chatModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    const onClickOutside = (e: MouseEvent | TouchEvent) => {
      if (!modalRef.current) return;
      if (!modalRef.current.contains(e.target as Node)) {
        closeModal();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("touchstart", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("touchstart", onClickOutside);
    };
  }, [chatModalOpen, closeModal]);

  async function loadMessages(conversationId: string, limit: number) {
    try {
      if (pendingFetchRef.current[conversationId]) return;
      pendingFetchRef.current[conversationId] = true;

      setLoadingMsgs((p) => ({ ...p, [conversationId]: true }));

      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;

      setMessagesByConv((p) => ({
        ...p,
        [conversationId]: (data ?? []) as MessageRow[],
      }));
    } catch (e) {
      console.error("loadMessages failed:", e);
    } finally {
      pendingFetchRef.current[conversationId] = false;
      setLoadingMsgs((p) => ({ ...p, [conversationId]: false }));
    }
  }

  async function openConversation(conversationId: string) {
    if (openConvId === conversationId) {
      setOpenConvId(null);
      return;
    }
    setOpenConvId(conversationId);
    const currentLimit = msgLimitByConv[conversationId] ?? 4;
    const initialLimit = Math.max(currentLimit, 4);

    setMsgLimitByConv((p) => ({ ...p, [conversationId]: initialLimit }));
    await loadMessages(conversationId, initialLimit);
  }

  async function showMoreMessages(conversationId: string) {
    const current = msgLimitByConv[conversationId] ?? 4;
    const next = current + 10;
    setMsgLimitByConv((p) => ({ ...p, [conversationId]: next }));
    await loadMessages(conversationId, next);
  }

  const modalChats = useMemo(() => {
    return recentConversations.slice(0, visibleChatCount);
  }, [recentConversations, visibleChatCount]);

  // Logic: Show More button only if there are actually more chats to see than currently visible.
  // Initial visibleChatCount is 4. So if total <= 4, this is false.
  const hasMoreChatsToLoad = recentConversations.length > visibleChatCount;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back. Here is how your AI agent is performing.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Conversations */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 group animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <MessageCircle className="w-6 h-6 text-orange-500" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
              +12% <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Conversations (7d)</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white tabular-nums">{stats.conversations}</h3>
        </div>

        {/* Messages */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 group animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Hash className="w-6 h-6 text-blue-500" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
              +5% <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Messages (7d)</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white tabular-nums">{stats.messages}</h3>
        </div>

        {/* Avg Response */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 group animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
              -0.2s <ArrowDownRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Response Time</p>
          <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white tabular-nums">1.2s</h3>
        </div>

        {/* Client ID */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl text-white relative overflow-hidden group animate-slide-up-fade" style={{ animationDelay: '300ms' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none group-hover:bg-white/10 transition-colors duration-500"></div>
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-300 relative z-10">Client ID</p>
          <div className="mt-2 flex items-center justify-between gap-2 relative z-10">
            <code className="text-sm font-mono bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 truncate flex-1 select-all hover:bg-black/50 transition-colors">
              {clientId || "Not Found"}
            </code>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up-fade" style={{ animationDelay: '400ms' }}>
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Conversation Volume</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Interactions over the last 7 days</p>
            </div>
          </div>
          <div className="flex-1 w-full min-h-[300px]">
            <AreaChart data={chartData} height={300} color="#f97316" />
          </div>
        </div>

        {/* Recent Chats List (Preview) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full max-h-[460px]">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Chats</h3>
            <button
              type="button"
              onClick={openModal}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors flex items-center gap-1 group"
            >
              View All <span aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            {recentConversations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No conversations yet.</p>
                <p className="text-xs text-slate-400 mt-1">Waiting for visitors...</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {recentConversations.slice(0, 5).map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      openModal();
                      openConversation(conv.id);
                    }}
                    className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        Guest
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                        {new Date(conv.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                        Active Session
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-mono opacity-60 truncate">
                      {conv.id}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 
        ================================================================
        PREMIUM ANIMATED MODAL 
        ================================================================
      */}
      {chatModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop with premium blur and smooth fade */}
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] animate-fade-in"
            onClick={closeModal}
          />

          {/* Modal Panel with float-up animation */}
          <div ref={modalRef} className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-950 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 animate-modal-up overflow-hidden">
            
            {/* Header */}
            <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Conversation History</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {recentConversations.length} total sessions found
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {recentConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <p>No chat history available.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modalChats.map((conv, index) => {
                    const isOpen = openConvId === conv.id;
                    const msgs = messagesByConv[conv.id] || [];
                    const isLoading = !!loadingMsgs[conv.id];
                    const limit = msgLimitByConv[conv.id] ?? 4;
                    // const hasMoreMessages = msgs.length >= limit;

                    return (
                      <div
                        key={conv.id}
                        className={`
                          rounded-xl border transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
                          ${isOpen 
                            ? "bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-500/30 shadow-md ring-1 ring-orange-500/20" 
                            : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                          }
                        `}
                        // Add stagger animation for list items
                        style={{ 
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => openConversation(conv.id)}
                          className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                              ${isOpen 
                                ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" 
                                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
                              }
                            `}>
                              {conv.user_agent?.includes("Mobile") ? "M" : "D"}
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">Guest User</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                                  {new Date(conv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono opacity-80">
                                {conv.id.slice(0, 18)}...
                              </p>
                            </div>
                          </div>

                          <div className={`
                            transform transition-transform duration-300 
                            ${isOpen ? "rotate-180 text-orange-500" : "text-slate-400"}
                          `}>
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </button>

                        {/* Accordion Content with smooth height animation */}
                        <div
                          className={`
                            grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                            ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
                          `}
                        >
                          <div className="overflow-hidden">
                            <div className="px-5 pb-5 pt-0">
                              <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-4" />
                              
                              <div className="space-y-6 pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-5 relative">
                                {isLoading ? (
                                  <div className="py-4 text-sm text-slate-400 animate-pulse pl-4">Loading conversation...</div>
                                ) : msgs.length === 0 ? (
                                  <div className="py-4 text-sm text-slate-400 pl-4">No messages found.</div>
                                ) : (
                                  msgs.map((m) => (
                                    <div key={m.id} className="relative pl-6 group animate-slide-in-right">
                                      {/* Timeline dot */}
                                      <div className={`
                                        absolute -left-[25px] top-0 w-3 h-3 rounded-full border-2 transition-colors
                                        ${m.sender === "user" 
                                          ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 group-hover:border-slate-400" 
                                          : "border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-900/20 group-hover:border-orange-400"
                                        }
                                      `}></div>
                                      
                                      <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${m.sender === "user" ? "text-slate-500" : "text-orange-600 dark:text-orange-400"}`}>
                                          {m.sender === "user" ? "Visitor" : "AI Agent"}
                                        </span>
                                        {m.created_at && (
                                          <span className="text-[10px] text-slate-400 tabular-nums">
                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                          </span>
                                        )}
                                      </div>
                                      
                                      <div className={`
                                        text-sm leading-relaxed whitespace-pre-wrap rounded-lg p-3
                                        ${m.sender === "user"
                                          ? "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50"
                                          : "text-slate-900 dark:text-slate-100 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20"
                                        }
                                      `}>
                                        {m.content}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Message Pagination Controls */}
                              {isOpen && !isLoading && msgs.length > 0 && (
                                <div className="mt-6 flex justify-center">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showMoreMessages(conv.id);
                                    }}
                                    className="text-xs font-semibold text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors py-2 px-4 rounded-full border border-slate-200 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-900"
                                  >
                                    Refresh Messages
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* 
                     SHOW MORE BUTTON LOGIC:
                     "Show More will only show if chats is greater than 4, but if it's less than 4, then dont show."
                  */}
                  {hasMoreChatsToLoad && (
                    <div className="pt-4 flex justify-center animate-slide-up-fade">
                      <button
                        type="button"
                        onClick={() => setVisibleChatCount(prev => prev + 5)}
                        className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 transition-all duration-300 ease-out hover:text-orange-600 dark:hover:text-orange-400"
                      >
                        <span className="absolute inset-0 w-full h-full bg-slate-100 dark:bg-slate-800/50 rounded-full opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300"></span>
                        <span className="relative flex items-center gap-2">
                          Show More Conversations <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Minimalist Footer Shadow Hint */}
            <div className="h-6 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none absolute bottom-0 left-0 right-0"></div>
          </div>
        </div>
      )}
    </div>
  );
}
