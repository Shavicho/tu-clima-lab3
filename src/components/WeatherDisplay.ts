import type { WeatherData } from '../types';
import { formatHumidity, formatPrecipitation, formatTemperature } from '../utils/formatters';

export interface LocationInfo {
  cityName: string;
  country?: string;
  admin1?: string;
  latitude?: number;
  longitude?: number;
}

type Mood = 'freezing' | 'cold' | 'mild' | 'warm' | 'hot';

function moodFor(temp: number): Mood {
  if (temp < 0) return 'freezing';
  if (temp < 12) return 'cold';
  if (temp < 22) return 'mild';
  if (temp < 30) return 'warm';
  return 'hot';
}

function summaryFor(w: WeatherData): string {
  if (w.precipitation >= 2.5) return 'Lluvia intensa';
  if (w.precipitation > 0) return 'Lluvia ligera';
  if (w.humidity >= 85) return 'Ambiente muy húmedo';
  if (w.humidity <= 30) return 'Ambiente seco';
  return 'Sin precipitaciones';
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Muestra nombre de ciudad, temperatura (°C), humedad (%) y precipitación (mm) (Req. 4.1–4.4, 4.7).
 * Todo el contenido se inserta con textContent para evitar inyección de HTML.
 */
export class WeatherDisplay {
  constructor(private readonly container: HTMLElement) {
    this.container.classList.add('weather');
    this.clear();
  }

  /** Nombre a mostrar: el de la API, o el ingresado por el usuario si viene vacío (Req. 4.7). */
  static resolveCityName(apiName: string | undefined, userInput: string): string {
    return apiName && apiName.trim() !== '' ? apiName : userInput;
  }

  render(location: LocationInfo, weather: WeatherData, userInput: string): void {
    this.clear();
    const cityName = WeatherDisplay.resolveCityName(location.cityName, userInput);
    const mood = moodFor(weather.temperature);

    const card = el('article', `weather-card weather-card--${mood}`);
    card.setAttribute('aria-labelledby', 'weather-city');

    // Encabezado
    const header = el('header', 'weather-card__header');
    const title = el('h2', 'weather-card__city', cityName);
    title.id = 'weather-city';
    header.append(title);
    const subtitleParts = [location.admin1, location.country].filter(
      (p): p is string => typeof p === 'string' && p !== '' && p !== cityName,
    );
    if (subtitleParts.length > 0) {
      header.append(el('p', 'weather-card__region', subtitleParts.join(', ')));
    }
    if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      const coords = el(
        'p',
        'weather-card__coords',
        `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`,
      );
      coords.title = 'Latitud, longitud';
      header.append(coords);
    }

    // Temperatura principal
    const hero = el('div', 'weather-card__hero');
    const temp = el('p', 'weather-card__temp', formatTemperature(weather.temperature));
    temp.id = 'weather-temperature';
    hero.append(
      el('span', 'weather-card__label', 'Temperatura actual'),
      temp,
      el('span', 'weather-card__summary', summaryFor(weather)),
    );

    // Métricas
    const metrics = el('div', 'weather-card__metrics');

    const humidity = el('section', 'metric metric--humidity');
    const humidityValue = el('p', 'metric__value', formatHumidity(weather.humidity));
    humidityValue.id = 'weather-humidity';
    const bar = el('div', 'metric__bar');
    bar.setAttribute('role', 'presentation');
    const fill = el('span', 'metric__bar-fill');
    fill.style.width = `${Math.min(100, Math.max(0, Math.round(weather.humidity)))}%`;
    bar.append(fill);
    humidity.append(el('h3', 'metric__label', 'Humedad relativa'), humidityValue, bar);

    const precip = el('section', 'metric metric--precip');
    const precipValue = el('p', 'metric__value', formatPrecipitation(weather.precipitation));
    precipValue.id = 'weather-precipitation';
    precip.append(
      el('h3', 'metric__label', 'Precipitación'),
      precipValue,
      el('p', 'metric__hint', weather.precipitation > 0 ? 'Lleva paraguas ☂' : 'Cielo sin lluvia'),
    );

    metrics.append(humidity, precip);
    card.append(header, hero, metrics);
    this.container.append(card);
    this.container.hidden = false;
  }

  /** Limpia el contenido previo (Req. 4.6). */
  clear(): void {
    this.container.replaceChildren();
    this.container.hidden = true;
  }

  isEmpty(): boolean {
    return this.container.childElementCount === 0;
  }
}
