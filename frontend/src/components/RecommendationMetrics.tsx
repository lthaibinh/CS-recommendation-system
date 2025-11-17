'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { getModelVersions, getModelMetrics, type ModelVersion, type MetricsData, type MetricsResponse, type MetricItem } from '@/services/dashboardSerivce';

// Dynamically import ReactApexChart to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
});

export default function RecommendationMetrics() {
    const [selectedModelVersion, setSelectedModelVersion] = useState<string | null>(null);
    const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
    const [loadingVersions, setLoadingVersions] = useState(true);
    const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);
    const [metricsError, setMetricsError] = useState<string | null>(null);
    const [selectedK, setSelectedK] = useState<number>(10);

    // Sample data for different K values
    const kValues = [10, 15, 20, 25, 30, 35, 40];

    // Transform raw metrics response to MetricsData format
    const transformMetricsData = (response: MetricsResponse): MetricsData => {
        const precision: Record<number, number> = {};
        const recall: Record<number, number> = {};
        const map: Record<number, number> = {};
        const ndcg: Record<number, number> = {};
        const coverage: Record<number, number> = {};
        const hitRate: Record<number, number> = {};

        // Initialize all K values to 0
        kValues.forEach(k => {
            precision[k] = 0;
            recall[k] = 0;
            map[k] = 0;
            ndcg[k] = 0;
            coverage[k] = 0;
            hitRate[k] = 0;
        });

        // Process each metric
        response.metrics.forEach((metric: MetricItem) => {
            const metricName = metric.metric_name.toLowerCase();
            const value = metric.metric_value;

            // Extract K value from metric name (e.g., "Precision@10" -> 10)
            const kMatch = metricName.match(/@(\d+)$/);
            if (!kMatch) return;
            const k = parseInt(kMatch[1], 10);
            if (!kValues.includes(k)) return;

            // Extract metric type
            if (metricName.startsWith('precision')) {
                precision[k] = value * 100; // Convert to percentage
            } else if (metricName.startsWith('recall')) {
                recall[k] = value * 100; // Convert to percentage
            } else if (metricName.startsWith('map')) {
                map[k] = value;
            } else if (metricName.startsWith('ndcg')) {
                ndcg[k] = value;
            } else if (metricName.startsWith('coverage')) {
                coverage[k] = value * 100; // Convert to percentage
            } else if (metricName.startsWith('hitrate')) {
                hitRate[k] = value * 100; // Convert to percentage
            }
        });

        // Convert to arrays ordered by kValues
        const precisionArray = kValues.map(k => precision[k] || 0);
        const recallArray = kValues.map(k => recall[k] || 0);
        const mapArray = kValues.map(k => map[k] || 0);
        const ndcgArray = kValues.map(k => ndcg[k] || 0);
        const coverageArray = kValues.map(k => coverage[k] || 0);
        const hitRateArray = kValues.map(k => hitRate[k] || 0);

        // Create summaries for all K values
        const summaries: Record<number, {
            precision: number;
            recall: number;
            map: number;
            coverage: number;
            hitRate: number;
        }> = {};
        
        kValues.forEach(k => {
            summaries[k] = {
                precision: precision[k] || 0,
                recall: recall[k] || 0,
                map: map[k] || 0,
                coverage: coverage[k] || 0,
                hitRate: hitRate[k] || 0,
            };
        });

        return {
            precision: precisionArray,
            recall: recallArray,
            map: mapArray,
            ndcg: ndcgArray,
            coverage: coverageArray,
            hitRate: hitRateArray,
            summaries,
        };
    };

    // Fetch model versions
    useEffect(() => {
        let mounted = true;
        const sub = getModelVersions().subscribe({
            next: (response: any) => {
                if (!mounted) return;
                // axiosObservable returns the axios response, so response.data is the API response (array)
                const versions = response.data;
                if (Array.isArray(versions)) {
                    setModelVersions(versions);
                    // Auto-select the latest version if available (using id as version_id)
                    if (versions.length > 0) {
                        setSelectedModelVersion((prev) => prev || String(versions[0].id));
                    }
                }
                setLoadingVersions(false);
            },
            error: (error) => {
                if (!mounted) return;
                console.error('Error fetching model versions:', error);
                setLoadingVersions(false);
            },
        });

        return () => {
            mounted = false;
            sub.unsubscribe();
        };
    }, []);

    // Fetch metrics when model version is selected
    useEffect(() => {
        if (!selectedModelVersion) {
            setMetricsData(null);
            setMetricsError(null);
            return;
        }

        let mounted = true;
        setLoadingMetrics(true);
        setMetricsError(null);

        const sub = getModelMetrics(selectedModelVersion).subscribe({
            next: (response: any) => {
                if (!mounted) return;
                // axiosObservable returns the axios response, so response.data is the API response
                const apiResponse: MetricsResponse = response.data;
                if (apiResponse && apiResponse.metrics && Array.isArray(apiResponse.metrics)) {
                    const transformedData = transformMetricsData(apiResponse);
                    setMetricsData(transformedData);
                } else {
                    setMetricsError('Invalid metrics data format');
                    setMetricsData(null);
                }
                setLoadingMetrics(false);
            },
            error: (error) => {
                if (!mounted) return;
                console.error('Error fetching metrics:', error);
                setMetricsError('Failed to fetch metrics. Please try again.');
                setMetricsData(null);
                setLoadingMetrics(false);
            },
        });

        return () => {
            mounted = false;
            sub.unsubscribe();
        };
    }, [selectedModelVersion]);

    // Default metrics data (all zeros) when no data is available
    const defaultMetricsData: MetricsData = {
        precision: kValues.map(() => 0),
        recall: kValues.map(() => 0),
        map: kValues.map(() => 0),
        ndcg: kValues.map(() => 0),
        coverage: kValues.map(() => 0),
        hitRate: kValues.map(() => 0),
        summaries: kValues.reduce((acc, k) => {
            acc[k] = {
                precision: 0,
                recall: 0,
                map: 0,
                coverage: 0,
                hitRate: 0,
            };
            return acc;
        }, {} as Record<number, { precision: number; recall: number; map: number; coverage: number; hitRate: number }>),
    };

    const displayMetricsData = metricsData || defaultMetricsData;

    // Line Chart Data: Precision@K, Recall@K
    const precisionRecallOptions: ApexOptions = {
        chart: {
            type: 'line',
            height: 350,
            toolbar: { show: true },
            zoom: { enabled: true },
        },
        stroke: {
            width: 3,
            curve: 'smooth',
        },
        title: {
            text: 'Precision@K & Recall@K',
            align: 'left',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
            },
        },
        xaxis: {
            categories: kValues,
            title: {
                text: 'K (Top-K Recommendations)',
            },
        },
        yaxis: {
            title: {
                text: 'Score (%)',
            },
            min: 0,
            max: 10,
        },
        tooltip: {
            y: {
                formatter: (val) => `${val.toFixed(2)}%`,
            },
        },
        dataLabels: {
            enabled: true,
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
        },
        colors: ['#3B82F6', '#10B981'],
    };

    const precisionRecallSeries = [
        {
            name: 'Precision@K',
            data: displayMetricsData.precision,
        },
        {
            name: 'Recall@K',
            data: displayMetricsData.recall,
        },
    ];

    // Line Chart Data: MAP@K & NDCG@K
    const mapNdcgOptions: ApexOptions = {
        chart: {
            type: 'line',
            height: 350,
            toolbar: { show: true },
            zoom: { enabled: true },
        },
        stroke: {
            width: 3,
            curve: 'smooth',
        },
        title: {
            text: 'MAP@K & NDCG@K',
            align: 'left',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
            },
        },
        xaxis: {
            categories: kValues,
            title: {
                text: 'K (Top-K Recommendations)',
            },
        },
        yaxis: {
            title: {
                text: 'Score',
            },
            min: 0,
            max: 1,
        },
        tooltip: {
            y: {
                formatter: (val) => val.toFixed(4),
            },
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
        },
        colors: ['#F59E0B', '#EF4444'],
    };

    const mapNdcgSeries = [
        {
            name: 'MAP@K',
            data: displayMetricsData.map,
        },
        {
            name: 'NDCG@K',
            data: displayMetricsData.ndcg,
        },
    ];

    // Bar Chart Data: Coverage
    const coverageOptions: ApexOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: true },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 5,
            },
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => `${val}%`,
        },
        title: {
            text: 'Coverage - Item Coverage Rate',
            align: 'left',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
            },
        },
        xaxis: {
            categories: kValues,
            title: {
                text: 'K (Top-K Recommendations)',
            },
        },
        yaxis: {
            title: {
                text: 'Coverage (%)',
            },
            min: 0,
            max: 100,
        },
        tooltip: {
            y: {
                formatter: (val) => `${val}% items được recommend`,
            },
        },
        colors: ['#8B5CF6'],
    };

    const coverageSeries = [
        {
            name: 'Coverage',
            data: displayMetricsData.coverage,
        },
    ];

    // Bar Chart Data: Hit Rate
    const hitRateOptions: ApexOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: true },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 5,
            },
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => `${val}%`,
        },
        title: {
            text: 'Hit Rate@K - User Hit Rate',
            align: 'left',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
            },
        },
        xaxis: {
            categories: kValues,
            title: {
                text: 'K (Top-K Recommendations)',
            },
        },
        yaxis: {
            title: {
                text: 'Hit Rate (%)',
            },
            min: 0,
            max: 100,
        },
        tooltip: {
            y: {
                formatter: (val) => `${val}% users có hit`,
            },
        },
        colors: ['#EC4899'],
    };

    const hitRateSeries = [
        {
            name: 'Hit Rate',
            data: displayMetricsData.hitRate,
        },
    ];

    const formatModelVersionLabel = (version: ModelVersion) => {
        const date = new Date(version.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        const activeBadge = version.isActive ? ' (Active)' : '';
        return `${version.version_tag} (${date})${activeBadge}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Recommendation System Evaluation Metrics
                            </h1>
                            <p className="text-gray-600">
                                Đánh giá hiệu suất của hệ thống gợi ý theo các metrics khác nhau
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <label htmlFor="model-version-select" className="text-sm font-medium text-gray-700">
                                Model Version:
                            </label>
                            <select
                                id="model-version-select"
                                value={selectedModelVersion || ''}
                                onChange={(e) => setSelectedModelVersion(e.target.value || null)}
                                disabled={loadingVersions || modelVersions.length === 0}
                                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed min-w-[300px]"
                            >
                                {loadingVersions ? (
                                    <option value="">Loading versions...</option>
                                ) : modelVersions.length === 0 ? (
                                    <option value="">No model versions available</option>
                                ) : (
                                    <>
                                        <option value="">Select a model version</option>
                                        {modelVersions.map((version) => (
                                            <option key={version.id} value={String(version.id)}>
                                                {formatModelVersionLabel(version)}
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                        </div>
                    </div>
                    {selectedModelVersion && (
                        <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Selected:</span>{' '}
                            {modelVersions.find(v => String(v.id) === selectedModelVersion)?.version_tag || selectedModelVersion}
                        </div>
                    )}
                </div>

                 {/* Summary Statistics */}
                 {selectedModelVersion ? (
                    <div className="mt-6 bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Summary Metrics</h2>
                            <div className="flex items-center gap-2">
                                <label htmlFor="k-select" className="text-sm font-medium text-gray-700">
                                    K Value:
                                </label>
                                <select
                                    id="k-select"
                                    value={selectedK}
                                    onChange={(e) => setSelectedK(Number(e.target.value))}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {kValues.map((k) => (
                                        <option key={k} value={k}>
                                            K={k}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {loadingMetrics ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-lg">Loading metrics...</p>
                            </div>
                        ) : metricsError ? (
                            <div className="text-center py-8 text-red-500">
                                <p className="text-lg">{metricsError}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{displayMetricsData.summaries[selectedK].precision.toFixed(1)}%</div>
                                    <div className="text-sm text-gray-600">Precision@{selectedK}</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{displayMetricsData.summaries[selectedK].recall.toFixed(1)}%</div>
                                    <div className="text-sm text-gray-600">Recall@{selectedK}</div>
                                </div>
                                <div className="text-center p-4 bg-orange-50 rounded-lg">
                                    <div className="text-2xl font-bold text-orange-600">{displayMetricsData.summaries[selectedK].map.toFixed(3)}</div>
                                    <div className="text-sm text-gray-600">MAP@{selectedK}</div>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{displayMetricsData.summaries[selectedK].coverage.toFixed(1)}%</div>
                                    <div className="text-sm text-gray-600">Coverage@{selectedK}</div>
                                </div>
                                <div className="text-center p-4 bg-pink-50 rounded-lg">
                                    <div className="text-2xl font-bold text-pink-600">{displayMetricsData.summaries[selectedK].hitRate.toFixed(1)}%</div>
                                    <div className="text-sm text-gray-600">Hit Rate@{selectedK}</div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mt-6 bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-lg">Please select a model version to view metrics</p>
                        </div>
                    </div>
                )}

                {selectedModelVersion ? (
                    loadingMetrics ? (
                        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                            <div className="text-center py-12 text-gray-500">
                                <svg className="animate-spin h-12 w-12 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-lg">Loading metrics data...</p>
                            </div>
                        </div>
                    ) : metricsError ? (
                        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                            <div className="text-center py-12 text-red-500">
                                <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-lg">{metricsError}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Precision & Recall */}
                            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                                <ReactApexChart
                                    options={precisionRecallOptions}
                                    series={precisionRecallSeries}
                                    type="line"
                                    height={350}
                                />
                            </div>

                            {/* MAP & NDCG */}
                            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                                <ReactApexChart
                                    options={mapNdcgOptions}
                                    series={mapNdcgSeries}
                                    type="line"
                                    height={350}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Coverage */}
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <ReactApexChart
                                        options={coverageOptions}
                                        series={coverageSeries}
                                        type="bar"
                                        height={350}
                                    />
                                </div>

                                {/* Hit Rate */}
                                <div className="bg-white rounded-lg shadow-lg p-6">
                                    <ReactApexChart
                                        options={hitRateOptions}
                                        series={hitRateSeries}
                                        type="bar"
                                        height={350}
                                    />
                                </div>
                            </div>
                        </>
                    )
                ) : (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <div className="text-center py-12 text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-lg">Select a model version to view detailed metrics charts</p>
                        </div>
                    </div>
                )}

               
            </div>
        </div>
    );
}

