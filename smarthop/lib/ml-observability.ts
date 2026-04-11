/**
 * ML Observability: Track version usage, errors, performance, and business metrics
 * Used for rollout monitoring, SLO gates, and debugging
 */

export interface MLMetrics {
  timestamp: string;
  user_id: string;
  ml_version: 'v1' | 'v2';
  endpoint: string; // /api/predict-fare, /api/cluster-riders, /api/optimize-route
  status: 'success' | 'error' | 'timeout';
  error_code?: string; // NETWORK_ERROR, TIMEOUT, ML_SERVICE_ERROR, INVALID_RESPONSE
  latency_ms: number;
  request_id?: string;
  fallback_used?: boolean; // true if v1 fell back to local calculation
}

export interface MLMetricsSnapshot {
  v1_count: number;
  v2_count: number;
  v1_error_rate: number; // 0-100
  v2_error_rate: number; // 0-100
  v1_p95_latency_ms: number;
  v2_p95_latency_ms: number;
  v1_fallback_rate: number; // % of v1 calls that used fallback
  most_common_v2_error?: string;
}

// In-memory buffer for metrics (would be persisted to analytics in production)
class MLMetricsCollector {
  private metrics: MLMetrics[] = [];
  private maxSize = 10000;

  record(metric: MLMetrics) {
    this.metrics.push(metric);
    // Keep recent metrics only
    if (this.metrics.length > this.maxSize) {
      this.metrics = this.metrics.slice(-this.maxSize);
    }
  }

  /**
   * Get current snapshot of metrics
   * In production, this would query a time-series database
   */
  getSnapshot(): MLMetricsSnapshot {
    const v1Metrics = this.metrics.filter(m => m.ml_version === 'v1');
    const v2Metrics = this.metrics.filter(m => m.ml_version === 'v2');

    const v1Errors = v1Metrics.filter(m => m.status === 'error').length;
    const v2Errors = v2Metrics.filter(m => m.status === 'error').length;

    // Calculate latency percentiles (p95)
    const p95Latency = (latencies: number[]): number => {
      if (latencies.length === 0) return 0;
      const sorted = [...latencies].sort((a, b) => a - b);
      const idx = Math.ceil(sorted.length * 0.95) - 1;
      return idx >= 0 ? sorted[idx] : 0;
    };

    const v1Latencies = v1Metrics.map(m => m.latency_ms);
    const v2Latencies = v2Metrics.map(m => m.latency_ms);

    const v1Fallbacks = v1Metrics.filter(m => m.fallback_used).length;

    // Most common v2 error
    const v2ErrorCodes = v2Metrics
      .filter(m => m.status === 'error' && m.error_code)
      .map(m => m.error_code!);
    const errorFreq = v2ErrorCodes.reduce<Record<string, number>>((acc, code) => {
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});
    const mostCommonError = Object.entries(errorFreq).sort(([, a], [, b]) => b - a)[0]?.[0];

    return {
      v1_count: v1Metrics.length,
      v2_count: v2Metrics.length,
      v1_error_rate: v1Metrics.length > 0 ? (v1Errors / v1Metrics.length) * 100 : 0,
      v2_error_rate: v2Metrics.length > 0 ? (v2Errors / v2Metrics.length) * 100 : 0,
      v1_p95_latency_ms: p95Latency(v1Latencies),
      v2_p95_latency_ms: p95Latency(v2Latencies),
      v1_fallback_rate: v1Metrics.length > 0 ? (v1Fallbacks / v1Metrics.length) * 100 : 0,
      most_common_v2_error: mostCommonError,
    };
  }

  /**
   * Push metrics to backend analytics (e.g., to a logs table)
   * Called periodically or on demand
   */
  async flush(analyticsUrl: string) {
    if (this.metrics.length === 0) return;

    try {
      await fetch(analyticsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: this.metrics }),
      });
      this.metrics = []; // Clear after flush
    } catch (err) {
      console.warn('Failed to flush ML metrics:', err);
    }
  }
}

export const metricsCollector = new MLMetricsCollector();

/**
 * Record an ML call for observability
 */
export function recordMLMetric(metric: MLMetrics) {
  metricsCollector.record(metric);
}

/**
 * SLO gate: Check if v2 is healthy enough to ramp up
 * Returns true if v2 is ready for next stage, false if rolls back
 */
export function isV2HealthyForRollout(snapshot: MLMetricsSnapshot): boolean {
  const MIN_SAMPLE_SIZE = 100;
  const MAX_ERROR_RATE = 5; // 5%
  const MAX_P95_LATENCY = 8000; // 8 seconds
  const MAX_FALLBACK_RATE = 10; // 10%

  // Need enough samples
  if (snapshot.v2_count < MIN_SAMPLE_SIZE) {
    console.log('Not enough v2 samples yet:', snapshot.v2_count, '< ', MIN_SAMPLE_SIZE);
    return false;
  }

  // Error rate acceptable
  if (snapshot.v2_error_rate > MAX_ERROR_RATE) {
    console.warn(`V2 error rate too high: ${snapshot.v2_error_rate.toFixed(2)}% > ${MAX_ERROR_RATE}%`);
    return false;
  }

  // Latency acceptable
  if (snapshot.v2_p95_latency_ms > MAX_P95_LATENCY) {
    console.warn(`V2 p95 latency too high: ${snapshot.v2_p95_latency_ms}ms > ${MAX_P95_LATENCY}ms`);
    return false;
  }

  // v1 fallback rate low enough
  if (snapshot.v1_fallback_rate > MAX_FALLBACK_RATE) {
    console.warn(`V1 fallback rate too high: ${snapshot.v1_fallback_rate.toFixed(2)}% > ${MAX_FALLBACK_RATE}%`);
    return false;
  }

  console.log('✅ V2 healthy for rollout:', snapshot);
  return true;
}

/**
 * Get recommended canary percentage for next stage
 * Used by ops team to decide rollout progression
 */
export function getRecommendedCanaryPercentage(
  snapshot: MLMetricsSnapshot,
  currentPercentage: number
): number {
  const stages = [0, 5, 25, 50, 100];
  const currentIdx = stages.indexOf(currentPercentage);

  if (!isV2HealthyForRollout(snapshot)) {
    // Rollback to previous stage
    return currentIdx > 0 ? stages[currentIdx - 1] : 0;
  }

  // Ramp up to next stage
  if (currentIdx < stages.length - 1) {
    return stages[currentIdx + 1];
  }

  // Fully ramped
  return 100;
}
