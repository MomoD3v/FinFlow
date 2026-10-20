# FinFlow

Budget personnel en React 18 / TypeScript / Material UI, compatible GitHub Pages. Les données restent dans IndexedDB sur l'appareil. Aucun serveur de données, secret GitHub, compte distant ou service d'IA n'est nécessaire.

## Démarrage

Node.js 22 ou supérieur :

```sh
npm ci
npm run dev
npm test
npm run build
```

Le chemin public est `/FinFlow/`. La navigation n'utilise pas de routes serveur, ce qui évite les erreurs 404 de GitHub Pages. `npm run deploy` publie explicitement `dist` sur la branche `gh-pages` ; ni la CI ni la création d'une PR ne publient le site.

## Première utilisation

1. Ouvrir **Sauvegardes**, puis **Charger mon import initial ou une sauvegarde**.
2. Choisir le fichier JSON privé préparé à partir du tableur, contrôler le récapitulatif et confirmer. La restauration remplace le budget actuel, après téléchargement d'une copie.
3. Vérifier les comptes des charges fixes et renseigner le buffer protégé si nécessaire.
4. Choisir le mois budgétaire. Un salaire peut financer le mois suivant sa réception.
5. Exporter régulièrement une sauvegarde hors du navigateur. L'effacement des données du site supprime le stockage local. Il n'y a pas de synchronisation entre appareils.

L'ancien état `finflow_state_v1` est migré à la première ouverture et conservé à sa clé d'origine. Sa copie complète est incluse dans la nouvelle sauvegarde. Les montants hors EUR sont conservés dans les données historiques mais ne sont pas agrégés au budget EUR sans conversion. Les comptes migrés sans solde renseigné sont à rapprocher.

## Budget et patrimoine

Le tableau de bord reprend les cartes colorées, les icônes et le thème émeraude de l’interface d’origine, avec douze indicateurs, les flux par enveloppe, le budget prévu/réalisé, les projets et les dernières opérations. Les courbes de patrimoine utilisent uniquement les photos datées enregistrées. Les dépenses nettes excluent l’épargne et les investissements ; leur taux réalisé utilise les revenus enregistrés. Les données manquantes restent signalées et aucun historique n’est inventé.

Le mois budgétaire se choisit avec les listes du mois et de l’année, ou avec les flèches précédent/suivant. La sélection et le thème clair/sombre sont conservés sur cet appareil. Les prévisions et les opérations d’un mois ne sont pas déplacées lorsqu’on consulte un autre mois.

Le tableau « Découpage du salaire » présente chaque enveloppe du mois budgétaire sélectionné : prévu, réalisé net et leurs pourcentages du salaire de référence de ce même mois. La base est le revenu régulier prévu dans « Budget mensuel → Modifier le mois » : renseigner le salaire net qui finance ce mois. Les entrées exceptionnelles, le solde bancaire et les revenus des autres mois ne sont pas utilisés. Une base absente ou nulle laisse les pourcentages à renseigner ; le total des affectations peut dépasser 100 %. Les réalisés dépendent des transactions comptabilisées affectées au mois, même si le salaire a été reçu le mois bancaire précédent.

- Montants stockés en centimes entiers. Prévisions séparées des opérations réelles et opérations en attente.
- Mois bancaire distinct du mois budgétaire ; salaire affecté au mois suivant par défaut lors de l'import.
- Remboursements d'achats déduits de leur catégorie. Transferts entre comptes exclus des revenus et dépenses. Épargne et investissements identifiés comme affectations budgétaires.
- Charges récurrentes avec dates d'effet et ajustement ponctuel. Un changement de tarif crée une nouvelle période sans réécrire les anciens mois.
- Échéanciers des crédits et impôts, avec répartition du dernier centime et jours bornés à la fin du mois.
- Les cagnottes ne sont pas ajoutées une seconde fois aux actifs.
- Les soldes des comptes sont des photos datées, pas recalculés par addition de relevés historiques. Les snapshots historiques sont indépendants des valorisations courantes.
- Les placements détaillés et le module Shariah existants sont conservés. Les valorisations EUR des placements alimentent le patrimoine ; les anciennes interfaces détaillées restent disponibles dans ce module.
- IndexedDB valide chaque sauvegarde et refuse une écriture si un autre onglet a changé la version entre-temps. Recharger la page dans ce cas.

