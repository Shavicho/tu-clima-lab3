import { fireEvent, getByRole } from '@testing-library/dom';
import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '../utils/errorMessages';
import { CitySearchForm } from './CitySearchForm';

function setup() {
  document.body.innerHTML = '<div id="c"></div>';
  const onSearch = vi.fn();
  const form = new CitySearchForm(document.getElementById('c')!, onSearch);
  return { form, onSearch };
}

describe('CitySearchForm — propiedades', () => {
  // Feature: weather-forecast-app, Propiedad 1: Rechazo de entradas de solo whitespace
  it('P1: entradas vacías o solo whitespace no emiten búsqueda y muestran validación', () => {
    fc.assert(
      fc.property(fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r', '\u00a0')), (value) => {
        const { form, onSearch } = setup();
        form.input.value = value;
        fireEvent.click(form.button);
        expect(onSearch).not.toHaveBeenCalled();
        expect(form.validation.textContent).toBe(MESSAGES.VALIDATION_EMPTY);
      }),
    );
  });

  // Feature: weather-forecast-app, Propiedad 2: Trim del nombre de ciudad antes de enviar
  it('P2: el valor emitido es igual a value.trim()', () => {
    const ws = fc.stringOf(fc.constantFrom(' ', '\t'), { maxLength: 5 });
    const core = fc
      .string({ minLength: 1, maxLength: 80 })
      .filter((s) => s.trim() !== '' && !/[\r\n]/.test(s));
    fc.assert(
      fc.property(ws, core, ws, (pre, mid, post) => {
        const { form, onSearch } = setup();
        const value = pre + mid + post;
        form.input.value = value;
        fireEvent.submit(form.form);
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith(value.trim());
      }),
    );
  });
});

describe('CitySearchForm — ejemplos', () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => {
    ctx = setup();
  });

  it('renderiza City_Input con maxlength=100', () => {
    expect(ctx.form.input.getAttribute('maxlength')).toBe('100');
    expect(getByRole(document.body, 'textbox', { name: 'Nombre de la ciudad' })).toBe(ctx.form.input);
  });

  it('envía con clic en el botón', () => {
    ctx.form.input.value = 'Lima';
    fireEvent.click(getByRole(document.body, 'button', { name: 'Consultar' }));
    expect(ctx.onSearch).toHaveBeenCalledWith('Lima');
  });

  it('envía con Enter mientras City_Input está enfocado (una sola vez)', () => {
    ctx.form.input.value = 'Cusco';
    ctx.form.input.focus();
    fireEvent.keyDown(ctx.form.input, { key: 'Enter' });
    expect(ctx.onSearch).toHaveBeenCalledTimes(1);
    expect(ctx.onSearch).toHaveBeenCalledWith('Cusco');
  });

  it('City_Input permanece accesible mientras está ocupado y tras un error', () => {
    ctx.form.setBusy(true);
    expect(ctx.form.input.disabled).toBe(false);
    expect(ctx.form.button.disabled).toBe(true);
    ctx.form.setBusy(false);
    ctx.form.input.value = '   ';
    ctx.form.submit();
    expect(ctx.form.input.disabled).toBe(false);
    expect(document.activeElement).toBe(ctx.form.input);
  });

  it('limpia la validación al escribir texto válido', () => {
    ctx.form.submit();
    expect(ctx.form.validation.textContent).not.toBe('');
    ctx.form.input.value = 'A';
    fireEvent.input(ctx.form.input);
    expect(ctx.form.validation.textContent).toBe('');
  });
});
