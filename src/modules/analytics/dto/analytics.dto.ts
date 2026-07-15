import type { DashboardData } from '../types/analytics.types.js';

export interface DashboardResponseDto {
  dashboard: DashboardData;
  role: string;
  generatedAt: string;
}
