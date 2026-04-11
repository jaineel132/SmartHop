import { 
  ClusterGroupV2,
  FarePredictionV2Data,
  MLError,
  MLResponse,
  RouteOptimization, 
  Waypoint 
} from '@/types';

const ML_BASE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL;

function buildRequestId(): string {
  return `fe-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowMs(): number {
  if (typeof performance !== 'undefined') {
    return performance.now();
  }
  return Date.now();
}

async function fetchFromMLV2<T>(path: string, options?: RequestInit, timeoutMs = 12000): Promise<MLResponse<T>> {
  const requestId = buildRequestId();
  const start = nowMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${ML_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...options?.headers,
      },
    });

    const latencyMs = Math.round(nowMs() - start);
    if (!response.ok) {
      return {
        data: null,
        error: {
          code: 'ML_SERVICE_ERROR',
          message: `ML API returned status ${response.status}`,
          status: response.status,
        },
        metadata: {
          request_id: requestId,
          latency_ms: latencyMs,
          fallback_used: false,
          contract_version: 'v2',
        },
      };
    }

    const payload = await response.json();
    if (typeof payload !== 'object' || payload === null || !('metadata' in payload)) {
      return {
        data: null,
        error: {
          code: 'INVALID_RESPONSE',
          message: 'ML API payload does not match v2 envelope',
        },
        metadata: {
          request_id: requestId,
          latency_ms: latencyMs,
          fallback_used: false,
          contract_version: 'v2',
        },
      };
    }

    return payload as MLResponse<T>;
  } catch (error: any) {
    const latencyMs = Math.round(nowMs() - start);
    const mlError: MLError = error?.name === 'AbortError'
      ? { code: 'TIMEOUT', message: `ML API timeout after ${timeoutMs}ms` }
      : { code: 'NETWORK_ERROR', message: error?.message || 'Network request failed' };

    return {
      data: null,
      error: mlError,
      metadata: {
        request_id: requestId,
        latency_ms: latencyMs,
        fallback_used: false,
        contract_version: 'v2',
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}


export const ML_API = {
  async checkMLHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${ML_BASE_URL}/api/health`);
      return response.status === 200;
    } catch {
      return false;
    }
  },

  async predictFareV2(
    distance_km: number,
    cluster_size: number,
    hour: number,
    day: number,
    demand: number,
    timeoutMs = 8000
  ): Promise<MLResponse<FarePredictionV2Data>> {
    return fetchFromMLV2('/api/predict-fare-v2', {
      method: 'POST',
      body: JSON.stringify({
        distance_km,
        cluster_size,
        hour,
        day_of_week: day,
        demand_level: demand,
      }),
    }, timeoutMs);
  },

  async clusterRidersV2(
    riders: { user_id: string; pickup_lat: number; pickup_lng: number; drop_lat: number; drop_lng: number }[],
    timeoutMs = 8000
  ): Promise<MLResponse<ClusterGroupV2[]>> {
    return fetchFromMLV2('/api/cluster-riders-v2', {
      method: 'POST',
      body: JSON.stringify(riders),
    }, timeoutMs);
  },

  async optimizeRouteV2(
    waypoints: Waypoint[],
    start_lat: number,
    start_lng: number,
    timeoutMs = 8000
  ): Promise<MLResponse<RouteOptimization>> {
    return fetchFromMLV2('/api/optimize-route-v2', {
      method: 'POST',
      body: JSON.stringify({ waypoints, start_lat, start_lng }),
    }, timeoutMs);
  }
};
