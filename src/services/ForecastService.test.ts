import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ForecastClient } from '../clients/ForecastClient';
import type { FetchFn } from '../types';
import { forecastErrorMessage } from '../utils/errorMessages';
import { ForecastService, parseForecastBody } from './ForecastService';

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const serviceWith = (fetchFn: FetchFn, timeoutMs = 1000) =>
  new ForecastService(new ForecastClient(fetchFn, timeoutMs));

const num = fc.double({ noNaN: true, noDefaultInfinity: true });
const FIELDS = ['temperature_2m', 'relative_humidity_2m', 'precipitation'] as const;

describe('ForecastService — propiedades', () => {
  // Feature: weather-forecast-app, Propiedad 7: Round-trip de parseo de la respuesta Forecast → WeatherData
  it('P7: los valores de WeatherData son idénticos a los del JSON crudo', () => {
    fc.assert(
      fc.property(
        fc.record({ temperature_2m: num, relative_humidity_2m: num, precipitation: num }),
        (current) => {
          const body = JSON.parse(JSON.stringify({ latitude: 0, longitude: 0, current }));
          const parsed = parseForecastBody(body);
          expect(parsed.success).toBe(true);
          if (!parsed.success) return;
          expect(parsed.data.temperature).toBe(body.current.temperature_2m);
          expect(parsed.data.humidity).toBe(body.current.relative_humidity_2m);
          expect(parsed.data.precipitation).toBe(body.current.precipitation);
        },
      ),
    );
  });

  // Feature: weather-forecast-app, Propiedad 10: Campos meteorológicos faltantes generan error de datos incompletos
  it('P10: al menos un campo null/ausente → INCOMPLETE_DATA', () => {
    const fieldState = fc.oneof(num, fc.constantFrom(null, undefined, 'ABSENT' as const));
    fc.assert(
      fc.property(
        fc.tuple(fieldState, fieldState, fieldState).filter((t) => t.some((v) => typeof v !== 'number')),
        (states) => {
          const current: Record<string, unknown> = { time: '2026-10-22T12:00' };
          states.forEach((v, i) => {
            if (v !== 'ABSENT') current[FIELDS[i]] = v;
          });
          expect(parseForecastBody({ current })).toEqual({ success: false, error: { type: 'INCOMPLETE_DATA' } });
        },
      ),
    );
  });

  // Feature: weather-forecast-app, Propiedad 8 (Forecast): Respuestas HTTP no-2xx siempre generan error
  it('P8: cualquier HTTP 300–599 → SERVICE_ERROR que identifica pronóstico', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 300, max: 599 }), async (status) => {
        const result = await serviceWith(() => Promise.resolve(new Response(null, { status }))).getForecast(0, 0);
        expect(result).toEqual({ success: false, error: { type: 'SERVICE_ERROR', statusCode: status } });
        if (!result.success) expect(forecastErrorMessage(result.error)).toMatch(/pronóstico/);
      }),
    );
  });

  // Feature: weather-forecast-app, Propiedad 9 (Forecast): Respuestas 2xx con cuerpo inválido generan error
  it('P9: 2xx con cuerpo malformado o sin `current` → INVALID_RESPONSE', async () => {
    const invalidBody = fc.oneof(
      fc.string().filter((s) => {
        try {
          JSON.parse(s);
          return false;
        } catch {
          return true;
        }
      }),
      fc.constantFrom('42', '"hola"', '[]', 'null', '{}', '{"current":5}', '{"current":[]}', '{"hourly":{}}'),
    );
    await fc.assert(
      fc.asyncProperty(invalidBody, async (raw) => {
        const result = await serviceWith(() => Promise.resolve(new Response(raw, { status: 200 }))).getForecast(0, 0);
        expect(result).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
      }),
    );
  });
});

describe('ForecastService — ejemplos', () => {
  it('error de red → NETWORK_ERROR', async () => {
    const result = await serviceWith(() => Promise.reject(new TypeError('Failed to fetch'))).getForecast(1, 2);
    expect(result).toEqual({ success: false, error: { type: 'NETWORK_ERROR' } });
  });

  it('timeout → TIMEOUT', async () => {
    const hanging: FetchFn = (_, init) =>
      new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('abort'))));
    expect(await serviceWith(hanging, 20).getForecast(1, 2)).toEqual({ success: false, error: { type: 'TIMEOUT' } });
  });

  it('respuesta completa → WeatherData', async () => {
    const body = {
      latitude: -16.375,
      longitude: -71.5,
      current_units: { temperature_2m: '°C', relative_humidity_2m: '%', precipitation: 'mm' },
      current: { time: '2026-10-22T12:00', temperature_2m: 19.7, relative_humidity_2m: 31, precipitation: 0 },
    };
    expect(await serviceWith(() => Promise.resolve(jsonResponse(body))).getForecast(-16.4, -71.5)).toEqual({
      success: true,
      data: { temperature: 19.7, humidity: 31, precipitation: 0 },
    });
  });

  it('campo con tipo no numérico → INVALID_RESPONSE', () => {
    expect(
      parseForecastBody({ current: { temperature_2m: '20', relative_humidity_2m: 50, precipitation: 0 } }),
    ).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
  });
});
