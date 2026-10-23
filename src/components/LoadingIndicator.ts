/** Indicador de carga con show()/hide() (Req. 1.5, 4.5). */
export class LoadingIndicator {
  constructor(private readonly container: HTMLElement) {
    this.container.classList.add('loading');
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');
    const spinner = document.createElement('span');
    spinner.className = 'loading__spinner';
    spinner.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    text.className = 'loading__text';
    text.textContent = 'Consultando el clima…';
    this.container.replaceChildren(spinner, text);
    this.hide();
  }

  show(): void {
    this.container.hidden = false;
  }

  hide(): void {
    this.container.hidden = true;
  }

  isVisible(): boolean {
    return !this.container.hidden;
  }
}
