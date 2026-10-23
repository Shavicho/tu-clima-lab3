import type { ForecastError, GeocodingError } from '../types';

/** Mensajes de error al usuario (design.md › Clasificación de Errores). */
export const MESSAGES = {
  VALIDATION_EMPTY: 'El nombre de la ciudad es obligatorio.',
  CITY_NOT_FOUND: 'No se encontró la ciudad ingresada. Verifica el nombre e intenta de nuevo.',
  GEOCODING_NETWORK_ERROR: 'El servicio de geocodificación no está disponible. Verifica tu conexión.',
  GEOCODING_TIMEOUT: 'El servicio de geocodificación no respondió a tiempo.',
  GEOCODING_SERVICE_ERROR: 'El servicio de geocodificación retornó un error.',
  GEOCODING_INVALID_RESPONSE: 'Los datos recibidos del servicio de geocodificación no son válidos.',
  FORECAST_NETWORK_ERROR: 'El servicio de pronóstico no está disponible. Verifica tu conexión.',
  FORECAST_TIMEOUT: 'El servicio de pronóstico no respondió a tiempo.',
  FORECAST_SERVICE_ERROR: 'El servicio de pronóstico retornó un error.',
  FORECAST_INCOMPLETE_DATA: 'Los datos meteorológicos recibidos están incompletos.',
  FORECAST_INVALID_RESPONSE: 'Los datos recibidos del servicio de pronóstico no son válidos.',
} as const;

export function geocodingErrorMessage(error: GeocodingError): string {
  switch (error.type) {
    case 'CITY_NOT_FOUND':
      return MESSAGES.CITY_NOT_FOUND;
    case 'NETWORK_ERROR':
      return MESSAGES.GEOCODING_NETWORK_ERROR;
    case 'TIMEOUT':
      return MESSAGES.GEOCODING_TIMEOUT;
    case 'SERVICE_ERROR':
      return `${MESSAGES.GEOCODING_SERVICE_ERROR} (HTTP ${error.statusCode})`;
    case 'INVALID_RESPONSE':
      return MESSAGES.GEOCODING_INVALID_RESPONSE;
  }
}

export function forecastErrorMessage(error: ForecastError): string {
  switch (error.type) {
    case 'NETWORK_ERROR':
      return MESSAGES.FORECAST_NETWORK_ERROR;
    case 'TIMEOUT':
      return MESSAGES.FORECAST_TIMEOUT;
    case 'SERVICE_ERROR':
      return `${MESSAGES.FORECAST_SERVICE_ERROR} (HTTP ${error.statusCode})`;
    case 'INCOMPLETE_DATA':
      return MESSAGES.FORECAST_INCOMPLETE_DATA;
    case 'INVALID_RESPONSE':
      return MESSAGES.FORECAST_INVALID_RESPONSE;
  }
}
