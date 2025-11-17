import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Force dynamic rendering - no cache
export const dynamic = 'force-dynamic';

interface MetricRow {
  metric_name: string;
  metric_value: number;
  k_value?: number;
}

interface MetricsResponse {
  precision: number[];
  recall: number[];
  map: number[];
  ndcg: number[];
  coverage: number[];
  hitRate: number[];
  summary: {
    precision: number;
    recall: number;
    map: number;
    coverage: number;
    hitRate: number;
  };
}

// Extract K value from metric name (e.g., "Precision@10" -> 10)
function extractKValue(metricName: string): number | null {
  const match = metricName.match(/@(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

// Extract metric type from metric name (e.g., "Precision@10" -> "Precision")
function extractMetricType(metricName: string): string {
  const match = metricName.match(/^([^@]+)/);
  return match ? match[1].trim() : metricName;
}

// GET /api/model-training/metrics?version_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('version_id');

    if (!versionId) {
      return NextResponse.json(
        { success: false, error: 'version_id parameter is required' },
        { status: 400 }
      );
    }

    // Define the expected K values
    const kValues = [10, 15, 20, 25, 30, 35, 40];

    // Parse version_id to number (assuming it's numeric)
    const modelVersionId = parseInt(versionId, 10);
    if (isNaN(modelVersionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid version_id. Must be a number.' },
        { status: 400 }
      );
    }

    // Query metrics for this model_version_id
    const metrics = await prisma.$queryRaw<MetricRow[]>(
      Prisma.sql`
        SELECT metric_name, metric_value
        FROM metrics
        WHERE model_version_id = ${modelVersionId}
        ORDER BY metric_name, timestamp DESC
      `
    );

    // Initialize arrays for each metric type with default values (0)
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

    // Process metrics and extract values by K
    metrics.forEach(metric => {
      const kValue = extractKValue(metric.metric_name);
      const metricType = extractMetricType(metric.metric_name).toLowerCase();

      if (kValue && kValues.includes(kValue)) {
        if (metricType.includes('precision')) {
          precision[kValue] = metric.metric_value;
        } else if (metricType.includes('recall')) {
          recall[kValue] = metric.metric_value;
        } else if (metricType.includes('map')) {
          map[kValue] = metric.metric_value;
        } else if (metricType.includes('ndcg')) {
          ndcg[kValue] = metric.metric_value;
        } else if (metricType.includes('coverage')) {
          coverage[kValue] = metric.metric_value;
        } else if (metricType.includes('hit') || metricType.includes('hitrate')) {
          hitRate[kValue] = metric.metric_value;
        }
      }
    });

    // Convert to arrays in the order of kValues
    const response: MetricsResponse = {
      precision: kValues.map(k => precision[k] || 0),
      recall: kValues.map(k => recall[k] || 0),
      map: kValues.map(k => map[k] || 0),
      ndcg: kValues.map(k => ndcg[k] || 0),
      coverage: kValues.map(k => coverage[k] || 0),
      hitRate: kValues.map(k => hitRate[k] || 0),
      summary: {
        precision: precision[10] || 0,
        recall: recall[10] || 0,
        map: map[10] || 0,
        coverage: coverage[10] || 0,
        hitRate: hitRate[10] || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

