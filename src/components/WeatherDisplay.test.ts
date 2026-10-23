import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatHumidity, formatPrecipitation, formatTemperature } from '../utils/formatters';
import { WeatherDisplay } from './WeatherDisplay';

function setup() {
  document.body.innerHTML = '<section id="w"></section>';
  const container = document.getElementById('w')!;
  return { container, display: new WeatherDisplay(container) };
}

const num = fc.double({ min: -100, max: 1000, noNaN: true });
const cityName = fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim() !== '');

describe('WeatherDisplay', () => {
  // Feature: weather-forecast-app, Propiedad 12: Weather_Display contiene todos los campos con sus unidades
  it('P12: muestra ciudad, temperatura °C, humedad % y precipitación mm', () => {
    fc.assert(
      fc.property(
        cityName,
        fc.record({ temperature: num, humidity: num, precipitation: num }),
        (name, weather) => {
          const { container, display } = setup();
          display.render({ cityName: name }, weather, 'entrada');
          expect(container.querySelector('#weather-city')?.textContent).toBe(name);
          expect(container.querySelector('#weather-temperature')?.textContent).toBe(formatTemperature(weather.temperature));
          expect(container.querySelector('#weather-humidity')?.textContent).toBe(formatHumidity(weather.humidity));
          expect(container.querySelector('#weather-precipitation')?.textContent).toBe(
            formatPrecipitation(weather.precipitation),
          );
          expect(container.textContent).toMatch(/°C/);
          expect(container.textContent).toMatch(/%/);
          expect(container.textContent).toMatch(/mm/);
        },
      ),
    );
  });

  it('usa el nombre ingresado por el usuario si la API no retorna nombre (Req. 4.7)', () => {
    const { container, display } = setup();
    display.render({ cityName: '' }, { temperature: 1, humidity: 2, precipitation: 3 }, 'Mi Ciudad');
    expect(container.querySelector('#weather-city')?.textContent).toBe('Mi Ciudad');
  });

  it('no interpreta HTML en el nombre de ciudad', () => {
    const { container, display } = setup();
    display.render({ cityName: '<img src=x onerror=alert(1)>' }, { temperature: 1, humidity: 2, precipitation: 3 }, 'x');
    expect(container.querySelector('img')).toBeNull();
  });

  it('clear() vacía y oculta el display', () => {
    const { container, display } = setup();
    display.render({ cityName: 'Lima' }, { temperature: 1, humidity: 2, precipitation: 3 }, 'Lima');
    expect(display.isEmpty()).toBe(false);
    display.clear();
    expect(display.isEmpty()).toBe(true);
    expect(container.hidden).toBe(true);
  });
});
