# 🍽️ Meal Organizer

**Une PWA full-stack pour planifier ses repas, importer des recettes depuis le web en un clic, et ne plus jamais se demander "qu'est-ce qu'on mange ce soir ?".**

Conçue et développée en solo, utilisée au quotidien par mon couple pour organiser nos repas de la semaine.

[🔗 Frontend repo](https://github.com/AntoineGallou31/meal-organizer-front) · [🔗 Backend repo](https://github.com/AntoineGallou31/meal-organizer-back)

---

## 📸 Aperçu

> _Captures d'écran à ajouter dans `/screenshots`_

| Planning hebdomadaire | Bibliothèque de recettes | Fiche recette |
|---|---|---|
| ![Calendar](screenshots/calendar.png) | ![Recipes](screenshots/recipes.png) | ![Detail](screenshots/detail.png) |

| Import par URL |
|---|
| ![Import](screenshots/import.png) |

---

## ✨ Pourquoi ce projet

On a tous ce dossier de liens de recettes glanées sur Instagram, un blog culinaire ou un site de recettes, jamais réellement exploité, et cette question récurrente du dimanche soir : "on planifie quoi cette semaine ?".

Meal Organizer part de ce problème très concret et propose :
- **Un import de recette en un clic** — colle une URL, l'app scrape et structure automatiquement titre, image, ingrédients, étapes et temps de préparation.
- **Un planning hebdomadaire** avec cases déjeuner/dîner, glisser une recette dessus ou écrire une note libre.
- **Des suggestions intelligentes** basées sur la saisonnalité des ingrédients et l'historique réel de ce qui a été cuisiné.
- **Une expérience mobile installable** (PWA) avec partage direct depuis le navigateur ou une app tierce vers Meal Organizer.

---

## 🧠 Fonctionnalités clés

### Import de recette par URL
Colle un lien depuis n'importe quel site de recettes : le backend scrape la page (parsing des données structurées `schema.org` en priorité, heuristiques CSS/mots-clés en repli), extrait titre, image, ingrédients, étapes et temps de préparation, puis catégorise automatiquement la recette selon son contenu. Détection des doublons, et flux de confirmation si des informations sont partielles.

### Planning hebdomadaire
Vue calendrier (déjeuner/dîner × 7 jours) : on y glisse une recette existante ou on écrit une note libre avec auto-complétion `@recette` pour lier une recette directement depuis une note.

### Suggestions de saison
Un moteur de recommandation croise un calendrier de saisonnalité des ingrédients (produits de saison, en français), la popularité réelle des recettes (nombre de fois cuisinées, déduit de l'historique du planning) et une pénalité de diversité pour éviter de répéter toujours les mêmes catégories.

### Fiche recette détaillée
Temps de préparation, nombre de portions avec **recalcul automatique des quantités** (y compris les fractions unicode ½ ⅓ ¼), badges de saisonnalité, recettes similaires, et compteur "cuisinée X fois".

### PWA installable et partage natif
Installable sur mobile comme une app native, avec un **Web Share Target** : depuis n'importe quelle app (navigateur, réseau social), partage un lien de recette directement vers Meal Organizer pour lancer l'import.

---

## 🛠️ Stack technique

**Frontend**
- React 19 + Vite
- Tailwind CSS 4
- TanStack React Query (infinite scroll, cache, mutations)
- React Router 7
- Radix UI (dialog, dropdown, form)
- `vite-plugin-pwa` (Workbox, manifest, Web Share Target)

**Backend**
- Node.js + Express 5
- Supabase (PostgreSQL + RPC pour la recherche par ingrédient)
- Axios + Cheerio (scraping), parsing `schema.org` / JSON-LD, repli sur heuristiques CSS
- Déployé en serverless sur Vercel

**Architecture**

```
┌─────────────────────┐        HTTPS/JSON        ┌──────────────────────┐
│   React PWA (Vite)   │ ────────────────────────▶│   Express API         │
│   meal-organizer-    │◀──────────────────────── │   meal-organizer-back │
│   front               │                          │   (Vercel serverless) │
└─────────────────────┘                           └──────────┬───────────┘
                                                               │
                                                    ┌──────────▼───────────┐
                                                    │   Supabase (Postgres) │
                                                    └───────────────────────┘
```

---

## 📂 Repos du projet

Ce repo est une vitrine du projet. Le code source complet se trouve dans deux repos séparés :

- **[meal-organizer-front](https://github.com/AntoineGallou31/meal-organizer-front)** — application React/Vite (PWA)
- **[meal-organizer-back](https://github.com/AntoineGallou31/meal-organizer-back)** — API Express + Supabase

---

## 👤 Auteur

Développé par **Antoine Gallou** — projet personnel utilisé au quotidien, pensé comme un cas d'usage réel plutôt qu'un exercice académique.
