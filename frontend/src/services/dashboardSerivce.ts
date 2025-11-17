import { axiosObservable } from "@/utils/axiosObservable";

// Types
export type RunStatus = 'success' | 'failed' | 'running' | 'queued';
export type TriggerType = 'manual' | 'scheduled';

export interface ModelRun {
  id: string;
  run_id: string;
  status: RunStatus;
  start_time: string;
  end_time: string | null;
  duration: string | null;
  triggered_by: TriggerType;
  logs?: string | null;
  created_at?: string;
  updated_at?: string;
  hyper_parameters: {
    rank: number;
    regParam: number;
    alpha: number;
    maxIter: number;
  };
}

export interface ModelRunListResponse {
  data: ModelRun[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface TrainingSchedule {
  id: string;
  cron_expression: string;
  is_paused: boolean;
  description?: string;
  next_run?: string;
  created_at?: string;
  updated_at?: string;
  rank?: number;
  regParam?: number;
  alpha?: number;
  maxIter?: number;
}

export interface TrainingStatistics {
  total_runs: number;
  success_count: number;
  failed_count: number;
  running_count: number;
  queued_count: number;
  success_rate: number;
  average_duration_minutes?: number | null;
  last_run?: ModelRun | null;
  next_scheduled_run?: string | null;
}

export interface ModelSuperParameters {
  rank?: number;
  regParam?: number;
  alpha?: number;
  maxIter?: number;
}

export interface TriggerRunRequest {
  priority?: 'high' | 'normal' | 'low';
  triggered_by: TriggerType;
  rank?: number;
  regParam?: number;
  alpha?: number;
  maxIter?: number;
}

export interface UpdateScheduleRequest {
  cron_expression?: string;
  is_paused?: boolean;
  rank?: number;
  regParam?: number;
  alpha?: number;
  maxIter?: number;
}

export interface RunLogsResponse {
  run_id: string;
  logs: string;
  log_size?: number;
}

export interface ModelVersion {
  id: number;
  version_tag: string;
  artifact_path: string;
  created_at: string;
  isActive: boolean;
}

// Query parameters interfaces
export interface GetRunsParams {
  status?: RunStatus;
  triggered_by?: TriggerType;
  page?: number;
  limit?: number;
  sort?: 'start_time' | '-start_time';
}

// Model Training API Services

/**
 * Get all model training runs with optional filtering and pagination
 */
export const getModelRuns = (params?: GetRunsParams) => {
  return axiosObservable<ModelRunListResponse>({
    method: "get",
    url: "/model-training/runs",
    params,
  });
};

/**
 * Get a specific model training run by ID
 */
export const getModelRunById = (runId: string) => {
  return axiosObservable<ModelRun>({
    method: "get",
    url: `/model-training/runs/${runId}`,
  });
};

/**
 * Trigger a manual model training run
 */
export const triggerModelRun = (data?: TriggerRunRequest) => {
  return axiosObservable<ModelRun>({
    method: "post",
    url: "/model-training/runs/trigger",
    data,
  });
};

/**
 * Get the current training schedule configuration
 */
export const getTrainingSchedule = () => {
  return axiosObservable<TrainingSchedule>({
    method: "get",
    url: "/model-training/schedule",
  });
};

/**
 * Update the training schedule configuration
 */
export const updateTrainingSchedule = (data: UpdateScheduleRequest) => {
  return axiosObservable<TrainingSchedule>({
    method: "put",
    url: "/model-training/schedule",
    data,
  });
};

/**
 * Pause the training schedule
 */
export const pauseTrainingSchedule = () => {
  return axiosObservable<TrainingSchedule>({
    method: "patch",
    url: "/model-training/schedule/pause",
    data: { is_paused: true },
  });
};

/**
 * Resume the training schedule
 */
export const resumeTrainingSchedule = () => {
  return axiosObservable<TrainingSchedule>({
    method: "patch",
    url: "/model-training/schedule/resume",
    data: { is_paused: false },
  });
};

/**
 * Get training statistics
 */
export const getTrainingStatistics = () => {
  return axiosObservable<TrainingStatistics>({
    method: "get",
    url: "/model-training/statistics",
  });
};

/**
 * Get logs for a specific model training run
 */
export const getModelRunLogs = (runId: string) => {
  return axiosObservable<RunLogsResponse>({
    method: "get",
    url: `/model-training/runs/${runId}/logs`,
  });
};

// Metrics interfaces
export interface MetricItem {
  metric_name: string;
  metric_value: number;
  timestamp: string;
}

export interface MetricsResponse {
  metrics: MetricItem[];
  version_id: number;
  version_tag: string;
}

export interface MetricsData {
  precision: number[];
  recall: number[];
  map: number[];
  ndcg: number[];
  coverage: number[];
  hitRate: number[];
  summaries: Record<number, {
    precision: number;
    recall: number;
    map: number;
    coverage: number;
    hitRate: number;
  }>;
}

/**
 * Get metrics for a specific model version
 */
export const getModelMetrics = (versionId: string | number) => {
  return axiosObservable<MetricsResponse>({
    method: "get",
    url: `/model-training/metrics`,
    params: { version_id: versionId },
  });
};

/**
 * Get all model versions
 */
export const getModelVersions = () => {
  return axiosObservable<ModelVersion[]>({
    method: "get",
    url: "/model-training/model-versions",
  });
};