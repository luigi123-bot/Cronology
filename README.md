# 📺 Cronology

> **Advanced TV Series Tracker** — React Native + Expo + Neon PostgreSQL

![Platform](https://img.shields.io/badge/platform-Android-green?style=flat-square&logo=android)
![Expo](https://img.shields.io/badge/Expo-51-black?style=flat-square&logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Neon](https://img.shields.io/badge/Database-Neon_PostgreSQL-teal?style=flat-square&logo=postgresql)
![Drizzle](https://img.shields.io/badge/ORM-Drizzle-C5F74F?style=flat-square)

Cronology es una aplicación móvil Android para rastrear series de televisión con sincronización en la nube. Incluye seguimiento de episodios, alertas visuales de crossovers, trailers de YouTube, análisis narrativo con IA (DeepSeek), y un motor de recomendaciones basado en géneros.

---

## ✨ Características

| Función | Descripción |
|---------|-------------|
| 📡 **TMDB Integration** | Búsqueda de series y descarga automática de episodios, pósters y stills |
| ☁️ **Cloud Sync** | Progreso de visualización sincronizado en Neon PostgreSQL en tiempo real |
| 🔗 **Crossover Alerts** | Alertas visuales cuando un episodio es parte de un crossover, con orden de visionado |
| 🎬 **YouTube Trailers** | Deep-link a trailers oficiales desde la pantalla de serie/episodio |
| 🤖 **DeepSeek AI** | Datos curiosos y contexto narrativo generados por IA para cada episodio |
| 🔥 **Chicago Universe** | Pre-cargado con el orden cronológico de Chicago Fire, P.D., Med, Justice + SVU |
| 🔍 **Buscador** | Agrega cualquier serie desde TMDB con un solo tap — todo se importa automáticamente |
| ⭐ **Recomendaciones** | Motor de recomendaciones basado en los géneros de tus series guardadas |
| 🌙 **Dark Mode UI** | Diseño premium oscuro con gradientes, animaciones y glassmorphism |

---

## 🏗️ Stack Técnico

```
Frontend        React Native + Expo SDK 51 (TypeScript)
Navegación      Expo Router (file-based routing)
Base de Datos   Neon PostgreSQL (cloud serverless)
ORM             Drizzle ORM (neon-http driver)
Estado Global   Zustand
Imágenes        expo-image (caché avanzado)
API Catálogo    TMDB API v3 (Bearer token)
API Trailers    YouTube Data API v3
AI Analysis     DeepSeek API (deepseek-chat)
Build APK       EAS Build (Expo Application Services)
```

---

## 📁 Estructura del Proyecto

```
Cronology/
│
├── 📱 app/                          # Pantallas (Expo Router)
│   ├── _layout.tsx                  # Root layout + fonts + StatusBar
│   ├── (tabs)/
│   │   ├── _layout.tsx              # Tab bar con blur (Android/iOS)
│   │   ├── index.tsx                # 🏠 Home — Continue watching + recomendaciones
│   │   ├── series.tsx               # 📺 My Series — Grid de series con progreso
│   │   └── search.tsx               # 🔍 Search — Buscar e importar desde TMDB
│   ├── series/
│   │   └── [id].tsx                 # Detalle de serie — Temporadas + episodios
│   └── episode/
│       └── [id].tsx                 # Detalle de episodio — Trailer + AI facts
│
├── 🧩 components/
│   ├── EpisodeCard.tsx              # Tarjeta de episodio con botón ✓ Visto
│   └── CrossoverAlert.tsx          # Alerta expandible de crossover con orden SVU
│
├── 🗄️ db/
│   ├── schema.ts                    # Schema Drizzle ORM (6 tablas)
│   └── index.ts                     # Cliente Neon + Drizzle
│
├── 🔌 services/
│   ├── tmdb.ts                      # TMDB API — search, episodios, imágenes
│   ├── youtube.ts                   # YouTube Data API v3 — trailers
│   └── deepseek.ts                  # DeepSeek AI — facts, contexto, recomendaciones
│
├── 🗂️ store/
│   └── useStore.ts                  # Zustand — auth, series, progreso, géneros
│
├── 🔷 types/
│   └── index.ts                     # Interfaces TypeScript globales
│
├── 📜 constants/
│   └── chicago.ts                   # Chicago Universe + crossovers completos
│
├── 🔧 scripts/
│   ├── migrate.js                   # Migraciones directas a Neon (sin interacción)
│   └── seed.js                      # Seed del Chicago Universe desde TMDB
│
├── .env                             # Variables de entorno (ver sección abajo)
├── app.json                         # Configuración Expo
├── eas.json                         # Configuración EAS Build (APK/AAB)
├── drizzle.config.ts                # Configuración Drizzle ORM
├── babel.config.js                  # Babel + module-resolver (path aliases)
└── tsconfig.json                    # TypeScript (extends expo/tsconfig.base)
```

---

## 🗃️ Esquema de Base de Datos

```
series ──────────────────────────────────────────────────
  id, tmdbId, name, originalName, overview
  posterUrl, bannerUrl, genres (jsonb)
  firstAirDate, lastAirDate, status
  numberOfSeasons, numberOfEpisodes
  youtubeTrailerId, voteAverage
  isChicagoUniverse, sortOrder
  createdAt, updatedAt

seasons ─────────────────────────────────────────────────
  id, seriesId (FK→series), tmdbId
  seasonNumber, name, overview, posterUrl
  airDate, episodeCount, createdAt

episodes ────────────────────────────────────────────────
  id, seriesId (FK→series), seasonId (FK→seasons), tmdbId
  seasonNumber, episodeNumber, name, overview
  airDate, runtime, stillUrl, youtubeClipId
  isCrossover, crossoverName, crossoverOrder
  crossoverSeries (jsonb), deepseekFacts, deepseekNarrative
  voteAverage, createdAt, updatedAt

users ───────────────────────────────────────────────────
  id, email, passwordHash, displayName, avatarUrl
  neonAuthId, createdAt, updatedAt

user_progress ───────────────────────────────────────────
  id, userId (FK→users), episodeId (FK→episodes)
  watched, watchedAt, rating, notes
  createdAt, updatedAt

crossover_arcs ──────────────────────────────────────────
  id, name, description
  orderedEpisodes (jsonb), includesSVU
  airDate, createdAt
```

---

## ⚙️ Configuración

### 1. Clonar y preparar

```bash
git clone <tu-repo>
cd Cronology
npm install --legacy-peer-deps
```

### 2. Variables de Entorno

Crea/edita el archivo `.env` en la raíz:

```env
# ── DeepSeek AI ──────────────────────────────────────────
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# ── Neon PostgreSQL (server-side: seed, migrations) ──────
DATABASE_URL=postgresql://user:pass@host/neondb?sslmode=require&channel_binding=require

# ── Neon Auth ─────────────────────────────────────────────
NEON_AUTH_URL=https://your-endpoint.neonauth.aws.neon.tech/neondb/auth
NEON_JWKS_URL=https://your-endpoint.neonauth.aws.neon.tech/neondb/auth/.well-known/jwks.json

# ── EXPO PUBLIC (accesibles desde el cliente Expo) ────────
EXPO_PUBLIC_DATABASE_URL=postgresql://user:pass@host/neondb?sslmode=require&channel_binding=require
EXPO_PUBLIC_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# TMDB — https://www.themoviedb.org/settings/api
EXPO_PUBLIC_TMDB_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_TMDB_BEARER_TOKEN=eyJhbGciOiJIUzI1NiJ9.xxxx
EXPO_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
EXPO_PUBLIC_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p/w500

# YouTube — https://console.cloud.google.com (YouTube Data API v3)
EXPO_PUBLIC_YOUTUBE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Nota:** Las variables con prefijo `EXPO_PUBLIC_` son accesibles desde el código del cliente en Expo. Las variables sin prefijo solo están disponibles en scripts de Node (seed, migraciones).

### 3. Obtener API Keys

| Servicio | URL | Notas |
|----------|-----|-------|
| **TMDB** | https://www.themoviedb.org/settings/api | Gratis. Necesitas cuenta. Obtendrás API Key y Bearer Token (JWT) |
| **YouTube** | https://console.cloud.google.com | Habilitar "YouTube Data API v3". 10,000 unidades/día gratis |
| **DeepSeek** | https://platform.deepseek.com | ~$0.001 por 1K tokens. Muy económico |

---

## 🚀 Comandos

### Desarrollo

```bash
# Iniciar en modo desarrollo Expo
npm start

# Abrir directamente en la Web
npm run web

# Servidor estático optimizado para Web (puerto 3000)
npm run web:serve

# Abrir en emulador Android
npm run android

# Ver la base de datos en Drizzle Studio (interfaz web)
npm run db:studio
```

### Base de Datos

```bash
# Aplicar el schema a Neon (crear tablas, índices, FK)
node scripts/migrate.js

# Poblar con el Chicago Universe + crossovers desde TMDB
node scripts/seed.js

# Generar archivos de migración Drizzle (para control de versiones)
npm run db:generate

# Aplicar migraciones con confirmación interactiva (requiere terminal manual)
npm run db:push
```

### Build APK

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login en Expo (crear cuenta gratis en expo.dev si no tienes)
eas login

# 3. Vincular proyecto con Expo (solo la primera vez)
eas build:configure

# 4. Compilar APK de preview (instalable directamente en Android)
eas build --platform android --profile preview

# 5. Build de producción (AAB para Google Play Store)
eas build --platform android --profile production
```

> El APK estará disponible para descarga en el dashboard de Expo (expo.dev) o en el link que aparece en la terminal al finalizar el build.

---

## 📱 Pantallas

### 🏠 Home (`/`)
- Banner "Continue Watching" con barra de progreso
- Carrusel del One Chicago Universe
- Recomendaciones basadas en géneros (TMDB + IA)
- Indicador de género predominante

### 📺 My Series (`/series`)
- Grid 2 columnas con pósters de alta calidad
- Estadísticas: series totales, episodios vistos, pendientes
- Badge 🔥 Chicago para series del universo
- Barra de progreso individual por serie

### 🔍 Search (`/search`)
- Búsqueda en tiempo real con debounce (500ms)
- Resultados de TMDB con rating, año, sinopsis
- Botón "Add" → importa todos los episodios, pósters y trailers automáticamente
- Detección automática de series del Chicago Universe

### 🎬 Series Detail (`/series/[id]`)
- Banner/backdrop de la serie
- Barra de progreso global
- Botón de trailer → abre YouTube app (o WebView como fallback)
- Selector de temporadas
- Filtro "Crossovers" para ver solo episodios crossover
- Lista completa de episodios con thumbnails

### 🎞️ Episode Detail (`/episode/[id]`)
- Still image del episodio con overlay de play (si hay trailer)
- Botón "✓ Mark as Watched" → actualiza Neon al instante
- Alerta de crossover expandible con orden de visionado
- Sección de "Curious Facts" generada por DeepSeek AI
- Caché automático de facts en Neon

---

## 🔗 Chicago Universe — Crossovers

El universo incluye los siguientes arcos de crossover (incluyendo SVU):

| Arco | Series | Temporadas |
|------|--------|-----------|
| Three Alarm Fire — P.D. Backdoor Pilot | Fire + P.D. | S1 |
| Infection — Three-Way | Med + Fire + P.D. | S1/S4/S3 |
| For Chicago — Four-Way | Fire + P.D. + Med + Justice | S5/S4/S2/S1 |
| One Chicago One Night | Fire + Med + P.D. | S6/S3/S5 |
| P.D./SVU — Yates Part 1 | P.D. + **SVU** | S3/S17 |
| P.D./SVU — Yates Part 2 | **SVU** + P.D. | S18/S4 |
| Season 8/5/7 Premiere | Fire + Med + P.D. | S8/S5/S7 |
| Season 9/6/8 Premiere | Fire + Med + P.D. | S9/S6/S8 |
| Season 10/7/9 Premiere | Fire + Med + P.D. | S10/S7/S9 |

> **Base de datos actual:** 5 series · **1,305 episodios** · 18 episodios crossover · 9 arcos

Los episodios crossover muestran una **alerta expandible** con:
- Nombre del arco de crossover
- Orden de visionado numerado
- Identificación del episodio actual (`← This episode`)
- Badge especial para crossovers con SVU

---

## 🤖 IA con DeepSeek

La integración con DeepSeek genera tres tipos de contenido:

```typescript
// 1. Datos curiosos del episodio (3 bullets)
getEpisodeFacts(seriesName, episodeName, season, episode, overview)

// 2. Contexto narrativo de crossovers
getCrossoverContext(crossoverName, orderedEpisodes)

// 3. Recomendaciones personalizadas
getAIRecommendation(genres, watchedSeries)
```

Los resultados se **cachean en Neon** (`episodes.deepseek_facts`) para no volver a llamar a la API en visitas posteriores.

---

## 🔒 Seguridad

- Las credenciales de Neon **nunca** se exponen en el bundle final de la app — solo en scripts de Node
- Las variables `EXPO_PUBLIC_*` sí se incluyen en el bundle del cliente (son necesarias para llamadas a TMDB/DeepSeek desde la app)
- Agregar `.env` al `.gitignore` antes de subir a un repositorio público

```bash
# .gitignore — agregar si no está:
.env
.env.local
.env*.local
```

---

## 🛠️ Desarrollo Local — Flujo Completo

```bash
# 1. Instalar dependencias
npm install --legacy-peer-deps

# 2. Configurar .env con tus API keys

# 3. Crear tablas en Neon
node scripts/migrate.js

# 4. Poblar el Chicago Universe
node scripts/seed.js

# 5. Iniciar Expo
npm start

# 6. Escanear QR con Expo Go app (Android/iOS)
#    O presionar 'a' para abrir en emulador Android
```

---

## 📦 Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| `expo` | ~51.0.28 | Framework base |
| `expo-router` | ~3.5.23 | File-based navigation |
| `expo-image` | ~1.12.15 | Imágenes optimizadas con caché |
| `expo-linear-gradient` | ~13.0.2 | Gradientes en UI |
| `expo-blur` | ~13.0.2 | Blur en tab bar (iOS) |
| `@neondatabase/serverless` | ^0.10.4 | Driver PostgreSQL Neon |
| `drizzle-orm` | ^0.38.4 | ORM type-safe |
| `zustand` | ^4.5.5 | Estado global |
| `react-native-webview` | 13.8.6 | Fallback trailers YouTube |
| `@expo-google-fonts/inter` | ^0.2.3 | Tipografía Inter |

---

## 🐛 Solución de Problemas

### `npm install` falla con conflictos de peers
```bash
npm install --legacy-peer-deps
```

### Error de PowerShell `execution policy`
Usar `cmd /c` como prefijo:
```bash
cmd /c "npm install"
cmd /c "node scripts/migrate.js"
```

### `drizzle-kit push` se queda esperando input
Usar el script directo:
```bash
node scripts/migrate.js
```

### La app no conecta con Neon
Verificar que `EXPO_PUBLIC_DATABASE_URL` en `.env` tenga `?sslmode=require&channel_binding=require` al final.

### Imágenes no cargan
Verificar que `EXPO_PUBLIC_TMDB_API_KEY` y `EXPO_PUBLIC_TMDB_BEARER_TOKEN` estén correctos en `.env`.

### EAS Build falla
1. Verificar que `app.json` tenga un `projectId` válido en `extra.eas`
2. Ejecutar `eas build:configure` para obtener el ID automáticamente
3. Asegurarse de estar logueado: `eas whoami`

---

## 📄 Licencia

MIT © Cronology 2026

---

<div align="center">
  <sub>Construido con ❤️ usando React Native, Expo, Neon y DeepSeek AI</sub>
</div>
