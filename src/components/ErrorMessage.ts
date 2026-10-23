/** Zona de mensajes de error (Req. 1.6, 2.3, 2.4, 3.3–3.5). */
export class ErrorMessage {
  private readonly text: HTMLParagraphElement;

  constructor(private readonly container: HTMLElement) {
    this.container.classList.add('error');
    this.container.setAttribute('role', 'alert');
    const icon = document.createElement('span');
    icon.className = 'error__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '!';
    this.text = document.createElement('p');
    this.text.className = 'error__text';
    this.text.id = 'error-text';
    this.container.replaceChildren(icon, this.text);
    this.clear();
  }

  show(message: string): void {
    this.text.textContent = message;
    this.container.hidden = false;
  }

  clear(): void {
    this.text.textContent = '';
    this.container.hidden = true;
  }

  get message(): string {
    return this.text.textContent ?? '';
  }
}
