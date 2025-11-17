'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

// Dynamically import ReactApexChart to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
    ssr: false,
});

export default function OverviewCharts() {
    // Mock Data: Dataset Overview KPIs
    const kpiData = {
        totalUsers: 1247,
        totalOrders: 8934,
        totalProducts: 156,
        avgOrdersPerUser: 7.2,
        sparsity: 94.3, // percentage
    };

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
            categories: ['1', '2', '3-5', '6-10', '11-20', '20+'],
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
            data: [425, 312, 268, 156, 62, 24], // Long-tail distribution
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
            categories: ['1-10', '11-50', '51-100', '101-200', '200+'],
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
            data: [89, 42, 18, 5, 2], // Long-tail distribution
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
            categories: [
                'Main Course (Món chính)',
                'Appetizers (Khai vị)',
                'Beverages (Đồ uống)',
                'Desserts (Tráng miệng)',
                'Soups (Súp)',
                'Salads (Salad)',
                'Side Dishes (Món phụ)',
            ],
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
            data: [2847, 1923, 1756, 982, 754, 423, 249],
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
            categories: [
                'Phở Bò Đặc Biệt',
                'Cơm Gà Xối Mỡ',
                'Bún Chả Hà Nội',
                'Trà Sữa Trân Châu',
                'Bánh Mì Thịt Nướng',
                'Gỏi Cuốn Tôm Thịt',
                'Cà Phê Sữa Đá',
                'Bún Bò Huế',
                'Chả Giò Rế',
                'Cơm Tấm Sườn Bì',
            ],
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
            data: [523, 487, 456, 423, 398, 367, 342, 318, 289, 267],
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
            categories: [
                'Jan 2024',
                'Feb 2024',
                'Mar 2024',
                'Apr 2024',
                'May 2024',
                'Jun 2024',
                'Jul 2024',
                'Aug 2024',
                'Sep 2024',
                'Oct 2024',
                'Nov 2024',
            ],
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
            data: [342, 456, 523, 612, 745, 823, 897, 934, 1023, 1145, 1234],
        },
    ];

    // Mock Data: User-Item Matrix Sparsity Heatmap
    // For demonstration, we'll create a sample 10x10 matrix showing sparse interactions
    const generateHeatmapData = () => {
        const data = [];
        for (let i = 0; i < 20; i++) {
            const row = [];
            for (let j = 0; j < 20; j++) {
                // Create sparse data (5-10% density)
                const hasInteraction = Math.random() < 0.08;
                row.push({
                    x: `P${j + 1}`,
                    y: hasInteraction ? Math.floor(Math.random() * 5) + 1 : 0,
                });
            }
            data.push({
                name: `U${i + 1}`,
                data: row,
            });
        }
        return data;
    };

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

    const heatmapSeries = generateHeatmapData();

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
