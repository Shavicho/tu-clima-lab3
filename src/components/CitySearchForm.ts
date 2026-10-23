import { MESSAGES } from '../utils/errorMessages';

export const CITY_INPUT_MAX_LENGTH = 100;

/**
 * Formulario de búsqueda de ciudad (Req. 1.1–1.5).
 * Valida que la entrada no esté vacía ni sea solo whitespace y emite `onSearch(trimmed)`.
 */
export class CitySearchForm {
  readonly form: HTMLFormElement;
  readonly input: HTMLInputElement;
  readonly button: HTMLButtonElement;
  readonly validation: HTMLParagraphElement;

  constructor(
    container: HTMLElement,
    private readonly onSearch: (cityName: string) => void,
  ) {
    this.form = document.createElement('form');
    this.form.className = 'search';
    this.form.id = 'city-search-form';
    this.form.noValidate = true;
    this.form.setAttribute('role', 'search');

    const label = document.createElement('label');
    label.htmlFor = 'city-input';
    label.className = 'visually-hidden';
    label.textContent = 'Nombre de la ciudad';

    const field = document.createElement('div');
    field.className = 'search__field';

    const icon = document.createElement('span');
    icon.className = 'search__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.id = 'city-input';
    this.input.name = 'city';
    this.input.className = 'search__input';
    this.input.maxLength = CITY_INPUT_MAX_LENGTH;
    this.input.placeholder = 'Busca una ciudad… ej. Arequipa';
    this.input.autocomplete = 'off';
    this.input.spellcheck = false;
    this.input.setAttribute('aria-describedby', 'validation-message');

    this.button = document.createElement('button');
    this.button.type = 'submit';
    this.button.id = 'search-button';
    this.button.className = 'search__button';
    this.button.textContent = 'Consultar';

    this.validation = document.createElement('p');
    this.validation.id = 'validation-message';
    this.validation.className = 'search__validation';
    this.validation.setAttribute('aria-live', 'polite');

    field.append(icon, this.input, this.button);
    this.form.append(label, field, this.validation);
    container.append(this.form);

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });
    // Enter con el input enfocado (Req. 1.2). preventDefault evita el submit implícito duplicado.
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submit();
      }
    });
    this.input.addEventListener('input', () => {
      if (this.input.value.trim() !== '') this.clearValidation();
    });
  }

  /** Valida y emite la búsqueda. Retorna true si se emitió. */
  submit(): boolean {
    const trimmed = this.input.value.trim();
    if (trimmed === '') {
      this.showValidation(MESSAGES.VALIDATION_EMPTY);
      this.input.focus();
      return false;
    }
    this.clearValidation();
    this.onSearch(trimmed);
    return true;
  }

  showValidation(message: string): void {
    this.validation.textContent = message;
    this.input.setAttribute('aria-invalid', 'true');
    this.form.classList.add('search--invalid');
  }

  clearValidation(): void {
    this.validation.textContent = '';
    this.input.removeAttribute('aria-invalid');
    this.form.classList.remove('search--invalid');
  }

  /** Durante la carga solo se deshabilita el botón: el input sigue accesible (Req. 1.6). */
  setBusy(busy: boolean): void {
    this.button.disabled = busy;
    this.form.setAttribute('aria-busy', String(busy));
  }

  focus(): void {
    this.input.focus();
  }
}
