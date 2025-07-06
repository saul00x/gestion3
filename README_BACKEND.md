# Backend Django pour StockPro

Ce backend Django remplace complètement Firebase et Cloudinary pour l'application StockPro.

## 🛠️ Technologies utilisées

- **Django 4.2** avec Django REST Framework
- **MySQL** (via XAMPP)
- **JWT Authentication** (djangorestframework-simplejwt)
- **Stockage local** des fichiers/images
- **CORS** pour la communication avec React

## 📋 Prérequis

1. **Python 3.8+**
2. **XAMPP** avec MySQL démarré
3. **pip** (gestionnaire de paquets Python)

## 🚀 Installation

### 1. Cloner et configurer l'environnement

```bash
# Aller dans le dossier backend
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows:
venv\Scripts\activate
# Sur macOS/Linux:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### 2. Configuration de la base de données

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer le fichier .env avec vos paramètres MySQL
# DB_NAME=stockpro_db
# DB_USER=root
# DB_PASSWORD=
# DB_HOST=localhost
# DB_PORT=3306
```

### 3. Initialisation automatique

```bash
# Exécuter le script de configuration
python setup_database.py
```

Ce script va :
- Créer la base de données MySQL
- Appliquer toutes les migrations
- Créer un superutilisateur admin

### 4. Démarrage du serveur

```bash
python manage.py runserver
```

Le serveur sera accessible sur `http://localhost:8000`

## 📊 Structure de la base de données

### Tables principales

1. **accounts_user** - Utilisateurs (remplace Firebase Auth)
2. **stores_magasin** - Magasins
3. **products_produit** - Produits
4. **suppliers_fournisseur** - Fournisseurs
5. **stock_stock** - Stocks par magasin
6. **stock_mouvement** - Mouvements de stock
7. **attendance_presence** - Présences/pointages
8. **messaging_message** - Messages entre utilisateurs

## 🔐 Authentification

Le système utilise JWT (JSON Web Tokens) :

- **Access Token** : Valide 24h
- **Refresh Token** : Valide 7 jours
- **Rotation automatique** des refresh tokens

### Endpoints d'authentification

```
POST /api/auth/login/          # Connexion
POST /api/auth/logout/         # Déconnexion
POST /api/auth/refresh/        # Renouvellement du token
GET  /api/auth/me/             # Utilisateur actuel
```

## 📁 Gestion des fichiers

Les images sont stockées localement dans le dossier `media/` :

```
media/
├── users/          # Photos de profil
├── produits/       # Images des produits
├── magasins/       # Images des magasins
└── fournisseurs/   # Images des fournisseurs
```

Les URLs des images sont automatiquement générées : `http://localhost:8000/media/...`

## 🔄 API Endpoints

### Produits
```
GET    /api/products/           # Liste des produits
POST   /api/products/           # Créer un produit
GET    /api/products/{id}/      # Détail d'un produit
PUT    /api/products/{id}/      # Modifier un produit
DELETE /api/products/{id}/      # Supprimer un produit
```

### Magasins
```
GET    /api/stores/             # Liste des magasins
POST   /api/stores/             # Créer un magasin
GET    /api/stores/{id}/        # Détail d'un magasin
PUT    /api/stores/{id}/        # Modifier un magasin
DELETE /api/stores/{id}/        # Supprimer un magasin
```

### Stock
```
GET    /api/stock/stocks/       # Liste des stocks
POST   /api/stock/stocks/       # Créer un stock
GET    /api/stock/mouvements/   # Liste des mouvements
POST   /api/stock/mouvements/   # Créer un mouvement
```

### Présences
```
GET    /api/attendance/presences/    # Liste des présences
POST   /api/attendance/presences/    # Créer une présence
```

## 👥 Comptes par défaut

Après l'installation, un compte administrateur est créé :

- **Email** : `admin@stockpro.com`
- **Mot de passe** : `admin123`
- **Rôle** : Administrateur

⚠️ **Important** : Changez ce mot de passe en production !

## 🔧 Administration Django

Accédez à l'interface d'administration Django :
- URL : `http://localhost:8000/admin/`
- Utilisez le compte admin créé automatiquement

## 🐛 Dépannage

### Erreur de connexion MySQL
```bash
# Vérifiez que XAMPP MySQL est démarré
# Vérifiez les paramètres dans .env
# Testez la connexion :
python -c "import mysql.connector; print('MySQL OK')"
```

### Erreur de migration
```bash
# Réinitialiser les migrations si nécessaire
python manage.py migrate --fake-initial
```

### Problème de CORS
```bash
# Vérifiez que le frontend tourne sur http://localhost:5173
# Les URLs CORS sont configurées dans settings.py
```

## 📝 Logs et Debug

En mode développement (`DEBUG=True`), tous les logs sont affichés dans la console.

Pour la production, configurez un système de logs approprié dans `settings.py`.

## 🔄 Migration depuis Firebase

Le backend Django reproduit exactement la même structure de données que Firebase :

1. **Collections Firebase** → **Tables MySQL**
2. **Documents Firebase** → **Enregistrements MySQL**
3. **Firebase Storage** → **Stockage local Django**
4. **Firebase Auth** → **JWT Authentication**

Le frontend React n'a besoin que de changer les appels API, la logique métier reste identique.