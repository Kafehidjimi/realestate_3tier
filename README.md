# Architecture 3-tiers (Vue public + React backoffice + API Express + MySQL)

## 1) Base de données (MySQL)
- Option Docker (recommandé en dev) : `docker compose -f docker-compose.example.yml up -d`
- Sinon utilisez un MySQL existant et créez la base `amenageur`.

## 2) Backend API
```
cd backend
cp .env.example .env
# Mettez votre DATABASE_URL MySQL (ex: mysql://root:root@localhost:3306/amenageur)
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```
- API sur `http://localhost:3000`
- Admin: `admin@example.com / admin123` (pour login React)

## 3) Frontend public (Vue 3)
```
cd frontend-vue
npm install
npm install -D @vitejs/plugin-vue
# Optionnel: créez .env et ajoutez VITE_API_BASE_URL=http://localhost:3000
npm run dev
```
- Site sur `http://localhost:5173`

## 4) Backoffice (React)
```
cd backoffice-react
npm install
npm install -D @vitejs/plugin-react
# Optionnel: créez .env et ajoutez VITE_API_BASE_URL=http://localhost:3000
npm run dev
```
- Backoffice sur `http://localhost:5174` (Connectez-vous avec l'admin)

## Remplacement des images et textes
- Site public (Vue) : remplacez les fichiers dans `frontend-vue/public/` (hero1.jpg, hero2.jpg, hero3.jpg, prop1/2/3.jpg).
- Les textes sont dans les pages Vue (Home/Services/Properties/PropertyDetail/Contact).
- Les données dynamiques (services, biens) se gèrent depuis le **Backoffice React** ou via l'API.

## Production (pistes)
- Backend: `pm2` ou `systemd`, proxy `Nginx`, `HTTPS` via Let's Encrypt.
- Frontends: `npm run build` puis servez les fichiers `dist/` via Nginx.
- Sécurité: changez les secrets `.env`, mettez en place sauvegardes MySQL, règles CORS restrictives.
