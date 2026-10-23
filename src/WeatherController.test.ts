import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { WeatherDisplay } from './components/WeatherDisplay';
import type { ForecastResult, GeocodingResult } from './types';
import { MESSAGES } from './utils/errorMessages';
import { WeatherController } from './WeatherController';

const GEO_OK: GeocodingResult = {
  success: true,
  data: { latitude: -12.04, longitude: -77.03, cityName: 'Lima', country: 'Perú' },
};
const FORECAST_OK: ForecastResult = { success: true, data: { temperature: 18.26, humidity: 77, precipitation: 0 } };

function setup(geo: () => Promise<GeocodingResult>, forecast: () => Promise<ForecastResult>) {
  document.body.innerHTML = '<section id="w"></section><div id="l"></div><div id="e"></div>';
  const display = new WeatherDisplay(document.getElementById('w')!);
  const loading = new LoadingIndicator(document.getElementById('l')!);
  const error = new ErrorMessage(document.getElementById('e')!);
  const geocodingService = { geocode: vi.fn(geo) };
  const forecastService = { getForecast: vi.fn(forecast) };
  const controller = new WeatherController({ geocodingService, forecastService, display, loading, error });
  return { controller, display, loading, error, geocodingService, forecastService };
}

describe('WeatherController — propiedades', () => {
  // Feature: weather-forecast-app, Propiedad 13: Limpieza del Weather_Display al iniciar nueva búsqueda
  it('P13: el display queda limpio antes de que llegue la nueva respuesta del pronóstico', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim() !== ''),
        fc.record({
          temperature: fc.double({ min: -50, max: 50, noNaN: true }),
          humidity: fc.double({ min: 0, max: 100, noNaN: true }),
          precipitation: fc.double({ min: 0, max: 50, noNaN: true }),
        }),
        async (prevCity, prevWeather) => {
          let releaseForecast!: (r: ForecastResult) => void;
          const ctx = setup(
            () => Promise.resolve(GEO_OK),
            () => new Promise<ForecastResult>((res) => (releaseForecast = res)),
          );
          ctx.display.render({ cityName: prevCity }, prevWeather, prevCity);
          expect(ctx.display.isEmpty()).toBe(false);

          const pending = ctx.controller.search('Lima');
          await vi.waitFor(() => expect(ctx.forecastService.getForecast).toHaveBeenCalled());
          expect(ctx.display.isEmpty()).toBe(true); // limpio mientras el pronóstico está pendiente

          releaseForecast(FORECAST_OK);
          await pending;
          expect(ctx.display.isEmpty()).toBe(false);
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe('WeatherController — ejemplos', () => {
  it('flujo exitoso completo: geocoding → forecast → display', async () => {
    const ctx = setup(() => Promise.resolve(GEO_OK), () => Promise.resolve(FORECAST_OK));
    await ctx.controller.search('  lima  ');
    expect(ctx.geocodingService.geocode).toHaveBeenCalledWith('lima');
    expect(ctx.forecastService.getForecast).toHaveBeenCalledWith(-12.04, -77.03);
    expect(document.getElementById('weather-city')?.textContent).toBe('Lima');
    expect(document.getElementById('weather-temperature')?.textContent).toBe('18.3 °C');
    expect(document.getElementById('weather-humidity')?.textContent).toBe('77 %');
    expect(document.getElementById('weather-precipitation')?.textContent).toBe('0.0 mm');
    expect(ctx.loading.isVisible()).toBe(false);
  });

  it('CITY_NOT_FOUND → mensaje correcto y no consulta el pronóstico', async () => {
    const ctx = setup(
      () => Promise.resolve({ success: false, error: { type: 'CITY_NOT_FOUND' } }),
      () => Promise.resolve(FORECAST_OK),
    );
    await ctx.controller.search('Atlantis');
    expect(ctx.error.message).toBe(MESSAGES.CITY_NOT_FOUND);
    expect(ctx.forecastService.getForecast).not.toHaveBeenCalled();
    expect(ctx.loading.isVisible()).toBe(false);
  });

  it('INCOMPLETE_DATA → mensaje correcto', async () => {
    const ctx = setup(
      () => Promise.resolve(GEO_OK),
      () => Promise.resolve({ success: false, error: { type: 'INCOMPLETE_DATA' } }),
    );
    await ctx.controller.search('Lima');
    expect(ctx.error.message).toBe(MESSAGES.FORECAST_INCOMPLETE_DATA);
    expect(ctx.display.isEmpty()).toBe(true);
  });

  it('el indicador de carga aparece al iniciar y desaparece al terminar', async () => {
    let release!: (r: GeocodingResult) => void;
    const ctx = setup(() => new Promise((r) => (release = r)), () => Promise.resolve(FORECAST_OK));
    const pending = ctx.controller.search('Lima');
    expect(ctx.loading.isVisible()).toBe(true);
    release({ success: false, error: { type: 'TIMEOUT' } });
    await pending;
    expect(ctx.loading.isVisible()).toBe(false);
    expect(ctx.error.message).toBe(MESSAGES.GEOCODING_TIMEOUT);
  });

  it('entrada vacía → validación sin llamadas de red', async () => {
    const ctx = setup(() => Promise.resolve(GEO_OK), () => Promise.resolve(FORECAST_OK));
    await ctx.controller.search('   ');
    expect(ctx.geocodingService.geocode).not.toHaveBeenCalled();
    expect(ctx.error.message).toBe(MESSAGES.VALIDATION_EMPTY);
  });

  it('descarta respuestas de búsquedas anteriores', async () => {
    const resolvers: Array<(r: GeocodingResult) => void> = [];
    const ctx = setup(() => new Promise((r) => resolvers.push(r)), () => Promise.resolve(FORECAST_OK));
    const first = ctx.controller.search('Madrid');
    const second = ctx.controller.search('Lima');
    resolvers[1](GEO_OK);
    await second;
    resolvers[0]({ success: true, data: { latitude: 40.4, longitude: -3.7, cityName: 'Madrid' } });
    await first;
    expect(document.getElementById('weather-city')?.textContent).toBe('Lima');
  });
});
