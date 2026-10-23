import { fireEvent } from '@testing-library/dom';
import { describe, expect, it, vi } from 'vitest';
import { ForecastClient } from './clients/ForecastClient';
import { GeocodingClient } from './clients/GeocodingClient';
import { CitySearchForm } from './components/CitySearchForm';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { WeatherDisplay } from './components/WeatherDisplay';
import { ForecastService } from './services/ForecastService';
import { GeocodingService } from './services/GeocodingService';
import type { FetchFn } from './types';
import { MESSAGES } from './utils/errorMessages';
import { WeatherController } from './WeatherController';

/** Monta la app completa con fetch simulado (tarea 11.3). */
function mountApp(geoFetch: FetchFn, forecastFetch: FetchFn) {
  document.body.innerHTML =
    '<div id="s"></div><div id="l"></div><div id="e"></div><section id="w"></section>';
  const display = new WeatherDisplay(document.getElementById('w')!);
  const loading = new LoadingIndicator(document.getElementById('l')!);
  const error = new ErrorMessage(document.getElementById('e')!);
  let controller: WeatherController;
  let done: Promise<void> = Promise.resolve();
  const form = new CitySearchForm(document.getElementById('s')!, (city) => {
    done = controller.search(city);
  });
  controller = new WeatherController({
    geocodingService: new GeocodingService(new GeocodingClient(geoFetch)),
    forecastService: new ForecastService(new ForecastClient(forecastFetch)),
    display,
    loading,
    error,
    form,
  });
  return { form, error, loading, settled: () => done };
}

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('Integración extremo a extremo', () => {
  it('búsqueda → geocoding → forecast → datos visibles en el DOM', async () => {
    const geoFetch = vi.fn<FetchFn>(() =>
      json({ results: [{ name: 'Arequipa', latitude: -16.39889, longitude: -71.535, country: 'Perú' }] }),
    );
    const forecastFetch = vi.fn<FetchFn>(() =>
      json({ current: { temperature_2m: 21.04, relative_humidity_2m: 28.6, precipitation: 0.12 } }),
    );
    const app = mountApp(geoFetch, forecastFetch);

    app.form.input.value = ' Arequipa ';
    fireEvent.click(app.form.button);
    expect(app.loading.isVisible()).toBe(true);
    await app.settled();

    expect(new URL(geoFetch.mock.calls[0][0]).searchParams.get('name')).toBe('Arequipa');
    const fUrl = new URL(forecastFetch.mock.calls[0][0]);
    expect(fUrl.searchParams.get('latitude')).toBe('-16.39889');
    expect(fUrl.searchParams.get('longitude')).toBe('-71.535');

    expect(document.getElementById('weather-city')?.textContent).toBe('Arequipa');
    expect(document.getElementById('weather-temperature')?.textContent).toBe('21.0 °C');
    expect(document.getElementById('weather-humidity')?.textContent).toBe('29 %');
    expect(document.getElementById('weather-precipitation')?.textContent).toBe('0.1 mm');
    expect(app.loading.isVisible()).toBe(false);
  });

  it('geocoding falla → mensaje de error visible y City_Input accesible', async () => {
    const forecastFetch = vi.fn<FetchFn>();
    const app = mountApp(() => Promise.reject(new TypeError('Failed to fetch')), forecastFetch);

    app.form.input.value = 'Lima';
    fireEvent.click(app.form.button);
    await app.settled();

    expect(app.error.message).toBe(MESSAGES.GEOCODING_NETWORK_ERROR);
    expect(forecastFetch).not.toHaveBeenCalled();
    expect(app.form.input.disabled).toBe(false);
    expect(app.form.button.disabled).toBe(false);
    expect(document.activeElement).toBe(app.form.input);
  });

  it('forecast retorna HTTP 500 → mensaje que identifica el servicio de pronóstico', async () => {
    const app = mountApp(
      () => json({ results: [{ name: 'Lima', latitude: -12, longitude: -77 }] }),
      () => Promise.resolve(new Response('oops', { status: 500 })),
    );
    app.form.input.value = 'Lima';
    fireEvent.submit(app.form.form);
    await app.settled();
    expect(app.error.message).toContain(MESSAGES.FORECAST_SERVICE_ERROR);
  });
});
