'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { getDatasetOverview, DatasetOverviewResponse } from '@/services/overviewService';

// Dynamically import ReactApexChart to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
});

export default function OverviewCharts() {
    const [overviewData, setOverviewData] = useState<DatasetOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const subscription = getDatasetOverview().subscribe({
            next: (response: any) => {
                setOverviewData(response.data);
                setLoading(false);
            },
            error: (err) => {
                console.error('Error fetching dataset overview:', err);
                setError('Failed to load dataset overview. Please try again later.');
                setLoading(false);
            },
        });

        return () => subscription.unsubscribe();
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dataset overview...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !overviewData) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-xl mb-2">⚠️</div>
                    <p className="text-gray-800 font-semibold">{error || 'Failed to load data'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Use real data from API
    const kpiData = overviewData.kpi;

    // Mock Data: User Purchase Frequency Distribution
    const userPurchaseFrequencyOptions: ApexOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: true },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '70%',
                borderRadius: 5,
            },
        },
        dataLabels: {
            enabled: true,
        },
        title: {
            text: 'User Purchase Frequency Distribution',
            align: 'left',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
            },
        },
        xaxis: {
            categories: overviewData.userPurchaseFrequency.categories,
            title: {
                text: 'Number of Purchases',
            },
        },
        yaxis: {
            title: {
                text: 'Number of Users',
            },
        },
        tooltip: {
            y: {
                formatter: (val) => `${val} users`,
            },
        },
        colors: ['#3B82F6'],
    };

    const userPurchaseFrequencySeries = [
        {
            name: 'Users',
            data: overviewData.userPurchaseFrequency.data,
        },
    ];

    // Mock Data: Product Popularity Distribution
    const productPopularityOptions: ApexOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: { show: true },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '70%',
                borderRadius: 5,
            },
        },
        dataLabels: {
            enabled: true,
        },
        title: {
            text: 'Product Popularity Distribution',
            align: 'left',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
            },
        },
        xaxis: {
            categories: overviewData.productPopularity.categories,
            title: {
                text: 'Number of Orders',
            },
        },
        yaxis: {
            title: {
                text: 'Number of Products',
            },
        },
        tooltip: {
            y: {
                formatter: (val) => `${val} products`,
            },
        },
        colors: ['#10B981'],
    };

    const productPopularitySeries = [
        {
            name: 'Products',
            data: overviewData.productPopularity.data,
        },
    ];

    // Mock Data: Top Categories by Purchase Count
    const topCategoriesOptions: ApexOptions = {
        chart: {
            type: 'bar',
            height: 400,
            toolbar: { show: true },
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 5,
                dataLabels: {
                    position: 'top',
                },
            },
        },
        dataLabels: {
            enabled: true,
            offsetX: 30,
            style: {
                fontSize: '12px',
                colors: ['#333'],
            },
        },
        title: {
            text: 'Top Categories by Purchase Count',
            align: 'left',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
            },
        },
        xaxis: {
            categories: overviewData.topCategories.categories,
            title: {
                text: 'Number of Orders',
            },
        },
        yaxis: {
            title: {
                text: 'Category',
            },
        },
        tooltip: {
            y: {
                formatter: (val) => `${val} orders`,
            },
        },
        colors: ['#F59E0B'],
    };

    const topCategoriesSeries = [
        {
            name: 'Orders',
            data: overviewData.topCategories.data,
        },
    ];

    // Mock Data: Top Products by Orders
    const topProductsOptions: ApexOptions = {
        chart: {
            type: 'bar',
            height: 450,
            toolbar: { show: true },
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 5,
                dataLabels: {
                    position: 'top',
                },
            },
        },
        dataLabels: {
            enabled: true,
            offsetX: 30,
            style: {
                fontSize: '12px',
                colors: ['#333'],
            },
        },
        title: {
            text: 'Top 10 Products by Orders',
            align: 'left',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
            },
        },
        xaxis: {
            categories: overviewData.topProducts.categories,
            title: {
                text: 'Number of Orders',
            },
        },
        yaxis: {
            title: {
                text: 'Product Name',
            },
        },
        tooltip: {
            y: {
                formatter: (val) => `${val} orders`,
            },
        },
        colors: ['#EF4444'],
    };

    const topProductsSeries = [
        {
            name: 'Orders',
            data: overviewData.topProducts.data,
        },
    ];

    // Mock Data: Data Growth Over Time (Orders per Month)
    const dataGrowthOptions: ApexOptions = {
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
            text: 'Order Growth Over Time',
            align: 'left',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
            },
        },
        xaxis: {
            categories: overviewData.dataGrowth.categories,
            title: {
                text: 'Month',
            },
        },
        yaxis: {
            title: {
                text: 'Number of Orders',
            },
        },
        tooltip: {
            y: {
                formatter: (val) => `${val} orders`,
            },
        },
        markers: {
            size: 5,
        },
        dataLabels: {
            enabled: false,
        },
        colors: ['#8B5CF6'],
    };

    const dataGrowthSeries = [
        {
            name: 'Orders',
            data: overviewData.dataGrowth.data,
        },
    ];

    // Use real heatmap data from API

    const heatmapOptions: ApexOptions = {
        chart: {
            type: 'heatmap',
            height: 500,
            toolbar: { show: true },
        },
        dataLabels: {
            enabled: false,
        },
        colors: ['#008FFB'],
        title: {
            text: 'User-Item Matrix Sparsity (Sample 20x20)',
            align: 'left',
            style: {
                fontSize: '18px',
                fontWeight: 'bold',
            },
        },
        xaxis: {
            title: {
                text: 'Products',
            },
        },
        yaxis: {
            title: {
                text: 'Users',
            },
        },
        plotOptions: {
            heatmap: {
                shadeIntensity: 0.5,
                colorScale: {
                    ranges: [
                        {
                            from: 0,
                            to: 0,
                            color: '#F3F4F6',
                            name: 'No Purchase',
                        },
                        {
                            from: 1,
                            to: 1,
                            color: '#DBEAFE',
                            name: '1 Purchase',
                        },
                        {
                            from: 2,
                            to: 2,
                            color: '#93C5FD',
                            name: '2 Purchases',
                        },
                        {
                            from: 3,
                            to: 3,
                            color: '#3B82F6',
                            name: '3 Purchases',
                        },
                        {
                            from: 4,
                            to: 5,
                            color: '#1E40AF',
                            name: '4+ Purchases',
                        },
                    ],
                },
            },
        },
        tooltip: {
            y: {
                formatter: (val) => (val === 0 ? 'No purchase' : `${val} purchase(s)`),
            },
        },
    };

    const heatmapSeries = overviewData.heatmapData;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Dataset Overview Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Comprehensive analysis of user behavior, product performance, and system statistics
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="text-sm font-medium text-gray-600 mb-1">Total Users</div>
                        <div className="text-3xl font-bold text-blue-600">{kpiData.totalUsers.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">Registered users</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                        <div className="text-sm font-medium text-gray-600 mb-1">Total Orders</div>
                        <div className="text-3xl font-bold text-green-600">{kpiData.totalOrders.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 mt-1">All time</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                        <div className="text-sm font-medium text-gray-600 mb-1">Total Products</div>
                        <div className="text-3xl font-bold text-orange-600">{kpiData.totalProducts}</div>
                        <div className="text-xs text-gray-500 mt-1">In catalog</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="text-sm font-medium text-gray-600 mb-1">Avg Orders/User</div>
                        <div className="text-3xl font-bold text-purple-600">{kpiData.avgOrdersPerUser}</div>
                        <div className="text-xs text-gray-500 mt-1">Per user</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
                        <div className="text-sm font-medium text-gray-600 mb-1">Matrix Sparsity</div>
                        <div className="text-3xl font-bold text-red-600">{kpiData.sparsity}%</div>
                        <div className="text-xs text-gray-500 mt-1">Empty cells</div>
                    </div>
                </div>

                {/* User-Item Matrix Sparsity Heatmap */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <ReactApexChart
                        options={heatmapOptions}
                        series={heatmapSeries}
                        type="heatmap"
                        height={500}
                    />
                   
                </div>

                {/* User Purchase Frequency & Product Popularity */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <ReactApexChart
                            options={userPurchaseFrequencyOptions}
                            series={userPurchaseFrequencySeries}
                            type="bar"
                            height={350}
                        />
                       
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <ReactApexChart
                            options={productPopularityOptions}
                            series={productPopularitySeries}
                            type="bar"
                            height={350}
                        />
                      
                    </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <ReactApexChart
                        options={topCategoriesOptions}
                        series={topCategoriesSeries}
                        type="bar"
                        height={400}
                    />
                   
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <ReactApexChart
                        options={topProductsOptions}
                        series={topProductsSeries}
                        type="bar"
                        height={450}
                    />
                  
                </div>

                {/* Data Growth Over Time */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <ReactApexChart
                        options={dataGrowthOptions}
                        series={dataGrowthSeries}
                        type="line"
                        height={350}
                    />
                  
                </div>

            </div>
        </div>
    );
}
