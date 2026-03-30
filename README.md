# Couple Meals Organizer (PWA)

Application React + Vite pour planifier les repas d'un couple sur la semaine.

## Stack

- React + Vite
- React Router
- React Query
- TailwindCSS
- PWA avec `vite-plugin-pwa`

## Prerequis

- Node.js 20+
- npm

## Installation

```bash
npm install
```

## Variables d'environnement

Créer un fichier `.env` a la racine :

```env
VITE_API_URL=http://localhost:3000
```

## Lancer en developpement

```bash
npm run dev
```

## Build de production

```bash
npm run build
```

## Apercu du build

```bash
npm run preview
```

## Fonctionnalites

- Calendrier hebdomadaire (Lun -> Dim, Midi / Soir)
- Ajout, remplacement et suppression de repas
- Bibliotheque de recettes avec recherche
- Import d'une recette via URL
- Fiche recette detaillee avec ingredients et etapes
- Ajout au calendrier depuis la fiche recette
- Navigation mobile via barre d'onglets en bas
- Support du mode sombre
- Manifest PWA + service worker pour cache des assets
