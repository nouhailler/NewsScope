# Sources d'Information, Droits Voisins & Déontologie

## 1. Cadre Légal et Directive Européenne 2019/790

NewsScope respecte strictement la directive européenne 2019/790 sur le droit d'auteur et les droits voisins dans le marché unique numérique :
- **Seules les métadonnées et courts extraits sont indexés :** Titre, extrait factuel court, date UTC et source officielle.
- **Aucun contournement de paywall (No Paywall Bypassing) :** Aucun contenu réservé aux abonnés n'est extrait illicitement.
- **Lien hypertexte canonique :** Chaque dépêche propose un lien direct vers la publication d'origine pour consultation de l'article complet.

## 2. Analyse des Flux d'Agences de Presse

### A. Reuters (`reuters.com`)
- **Type d'accès :** Domaine d'information public indexé par GDELT DOC 2.0.
- **Attribution :** Label `REUTERS`, vérification canonique sur domaine `reuters.com`.

### B. Bloomberg (`bloomberg.com`)
- **Type d'accès :** Domaine d'actualité financière indexé par GDELT DOC 2.0.
- **Attribution :** Label `BLOOMBERG`, vérification canonique sur domaine `bloomberg.com`.

### C. Agence France-Presse (AFP) (`afp.com` & Syndication)
- **Modèle de distribution :** L'AFP diffuse ses dépêches complètes en direct via sa plateforme payante B2B réservée aux médias accrédités (`afpforum.com`).
- **Indexation GDELT :** Le domaine public `afp.com` ne publiant que des communiqués institutionnels et dossiers choisis, la majorité des dépêches AFP référencées sur le web proviennent d'agrégateurs ou de partenaires médias syndiqués.
- **Règle de transparence NewsScope :** Tout article relayé par un tiers citant l'AFP est étiqueté `Mention tierce / Rediffusion` avec avertissement explicite sur l'absence de publication originale sur `afp.com`.

## 3. Données de Démonstration (`mockDispatches.ts`)

Pour permettre le développement de l'interface et la démonstration hors-connexion, un jeu de données de test est maintenu dans `src/data/mockDispatches.ts`.
- **Règle d'intégrité :** Chaque élément du jeu est identifié par `isMock: true` et assorti du badge visible `[DÉMO]`.
- L'application ne prétend jamais qu'une dépêche de démonstration est issue d'un flux en direct.
