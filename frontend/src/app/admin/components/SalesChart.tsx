'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function SalesChart() {
  const options: ApexOptions = {
    chart: {
      height: 420,
      type: 'area',
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: {
        style: {
          colors: '#9ca3af',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9ca3af',
        },
      },
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      },
    },
    colors: ['#3b82f6'],
    grid: {
      show: true,
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
    },
  };

  const series = [
    {
      name: 'Revenue',
      data: [6356, 6218, 6156, 6526, 6356, 6256, 6056],
    },
  ];

  return (
    <div className="w-full">
      <Chart options={options} series={series} type="area" height={320} />
    </div>
  );
}


