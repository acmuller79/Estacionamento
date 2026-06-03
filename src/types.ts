export interface VehicleRecord {
  id: string;
  plate: string;
  entryTime: string;
  exitTime?: string;
  paid: boolean;
  spotNumber: number;
  fee?: number;
}

export interface EventLog {
  id: string;
  timestamp: string;
  type: 'ENTRY' | 'EXIT' | 'PAYMENT' | 'ALERT';
  plate: string;
  details: string;
}

export interface SystemStatus {
  totalSpots: number;
  availableSpots: number;
  activeVehicles: VehicleRecord[];
  recentEvents: EventLog[];
}

export interface DailyReport {
  date: string;
  entries: number;
  revenue: number;
  occupancyRate: number;
}

export interface ChartData {
  time: string;
  entries: number;
}
