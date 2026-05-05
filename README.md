<div align="center">

# 🎵 Povlao Guess

### El juego de adivinar canciones de música urbana y underground

[![Jugar ahora](https://img.shields.io/badge/🎮%20Jugar%20ahora-povlaoguess.qzz.io-7c3aed?style=for-the-badge)](https://www.povlaoguess.qzz.io/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express)](https://expressjs.com/)

</div>

---

## 🎤 ¿Qué es Povlao Guess?

**Povlao Guess** es un juego web inspirado en el clásico [Heardle](https://en.wikipedia.org/wiki/Heardle) pero dedicado exclusivamente a la **música urbana y underground** española. Escucha fragmentos de canciones y demuestra que eres el mayor fan de la escena.

> 🚀 **¿Quieres jugar ya?** Accede en: [https://www.povlaoguess.qzz.io/](https://www.povlaoguess.qzz.io/)

---

## 🕹️ Modos de juego

### 🎧 Modo Heardle — *Adivina por el audio*
Escucha un fragmento de canción, cada vez más largo, y adivina el título y el artista antes de que se agoten tus **6 intentos**.

- ▶️ Cada fallo desbloquea un fragmento más largo del audio
- 🔍 Autocompletado al escribir el nombre de la canción o artista
- ✅ Feedback visual en cada intento: artista correcto, título correcto, o ninguno
- 🔁 Nuevo juego disponible en cualquier momento

### 📝 Modo Letras — *Adivina por la lírica*
Se muestra un fragmento de la letra de una canción. ¿Reconoces de qué tema es?

- 📖 Fragmento de letra visible desde el principio
- 🎯 Hasta 6 intentos para acertar artista y canción
- 🔊 Se revela el audio al terminar la partida

---

## 🏆 Sistema de rachas

Encadena victorias consecutivas para construir tu **racha**. Cada vez que aciertas, tu contador sube; si fallas o empiezas un nuevo modo, la racha se reinicia. ¡A ver hasta dónde llegas!

---

## ✨ Características

- 🎨 **Estética glitch urbana** — diseño oscuro con efectos visuales que encajan con la escena
- 🔎 **Búsqueda con normalización** — encuentra canciones aunque escribas sin tildes o acentos
- 💬 **Widget de feedback** — manda sugerencias directamente desde la app
- 📱 **Diseño responsive** — funciona tanto en móvil como en escritorio
- ⚡ **Backend Express + SQLite** — API rápida y ligera para servir el catálogo de canciones

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 6 |
| Estilos | Tailwind CSS 4 |
| Routing | React Router DOM 7 |
| Iconos | Lucide React |
| Backend | Express 5 |
| Base de datos | SQLite (better-sqlite3) |
| Metadatos de audio | jsmediatags / music-metadata-browser |

---

## 🚀 Instalación local

### Requisitos previos
- **Node.js** v18 o superior
- **npm**

### Pasos

```bash
# 1. Clona el repositorio
git clone https://github.com/diegolop23/UrbanHeardle.git
cd UrbanHeardle

# 2. Instala las dependencias
npm install

# 3. Arranca el servidor de la API
npm run server

# 4. En otra terminal, lanza el frontend en modo desarrollo
npm run dev
```

También puedes usar los scripts de arranque rápido incluidos:

```bash
# En Linux / macOS
./start.sh

# En Windows
start.bat
```

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualización del build |
| `npm run server` | Inicia la API de Express |
| `npm run generate-manifest` | Genera el manifiesto de canciones |
| `npm run lint` | Linting con ESLint |

---

## 📁 Estructura del proyecto

```
UrbanHeardle/
├── src/
│   ├── components/         # Componentes React
│   │   ├── AudioPlayer.jsx       # Reproductor con control de fragmentos
│   │   ├── LyricsGame.jsx        # Modo letras
│   │   ├── GuessAutocompleteInput.jsx  # Input con sugerencias
│   │   ├── ResultDisplay.jsx     # Historial de intentos
│   │   ├── GameModeBar.jsx       # Barra de cambio de modo
│   │   ├── FeedbackWidget.jsx    # Widget de feedback flotante
│   │   └── Leaderboard.jsx       # Tabla de clasificación (próximamente)
│   ├── server/
│   │   ├── api.js               # API REST con Express
│   │   └── generateManifest.js  # Generador de catálogo
│   ├── utils/
│   │   ├── songs.js             # Lógica de canciones
│   │   └── score.js             # Sistema de puntuación / rachas
│   ├── App.jsx                  # Componente raíz y rutas
│   └── glitch-theme.css         # Estilos del tema urbano
├── public/                      # Assets estáticos
├── index.html
├── vite.config.js
└── package.json
```

---

## 🤝 Contribuir

¿Quieres añadir canciones, reportar un bug o proponer una mejora? Las contribuciones son bienvenidas.

1. Haz un fork del repositorio
2. Crea una rama: `git checkout -b feature/mi-mejora`
3. Commitea tus cambios: `git commit -m "feat: añadir nueva funcionalidad"`
4. Haz push: `git push origin feature/mi-mejora`
5. Abre una **Pull Request**

También puedes usar el **widget de feedback** dentro de la propia aplicación para enviarnos sugerencias directamente.

---

## 📄 Licencia

Este proyecto está bajo la licencia **ISC**.

---

<div align="center">

Hecho con 🖤 para la escena urbana y underground

[🎮 Jugar ahora](https://www.povlaoguess.qzz.io/) · [🐛 Reportar un bug](https://github.com/diegolop23/UrbanHeardle/issues) · [⭐ Dale una estrella](https://github.com/diegolop23/UrbanHeardle)

</div>
