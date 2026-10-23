import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { GeocodingClient } from '../clients/GeocodingClient';
import type { FetchFn } from '../types';
import { geocodingErrorMessage } from '../utils/errorMessages';
import { GeocodingService, parseGeocodingBody } from './GeocodingService';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const serviceWith = (fetchFn: FetchFn, timeoutMs = 1000) =>
  new GeocodingService(new GeocodingClient(fetchFn, timeoutMs));

const latArb = fc.double({ min: -90, max: 90, noNaN: true });
const lonArb = fc.double({ min: -180, max: 180, noNaN: true });
const missing = fc.constantFrom(null, undefined, 'ABSENT' as const);

describe('GeocodingService — propiedades', () => {
  // Feature: weather-forecast-app, Propiedad 4: Extracción de coordenadas del primer resultado
  it('P4: extrae lat/lon/nombre del primer resultado sin transformación', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ latitude: latArb, longitude: lonArb, name: fc.string() }), { minLength: 1, maxLength: 5 }),
        (results) => {
          const parsed = parseGeocodingBody(JSON.parse(JSON.stringify({ results })));
          expect(parsed.success).toBe(true);
          if (!parsed.success) return;
          expect(parsed.data.latitude).toBe(results[0].latitude);
          expect(parsed.data.longitude).toBe(results[0].longitude);
          expect(parsed.data.cityName).toBe(results[0].name);
        },
      ),
    );
  });

  // Feature: weather-forecast-app, Propiedad 5: Validación de campos de coordenadas faltantes
  it('P5: latitude o longitude null/ausente → CITY_NOT_FOUND', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.tuple(missing, fc.oneof(lonArb, missing)),
          fc.tuple(fc.oneof(latArb, missing), missing),
        ),
        ([lat, lon]) => {
          const item: Record<string, unknown> = { name: 'X' };
          if (lat !== 'ABSENT') item.latitude = lat;
          if (lon !== 'ABSENT') item.longitude = lon;
          expect(parseGeocodingBody({ results: [item] })).toEqual({
            success: false,
            error: { type: 'CITY_NOT_FOUND' },
          });
        },
      ),
    );
  });

  // Feature: weather-forecast-app, Propiedad 8 (Geocoding): Respuestas HTTP no-2xx siempre generan error
  it('P8: cualquier HTTP 300–599 → SERVICE_ERROR que identifica geocodificación', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 300, max: 599 }), async (status) => {
        const result = await serviceWith(() => Promise.resolve(new Response(null, { status }))).geocode('Lima');
        expect(result).toEqual({ success: false, error: { type: 'SERVICE_ERROR', statusCode: status } });
        if (!result.success) expect(geocodingErrorMessage(result.error)).toMatch(/geocodificación/);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: weather-forecast-app, Propiedad 9 (Geocoding): Respuestas 2xx con cuerpo inválido generan error
  it('P9: 2xx con JSON malformado → INVALID_RESPONSE', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((s) => {
          try {
            JSON.parse(s);
            return false;
          } catch {
            return true;
          }
        }),
        async (raw) => {
          const result = await serviceWith(() => Promise.resolve(new Response(raw, { status: 200 }))).geocode('Lima');
          expect(result).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
        },
      ),
    );
  });

  it('P9: 2xx con estructura inesperada → INVALID_RESPONSE', () => {
    for (const body of [42, 'texto', [], { results: 'x' }, { results: [5] }, { results: [{ latitude: 'a', longitude: 1 }] }]) {
      expect(parseGeocodingBody(body)).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
    }
  });
});

describe('GeocodingService — ejemplos', () => {
  it('0 resultados → CITY_NOT_FOUND', async () => {
    expect(await serviceWith(() => Promise.resolve(jsonResponse({ results: [] }))).geocode('zzz')).toEqual({
      success: false,
      error: { type: 'CITY_NOT_FOUND' },
    });
    // La API omite `results` cuando no hay coincidencias
    expect(await serviceWith(() => Promise.resolve(jsonResponse({ generationtime_ms: 0.1 }))).geocode('zzz')).toEqual({
      success: false,
      error: { type: 'CITY_NOT_FOUND' },
    });
  });

  it('error de red → NETWORK_ERROR', async () => {
    const result = await serviceWith(() => Promise.reject(new TypeError('Failed to fetch'))).geocode('Lima');
    expect(result).toEqual({ success: false, error: { type: 'NETWORK_ERROR' } });
  });

  it('timeout → TIMEOUT', async () => {
    const hanging: FetchFn = (_, init) =>
      new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('abort'))));
    expect(await serviceWith(hanging, 20).geocode('Lima')).toEqual({ success: false, error: { type: 'TIMEOUT' } });
  });

  it('respuesta válida → Coordinates', async () => {
    const body = {
      results: [{ id: 3947322, name: 'Arequipa', latitude: -16.39889, longitude: -71.535, country: 'Perú', admin1: 'Arequipa' }],
    };
    expect(await serviceWith(() => Promise.resolve(jsonResponse(body))).geocode('Arequipa')).toEqual({
      success: true,
      data: { latitude: -16.39889, longitude: -71.535, cityName: 'Arequipa', country: 'Perú', admin1: 'Arequipa' },
    });
  });

  it('envía el nombre como parámetro de búsqueda con count=1', async () => {
    let calledUrl = '';
    await serviceWith((url) => {
      calledUrl = url;
      return Promise.resolve(jsonResponse({ results: [] }));
    }).geocode('San José');
    const url = new URL(calledUrl);
    expect(url.searchParams.get('name')).toBe('San José');
    expect(url.searchParams.get('count')).toBe('1');
  });
});
