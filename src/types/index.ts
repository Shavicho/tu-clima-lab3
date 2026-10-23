/**
 * Tipos e interfaces centrales del dominio de weather-forecast-app.
 * Ver design.md › "Components and Interfaces" y "Data Models".
 */

/** Coordenadas obtenidas de la Geocoding API (Req. 2.2, 5.1). */
export interface Coordinates {
  latitude: number;
  longitude: number;
  /** Nombre de la ciudad tal como lo retornó la Geocoding API. */
  cityName: string;
  /** Datos opcionales para enriquecer la presentación. */
  country?: string;
  admin1?: string;
}

/** Datos meteorológicos actuales, valores crudos sin formatear (Req. 3.2, 5.2). */
export interface WeatherData {
  /** temperature_2m en °C */
  temperature: number;
  /** relative_humidity_2m en % */
  humidity: number;
  /** precipitation en mm */
  precipitation: number;
}

export type GeocodingError =
  | { type: 'CITY_NOT_FOUND' }
  | { type: 'NETWORK_ERROR' }
  | { type: 'TIMEOUT' }
  | { type: 'SERVICE_ERROR'; statusCode: number }
  | { type: 'INVALID_RESPONSE' };

export type GeocodingResult =
  | { success: true; data: Coordinates }
  | { success: false; error: GeocodingError };

export type ForecastError =
  | { type: 'NETWORK_ERROR' }
  | { type: 'TIMEOUT' }
  | { type: 'SERVICE_ERROR'; statusCode: number }
  | { type: 'INCOMPLETE_DATA' }
  | { type: 'INVALID_RESPONSE' };

export type ForecastResult =
  | { success: true; data: WeatherData }
  | { success: false; error: ForecastError };

export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; cityName: string; weather: WeatherData }
  | { status: 'error'; message: string };

/** Firma mínima de fetch, inyectable para pruebas. */
export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;
