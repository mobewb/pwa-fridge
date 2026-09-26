# Fridge — PWA

Client mobile (React + Vite + TypeScript) de l'API [back-end-fridge](../back-end-fridge) : connexion, liste des produits, « bientôt périmés », ajout / édition / consommé / suppression. Installable sur iPhone et Android, dernier état lisible hors-ligne.

## Démarrage

```sh
# 1. back-end (dans ../back-end-fridge) : mise run db && mise run migrate && mise run dev
# 2. front
npm install
npm run dev          # http://localhost:5173, /api proxifié vers http://localhost:8000
```

Autres commandes : `npm test`, `npm run lint`, `npm run build` (+ `npm run preview` pour tester le service worker), `npm run icons` (régénère les icônes depuis `public/favicon.svg`).

## Production

- Servir `dist/` en **HTTPS** (obligatoire pour le service worker et l'installation).
- `VITE_API_URL` = URL complète de l'API (voir `.env.example`) au moment du build, et ajouter l'origine de la PWA dans `CORS_ORIGINS` côté back-end. Ou servir PWA et API sous le même domaine via un reverse proxy (`/api` → API) et ne rien configurer.
- Installation : Android/Chrome → « Installer l'application » ; iPhone/Safari → Partager → « Sur l'écran d'accueil ».

## Notes

- Le JWT (60 min, sans refresh) est stocké en `localStorage` ; un 401 déconnecte l'utilisateur.
- Les réponses GET sont persistées (`fridge.cache`) pour la lecture hors-ligne ; les écritures nécessitent une connexion.
