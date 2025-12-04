import { axiosObservable } from "@/utils/axiosObservable";

// Types for Dataset Overview API

export interface DatasetKPI {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  avgOrdersPerUser: number;
  sparsity: number;
}

export interface ChartDataResponse {
  categories: string[];
  data: number[];
}

export interface HeatmapDataPoint {
  x: string;
  y: number;
}

export interface HeatmapSeries {
  name: string;
  data: HeatmapDataPoint[];
}

export interface DatasetOverviewResponse {
  kpi: DatasetKPI;
  userPurchaseFrequency: ChartDataResponse;
  productPopularity: ChartDataResponse;
  topCategories: ChartDataResponse;
  topProducts: ChartDataResponse;
  dataGrowth: ChartDataResponse;
  heatmapData: HeatmapSeries[];
}

/**
 * Get comprehensive dataset overview statistics
 * 
 * This endpoint provides:
 * - KPI metrics (total users, orders, products, avg orders per user, sparsity)
 * - User purchase frequency distribution
 * - Product popularity distribution
 * - Top categories by purchase count
 * - Top products by orders
 * - Order growth over time
 * - User-item matrix heatmap sample (20x20)
 */
export const getDatasetOverview = () => {
  return axiosObservable<DatasetOverviewResponse>({
    method: "get",
    url: "/dataset-overview",
  });
};

