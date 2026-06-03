import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { AdminPanel } from './components/AdminPanel';
import { ALPRKiosk } from './components/ALPRKiosk';
import { ReportsPanel } from './components/ReportsPanel';
import { SystemStatus } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'admin' | 'kiosk' | 'reports'>('admin');
  const [status, setStatus] = useState<SystemStatus | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 flex flex-col h-full overflow-hidden pb-16 md:pb-0 relative">
        {activeTab === 'admin' && <AdminPanel status={status} onRefresh={fetchStatus} />}
        {activeTab === 'kiosk' && <ALPRKiosk status={status} onRefresh={fetchStatus} />}
        {activeTab === 'reports' && <ReportsPanel />}
      </main>
    </div>
  );
}
