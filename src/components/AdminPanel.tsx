import React from 'react';
import { motion } from 'motion/react';
import { SystemStatus, EventLog } from '../types';
import { cn } from '../lib/utils';
import { Car, Clock, ShieldAlert } from 'lucide-react';

export function AdminPanel({ status }: { status: SystemStatus | null, onRefresh: () => void }) {
  if (!status) return <div className="p-8 flex-1 flex items-center justify-center">Carregando...</div>;

  const totalSpots = status.totalSpots;
  const spotsArray = Array.from({ length: totalSpots }, (_, i) => i + 1);
  const occupiedSpots = new Map(status.activeVehicles.map(v => [v.spotNumber, v]));

  // Progress variables
  const occPercentage = ((status.totalSpots - status.availableSpots) / status.totalSpots) * 100;

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-white">
      {/* Vagas Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 border-b md:border-b-0 md:border-r border-slate-100">
        <header className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Dashboard de Vagas</h2>
          <p className="text-slate-500 mt-1 md:mt-2 text-base md:text-lg">Visão em tempo real da ocupação do pátio.</p>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
          <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Vagas Livres</p>
              <p className="text-3xl md:text-4xl font-bold text-emerald-500">{status.availableSpots}</p>
            </div>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Car className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
          <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Ocupadas</p>
              <p className="text-3xl md:text-4xl font-bold text-amber-500">{status.totalSpots - status.availableSpots}</p>
            </div>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <Car className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
          <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Ocupação Atual</p>
              <p className="text-3xl md:text-4xl font-bold text-indigo-500">{occPercentage.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
        </div>

        {/* Grid itself */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 md:gap-3">
          {spotsArray.map(spotId => {
            const vehicle = occupiedSpots.get(spotId);
            const isOccupied = !!vehicle;
            return (
              <motion.div
                key={spotId}
                layoutId={`spot-${spotId}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center relative group transition-colors",
                  isOccupied 
                    ? vehicle.paid ? "bg-amber-100 border border-amber-200" : "bg-red-100 border border-red-200"
                    : "bg-emerald-50 border border-emerald-100"
                )}
              >
                <span className={cn(
                  "text-lg md:text-xl font-bold z-10",
                  isOccupied ? "text-slate-800" : "text-emerald-300"
                )}>
                  {spotId}
                </span>

                {isOccupied && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-slate-900/90 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  >
                    <span className="font-mono font-bold tracking-wider text-xs md:text-base">{vehicle.plate}</span>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="w-full md:w-96 bg-slate-50 flex flex-col shrink-0 h-[400px] md:h-auto border-t md:border-t-0">
        <div className="p-4 md:p-6 border-b border-slate-200 bg-white shrink-0">
          <h3 className="font-bold text-slate-800 text-base md:text-lg">Log de Atividades</h3>
          <p className="text-xs md:text-sm text-slate-500">Leituras ALPR em tempo real</p>
        </div>
        <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-4">
          {status.recentEvents.map((log: EventLog) => (
            <motion.div 
              key={log.id} 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 md:gap-4 items-start"
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 mt-1",
                log.type === 'ENTRY' ? "bg-emerald-100 text-emerald-600 border-emerald-200" :
                log.type === 'EXIT' ? "bg-amber-100 text-amber-600 border-amber-200" :
                log.type === 'PAYMENT' ? "bg-indigo-100 text-indigo-600 border-indigo-200" :
                "bg-red-100 text-red-600 border-red-200"
              )}>
                {log.type === 'ALERT' ? <ShieldAlert size={18} /> : <Car size={18} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800 text-sm tracking-widest">{log.plate}</span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5 leading-snug">{log.details}</p>
              </div>
            </motion.div>
          ))}
          {status.recentEvents.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-10">Nenhuma atividade recente.</p>
          )}
        </div>
      </div>
    </div>
  );
}
