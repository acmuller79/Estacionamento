import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { randomUUID } from 'crypto';
import { GoogleGenAI } from '@google/genai';

const TOTAL_SPOTS = 50;
const HOURLY_RATE = 12.00;

// State
let activeVehicles = new Map<string, any>();
let eventLogs: any[] = [];
const generateSeedReports = () => {
  const reports = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    reports.push({
      date: d.toISOString().split('T')[0],
      entries: Math.floor(Math.random() * 50) + 20,
      revenue: Math.floor(Math.random() * 300) + 100,
      occupancyRate: Math.floor(Math.random() * 40) + 40, // 40-80%
    });
  }
  return reports;
};
let dailyReports = generateSeedReports();

const addLog = (type: string, plate: string, details: string) => {
  eventLogs.unshift({
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    plate,
    details
  });
  if (eventLogs.length > 50) eventLogs.pop();
};

const getAvailableSpots = () => {
  const occupiedSpots = new Set(Array.from(activeVehicles.values()).map(v => v.spotNumber));
  const freeSpots = [];
  for (let i = 1; i <= TOTAL_SPOTS; i++) {
    if (!occupiedSpots.has(i)) freeSpots.push(i);
  }
  return freeSpots;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // APIs
  app.post('/api/ocr', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ error: 'No image' });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Extraia apenas a placa de identificação de veículo (padrão Brasil/Mercosul) contida nesta imagem. Ignore qualquer outro texto. Retorne a resposta exclusivamente no formato "ABC1234" ou "ABC1D23", sem traços e sem espaços. Se não for possível ler nenhuma placa, retorne "ERRO".' },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64.split(',')[1] || imageBase64
                }
              }
            ]
          }
        ]
      });

      const txt = response.text?.trim() || 'ERRO';
      res.json({ plate: txt });
    } catch (err) {
      console.error('OCR Error:', err);
      res.status(500).json({ error: 'OCR failed' });
    }
  });
  app.get('/api/status', (req, res) => {
    res.json({
      totalSpots: TOTAL_SPOTS,
      availableSpots: getAvailableSpots().length,
      activeVehicles: Array.from(activeVehicles.values()),
      recentEvents: eventLogs.slice(0, 15)
    });
  });

  app.post('/api/entry', (req, res) => {
    const { plate } = req.body;
    if (!plate) return res.status(400).json({ error: 'Placa é obrigatória' });
    
    // Check if Plate is already in
    const existing = Array.from(activeVehicles.values()).find(v => v.plate === plate);
    if (existing) {
       return res.status(400).json({ error: 'Veículo já está no estacionamento' });
    }

    const freeSpots = getAvailableSpots();
    if (freeSpots.length === 0) {
      addLog('ALERT', plate, 'Tentativa de entrada: Estacionamento Lotado');
      return res.status(400).json({ error: 'Estacionamento Lotado' });
    }

    const spotNumber = freeSpots[0];
    const vehicle = {
      id: randomUUID(),
      plate: plate.toUpperCase(),
      entryTime: new Date().toISOString(),
      paid: false,
      spotNumber
    };

    activeVehicles.set(vehicle.id, vehicle);
    addLog('ENTRY', vehicle.plate, `Entrou na vaga ${spotNumber}`);

    // Update today's report minimally
    const todayStr = new Date().toISOString().split('T')[0];
    let todayRep = dailyReports.find(r => r.date === todayStr);
    if (todayRep) {
      todayRep.entries++;
    }

    res.json({ success: true, vehicle });
  });

  app.post('/api/exit', (req, res) => {
    const { plate } = req.body;
    const vehicle = Array.from(activeVehicles.values()).find(v => v.plate === plate?.toUpperCase());
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    if (!vehicle.paid) {
      // Calculate missing fee
      const entryTime = new Date(vehicle.entryTime);
      const exitTime = new Date();
      let diffMs = exitTime.getTime() - entryTime.getTime();
      let diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      // if it's less than 1 hour it's still 1 hr minimum typically, but to demonstrate fast usage, let's charge at least 1 hr
      if (diffHours < 1) diffHours = 1;
      
      const fee = diffHours * HOURLY_RATE;
      
      return res.status(402).json({ 
        error: 'Pagamento pendente', 
        vehicle: { ...vehicle, exitTime: exitTime.toISOString(), fee } 
      });
    }

    // Process Exit
    activeVehicles.delete(vehicle.id);
    addLog('EXIT', vehicle.plate, `Saiu da vaga ${vehicle.spotNumber}`);

    res.json({ success: true, message: 'Catraca Liberada' });
  });

  app.post('/api/pay', (req, res) => {
    const { plate, amount } = req.body;
    const vehicle = Array.from(activeVehicles.values()).find(v => v.plate === plate?.toUpperCase());
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    vehicle.paid = true;
    addLog('PAYMENT', vehicle.plate, `Pagamento Aprovado: R$ ${(amount || 12).toFixed(2)}`);

    // Add to revenue
    const todayStr = new Date().toISOString().split('T')[0];
    let todayRep = dailyReports.find(r => r.date === todayStr);
    if (todayRep) {
      todayRep.revenue += Number(amount) || 12;
    }

    res.json({ success: true });
  });

  app.get('/api/reports', (req, res) => {
    res.json({ dailyReports });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
