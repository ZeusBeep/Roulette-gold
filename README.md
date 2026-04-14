# Contador Ruleta - PWA

App web progresiva para contar números y analizar patrones estadísticos en ruleta Black Pearl.

## Cómo publicarla en GitHub Pages

### Paso 1: Crear el repositorio

1. Ve a [github.com](https://github.com) y entra con tu cuenta.
2. Click en el botón verde **"New"** (arriba a la derecha).
3. Nombre del repositorio: `ruleta` (o el nombre que quieras).
4. Marca **"Public"** (obligatorio para GitHub Pages gratis).
5. Click en **"Create repository"**.

### Paso 2: Subir los archivos

**Opción A - Desde la web (más fácil):**

1. En la página del repo recién creado, click en **"uploading an existing file"**.
2. Arrastra TODOS los archivos de esta carpeta (incluyendo la carpeta `icons/`).
3. Baja hasta el final y click **"Commit changes"**.

**Opción B - Desde terminal (si tienes git):**

```bash
cd ruleta-pwa
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ruleta.git
git push -u origin main
```

### Paso 3: Activar GitHub Pages

1. En tu repositorio, ve a **Settings** (arriba a la derecha).
2. En el menú izquierdo, click **Pages**.
3. En "Source", selecciona **"Deploy from a branch"**.
4. En "Branch", selecciona **main** y carpeta **/ (root)**.
5. Click **Save**.
6. Espera 1-2 minutos. Arriba aparecerá la URL: `https://TU_USUARIO.github.io/ruleta/`

### Paso 4: Instalar en el móvil

**iPhone (Safari):**
1. Abre la URL en Safari.
2. Toca el botón Compartir (cuadrado con flecha hacia arriba).
3. Baja y toca **"Añadir a pantalla de inicio"**.
4. Toca **"Añadir"**.

**Samsung/Android (Chrome):**
1. Abre la URL en Chrome.
2. Toca el menú de los 3 puntos (arriba a la derecha).
3. Toca **"Instalar app"** o **"Añadir a pantalla de inicio"**.
4. Confirma.

Listo. La app aparecerá en la pantalla de inicio como cualquier otra app, funciona offline, y guarda todos los datos localmente en el móvil.

## Estructura de archivos

```
ruleta-pwa/
├── index.html       # Página principal
├── app.js           # Lógica de la app
├── sw.js            # Service worker (offline)
├── manifest.json    # Config de instalación
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md        # Este archivo
```

## Funciones incluidas

- Contador táctil con los 37 números de ruleta europea
- Botón decrecer individual por número (para la ventana móvil de la máquina)
- Detección automática de números calientes/fríos (>2σ)
- Test chi-cuadrado para detectar sesgo real
- Gráfica de barras con todos los números
- Gráfica de tendencia de los top 5 números
- Modo oscuro automático según el sistema
- Funcionamiento offline completo
- Vibración táctil al pulsar
- Deshacer último movimiento
- Nueva sesión / borrar todo

## Privacidad

Todos los datos se guardan **solo en tu móvil**, en el `localStorage` del navegador. No se envía nada a ningún servidor. Si desinstalas la app o limpias los datos del navegador, se pierden.
