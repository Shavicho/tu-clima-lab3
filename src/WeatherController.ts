import type { CitySearchForm } from './components/CitySearchForm';
import type { ErrorMessage } from './components/ErrorMessage';
import type { LoadingIndicator } from './components/LoadingIndicator';
import type { WeatherDisplay } from './components/WeatherDisplay';
import type { ForecastResult, GeocodingResult } from './types';
import { forecastErrorMessage, geocodingErrorMessage, MESSAGES } from './utils/errorMessages';

export interface WeatherControllerDeps {
  geocodingService: { geocode(cityName: string): Promise<GeocodingResult> };
  forecastService: { getForecast(lat: number, lon: number): Promise<ForecastResult> };
  display: Pick<WeatherDisplay, 'render' | 'clear'>;
  loading: Pick<LoadingIndicator, 'show' | 'hide'>;
  error: Pick<ErrorMessage, 'show' | 'clear'>;
  form?: Pick<CitySearchForm, 'setBusy' | 'focus'>;
}

/**
 * Orquesta el flujo completo: validación → geocodificación → pronóstico → presentación.
 * Ver design.md › Flujo de Manejo de Errores.
 */
export class WeatherController {
  /** Identificador de la búsqueda vigente; descarta respuestas de búsquedas anteriores. */
  private currentRequest = 0;

  constructor(private readonly deps: WeatherControllerDeps) {}

  async search(rawCityName: string): Promise<void> {
    const { geocodingService, forecastService, display, loading, error, form } = this.deps;
    const cityName = rawCityName.trim();

    // Validación síncrona antes de cualquier llamada de red (Req. 2.5)
    if (cityName === '') {
      display.clear();
      error.show(MESSAGES.VALIDATION_EMPTY);
      return;
    }

    const requestId = ++this.currentRequest;
    const isStale = () => requestId !== this.currentRequest;

    // Limpiar estado previo y mostrar carga (Req. 1.5, 4.5, 4.6)
    display.clear();
    error.clear();
    loading.show();
    form?.setBusy(true);

    const finish = (message?: string) => {
      if (isStale()) return;
      loading.hide();
      form?.setBusy(false);
      if (message) {
        error.show(message);
        form?.focus(); // City_Input accesible para reintentar (Req. 1.6)
      }
    };

    try {
      const geo = await geocodingService.geocode(cityName);
      if (isStale()) return;
      if (!geo.success) return finish(geocodingErrorMessage(geo.error));

      const { latitude, longitude } = geo.data;
      const forecast = await forecastService.getForecast(latitude, longitude);
      if (isStale()) return;
      if (!forecast.success) return finish(forecastErrorMessage(forecast.error));

      display.render(geo.data, forecast.data, cityName);
      finish();
    } catch {
      // Salvaguarda: los servicios no deberían lanzar, pero nunca dejamos la UI colgada.
      finish(MESSAGES.GEOCODING_NETWORK_ERROR);
    }
  }
}
