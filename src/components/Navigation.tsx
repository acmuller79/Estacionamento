import { Car, LayoutDashboard, BarChart3, Ticket } from 'lucide-react';
import { cn } from '../lib/utils';

export function Navigation({ 
  activeTab, 
  setActiveTab 
}: { 
  activeTab: string; 
  setActiveTab: (v: any) => void;
}) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-slate-900 text-white flex-col h-full border-r border-slate-800 shrink-0">
        <div className="p-6 flex items-center gap-3">
          <Car className="w-8 h-8 text-emerald-400" />
          <h1 className="text-xl font-bold tracking-tight">SmartPark</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => setActiveTab('admin')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === 'admin' 
                ? "bg-slate-800 text-emerald-400 font-medium" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            Vagas
          </button>
          <button
            onClick={() => setActiveTab('kiosk')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === 'kiosk' 
                ? "bg-slate-800 text-emerald-400 font-medium" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <Ticket className="w-5 h-5" />
            Scanner Mobile
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
              activeTab === 'reports' 
                ? "bg-slate-800 text-emerald-400 font-medium" 
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            )}
          >
            <BarChart3 className="w-5 h-5" />
            Relatórios
          </button>
        </nav>

        <div className="p-4 text-xs text-slate-500 font-mono text-center mb-4">
          SISTEMA ATIVO • v1.0.2
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 text-white flex justify-around items-center h-16 pb-safe">
        <button
          onClick={() => setActiveTab('admin')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full",
            activeTab === 'admin' ? "text-emerald-400" : "text-slate-400"
          )}
        >
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Vagas</span>
        </button>
        <button
          onClick={() => setActiveTab('kiosk')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full",
            activeTab === 'kiosk' ? "text-emerald-400" : "text-slate-400"
          )}
        >
          <Ticket className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Scanner</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full",
            activeTab === 'reports' ? "text-emerald-400" : "text-slate-400"
          )}
        >
          <BarChart3 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Relatórios</span>
        </button>
      </div>
    </>
  );
}
