import type { FetchFn } from '../types';

/** Timeout por defecto de las solicitudes HTTP (Req. 2.4, 3.3). */
export const REQUEST_TIMEOUT_MS = 10_000;

/** La solicitud superó el tiempo máximo de espera. */
export class TimeoutError extends Error {
  constructor() {
    super('La solicitud superó el tiempo de espera');
    this.name = 'TimeoutError';
  }
}

/** Fallo de red (sin conexión, DNS, CORS, etc.). */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('Error de red');
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/**
 * Ejecuta fetch con un timeout implementado mediante AbortController + setTimeout.
 * Retorna la Response cruda; lanza TimeoutError o NetworkError.
 */
export async function fetchWithTimeout(
  url: string,
  fetchFn: FetchFn,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetchFn(url, { signal: controller.signal });
  } catch (err) {
    if (timedOut) throw new TimeoutError();
    throw new NetworkError(err);
  } finally {
    clearTimeout(timer);
  }
}
