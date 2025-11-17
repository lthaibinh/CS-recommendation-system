'use client';

import CustomAlert from '@/components/CustomAlert';
import { useState, useEffect } from 'react';
import { 
  getModelRuns, 
  getTrainingSchedule, 
  getTrainingStatistics,
  triggerModelRun,
  pauseTrainingSchedule,
  resumeTrainingSchedule,
  updateTrainingSchedule,
  getModelRunLogs,
  type ModelRun as APIModelRun,
  type TrainingSchedule,
  type TrainingStatistics
} from '@/services/dashboardSerivce';
import { Subscription } from 'rxjs';

type RunStatus = 'success' | 'failed' | 'running' | 'queued';

interface ModelRun {
  id: string;
  runId: string;
  status: RunStatus;
  startTime: string;
  endTime: string | null;
  duration: string | null;
  triggeredBy: 'manual' | 'scheduled';
  logs?: string;
  hyperParameters?: {
    rank: number;
    regParam: number;
    alpha: number;
    maxIter: number;
  };
}

// Transform API response (snake_case) to UI format (camelCase)
const transformModelRun = (apiRun: APIModelRun): ModelRun => {
  return {
    id: apiRun.id,
    runId: apiRun.run_id,
    status: apiRun.status,
    startTime: apiRun.start_time,
    endTime: apiRun.end_time,
    duration: apiRun.duration,
    triggeredBy: apiRun.triggered_by,
    logs: apiRun.logs || undefined,
    hyperParameters: apiRun.hyper_parameters ? {
      rank: apiRun.hyper_parameters.rank,
      regParam: apiRun.hyper_parameters.regParam,
      alpha: apiRun.hyper_parameters.alpha,
      maxIter: apiRun.hyper_parameters.maxIter,
    } : undefined,
  };
};

