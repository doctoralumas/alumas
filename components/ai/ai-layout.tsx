"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChatText, List, X } from "@phosphor-icons/react";
import HealthNavigator from "@/components/ai/health-navigator";

export default function AiLayout({ history, currentConversationId, initialMessages }: any) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [currentConversationId]);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full max-w-[1400px] mx-auto overflow-hidden relative bg-white border-t border-slate-100">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-[280px] bg-slate-50 border-r border-slate-200 
        flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        h-[100dvh] md:h-auto
      `}>
        <div className="p-4 flex items-center justify-between md:hidden">
          <span className="font-bold text-slate-800">Sohbetler</span>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="p-4 pt-6 md:pt-4">
          <Link href="/ai" className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-sm">
            <span>+</span> Yeni Sohbet
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-1 scrollbar-hide">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-2 mt-2">Geçmiş</div>
          {history.length === 0 ? (
            <div className="px-2 py-3 text-slate-400 text-sm">Henüz sohbet yok.</div>
          ) : (
            history.map((h: any) => (
              <Link 
                key={h.id} 
                href={`/ai?c=${h.id}`} 
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all
                  ${currentConversationId === h.id ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/50 border border-transparent'}
                `}
              >
                <ChatText size={18} weight={currentConversationId === h.id ? "fill" : "regular"} />
                <span className="truncate flex-1">{h.title || "Yeni Sohbet"}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-3 p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <List size={24} />
          </button>
          <div className="font-bold text-slate-800 flex items-center gap-2">
             <div className="w-6 h-6 rounded bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center text-white">
                <ChatText size={14} weight="fill" />
             </div>
             Luma AI
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden pt-[73px] md:pt-0">
          <HealthNavigator 
            initialConversationId={currentConversationId} 
            initialMessages={initialMessages} 
            compact={true}
          />
        </div>
      </div>

    </div>
  );
}
