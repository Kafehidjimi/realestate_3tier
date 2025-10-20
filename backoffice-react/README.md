# 🏢 Sankofa Afrik - Backoffice React

Interface d'administration complète pour la gestion de l'agence immobilière Sankofa Afrik.

## 📋 Fonctionnalités

### ✅ Modules Implémentés

- **🏠 Gestion des Biens** - Créer, modifier, supprimer des propriétés avec images
- **🏗️ Gestion des Projets** - Suivi des projets avec médias, statuts et dates
- **🛠️ Gestion des Services** - Configuration des services proposés
- **👥 Gestion des Clients** - Base de données clients complète
- **💼 Gestion des Affaires** - Transactions et suivi des deals
- **📄 Facturation** - Création et export PDF des factures
- **💰 Paiements** - Enregistrement et suivi des paiements
- **💸 Dépenses** - Suivi des dépenses de l'entreprise
- **📊 Tableau de Bord** - Statistiques et métriques clés

## 🚀 Installation

### Prérequis

- Node.js 16+ et npm
- MySQL 8+
- Backend API en cours d'exécution

### Étapes d'installation

```bash
# 1. Naviguer vers le dossier backoffice
cd backoffice-react

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env
cp .env.example .env

# 4. Configurer l'URL de l'API dans .env
echo "VITE_API_BASE_URL=http://localhost:3000" > .env

# 5. Démarrer le serveur de développement
npm run dev
```

Le backoffice sera accessible sur : **http://localhost:3001**

## 🔐 Connexion

Identifiants par défaut (à changer en production) :
- **Email** : `admin@example.com`
- **Mot de passe** : `admin123`

## 📁 Structure des Fichiers

```
backoffice-react/
├── src/
│   ├── pages/           # Pages de l'application
│   │   ├── Dashboard.jsx
│   │   ├── Properties.jsx
│   │   ├── Projects.jsx
│   │   ├── Services.jsx
│   │   ├── Clients.jsx
│   │   ├── Deals.jsx
│   │   ├── Invoices.jsx
│   │   ├── Payments.jsx
│   │   ├── Expenses.jsx
│   │   └── Login.jsx
│   ├── App.jsx          # Composant principal + routing
│   ├── api.js           # Configuration Axios + intercepteurs
│   ├── main.jsx         # Point d'entrée React
│   └── styles.css       # Styles globaux
├── .env                 # Variables d'environnement
├── vite.config.js       # Configuration Vite
└── package.json
```

## 🎨 Composants Principaux

### Properties.jsx
Gestion complète des biens immobiliers :
- Formulaire avec validation
- Upload d'images
- Catégories : terrain, maison, import-export
- Statuts : vente, location, vendu
- Champs dynamiques selon la catégorie

### Projects.jsx
Gestion des projets :
- Statuts : planifié, en cours, livré
- Surface et nombre d'unités
- Dates de début et livraison
- Images de couverture
- Catégories multiples

### Services.jsx
Configuration des services :
- Upload d'icônes
- Description courte et contenu détaillé
- Génération automatique de slug

## 🔄 API Endpoints Utilisés

```javascript
// Authentification
POST   /api/auth/login
POST   /api/auth/register

// Properties
GET    /api/properties
POST   /api/admin/properties
PUT    /api/admin/properties/:id
DELETE /api/admin/properties/:id
POST   /api/admin/properties/:id/images

// Projects
GET    /api/projects
POST   /api/projects
PUT    /api/admin/projects/:id
DELETE /api/admin/projects/:id
POST   /api/admin/projects/:id/medias

// Services
GET    /api/services
POST   /api/admin/services
PUT    /api/admin/services/:id
DELETE /api/admin/services/:id

// Clients, Deals, Invoices, Payments, Expenses...
// Voir server.js pour la liste complète
```

## 🎯 Fonctionnalités Avancées

### Upload de Fichiers
```javascript
const handleUpload = async (file) => {
  const fd = new FormData()
  fd.append('file', file)
  const { data } = await api.post('/api/admin/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data.url
}
```

### Authentification JWT
L'API client intercepte automatiquement les requêtes pour ajouter le token JWT :
```javascript
// api.js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Gestion des Erreurs
Redirection automatique vers /login en cas d'erreur 401 :
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## 🛠️ Scripts Disponibles

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview du build
npm run preview
```

## 📊 Tableau de Bord

Le tableau de bord affiche :
- Nombre d'affaires ouvertes
- Factures en attente
- Encaissements du mois
- Dépenses du mois

## 🔒 Sécurité

- Authentification JWT obligatoire pour toutes les routes admin
- Tokens stockés en localStorage
- Expiration automatique après 12h
- Validation des données côté client et serveur

## 🎨 Design System

### Couleurs
```css
--primary-color: #0d7c8c;
--primary-dark: #0a5f6d;
--secondary-color: #f97316;
--text-dark: #1a1a1a;
--text-light: #6b7280;
--bg-light: #f9fafb;
```

### Composants
- Boutons : `.btn`, `.btn-primary`, `.btn-secondary`
- Cartes : `.card`
- Tableaux : `.table`
- Formulaires : grilles responsives

## 📱 Responsive Design

L'interface est entièrement responsive :
- Desktop : Layout complet avec navigation horizontale
- Tablet : Navigation adaptée
- Mobile : Menu empilé, tableaux scrollables

## 🐛 Debugging

### Logs Console
```javascript
console.log('📊 Données chargées:', items)
console.error('❌ Erreur:', error)
```

### Vérification API
```bash
# Tester une route depuis le terminal
curl http://localhost:3000/api/properties
```

## 🚀 Déploiement

### Build Production
```bash
npm run build
```

Le dossier `dist/` contiendra les fichiers statiques optimisés.

### Variables d'environnement Production
```env
VITE_API_BASE_URL=https://api.votre-domaine.com
```

## 📝 TODO / Améliorations Futures

- [ ] Upload multiple d'images pour Properties
- [ ] Drag & drop pour réorganiser les images
- [ ] Filtres avancés dans les listes
- [ ] Export Excel personnalisé
- [ ] Gestion des médias de projets depuis l'interface
- [ ] Prévisualisation avant suppression
- [ ] Historique des modifications
- [ ] Notifications en temps réel
- [ ] Mode sombre
- [ ] Multi-langues (FR/EN)

## 🤝 Support

Pour toute question ou problème :
1. Vérifier que le backend est en cours d'exécution
2. Vérifier la configuration `.env`
3. Consulter les logs dans la console navigateur
4. Vérifier les logs du serveur backend

## 📄 Licence

Propriétaire - Sankofa Afrik © 2025