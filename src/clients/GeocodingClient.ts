import type { FetchFn } from '../types';
import { fetchWithTimeout, REQUEST_TIMEOUT_MS } from './http';

export const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/** Construye la URL de geocodificación con `name` URL-encoded y `count=1` (Req. 2.1). */
export function buildGeocodingUrl(cityName: string): string {
  const params = new URLSearchParams({
    name: cityName,
    count: '1',
    language: 'es',
    format: 'json',
  });
  return `${GEOCODING_BASE_URL}?${params.toString()}`;
}

/** Cliente HTTP de la Geocoding API: solo comunicación de red. */
export class GeocodingClient {
  constructor(
    private readonly fetchFn: FetchFn = (input, init) => fetch(input, init),
    private readonly timeoutMs: number = REQUEST_TIMEOUT_MS,
  ) {}

  search(cityName: string): Promise<Response> {
    return fetchWithTimeout(buildGeocodingUrl(cityName), this.fetchFn, this.timeoutMs);
  }
}