## Import PDF et CSV

Le moteur PDF générique utilise le texte et les positions fournis par PDF.js, les en-têtes de colonnes et les sections. Aucun choix de banque n'est requis. Le worker est livré avec l'application. Les fichiers ne sont pas téléversés.

Sélectionner le compte avant de charger un ou plusieurs relevés de ce compte. L'aperçu permet de modifier les dates, descriptions, montants, catégories, types et mois budgétaires, puis de garder ou ignorer les lignes. Les opérations en attente sont exclues du réalisé. Les montants en devises dans le détail ne remplacent pas le montant débité en EUR.

Les contrôles des soldes/totaux s'effectuent sur toutes les opérations comptabilisées détectées, avant sélection. Un écart exige une validation manuelle. L'absence de contrôle est indiquée explicitement. Deux achats identiques dans le même document sont conservés. Les réimports et lignes ignorées sont repérés par compte/date/montant/libellé et numéro d'occurrence ; une similarité reste à vérifier humainement.

Une correspondance de colonnes peut être corrigée et mémorisée pour le compte. Les réglages de colonnes sont propres au navigateur et peuvent être réinitialisés. Les scans et PDF sans couche texte sont signalés : OCR non inclus. Les PDF chiffrés doivent être fournis déverrouillés. Les documents multi-comptes ou inhabituels nécessitent un contrôle manuel ; une détection universelle parfaite n'est pas garantie.

CSV : en-tête `date,description,amount` (montant signé) ou `date;libelle;debit;credit`. Les champs entre guillemets et séparateurs usuels sont pris en charge. La catégorisation s'enrichit avec les règles créées depuis les transactions.

L'annulation d'un lot retire ses transactions et rétablit les opérations antérieures modifiées lors du rapprochement. Vérifier les modifications manuelles avant d'annuler un ancien lot.

## Reprise ODS privée

```sh
python scripts/convert-budget-ods.py /chemin/budget.ods /chemin/prive/import.json --months 2026-09 2026-10
```

Le convertisseur lit les valeurs sauvegardées du classeur (pas de recalcul). Il reprend comptes, charges, engagements, projets, historique, prévisions des mois sélectionnés et transactions datées ou affectées à ces mois. Il ne transforme pas les prévisions en dépenses. Les noms de comptes génériques sont rapprochés avec les établissements du patrimoine ; les affectations de charges du classeur sont conservées. Les montants manquants restent à renseigner.

Ne jamais placer les relevés, le tableur, les sauvegardes réelles ou leurs captures dans le dépôt public. Les tests publics utilisent uniquement des données fictives.

## Vérifications

```sh
npm test
npm run build
# Facultatif : fichiers privés hors du dépôt
FINFLOW_PRIVATE_PDFS=/chemin/prive FINFLOW_PRIVATE_BACKUP=/chemin/import.json npm run test:private
# Installer Chromium pour les tests navigateur
npx playwright install chromium
FINFLOW_PRIVATE_BACKUP=/chemin/import.json FINFLOW_PRIVATE_PDFS=/chemin/prive node scripts/verify-ui.mjs
```

Le test navigateur démarre son propre serveur local et vérifie restauration, rechargement, navigation, aperçu PDF, import/annulation et largeur mobile. Il accepte `FINFLOW_BROWSER_PATH` si Chromium est déjà installé. Ses captures restent dans le dossier temporaire local, sans données ajoutées à Git.

Pour le contrôle ciblé du tableau de bord, démarrer `npm run dev -- --host 127.0.0.1 --port 5183` dans un terminal, puis `npm run test:dashboard` dans un autre. Ce contrôle utilise un navigateur isolé et des données fictives : remboursements, épargne, exclusion des opérations en attente et transferts, historique réel, projets, choix du mois, changement d’année, persistance du mois et du thème, menu mobile et absence de débordement à 320/390 px. `FINFLOW_URL` permet de choisir un autre serveur et `FINFLOW_SCREENSHOTS` un dossier local pour les captures facultatives. Aucune donnée personnelle n’est nécessaire.
