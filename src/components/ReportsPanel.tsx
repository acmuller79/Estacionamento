import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { DailyReport } from '../types';
import { Calendar, TrendingUp, Download, PieChart, Users, DollarSign, Car } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ReportsPanel() {
  const [reports, setReports] = useState<DailyReport[]>([]);

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        // Sort chronologically ascending
        const sorted = data.dailyReports.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setReports(sorted);
      });
  }, []);

  if (reports.length === 0) return <div className="p-8 flex-1 flex items-center justify-center">Carregando relatórios...</div>;

  const totalRevenue = reports.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalEntries = reports.reduce((acc, curr) => acc + curr.entries, 0);
  const avgOccupancy = reports.reduce((acc, curr) => acc + curr.occupancyRate, 0) / reports.length;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-50">
      <header className="mb-6 md:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Relatórios Analíticos</h2>
          <p className="text-slate-500 mt-1 md:mt-2 text-base md:text-lg">Métricas e faturamentos dos últimos 7 dias.</p>
        </div>
        <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 md:px-5 md:py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors shadow-sm w-full sm:w-auto">
          <Download size={18} />
          Exportar CSV
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Faturamento (7d)</p>
            <p className="text-3xl md:text-4xl font-bold text-slate-900">
              <span className="text-xl md:text-2xl text-slate-400 mr-1">R$</span>
              {totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs md:text-sm text-emerald-500 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp size={14} /> +12% do último período
            </p>
          </div>
          <div className="bg-emerald-50 p-3 md:p-4 rounded-xl text-emerald-600">
            <DollarSign size={20} className="md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Tickets Emitidos</p>
            <p className="text-3xl md:text-4xl font-bold text-slate-900">{totalEntries}</p>
            <p className="text-xs md:text-sm text-emerald-500 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp size={14} /> +5.4% do último período
            </p>
          </div>
          <div className="bg-blue-50 p-3 md:p-4 rounded-xl text-blue-600">
            <Users size={20} className="md:w-6 md:h-6" />
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Ocupação Média</p>
            <p className="text-3xl md:text-4xl font-bold text-slate-900">{avgOccupancy.toFixed(1)}%</p>
            <p className="text-xs md:text-sm text-amber-500 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp size={14} /> Estável
            </p>
          </div>
          <div className="bg-amber-50 p-3 md:p-4 rounded-xl text-amber-600">
            <PieChart size={20} className="md:w-6 md:h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Faturamento Chart */}
        <div className="bg-white p-5 md:p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
            <DollarSign className="text-emerald-500" size={20} />
            Receita Diária
          </h3>
          <div className="flex-1 min-h-[250px] md:min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(parseISO(val), 'dd/MM', { locale: ptBR })}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b' }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
                  labelFormatter={(val) => format(parseISO(val as string), "d 'de' MMMM", { locale: ptBR })}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume de Entradas Chart */}
        <div className="bg-white p-5 md:p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
            <Car className="text-blue-500" size={20} />
            Volume de Entradas
          </h3>
          <div className="flex-1 min-h-[250px] md:min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reports} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => format(parseISO(val), 'dd/MM', { locale: ptBR })}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b' }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} veículos`, 'Entradas']}
                  labelFormatter={(val) => format(parseISO(val as string), "d 'de' MMMM", { locale: ptBR })}
                />
                <Line 
                  type="monotone" 
                  dataKey="entries" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
