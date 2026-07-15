# Automatisation Entreprise

Application web **installable** (PWA, façon appli mobile) pour piloter votre
entreprise sur 2-3 appareils :

- 💰 **Caisse** — entrées / sorties, total du mois et solde restant calculés automatiquement
- 👥 **Prospects** — carnet de contacts (CRM) + messages WhatsApp / SMS / e-mail en 1 clic + envoi groupé
- 📣 **Réseaux sociaux** — préparer et **programmer** des posts Facebook / Instagram / TikTok (publication automatique via API)
- ☁️ **Synchronisation** cloud en temps réel entre vos appareils (optionnelle)

L'app **marche dès le premier lancement en local** (données sur l'appareil).
Le cloud et la publication automatique s'activent quand vous le voulez
(voir [`supabase/README.md`](supabase/README.md)).

## Démarrer

```bash
npm install
npm run dev
```

Ouvrez l'adresse affichée (par défaut http://localhost:5180).

### Installer comme une application

- **Sur téléphone (Android/iPhone)** : ouvrez le site → menu du navigateur →
  « Ajouter à l'écran d'accueil ».
- **Sur PC (Chrome/Edge)** : icône d'installation dans la barre d'adresse.

## Construire la version de production

```bash
npm run build      # génère le dossier dist/
npm run preview    # prévisualise la version de prod
```

Déployez `dist/` sur n'importe quel hébergement statique (Vercel, Netlify, …).

## Activer la synchro + la publication auto

Tout est expliqué dans [`supabase/README.md`](supabase/README.md) :
base de données, comptes, jetons Meta/TikTok, planification.

## Pile technique

React + Vite + TypeScript · Tailwind CSS · PWA (installable, hors-ligne) ·
Supabase (base cloud, authentification, temps réel, Edge Functions).
