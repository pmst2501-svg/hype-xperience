# HypeTicket — Hype Xperience

Plataforma de boletaje, control de acceso con escáner QR, verificación de pulseras y gestión de eventos masivos con Firebase Authentication y Cloud Firestore.

## Características Principales

- **3 Portales Integrados:**
  - **Creador del Evento (Admin):** Gestión de boletos, pulseras verificadas, mapas interactivos, calendario, staff y mesas VIP.
  - **Staff de Acceso (Colaborador):** Escáner QR en vivo, validación manual y captura fotográfica de pulseras.
  - **Cartelera y Asistentes (Usuario):** Exploración de eventos, compra de boletos con QR dinámico e historias 9:16.
- **Autenticación con Firebase:**
  - Inicio de sesión con **Google Sign-In**.
  - Registro y verificación por **Número de Teléfono (SMS)** y **Correo Electrónico**.
  - Persistencia en **Cloud Firestore** (`ai-studio-hypeticket-e6eb7a44-eee5-4f7c-9fa2-aca6f0c6bf21`) y respaldo local instantáneo.
- **Diseño Unificado:**
  - Marco adaptativo iPhone 16 Pro con Dynamic Island interactiva, barra flotante inferior (Liquid Glass Dock) y pantalla de carga minimalista con el emblema oficial de Hype Xperience.

## Desarrollo Local

```bash
npm install
npm run dev
```

## Construcción para Producción

```bash
npm run build
```

## Despliegue Automático en GitHub Pages

Este proyecto incluye el flujo de trabajo `.github/workflows/deploy.yml`:
1. Sube el proyecto a un repositorio de GitHub (usando el botón **Save to GitHub** en la barra superior de AI Studio o mediante `git push`).
2. En tu repositorio de GitHub, ve a **Settings → Pages**.
3. En **Build and deployment → Source**, selecciona **GitHub Actions**.
4. Cada `push` a la rama `main` compilará y publicará automáticamente la aplicación en GitHub Pages.

---
Todos los derechos reservados para Hype Xperience.
