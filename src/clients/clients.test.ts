import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { buildForecastUrl, CURRENT_VARIABLES } from './ForecastClient';
import { buildGeocodingUrl, GEOCODING_BASE_URL } from './GeocodingClient';
import { fetchWithTimeout, NetworkError, TimeoutError } from './http';

describe('GeocodingClient', () => {
  // Feature: weather-forecast-app, Propiedad 3: Construcción correcta de la URL de Geocodificación
  it('P3: la URL contiene el nombre URL-encoded como `name` y `count=1`', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (name) => {
        const url = new URL(buildGeocodingUrl(name));
        expect(`${url.origin}${url.pathname}`).toBe(GEOCODING_BASE_URL);
        expect(url.searchParams.get('name')).toBe(name);
        expect(url.searchParams.get('count')).toBe('1');
        // El nombre crudo nunca rompe la query: se codifica
        expect(buildGeocodingUrl(name)).toContain(`name=${new URLSearchParams({ n: name }).toString().slice(2)}`);
      }),
    );
  });
});

describe('ForecastClient', () => {
  // Feature: weather-forecast-app, Propiedad 6: Construcción correcta de la URL de Pronóstico
  it('P6: la URL contiene latitude, longitude y current con las tres variables', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        (lat, lon) => {
          const url = new URL(buildForecastUrl(lat, lon));
          expect(Number(url.searchParams.get('latitude'))).toBe(lat);
          expect(Number(url.searchParams.get('longitude'))).toBe(lon);
          const current = url.searchParams.get('current')?.split(',') ?? [];
          for (const v of CURRENT_VARIABLES) expect(current).toContain(v);
          expect(current).toEqual(['temperature_2m', 'relative_humidity_2m', 'precipitation']);
        },
      ),
    );
  });
});

describe('fetchWithTimeout', () => {
  it('lanza TimeoutError si la solicitud supera el timeout', async () => {
    const hangingFetch = (_: string, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    await expect(fetchWithTimeout('https://x.test', hangingFetch, 20)).rejects.toBeInstanceOf(TimeoutError);
  });

  it('lanza NetworkError ante un fallo de red', async () => {
    const failingFetch = () => Promise.reject(new TypeError('Failed to fetch'));
    await expect(fetchWithTimeout('https://x.test', failingFetch, 1000)).rejects.toBeInstanceOf(NetworkError);
  });

  it('retorna la Response cruda cuando hay respuesta', async () => {
    const res = new Response('{}', { status: 500 });
    await expect(fetchWithTimeout('https://x.test', () => Promise.resolve(res), 1000)).resolves.toBe(res);
  });
});
