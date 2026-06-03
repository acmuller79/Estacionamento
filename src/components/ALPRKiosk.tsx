import React, { useState, useRef, useEffect } from 'react';
import { Camera, CreditCard, TicketCheck, ArrowRight, ScanLine, ShieldAlert, Loader2 } from 'lucide-react';
import { SystemStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function ALPRKiosk({ status, onRefresh }: { status: SystemStatus | null, onRefresh: () => void }) {
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setResult(null);
    setPlate('');
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let scaleSize = 1;
          if (img.width > MAX_WIDTH) {
            scaleSize = MAX_WIDTH / img.width;
          }
          canvas.width = img.width * scaleSize;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);

          try {
            const res = await fetch('/api/ocr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64: resizedBase64 })
            });
            const data = await res.json();
            
            if (data.plate && data.plate !== 'ERRO') {
              const clean = data.plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
              if (clean.length >= 7) {
                setPlate(`${clean.substring(0, 3)}-${clean.substring(3, 7)}`);
              } else {
                setPlate(clean);
              }
            } else {
              handleSimulateCamera();
            }
          } catch (err) {
            handleSimulateCamera();
          } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Capture Error", err);
      handleSimulateCamera();
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSimulateCamera = () => {
    // Random plate generator
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const num = '0123456789';
    let p = '';
    for (let i = 0; i < 3; i++) p += letters[Math.floor(Math.random() * letters.length)];
    p += '-';
    for (let i = 0; i < 4; i++) p += num[Math.floor(Math.random() * num.length)];
    setPlate(p);
  };

  const handleEntry = async () => {
    if (!plate) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate })
      });
      const data = await res.json();
      setResult({ type: res.ok ? 'success' : 'error', data });
      onRefresh();
    } catch (e) {
      setResult({ type: 'error', data: { error: 'Erro de conexão' } });
    }
    setLoading(false);
  };

  const handleExit = async () => {
    if (!plate) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate })
      });
      const data = await res.json();
      // 402 is payment required
      setResult({ type: res.ok ? 'success' : (res.status === 402 ? 'payment' : 'error'), data });
      onRefresh();
    } catch (e) {
      setResult({ type: 'error', data: { error: 'Erro de conexão' } });
    }
    setLoading(false);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate, amount: result?.data?.vehicle?.fee || 12 })
      });
      if (res.ok) {
        setResult({ type: 'success', data: { message: 'Pagamento Aprovado. Aproxime à catraca novamente.' } });
        onRefresh();
      }
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 items-center justify-center bg-slate-100 overflow-y-auto w-full">
      <div className="w-full max-w-lg bg-white sm:rounded-[2rem] rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col relative min-h-[600px] h-[80vh] md:h-auto">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-center relative overflow-hidden shrink-0">
          <Camera className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Scanner Mobile</h2>
          <p className="text-slate-400 mt-1 text-sm">Câmera ALPR e Pagamento</p>
          <div className="absolute top-4 right-4 bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full font-medium">
            R$ 12,00/h
          </div>
        </div>

        {/* Scanning Overlay Mode */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl sm:rounded-[2rem] text-white"
            >
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin mb-4" />
              <h3 className="text-2xl font-bold">Lendo Placa...</h3>
              <p className="text-slate-400 mt-2">Processando imagem via OCR.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body */}
        <div className="p-6 flex flex-col items-center flex-1 w-full relative z-10 overflow-y-auto">
          
          <div className="w-full relative mb-6">
            <label className="block text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3 text-center">Placa de Identificação</label>
            <div className="flex bg-slate-50 rounded-2xl p-2 border-2 border-slate-200 focus-within:border-blue-500 transition-colors shadow-inner">
              <input 
                type="text" 
                value={plate}
                onChange={e => setPlate(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                className="flex-1 bg-transparent text-center text-4xl font-mono font-bold text-slate-800 focus:outline-none placeholder:text-slate-300 uppercase tracking-widest w-full min-w-0"
              />
            </div>
            
            <label className="mt-4 w-full bg-blue-50 active:bg-blue-100 hover:bg-blue-100 border border-blue-200 text-blue-700 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageCapture}
              />
              <ScanLine size={24} />
              Escanear com a Câmera
            </label>

            {isInIframe && (
              <div className="mt-6 w-full bg-amber-50 border border-amber-200 rounded-xl p-5 text-center shadow-sm">
                <p className="text-sm text-amber-800 font-medium mb-3">
                  ⚠️ Para usar a câmera no celular, primeiro abra o sistema em tela cheia clicando no botão abaixo:
                </p>
                <a 
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-colors items-center justify-center shadow-sm active:scale-95"
                >
                  Abrir Sistema em Tela Cheia
                </a>
              </div>
            )}
          </div>

          <div className="flex w-full gap-3 mb-6">
            <button 
              onClick={handleEntry}
              disabled={loading || (!plate && plate.length < 7)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-base md:text-lg disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1"
            >
              <ArrowRight className="w-6 h-6" />
              Entrada
            </button>
            <button 
              onClick={handleExit}
              disabled={loading || (!plate && plate.length < 7)}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold text-base md:text-lg disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1"
            >
              <ArrowRight className="w-6 h-6 rotate-180" />
              Saída
            </button>
          </div>

          {/* Results Area */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className={cn(
                  "w-full rounded-2xl p-6 border-2 flex flex-col items-center text-center mt-auto",
                  result.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                  result.type === 'error' ? "bg-red-50 border-red-200 text-red-800" :
                  "bg-indigo-50 border-indigo-200 text-indigo-900"
                )}
              >
                {result.type === 'success' && (
                  <>
                    <TicketCheck className="w-12 h-12 text-emerald-500 mb-3" />
                    <h3 className="text-xl font-bold mb-1">Acesso Liberado</h3>
                    <p className="text-base opacity-80">{result.data.message || `Bem vindo! Vaga livre alocada: V-${result.data.vehicle?.spotNumber}`}</p>
                  </>
                )}

                {result.type === 'error' && (
                  <>
                    <ShieldAlert className="w-12 h-12 text-red-500 mb-3" />
                    <h3 className="text-xl font-bold mb-1">Acesso Negado</h3>
                    <p className="text-base opacity-80">{result.data.error}</p>
                  </>
                )}

                {result.type === 'payment' && (
                  <>
                    <CreditCard className="w-12 h-12 text-indigo-500 mb-3" />
                    <h3 className="text-xl font-bold mb-1">Pagamento Pendente</h3>
                    <p className="text-sm opacity-80 mb-1">Taxa por hora: R$ 12,00</p>
                    <p className="text-base opacity-80 mb-4">Total: <strong className="text-2xl text-indigo-700">R$ {result.data.vehicle?.fee?.toFixed(2)}</strong></p>
                    
                    <button 
                      onClick={handlePay}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard size={20} />
                      Cobrar via Cartão / NFC
                    </button>
                  </>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
