import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatHumidity, formatPrecipitation, formatTemperature } from './formatters';

const num = fc.double({ min: -1e6, max: 1e6, noNaN: true });

describe('formatters', () => {
  // Feature: weather-forecast-app, Propiedad 11: Formateo numérico correcto de los valores del clima
  it('P11: temperatura y precipitación con máximo 1 decimal; humedad entera', () => {
    fc.assert(
      fc.property(num, (v) => {
        expect(formatTemperature(v)).toMatch(/^-?\d+(\.\d)? °C$/);
        expect(formatPrecipitation(v)).toMatch(/^-?\d+(\.\d)? mm$/);
        expect(formatHumidity(v)).toMatch(/^-?\d+ %$/);
      }),
    );
  });

  it('P11: el valor formateado corresponde al redondeo del valor crudo', () => {
    fc.assert(
      fc.property(num, (v) => {
        expect(Math.abs(parseFloat(formatTemperature(v)) - v)).toBeLessThanOrEqual(0.05 + 1e-9);
        expect(Math.abs(parseInt(formatHumidity(v), 10) - v)).toBeLessThanOrEqual(0.5);
      }),
    );
  });

  it('ejemplos de design.md', () => {
    expect(formatTemperature(8.4)).toBe('8.4 °C');
    expect(formatHumidity(72)).toBe('72 %');
    expect(formatPrecipitation(0)).toBe('0.0 mm');
    expect(formatTemperature(-0.04)).toBe('0.0 °C');
    expect(formatHumidity(71.6)).toBe('72 %');
  });
});
