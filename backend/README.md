# Backend API (Express + Prisma + MySQL)

## Setup
```bash
cp .env.example .env   # modifiez DATABASE_URL, JWT_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate    # crée les tables
npm run seed              # insère un admin + données demo
npm run dev
```

- API: `http://localhost:3000`
- Admin login: `POST /api/auth/login` body `{ "email":"admin@example.com", "password":"admin123" }`
- Public endpoints: `/api/services`, `/api/properties`, `/api/properties/:slug`, `/api/leads`
- Backoffice endpoint exemple: `/api/admin/dashboard` (Bearer token requis).
