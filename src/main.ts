import './styles.css';
import { ForecastClient } from './clients/ForecastClient';
import { GeocodingClient } from './clients/GeocodingClient';
import { CitySearchForm } from './components/CitySearchForm';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingIndicator } from './components/LoadingIndicator';
import { WeatherDisplay } from './components/WeatherDisplay';
import { ForecastService } from './services/ForecastService';
import { GeocodingService } from './services/GeocodingService';
import { WeatherController } from './WeatherController';

function mustGet(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Falta el elemento #${id} en index.html`);
  return node;
}

const geocodingService = new GeocodingService(new GeocodingClient());
const forecastService = new ForecastService(new ForecastClient());

const display = new WeatherDisplay(mustGet('weather-display'));
const loading = new LoadingIndicator(mustGet('loading-indicator'));
const error = new ErrorMessage(mustGet('error-message'));

let controller: WeatherController;
const form = new CitySearchForm(mustGet('search-container'), (city) => {
  void controller.search(city);
});

controller = new WeatherController({ geocodingService, forecastService, display, loading, error, form });

// Sugerencias rápidas
document.querySelectorAll<HTMLButtonElement>('[data-city]').forEach((btn) => {
  btn.addEventListener('click', () => {
    form.input.value = btn.dataset.city ?? '';
    form.submit();
  });
});

form.focus();
