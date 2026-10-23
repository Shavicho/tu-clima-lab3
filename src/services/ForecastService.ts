import { ForecastClient } from '../clients/ForecastClient';
import { NetworkError, TimeoutError } from '../clients/http';
import type { ForecastError, ForecastResult } from '../types';

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const fail = (error: ForecastError): ForecastResult => ({ success: false, error });

/**
 * Parsea el cuerpo JSON de la Forecast API a WeatherData, sin transformar valores.
 * - `current` ausente o no-objeto → INVALID_RESPONSE (Req. 5.5)
 * - algún campo null/ausente → INCOMPLETE_DATA (Req. 3.5)
 * - algún campo con tipo no numérico → INVALID_RESPONSE (Req. 5.5)
 */
export function parseForecastBody(body: unknown): ForecastResult {
  if (!isObject(body) || !isObject(body.current)) return fail({ type: 'INVALID_RESPONSE' });

  const { temperature_2m, relative_humidity_2m, precipitation } = body.current;
  const values = [temperature_2m, relative_humidity_2m, precipitation];

  if (values.some((v) => v === null || v === undefined)) return fail({ type: 'INCOMPLETE_DATA' });
  if (values.some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
    return fail({ type: 'INVALID_RESPONSE' });
  }

  return {
    success: true,
    data: {
      temperature: temperature_2m as number,
      humidity: relative_humidity_2m as number,
      precipitation: precipitation as number,
    },
  };
}

/** Orquesta la consulta del pronóstico: red → código HTTP → JSON → validación. */
export class ForecastService {
  constructor(private readonly client: ForecastClient = new ForecastClient()) {}

  async getForecast(lat: number, lon: number): Promise<ForecastResult> {
    let response: Response;
    try {
      response = await this.client.getCurrent(lat, lon);
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
    return parseForecastBody(body);
  }
}
