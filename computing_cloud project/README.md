# Faculté des Sciences — portail

Portail public responsive de la Faculté des Sciences de l'Université de Boumerdès. Il affiche un diaporama, les annonces générales et départementales, ainsi que les départements du fichier PostgreSQL fourni.

## Installation

Python 3.10 ou supérieur est requis.

```powershell
py -m pip install -r requirements.txt
```

Importez ensuite la base PostgreSQL fournie, puis démarrez le serveur :

```powershell
$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/umbb_university"
py server.py
```

Ouvrez ensuite `http://127.0.0.1:8000`.

`HOST` et `PORT` peuvent aussi être configurés :

```powershell
$env:HOST = "127.0.0.1"
$env:PORT = "8000"
py server.py
```

## Fonctionnalités

- Page d'accueil publique, sans connexion.
- Diaporama professionnel à défilement automatique.
- Les quatre tuiles d'accès rapide sont décoratives et ne déclenchent aucune action.
- Filtre des annonces : toutes, générales ou départementales.
- Cliquer sur une annonce ouvre sa page de détail (`/announcements/<id>`).
- Cliquer sur un département ouvre sa page, avec ses annonces associées (`/departments/<id>`).
- Les liens « Annonces » et « Départements » ouvrent leurs pages de listes (`/announcements` et `/departments`).
- « Voir toutes » ouvre la page de toutes les annonces (`/announcements`).
- Connexion administrateur depuis le bouton « Connexion admin ».
- Gestion des annonces et des départements depuis le panneau réservé à l'administrateur.
- Données persistantes dans PostgreSQL lorsque `DATABASE_URL` est disponible.

Si PostgreSQL ou le pilote Python n'est pas disponible, le serveur utilise temporairement une mémoire locale pour permettre le développement. Les modifications sont alors perdues au redémarrage.

En mode mémoire, la connexion de démonstration est `admin` / `admin`. En mode PostgreSQL, elle lit les identifiants de la table `administrators`.

## Langues

Le sélecteur `FR / EN` de l'en-tête traduit l'interface et mémorise la langue choisie dans le navigateur.

## Comment fonctionne le backend

Le serveur utilise Python `http.server` et expose des routes REST sous `/api` :

- `GET /api/departments` et `GET /api/announcements` sont publics.
- `POST`, `PUT` et `DELETE` sont réservés à l'administrateur connecté.
- `POST /api/login` vérifie le nom d'utilisateur et le mot de passe.
- `GET /api/me` vérifie la session active.
- `POST /api/logout` supprime la session.

Après la connexion, le serveur crée un jeton aléatoire et l'enregistre dans un cookie HTTP-only. Chaque modification vérifie ce jeton côté serveur avant d'accéder aux données.

En mode PostgreSQL, les annonces viennent de `announcements`, les départements de `departments` et l'administrateur de `administrators`. Le backend transforme les lignes SQL en objets JSON utilisés par JavaScript. Si aucune base n'est disponible, le serveur utilise des listes locales temporaires.
