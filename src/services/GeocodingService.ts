import { GeocodingClient } from '../clients/GeocodingClient';
import { NetworkError, TimeoutError } from '../clients/http';
import type { GeocodingError, GeocodingResult } from '../types';

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const fail = (error: GeocodingError): GeocodingResult => ({ success: false, error });

/**
 * Parsea el cuerpo JSON de la Geocoding API a Coordinates, sin transformar valores.
 * - `results` ausente o vacío → CITY_NOT_FOUND (Req. 2.3)
 * - latitude/longitude null o ausente → CITY_NOT_FOUND (Req. 2.6)
 * - estructura inesperada o coordenadas fuera de rango → INVALID_RESPONSE (Req. 5.5)
 */
export function parseGeocodingBody(body: unknown): GeocodingResult {
  if (!isObject(body)) return fail({ type: 'INVALID_RESPONSE' });

  const { results } = body;
  if (results === undefined || results === null) return fail({ type: 'CITY_NOT_FOUND' });
  if (!Array.isArray(results)) return fail({ type: 'INVALID_RESPONSE' });
  if (results.length === 0) return fail({ type: 'CITY_NOT_FOUND' });

  const first: unknown = results[0];
  if (!isObject(first)) return fail({ type: 'INVALID_RESPONSE' });

  const { latitude, longitude, name, country, admin1 } = first;
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    return fail({ type: 'CITY_NOT_FOUND' });
  }
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return fail({ type: 'INVALID_RESPONSE' });
  }

  return {
    success: true,
    data: {
      latitude,
      longitude,
      cityName: typeof name === 'string' ? name : '',
      ...(typeof country === 'string' ? { country } : {}),
      ...(typeof admin1 === 'string' ? { admin1 } : {}),
    },
  };
}

/** Orquesta la geocodificación: red → código HTTP → JSON → validación. */
export class GeocodingService {
  constructor(private readonly client: GeocodingClient = new GeocodingClient()) {}

  async geocode(cityName: string): Promise<GeocodingResult> {
    let response: Response;
    try {
      response = await this.client.search(cityName);
    } catch (err) {
      if (err instanceof TimeoutError) return fail({ type: 'TIMEOUT' });
      if (err instanceof NetworkError) return fail({ type: 'NETWORK_ERROR' });
      return fail({ type: 'NETWORK_ERROR' });
    }

    if (!response.ok) return fail({ type: 'SERVICE_ERROR', statusCode: response.status });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return fail({ type: 'INVALID_RESPONSE' });
    }
    return parseGeocodingBody(body);
  }
}
