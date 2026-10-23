import type { FetchFn } from '../types';
import { fetchWithTimeout, REQUEST_TIMEOUT_MS } from './http';

export const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Variables del clima actual. Se usa el nombre moderno `relative_humidity_2m`
 * (requirements.md menciona el legacy `relativehumidity_2m`).
 */
export const CURRENT_VARIABLES = ['temperature_2m', 'relative_humidity_2m', 'precipitation'] as const;

/** Construye la URL de pronóstico (Req. 3.1). */
export function buildForecastUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: CURRENT_VARIABLES.join(','),
    timezone: 'auto',
  });
  return `${FORECAST_BASE_URL}?${params.toString()}`;
}

/** Cliente HTTP de la Forecast API: solo comunicación de red. */
export class ForecastClient {
  constructor(
    private readonly fetchFn: FetchFn = (input, init) => fetch(input, init),
    private readonly timeoutMs: number = REQUEST_TIMEOUT_MS,
  ) {}

  getCurrent(lat: number, lon: number): Promise<Response> {
    return fetchWithTimeout(buildForecastUrl(lat, lon), this.fetchFn, this.timeoutMs);
  }
}
