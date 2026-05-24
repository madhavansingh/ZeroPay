import { Request, Response, NextFunction, Router } from 'express';

// In-memory metrics counters
const requestCounts: Record<string, number> = {};
const responseTimes: number[] = [];
const statusCounts: Record<number, number> = {};
let totalRequests = 0;

export function metricsCollector(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const routeKey = `${req.method} ${req.route?.path || req.path}`;
    requestCounts[routeKey] = (requestCounts[routeKey] || 0) + 1;
    statusCounts[res.statusCode] = (statusCounts[res.statusCode] || 0) + 1;
    responseTimes.push(duration);
    totalRequests++;

    // Keep response times array bounded (last 10000 entries)
    if (responseTimes.length > 10000) {
      responseTimes.splice(0, responseTimes.length - 10000);
    }
  });
  next();
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function createMetricsRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    const lines: string[] = [
      '# HELP zeropay_requests_total Total number of HTTP requests',
      '# TYPE zeropay_requests_total counter',
      `zeropay_requests_total ${totalRequests}`,
      '',
      '# HELP zeropay_response_duration_ms Response time percentiles',
      '# TYPE zeropay_response_duration_ms gauge',
      `zeropay_response_duration_ms{quantile="0.5"} ${percentile(responseTimes, 50)}`,
      `zeropay_response_duration_ms{quantile="0.95"} ${percentile(responseTimes, 95)}`,
      `zeropay_response_duration_ms{quantile="0.99"} ${percentile(responseTimes, 99)}`,
      '',
      '# HELP zeropay_http_status_total HTTP response status codes',
      '# TYPE zeropay_http_status_total counter',
    ];

    for (const [status, count] of Object.entries(statusCounts)) {
      lines.push(`zeropay_http_status_total{status="${status}"} ${count}`);
    }

    lines.push('');
    lines.push('# HELP zeropay_route_requests_total Requests per route');
    lines.push('# TYPE zeropay_route_requests_total counter');

    for (const [route, count] of Object.entries(requestCounts)) {
      const safeRoute = route.replace(/"/g, '');
      lines.push(`zeropay_route_requests_total{route="${safeRoute}"} ${count}`);
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(lines.join('\n') + '\n');
  });

  return router;
}