export default function Page() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRunBuildModal, setShowRunBuildModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [schedule, setSchedule] = useState('0 0 * * 0');
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [runs, setRuns] = useState<ModelRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<TrainingStatistics | null>(null);
  const [runLogs, setRunLogs] = useState<Record<string, string>>({});
  const [loadingLogs, setLoadingLogs] = useState<Record<string, boolean>>({});
  
  // Super parameters for schedule
  const [scheduleRank, setScheduleRank] = useState<number>(10);
  const [scheduleRegParam, setScheduleRegParam] = useState<number>(0.1);
  const [scheduleAlpha, setScheduleAlpha] = useState<number>(1.0);
  const [scheduleMaxIter, setScheduleMaxIter] = useState<number>(10);
  
  // Super parameters for manual run
  const [runRank, setRunRank] = useState<number>(10);
  const [runRegParam, setRunRegParam] = useState<number>(0.1);
  const [runAlpha, setRunAlpha] = useState<number>(1.0);
  const [runMaxIter, setRunMaxIter] = useState<number>(10);

  // Fetch initial data
  useEffect(() => {
    const subscriptions: Subscription[] = [];

    // Fetch runs
    const runsSub = getModelRuns({ sort: '-start_time' }).subscribe({
      next: (response: any) => {
        const data = response.data;
        if (data && data.data) {
          const transformedRuns = data.data.map(transformModelRun);
          setRuns(transformedRuns);
        }
        setLoading(false);
      },
      error: (error) => {
        console.error('Error fetching runs:', error);
        setAlertMessage('Failed to load runs');
        setAlertType('error');
        setAlertOpen(true);
        setLoading(false);
      },
    });
    subscriptions.push(runsSub);

    // Fetch schedule
    const scheduleSub = getTrainingSchedule().subscribe({
      next: (response: any) => {
        const scheduleData = response.data;
        setSchedule(scheduleData.cron_expression);
        setIsPaused(scheduleData.is_paused);
        // Load super parameters if they exist in the response
        if (scheduleData.rank !== undefined) setScheduleRank(scheduleData.rank);
        if (scheduleData.regParam !== undefined) setScheduleRegParam(scheduleData.regParam);
        if (scheduleData.alpha !== undefined) setScheduleAlpha(scheduleData.alpha);
        if (scheduleData.maxIter !== undefined) setScheduleMaxIter(scheduleData.maxIter);
      },
      error: (error) => {
        console.error('Error fetching schedule:', error);
      },
    });
    subscriptions.push(scheduleSub);

    // Fetch statistics
    const statsSub = getTrainingStatistics().subscribe({
      next: (response: any) => {
        setStatistics(response.data);
      },
      error: (error) => {
        console.error('Error fetching statistics:', error);
      },
    });
    subscriptions.push(statsSub);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  // Refresh data periodically (every 30 seconds) if there are running/queued jobs
  useEffect(() => {
    const hasActiveJobs = runs.some(r => r.status === 'running' || r.status === 'queued');
    if (!hasActiveJobs) return;

    const subscriptions: Subscription[] = [];
    const interval = setInterval(() => {
      const sub = getModelRuns({ sort: '-start_time' }).subscribe({
        next: (response: any) => {
          const data = response.data;
          if (data && data.data) {
            const transformedRuns = data.data.map(transformModelRun);
            setRuns(transformedRuns);
          }
        },
        error: (error) => {
          console.error('Error refreshing runs:', error);
        },
      });
      subscriptions.push(sub);
    }, 30000);

    return () => {
      clearInterval(interval);
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [runs]);

  // Handler functions
  const handleTriggerRun = () => {
    const sub = triggerModelRun({
      priority: 'high',
      triggered_by: 'manual',
      rank: runRank,
      regParam: runRegParam,
      alpha: runAlpha,
      maxIter: runMaxIter,
    }).subscribe({
      next: (response: any) => {
        const newRun = transformModelRun(response.data);
        setRuns(prev => [newRun, ...prev]);
        setShowRunBuildModal(false);
        setAlertMessage('Run triggered successfully');
        setAlertType('success');
        setAlertOpen(true);
      },
      error: (error: any) => {
        const message = error.response?.data?.error?.message || 'Failed to trigger run';
        setAlertMessage(message);
        setAlertType('error');
        setAlertOpen(true);
      },
    });
    return () => sub.unsubscribe();
  };

  const handlePauseResume = () => {
    const action = isPaused ? resumeTrainingSchedule() : pauseTrainingSchedule();
    const sub = action.subscribe({
      next: (response: any) => {
        const scheduleData = response.data;
        setIsPaused(scheduleData.is_paused);
        setAlertMessage(`Schedule ${scheduleData.is_paused ? 'paused' : 'resumed'} successfully`);
        setAlertType('success');
        setAlertOpen(true);
      },
      error: (error: any) => {
        const message = error.response?.data?.error?.message || 'Failed to update schedule';
        setAlertMessage(message);
        setAlertType('error');
        setAlertOpen(true);
      },
    });
    return () => sub.unsubscribe();
  };

  const handleSaveSchedule = () => {
    const sub = updateTrainingSchedule({
      cron_expression: schedule,
      is_paused: isPaused,
      rank: scheduleRank,
      regParam: scheduleRegParam,
      alpha: scheduleAlpha,
      maxIter: scheduleMaxIter,
    }).subscribe({
      next: (response: any) => {
        const scheduleData = response.data;
        setSchedule(scheduleData.cron_expression);
        setIsPaused(scheduleData.is_paused);
        setShowScheduleModal(false);
        setAlertMessage('Schedule updated successfully');
        setAlertType('success');
        setAlertOpen(true);
      },
      error: (error: any) => {
        const message = error.response?.data?.error?.message || 'Failed to update schedule';
        setAlertMessage(message);
        setAlertType('error');
        setAlertOpen(true);
      },
    });
    return () => sub.unsubscribe();
  };

  const handleViewLogs = (runId: string) => {
    const run = runs.find(r => r.id === runId);
    if (!run) return;

    if (selectedRun === runId) {
      setSelectedRun(null);
      return;
    }

    setSelectedRun(runId);
    
    // Check if logs are already loaded
    if (runLogs[runId]) {
      return;
    }

    setLoadingLogs(prev => ({ ...prev, [runId]: true }));
    const sub = getModelRunLogs(run.runId).subscribe({
      next: (response: any) => {
        const logsData = response.data;
        setRunLogs(prev => ({ ...prev, [runId]: logsData.logs }));
        setLoadingLogs(prev => ({ ...prev, [runId]: false }));
      },
      error: (error: any) => {
        setRunLogs(prev => ({ ...prev, [runId]: 'Failed to load logs' }));
        setLoadingLogs(prev => ({ ...prev, [runId]: false }));
      },
    });
    return () => sub.unsubscribe();
  };

  const getStatusColor = (status: RunStatus) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'running':
        return 'bg-blue-500 animate-pulse';
      case 'queued':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: RunStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const successRate = runs.filter(r => r.status === 'success').length / runs.filter(r => r.status !== 'queued').length * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ALS Model Training</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Alternating Least Squares Collaborative Filtering
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePauseResume}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${isPaused
                    ? 'text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                    : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}
              >
                {isPaused ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Resume
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Pause
                  </>
                )}
              </button>
              <button
                onClick={() => setShowRunBuildModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                </svg>
                Run Build
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Info Card */}
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Schedule</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono">{schedule}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Every Sunday at midnight</p>
              </div>
              <div className="border-l border-gray-300 dark:border-gray-600 pl-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isPaused ? (
                    <span className="text-yellow-600">Paused</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  )}
                </p>
              </div>
              <div className="border-l border-gray-300 dark:border-gray-600 pl-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Runs</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {statistics?.total_runs ?? runs.length}
                </p>
              </div>
              <div className="border-l border-gray-300 dark:border-gray-600 pl-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {statistics?.success_rate !== undefined 
                    ? statistics.success_rate.toFixed(1) 
                    : successRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium"
            >
              Edit Schedule
            </button>
          </div>
        </div>

        {/* Recent Runs */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Runs</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">Status</th>
                  <th scope="col" className="px-6 py-3 text-left">Run ID</th>
                  <th scope="col" className="px-6 py-3 text-left">Type</th>
                  <th scope="col" className="px-6 py-3 text-left">Hyperparameters</th>
                  <th scope="col" className="px-6 py-3 text-left">Start Time</th>
                  <th scope="col" className="px-6 py-3 text-left">End Time</th>
                  <th scope="col" className="px-6 py-3 text-left">Duration</th>
                  <th scope="col" className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No runs found
                    </td>
                  </tr>
                )}
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(run.status)}`}></div>
                        <span className="text-gray-900 dark:text-white font-medium">{getStatusText(run.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{run.runId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${run.triggeredBy === 'manual'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                        }`}>
                        {run.triggeredBy}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {run.hyperParameters ? (
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Rank:</span> {run.hyperParameters.rank}
                          </div>
                          <div className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Reg:</span> {run.hyperParameters.regParam}
                          </div>
                          <div className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Alpha:</span> {run.hyperParameters.alpha}
                          </div>
                          <div className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">MaxIter:</span> {run.hyperParameters.maxIter}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {formatDateTime(run.startTime)}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {run.endTime ? formatDateTime(run.endTime) : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {run.duration || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewLogs(run.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        disabled={loadingLogs[run.id]}
                      >
                        {loadingLogs[run.id] ? 'Loading...' : selectedRun === run.id ? 'Hide' : 'View'} Logs
                      </button>
                    </td>
                  </tr>
                ))}
                {runs.map((run) => (
                  selectedRun === run.id && (
                    <tr key={`logs-${run.id}`} className="bg-gray-50 dark:bg-gray-700">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="p-4 bg-gray-900 rounded-lg">
                          <h4 className="text-sm font-semibold text-white mb-2">Logs</h4>
                          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                            {loadingLogs[run.id] ? 'Loading logs...' : (runLogs[run.id] || run.logs || 'No logs available')}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Run Build Modal */}
        {showRunBuildModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900 bg-opacity-50">
            <div className="relative w-full max-w-lg p-4">
              <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="flex items-center justify-between p-5 border-b rounded-t dark:border-gray-600">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Run Model Build
                  </h3>
                  <button
                    onClick={() => setShowRunBuildModal(false)}
                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Configure the super parameters for this model build run.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Model Super Parameters
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Rank
                        </label>
                        <input
                          type="number"
                          value={runRank}
                          onChange={(e) => setRunRank(Number(e.target.value))}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                          placeholder="10"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Regularization Parameter (regParam)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={runRegParam}
                          onChange={(e) => setRunRegParam(Number(e.target.value))}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                          placeholder="0.1"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Alpha
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={runAlpha}
                          onChange={(e) => setRunAlpha(Number(e.target.value))}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                          placeholder="1.0"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Max Iterations (maxIter)
                        </label>
                        <input
                          type="number"
                          value={runMaxIter}
                          onChange={(e) => setRunMaxIter(Number(e.target.value))}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                          placeholder="10"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
                  <button
                    onClick={handleTriggerRun}
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    Run Build
                  </button>
                  <button
                    onClick={() => setShowRunBuildModal(false)}
                    className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-900 bg-opacity-50">
            <div className="relative w-full max-w-lg p-4">
              <div className="relative bg-white rounded-lg shadow dark:bg-gray-800">
                <div className="flex items-center justify-between p-5 border-b rounded-t dark:border-gray-600">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Configure Training Schedule
                  </h3>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Cron Schedule
                    </label>
                    <input
                      type="text"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white font-mono"
                      placeholder="0 0 * * 0"
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Cron expression format: minute hour day month weekday
                    </p>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Quick Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSchedule('0 0 * * *')}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        Daily
                      </button>
                      <button
                        onClick={() => setSchedule('0 0 * * 0')}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        Weekly
                      </button>
                      <button
                        onClick={() => setSchedule('0 0 1 * *')}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setSchedule('0 */6 * * *')}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        Every 6h
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Model Super Parameters
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Rank
                        </label>
                        <input
                          type="number"
                          value={scheduleRank}
                          onChange={(e) => setScheduleRank(Number(e.target.value))}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                          placeholder="10"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Regularization Parameter (regParam)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={scheduleRegParam}
                          onChange={(e) => setScheduleRegParam(Number(e.target.value))}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                          placeholder="0.1"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Alpha
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={scheduleAlpha}
                          onChange={(e) => setScheduleAlpha(Number(e.target.value))}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                          placeholder="1.0"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Max Iterations (maxIter)
                        </label>
                        <input
                          type="number"
                          value={scheduleMaxIter}
                          onChange={(e) => setScheduleMaxIter(Number(e.target.value))}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                          placeholder="10"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center p-6 space-x-2 border-t border-gray-200 rounded-b dark:border-gray-600">
                  <button
                    onClick={handleSaveSchedule}
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >
                    Save Schedule
                  </button>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg p-6 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-900 dark:text-white">Loading...</p>
          </div>
        </div>
      )}
      <CustomAlert
        isOpen={alertOpen}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
}
