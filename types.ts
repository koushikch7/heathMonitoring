
export interface SleepStages {
  rem: number;   // percentage
  deep: number;  // percentage
  light: number; // percentage
  awake: number; // percentage
}

export interface HealthMetrics {
  heartRate: number;
  bloodOxygen: number;
  steps: number;
  calories: number;
  sleepHours: number;
  sleepScore: number;
  sleepStages: SleepStages;
  stressLevel: number;
  ecgStatus: string;
  timestamp: string;
}

export interface ChartDataPoint {
  time: string;
  value: number;
}

export enum SyncStatus {
  IDLE = 'IDLE',
  SYNCING = 'SYNCING',
  PUSHING = 'PUSHING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE'
}

export interface SyncLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'ERROR' | 'SKIPPED';
  details: string;
}

export interface AIInsight {
  summary: string;
  recommendations: string[];
  riskLevel: 'Low' | 'Moderate' | 'High';
}
