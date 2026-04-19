<div align="center">

# ⚔️ Here to Slay — Companion App

**Aplicación web companion en tiempo real para el juego de cartas *Here to Slay*.**  
Sincroniza el estado de la partida entre múltiples dispositivos a través de tu red local.

[![MIT License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-real--time-black.svg)](https://socket.io/)

</div>

---

## 📖 ¿Qué es esto?

Este repositorio es una **aplicación companion** no oficial para el juego de cartas **[Here to Slay](https://www.unstablegames.com/products/here-to-slay)** de Unstable Games.

El objetivo es simple: reemplazar el caos de recordar quién tiene qué héroes, cuántos banners hay, y quién puede atacar qué monstruo — todo desde tu móvil o PC mientras juegas físicamente con las cartas.

> **No es un juego digital. Es un asistente para la partida física.**  
> Las cartas reales siguen siendo necesarias. Esto solo gestiona el estado compartido.

---

## ✨ Características

| Función | Descripción |
|:--------|:------------|
| 🔄 **Sincronización en tiempo real** | El estado de la partida se comparte entre todos los dispositivos conectados a tu red local (WebSockets) |
| 👥 **Hasta 6 jugadores** | Cada jugador abre la app en su móvil y ve su propio party |
| ⚔️ **Calculadora de combate** | Dados animados 2d6 + modificadores + resultado automático contra el monstruo seleccionado |
| 🚩 **Sistema de banners automático** | Calcula quién tiene la mayoría en cada clase y asigna los banners según las reglas oficiales |
| 🃏 **3 monstruos activos** | Muestra los monstruos disponibles y valida si tu party cumple los requisitos para atacar |
| 🔁 **Reconexión automática** | Si cambias de app o el navegador se refresca, vuelves a tu partida automáticamente |
| 🛡️ **Panel de admin** | El PC anfitrión puede corregir el estado manualmente, ver el log de acciones y reiniciar |
| 📱 **Diseño mobile-first** | Optimizado para usar desde el móvil con una mano durante la partida |

---

## 🎮 Expansiones incluidas

- ✅ **Base** — Here to Slay
- ✅ **Warriors & Druids**
- ✅ **Berserkers & Necromancers**
- ❌ Sorcerers & Squires *(sin imágenes oficiales disponibles aún)*

---

## 🛠️ Tech Stack

```
Frontend:   React 19 + TypeScript + Vite + Tailwind CSS v3
Backend:    Node.js (Express) + Socket.io
Estado:     Zustand (cliente) + Estado en memoria (servidor)
Red:        LAN local — host: tu PC, clientes: móviles en la misma WiFi
```

---

## 🚀 Cómo ejecutarlo

### Requisitos previos
- [Node.js v18+](https://nodejs.org/)
- Todos los dispositivos en la **misma red WiFi**

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/Here-to-Slay-Companion-App.git
cd "Here to Slay Companion App"

# Instalar dependencias
npm install
```

### Ejecución

Abre **dos terminales**:

**Terminal 1 — Servidor WebSocket:**
```bash
npm run server
```

**Terminal 2 — Cliente Vite:**
```bash
npm run dev
```

La app estará disponible en:
- **PC:** `http://localhost:5173`
- **Móviles:** `http://<IP-de-tu-PC>:5173` (la IP aparece en la terminal de Vite)

### Flujo de uso
1. El **anfitrión** abre la app en el PC → crea sala → comparte el código de 6 letras
2. Los **demás jugadores** abren la app en sus móviles → "Unirse a sala" → introducen el código
3. Cada jugador elige su nombre y líder de party
4. El anfitrión inicia la partida
5. Durante el juego: cada jugador gestiona su party desde su móvil, los banners se actualizan solos

---

## 📂 Estructura del proyecto

```
├── server/
│   ├── server.js        # Express + Socket.io
│   ├── gameState.js     # Estado en memoria + lógica de salas
│   └── gameLogic.js     # Reglas: banners, combate, victoria
│
├── src/
│   ├── components/
│   │   ├── layout/      # Header, NavBar, Modal, Toast
│   │   ├── game/        # MonsterArena, PlayerBoard, CombatCalculator, BannerGrid…
│   │   └── admin/       # AdminConsole
│   ├── hooks/
│   │   ├── useSocket.ts # Conexión Socket.io + reconexión automática
│   │   └── useGameLogic.ts # Validaciones en tiempo real
│   ├── store/
│   │   └── gameStore.ts # Zustand — estado global del cliente
│   ├── pages/
│   │   ├── SetupPage.tsx  # Lobby: crear/unirse a sala
│   │   ├── GamePage.tsx   # Vista principal: 4 tabs
│   │   └── AdminPage.tsx  # Panel de control del anfitrión
│   └── data/
│       ├── monsters.json
│       ├── leaders.json
│       └── banners.json
│
└── resources/
    └── images/          # Assets visuales del juego
```

---

## ⚖️ Licencia y aviso legal

Este proyecto está bajo la licencia **MIT** — puedes usarlo, modificarlo y distribuirlo libremente.

> **⚠️ Aviso importante:**  
> Este proyecto es **no oficial** y **sin fines de lucro**.  
> *Here to Slay* y todos sus personajes, arte e imágenes son propiedad de **Unstable Games**.  
> Las imágenes incluidas en este repositorio son únicamente para uso personal como companion app.  
> Este proyecto no está afiliado, patrocinado ni respaldado por Unstable Games.

Si eres de Unstable Games y tienes alguna objeción, no dudes en contactarme y lo resuelvo encantado.

---

## 🙌 Contribuciones

Este es un proyecto personal y público. Si quieres proponer mejoras, abre un Issue o un Pull Request.

---

<div align="center">
  Hecho con ❤️ para jugar <em>Here to Slay</em> sin perder la cuenta de nada.
</div>
