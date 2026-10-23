# Clima Ahora — weather-forecast-app

Aplicación web (SPA estática) que recibe el nombre de una ciudad, obtiene sus coordenadas con la
**Geocoding API** de Open-Meteo y muestra el clima actual (temperatura, humedad y precipitación)
usando la **Forecast API** de Open-Meteo.

- No tiene backend propio: todo corre en el navegador.
- Las APIs de Open-Meteo son gratuitas y **no requieren API key**.
- Stack: HTML + CSS + TypeScript, [Vite](https://vitejs.dev/) (servidor/compilación) y
  [Vitest](https://vitest.dev/) + [fast-check](https://fast-check.io/) (pruebas).

---

## 1. Requisitos previos

| Herramienta | Versión mínima | Cómo verificar |
|-------------|----------------|----------------|
| Node.js     | **18** o superior (recomendado 20 o 22 LTS) | `node -v` |
| npm         | 9 o superior (viene con Node.js) | `npm -v` |
| Conexión a Internet | — | Necesaria para instalar dependencias y para que la app consulte Open-Meteo |

Si no tienes Node.js, descárgalo de <https://nodejs.org> (versión **LTS**) e instálalo con las
opciones por defecto. Cierra y vuelve a abrir la terminal después de instalarlo.

> **Nota:** No es necesario instalar TypeScript ni Vite de forma global; se instalan como
> dependencias del proyecto.

---

## 2. Copiar el proyecto a la otra máquina

Copia la carpeta del proyecto (por USB, ZIP, Git, etc.). Debe contener al menos:

```
lab3/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vitest.config.ts
└── src/
```

> **Importante:** **No copies la carpeta `node_modules/`** (pesa mucho y depende del sistema
> operativo). Se vuelve a generar en el paso 3. Tampoco hace falta copiar `dist/`.

Si usas Git:

```bash
git clone <url-del-repositorio>
cd <carpeta-del-proyecto>
```

---

## 3. Instalar dependencias

Abre una terminal **dentro de la carpeta del proyecto** (donde está `package.json`) y ejecuta:

```bash
npm ci
```

`npm ci` instala exactamente las versiones registradas en `package-lock.json`.
Si no existe `package-lock.json`, usa en su lugar:

```bash
npm install
```

La instalación tarda entre 1 y 3 minutos según la conexión.

---

## 4. Levantar el servicio

### Opción A — Modo desarrollo (recomendado para probar)

```bash
npm run dev
```

Verás algo como:

```
  VITE v5.x  ready in 400 ms
  ➜  Local:   http://localhost:5173/
```

Abre **<http://localhost:5173/>** en el navegador. Para detener el servidor presiona `Ctrl + C`.

### Opción B — Modo producción (build optimizado)

1. Compilar (verifica tipos y genera la carpeta `dist/`):

   ```bash
   npm run build
   ```

2. Servir la versión compilada:

   ```bash
   npm run preview
   ```

   Abre **<http://localhost:4173/>**.

La carpeta `dist/` es un sitio estático: también puede publicarse en cualquier servidor web
(Nginx, Apache, IIS, GitHub Pages, Netlify, Vercel, etc.) sin configuración adicional.

> **Atención:** Abrir `index.html` con doble clic **no funciona**: el código está en TypeScript y
> necesita pasar por Vite. Usa siempre `npm run dev`, `npm run preview` o la carpeta `dist/`.

---

## 5. Acceder desde otros equipos de la red (opcional)

Por defecto el servidor solo escucha en `localhost`. Para que otros dispositivos de la misma red
(por ejemplo, otra PC o un celular) puedan entrar:

```bash
# Desarrollo
npm run dev -- --host

# Producción
npm run preview -- --host
```

Vite mostrará una línea `Network: http://192.168.x.x:5173/`. Usa esa dirección desde el otro
dispositivo.

Para usar otro puerto:

```bash
npm run dev -- --port 3000
```

> En Windows, la primera vez el **Firewall** puede pedir permiso para Node.js: acepta para
> redes privadas.

---

## 6. Ejecutar las pruebas (opcional)

```bash
npm test          # ejecuta toda la suite una vez (unitarias, de propiedades e integración)
npm run typecheck # solo verificación de tipos de TypeScript
```

Resultado esperado: `Test Files 8 passed` y `Tests 47 passed`.

---

## 7. Uso de la aplicación

1. Escribe el nombre de una ciudad (por ejemplo, `Arequipa`) o pulsa una de las sugerencias.
2. Presiona **Consultar** o la tecla **Enter**.
3. Se mostrarán: nombre de la ciudad, temperatura (°C), humedad relativa (%) y precipitación (mm).

Si la ciudad no existe, si no hay conexión o si el servicio tarda más de 10 segundos, la app
muestra un mensaje de error y puedes volver a intentar.

---

## 8. Resumen de comandos

| Comando | Descripción |
|---------|-------------|
| `npm ci` | Instala las dependencias (usar una sola vez, o tras cambiar `package.json`) |
| `npm run dev` | Servidor de desarrollo en <http://localhost:5173> |
| `npm run build` | Verifica tipos y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve `dist/` en <http://localhost:4173> |
| `npm test` | Ejecuta todas las pruebas |
| `npm run typecheck` | Verifica tipos de TypeScript |

---

## 9. Solución de problemas

| Problema | Solución |
|----------|----------|
| `'node' / 'npm' no se reconoce como un comando` | Node.js no está instalado o la terminal se abrió antes de instalarlo. Instálalo y abre una terminal nueva. |
| En PowerShell: `la ejecución de scripts está deshabilitada en este sistema` | Ejecuta una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` y confirma, o usa **CMD** en lugar de PowerShell. |
| `npm ci` falla por el lockfile | Borra `node_modules/` (si existe) y ejecuta `npm install`. |
| `Port 5173 is in use` | Vite elegirá otro puerto automáticamente (mira la URL en la consola) o indica uno: `npm run dev -- --port 3000`. |
| Error de sintaxis o `Unsupported engine` al iniciar | Tu versión de Node.js es antigua. Actualiza a la versión LTS. |
| La app carga pero muestra "El servicio … no está disponible" | Sin conexión a Internet o la red bloquea `open-meteo.com` (proxy/firewall institucional). Prueba en otra red. |
| La tipografía se ve distinta | La fuente Outfit se carga desde Google Fonts; sin Internet se usa una fuente del sistema. No afecta el funcionamiento. |
| Otros equipos no pueden acceder | Usa `--host` (sección 5) y permite Node.js en el firewall. Ambos equipos deben estar en la misma red. |

---

## 10. Estructura del proyecto

```
src/
├── clients/      # Llamadas HTTP a Open-Meteo (timeout de 10 s)
├── services/     # Parseo y validación de respuestas, clasificación de errores
├── components/   # UI: formulario, tarjeta del clima, carga y errores
├── utils/        # Formateo de valores y mensajes de error
├── types/        # Tipos e interfaces del dominio
├── WeatherController.ts  # Orquesta el flujo completo
├── main.ts       # Punto de entrada
└── styles.css    # Estilos
```

Documentación de diseño: [requirements.md](requirements.md), [design.md](design.md) y
[tasks.md](tasks.md).

Datos meteorológicos proporcionados por [Open-Meteo.com](https://open-meteo.com).
