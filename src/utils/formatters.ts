/**
 * Formateo de valores para la presentación (Req. 5.3, design.md › Reglas de Formateo).
 * Temperatura y precipitación: máximo 1 decimal. Humedad: entero.
 */

/** Evita mostrar "-0.0" cuando el valor redondeado es cero. */
function toOneDecimal(value: number): string {
  const fixed = value.toFixed(1);
  return fixed === '-0.0' ? '0.0' : fixed;
}

export function formatTemperature(value: number): string {
  return `${toOneDecimal(value)} °C`;
}

export function formatHumidity(value: number): string {
  const rounded = Math.round(value);
  return `${rounded === 0 ? 0 : rounded} %`; // normaliza -0
}

export function formatPrecipitation(value: number): string {
  return `${toOneDecimal(value)} mm`;
}
