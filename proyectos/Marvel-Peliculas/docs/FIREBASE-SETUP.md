# Firebase · MCU Tracker

La aplicación puede funcionar en modo local con `localStorage` o sincronizar
el progreso y las puntuaciones por usuario mediante Firebase Authentication y
Cloud Firestore.

## 1. Crear y configurar el proyecto

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Registra una aplicación web y copia su configuración en
   `js/firebase-config.js`.
3. En **Authentication → Sign-in method**, activa **Google**.
4. En **Firestore Database**, crea la base de datos y publica las reglas del
   archivo `firestore.rules`.
5. Añade el dominio de Firebase Hosting en **Authentication → Settings →
   Authorized domains**. Para desarrollo local usa un servidor HTTP, no abras
   la página directamente con `file://`.

El SDK se carga bajo demanda desde el CDN oficial únicamente cuando el archivo
de configuración tiene `apiKey`, `authDomain`, `projectId` y `appId`. Si se
deja vacío, el tracker sigue funcionando localmente.

## 2. Modelo de datos

Cada usuario tiene un documento:

```text
users/{uid}
  schemaVersion: 1
  seen: ["Iron Man", "Thor", ...]
  ratings: { "Iron Man": 9, "Thor": 8 }
  progressPercent: 42
  profile: { displayName, email, photoURL }
  updatedAt: server timestamp
```

Las reglas solo permiten acceder al documento cuyo `uid` coincide con la
sesión autenticada.

## 3. Desplegar con Firebase Hosting

Instala la CLI y autentícate una vez:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,hosting
```

Cuando `firebase use --add` lo solicite, selecciona el proyecto creado en el
primer paso. Después de publicar, añade la URL `*.web.app` o `*.firebaseapp.com`
que te entregue Firebase a los dominios autorizados si no aparece de forma
automática.

## 4. Qué se sincroniza

Al iniciar sesión con Google, si existe un documento remoto se carga en el
tracker; si no existe, se sube el progreso local actual. Los cambios posteriores
en vistos y notas se guardan automáticamente con un pequeño debounce. El campo
`progressPercent` se calcula a partir de los títulos vistos y se guarda junto a
las notas para que el perfil conserve también el porcentaje. Cerrar sesión
vuelve a dejar la app en modo local.

Cuando Firebase está configurado aparece una pantalla de acceso con el estilo
visual del tracker. El botón «Continuar sin cuenta» permite usar el modo local
si se necesita consultar la aplicación sin sincronización.
