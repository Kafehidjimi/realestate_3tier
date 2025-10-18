// backend/src/server.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

// --- uploads & utils (imports une seule fois)
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { pdfInvoice, excelTransactions, uploadToS3IfConfigured } from './utils.js'
import { requireRole } from './middleware.js'
import { log as audit } from './audit.js'

const app = express()
const prisma = new PrismaClient()

const PORT = process.env.PORT || 3000
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)

// ============= CORRECTION ICI =============
// middlewares - ORDRE IMPORTANT !
app.use(express.json())
app.use(morgan('dev'))

// CORS général pour les API
app.use(cors({ 
  origin: CORS_ORIGINS.length ? CORS_ORIGINS : true,
  credentials: true 
}))

// Helmet APRÈS CORS et AVANT les routes statiques
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // ← AJOUT IMPORTANT
  crossOriginEmbedderPolicy: false // ← AJOUT IMPORTANT
}))

// === Uploads locaux avec CORS pour les images ===
const uploadDir = process.env.UPLOAD_DIR || 'uploads'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
const upload = multer({ dest: uploadDir })

// Servir les fichiers statiques AVEC les bons headers CORS
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  next()
}, express.static(path.resolve(uploadDir)))
// ============= FIN CORRECTION =============

// ==== Helpers ====
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, isStaff: user.isStaff },
    process.env.JWT_SECRET || 'dev',
    { expiresIn: '12h' }
  )
}
function auth(req, res, next) {
  const h = req.headers.authorization || ''
  const t = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!t) return res.status(401).json({ error: 'No token' })
  try {
    req.user = jwt.verify(t, process.env.JWT_SECRET || 'dev')
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// ====================== AUTH API ======================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    
    const token = signToken(user)
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        isStaff: user.isStaff 
      } 
    })
  } catch (e) {
    console.error('LOGIN ERROR:', e)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  
  try {
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(400).json({ error: 'Email already exists' })
    
    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hash, name: name || null, isStaff: false }
    })
    
    const token = signToken(user)
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        isStaff: user.isStaff 
      } 
    })
  } catch (e) {
    console.error('REGISTER ERROR:', e)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// ---- Normalisation FR/EN pour statuts et labels ----
const FR_TO_PROP_STATUS = {
  'vente': 'sale', 'à vendre': 'sale', 'a vendre': 'sale',
  'location': 'rent', 'à louer': 'rent', 'a louer': 'rent',
  'vendu': 'sold'
}
function normalizePropStatus(s) {
  if (!s) return null
  const x = s.toString().toLowerCase().trim()
  return FR_TO_PROP_STATUS[x] || (['sale','rent','sold'].includes(x) ? x : null)
}
function propStatusLabel(code) {
  return code === 'sale' ? 'À vendre'
    : code === 'rent' ? 'À louer'
    : code === 'sold' ? 'Vendu'
    : null
}

const FR_TO_PHASE = {
  'planifié': 'planned', 'planifie': 'planned',
  'en cours': 'ongoing',
  'livré': 'delivered', 'livre': 'delivered'
}
function normalizePhase(s) {
  if (!s) return null
  const x = s.toString().toLowerCase().trim()
  return FR_TO_PHASE[x] || (['planned','ongoing','delivered'].includes(x) ? x : null)
}

// ====================== PUBLIC API ======================
app.get('/api/health', (req, res) => res.json({ ok: true }))

// Services
app.get('/api/services', async (req, res) => {
  console.log(' Requête reçue sur /api/services')
  try {
    const rows = await prisma.service.findMany({ orderBy: { id: 'asc' } })
    console.log(' Services trouvés:', rows.length)
    const items = rows.map(s => ({
      id: s.id,
      title: s.title ?? s.name ?? 'Service',
      description: s.description ?? s.content ?? '',
      icon: s.icon ?? null,
      slug: s.slug ?? null
    }))
    res.json(items)
  } catch (e) {
    console.error(' SERVICES ERROR:', e)
    res.status(500).json({ error: 'Failed to list services' })
  }
})
app.get('/api/debug/services', async (_req, res) => {
  res.json({
    count: await prisma.service.count(),
    sample: await prisma.service.findFirst()
  })
})

// Properties (LIST + DETAIL) – avec images, filtre FR et labels FR
app.get('/api/properties', async (req, res) => {
  console.log(' Requête reçue sur /api/properties')
  try {
    const q = (req.query.q ?? '').toString().trim()
    const statusParam = (req.query.status ?? '').toString().trim()
    const categoryParam = (req.query.category ?? '').toString().trim()
    
    const where = {}
    
    // Filtre de recherche
    if (q) {
      where.OR = [
        { title: { contains: q } },       // ✅ Sans mode
        { location: { contains: q } },    // ✅ Sans mode
        { description: { contains: q } }, // ✅ Sans mode
      ]
    }
    
    // Filtre par statut
    if (statusParam) {
      const norm = normalizePropStatus(statusParam)
      if (norm) where.status = norm
    }
    
    // Filtre par catégorie
    if (categoryParam) {
      where.category = categoryParam
    }

    const rows = await prisma.property.findMany({
      where,
      orderBy: { id: 'desc' },
      include: { images: { orderBy: { order: 'asc' } } }
    })

    console.log(' Properties trouvées:', rows.length)

    const out = rows.map(r => {
      const statusCode = normalizePropStatus(r.status)
      return {
        ...r,
        status: statusCode || r.status,
        statusLabel: propStatusLabel(statusCode || ''),
        price: r.price != null ? Number(r.price) : null
      }
    })
    res.json(out)
  } catch (e) {
    console.error(' PROPERTIES ERROR:', e)
    res.status(500).json({ error: 'Failed to list properties', details: e.message })
  }
})

app.get('/api/properties/:slug', async (req, res) => {
  try {
    const r = await prisma.property.findUnique({
      where: { slug: req.params.slug },
      include: { images: { orderBy: { order: 'asc' } } }
    })
    if (!r) return res.status(404).json({ error: 'Not found' })
    const statusCode = normalizePropStatus(r.status)
    res.json({
      ...r,
      status: statusCode || r.status,
      statusLabel: propStatusLabel(statusCode || ''),
      price: r.price != null ? Number(r.price) : null
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to get property' })
  }
})

// Leads (contact)
app.post('/api/leads', async (req, res) => {
  const { name, email, phone, message, propertyId } = req.body || {}
  if (!name || !message) return res.status(400).json({ error: 'name and message required' })
  const lead = await prisma.contactlead.create({
    data: { name, email, phone, message, propertyId: propertyId || null }
  })
  res.json(lead)
})

// Projects (LIST + DETAIL)

app.get('/api/projects', async (req, res) => {
  console.log('🔍 Requête reçue sur /api/projects')
  try {
    const q = (req.query.q ?? '').toString().trim()
    const statusParam = (req.query.status ?? '').toString().trim()
    const categoryParam = (req.query.category ?? '').toString().trim()
    
    const where = {}
    
    // Filtre de recherche
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
        { location: { contains: q } },
      ]
    }
    
    // Filtre par statut
    if (statusParam) {
      const norm = normalizePhase(statusParam)
      if (norm) where.status = norm
    }
    
    // Filtre par catégorie
    if (categoryParam) {
      where.category = categoryParam
    }

    const rows = await prisma.project.findMany({
      where,
      orderBy: { id: 'desc' },
      include: { medias: { orderBy: { order: 'asc' } } }
    })
    
    console.log(' Projects trouvés:', rows.length)
    
    const out = rows.map(p => ({
      ...p,
      status: normalizePhase(p.status) || p.status
    }))
    
    res.json(out)
  } catch (e) {
    console.error(' PROJECTS ERROR:', e)
    res.status(500).json({ error: 'Failed to list projects', details: e.message })
  }
})

app.get('/api/projects/:slug', async (req, res) => {
  try {
    const p = await prisma.project.findUnique({
      where: { slug: req.params.slug },
      include: { medias: { orderBy: { order: 'asc' } } }
    })
    if (!p) return res.status(404).json({ error: 'Not found' })
    res.json({ ...p, status: normalizePhase(p.status) || p.status })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to get project' })
  }
})

// Page content (CMS) – robuste si le champ "page" diffère dans ton modèle
function buildPageObject(rows) {
  const out = {}
  for (const r of rows) {
    const section = r.section ?? r.sectionName ?? 'default'
    const key = r.key ?? r.field ?? 'value'
    const value = r.value
    out[section] ||= {}
    out[section][key] = value
  }
  return out
}

app.get('/api/page/:page', async (req, res) => {
  const pageParam = String(req.params.page || '').trim()
  try {
    const rows = await prisma.pageContent.findMany({ where: { page: pageParam } })
    return res.json(buildPageObject(rows))
  } catch (e1) {
    console.error('[PAGE] erreur sur where.page =', e1?.message || e1)
    try {
      const all = await prisma.pageContent.findMany()
      const filtered = all.filter(r => {
        const p = r.page ?? r.pageName ?? r.page_key ?? r.pageKey
        return String(p || '').trim() === pageParam
      })
      return res.json(buildPageObject(filtered))
    } catch (e2) {
      console.error('[PAGE] fallback erreur =', e2?.message || e2)
      return res.status(500).json({ error: "Échec de l'obtention du contenu de la page", details: e2?.message })
    }
  }
})

app.get('/api/debug/page', async (_req, res) => {
  try {
    const sample = await prisma.pageContent.findFirst()
    const count = await prisma.pageContent.count()
    res.json({
      count,
      sample,
      keys: sample ? Object.keys(sample) : []
    })
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) })
  }
})

app.post('/api/page/:page', async (req, res) => {
  try {
    const page = String(req.params.page || '').trim()
    const { section, key, value } = req.body || {}
    if (!page || !section || !key) {
      return res.status(400).json({ error: 'page, section et key sont requis' })
    }

    const existing = await prisma.pageContent.findFirst({
      where: { page, section, key }
    })

    let row
    if (existing) {
      row = await prisma.pageContent.update({
        where: { id: existing.id },
        data: { value }
      })
    } else {
      row = await prisma.pageContent.create({
        data: { page, section, key, value }
      })
    }
    res.json(row)
  } catch (e) {
    console.error('[PAGE:UPSERT] error:', e)
    res.status(500).json({ error: "Échec d'écriture du contenu de page" })
  }
})

// Upload public
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' })
  const url = `/uploads/${req.file.filename}`
  res.json({ url, originalName: req.file.originalname })
})

// Créer/mettre à jour un projet
app.post('/api/projects', async (req, res) => {
  const { id, title, slug, description, coverImage, status, location, startedAt } = req.body || {}
  if (!title || !slug) return res.status(400).json({ error: 'title and slug required' })
  const data = {
    title, slug,
    description: description || null,
    coverImage: coverImage || null,
    status: (normalizePhase(status) || status || null),
    location: location || null,
    startedAt: startedAt ? new Date(startedAt) : null
  }
  const p = id
    ? await prisma.project.update({ where: { id: Number(id) }, data })
    : await prisma.project.upsert({ where: { slug }, update: data, create: data })
  res.json(p)
})

// Ajouter un média à un projet
app.post('/api/projects/:id/medias', async (req, res) => {
  const projectId = Number(req.params.id)
  const { kind='image', url, alt=null, order=0 } = req.body || {}
  if (!url) return res.status(400).json({ error: 'url required' })
  const m = await prisma.projectMedia.create({ data: { projectId, kind, url, alt, order } })
  res.json(m)
})

// Ajouter une image à un bien
app.post('/api/properties/:id/images', async (req, res) => {
  const propertyId = Number(req.params.id)
  const { url, alt=null, order=0 } = req.body || {}
  if (!url) return res.status(400).json({ error: 'url required' })
  const img = await prisma.propertyImage.create({ data: { propertyId, url, alt, order } })
  res.json(img)
})

// ====================== ADMIN API (protected) ======================
app.get('/api/admin/dashboard', auth, async (req, res) => {
  const dealsOpen = await prisma.deal.count({ where: { NOT: [{ status: { in: ['closed', 'cancelled'] } }] } })
  const invoicesOpen = await prisma.invoice.count({ where: { status: 'open' } })
  const paymentsMonth = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }
  })
  const expensesMonth = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }
  })
  res.json({
    dealsOpen,
    invoicesOpen,
    paymentsMonth: paymentsMonth._sum.amount || 0,
    expensesMonth: expensesMonth._sum.amount || 0
  })
})

// Services admin
app.post('/api/admin/services', auth, async (req, res) => {
  const s = await prisma.service.create({ data: req.body })
  res.json(s)
})
app.put('/api/admin/services/:id', auth, async (req, res) => {
  const s = await prisma.service.update({ where: { id: Number(req.params.id) }, data: req.body })
  res.json(s)
})
app.delete('/api/admin/services/:id', auth, async (req, res) => {
  await prisma.service.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

// Properties admin
app.post('/api/admin/properties', auth, async (req, res) => {
  const p = await prisma.property.create({ data: req.body })
  res.json(p)
})
app.put('/api/admin/properties/:id', auth, async (req, res) => {
  const p = await prisma.property.update({ where: { id: Number(req.params.id) }, data: req.body })
  res.json(p)
})
app.delete('/api/admin/properties/:id', auth, async (req, res) => {
  await prisma.property.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

// Upload admin
app.post('/api/admin/upload', auth, requireRole('admin','sales'), upload.single('file'), async (req, res) => {
  const s3Url = await uploadToS3IfConfigured(req.file.path, req.file.originalname, process.env)
  const url = s3Url || `/${uploadDir}/${req.file.filename}`
  res.json({ url })
})

// Clients
app.get('/api/admin/clients', auth, requireRole('admin','sales'), async (req,res)=>{
  res.json(await prisma.client.findMany({ orderBy: { name: 'asc' } }))
})
app.post('/api/admin/clients', auth, requireRole('admin','sales'), async (req,res)=>{
  const c = await prisma.client.create({ data: req.body })
  await audit(prisma, { userId: req.user?.sub, action:'create', entity:'Client', entityId:c.id, after:c })
  res.json(c)
})
app.put('/api/admin/clients/:id', auth, requireRole('admin','sales'), async (req,res)=>{
  const id = Number(req.params.id)
  const before = await prisma.client.findUnique({ where:{ id } })
  const c = await prisma.client.update({ where: { id }, data: req.body })
  await audit(prisma, { userId: req.user?.sub, action:'update', entity:'Client', entityId:id, before, after:c })
  res.json(c)
})
app.delete('/api/admin/clients/:id', auth, requireRole('admin'), async (req,res)=>{
  const id = Number(req.params.id)
  const before = await prisma.client.findUnique({ where:{ id } })
  await prisma.client.delete({ where: { id } })
  await audit(prisma, { userId: req.user?.sub, action:'delete', entity:'Client', entityId:id, before })
  res.json({ ok:true })
})

// Deals + schedules
app.get('/api/admin/deals', auth, requireRole('admin','sales'), async (req,res)=>{
  res.json(await prisma.deal.findMany({ include:{ client:true, property:true }, orderBy:{ createdAt:'desc' } }))
})
app.post('/api/admin/deals', auth, requireRole('admin','sales'), async (req,res)=>{
  const d = await prisma.deal.create({ data: req.body })
  await audit(prisma, { userId: req.user?.sub, action:'create', entity:'Deal', entityId:d.id, after:d })
  res.json(d)
})
app.put('/api/admin/deals/:id', auth, requireRole('admin','sales'), async (req,res)=>{
  const id = Number(req.params.id)
  const before = await prisma.deal.findUnique({ where:{ id } })
  const d = await prisma.deal.update({ where: { id }, data: req.body })
  await audit(prisma, { userId: req.user?.sub, action:'update', entity:'Deal', entityId:id, before, after:d })
  res.json(d)
})
app.delete('/api/admin/deals/:id', auth, requireRole('admin'), async (req,res)=>{
  const id = Number(req.params.id)
  const before = await prisma.deal.findUnique({ where:{ id } })
  await prisma.deal.delete({ where: { id } })
  await audit(prisma, { userId: req.user?.sub, action:'delete', entity:'Deal', entityId:id, before })
  res.json({ ok:true })
})
app.get('/api/admin/deals/:id/schedules', auth, requireRole('admin','sales'), async (req,res)=>{
  res.json(await prisma.paymentSchedule.findMany({ where:{ dealId:Number(req.params.id) }, orderBy:{ dueDate:'asc' } }))
})
app.post('/api/admin/deals/:id/schedules', auth, requireRole('admin','sales'), async (req,res)=>{
  const dealId = Number(req.params.id)
  const s = await prisma.paymentSchedule.create({ data: { dealId, ...req.body } })
  res.json(s)
})
app.put('/api/admin/schedules/:sid', auth, requireRole('admin','sales'), async (req,res)=>{
  const sid = Number(req.params.sid)
  const s = await prisma.paymentSchedule.update({ where:{ id:sid }, data:req.body })
  res.json(s)
})

// Invoices + PDF
app.get('/api/admin/invoices', auth, requireRole('admin','sales'), async (req,res)=>{
  res.json(await prisma.invoice.findMany({ include:{ deal:true }, orderBy:{ issueDate:'desc' } }))
})
app.post('/api/admin/invoices', auth, requireRole('admin','sales'), async (req,res)=>{
  const now = new Date()
  const prefix = `INV${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}`
  const last = await prisma.invoice.findFirst({ where:{ number: { startsWith: prefix } }, orderBy:{ number:'desc' } })
  const seq = last ? Number(last.number.split('-').pop()) + 1 : 1
  const number = `${prefix}-${String(seq).padStart(4,'0')}`
  const inv = await prisma.invoice.create({ data: { ...req.body, number } })
  res.json(inv)
})
app.get('/api/admin/invoices/:id/pdf', auth, requireRole('admin','sales'), async (req,res)=>{
  const id = Number(req.params.id)
  const invoice = await prisma.invoice.findUnique({ where:{ id } })
  if (!invoice) return res.status(404).end()
  const deal = await prisma.deal.findUnique({ where:{ id: invoice.dealId } })
  const client = await prisma.client.findUnique({ where:{ id: deal.clientId } })
  const property = deal.propertyId ? await prisma.property.findUnique({ where:{ id: deal.propertyId } }) : null
  const buf = pdfInvoice({ invoice, deal, client, property })
  res.setHeader('Content-Type','application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="invoice-${invoice.number}.pdf"`)
  res.send(buf)
})


// Payments
app.get('/api/admin/payments', auth, requireRole('admin','sales'), async (req,res)=>{
  res.json(await prisma.payment.findMany({ include:{ deal:true, invoice:true }, orderBy:{ date:'desc' } }))
})
app.post('/api/admin/payments', auth, requireRole('admin','sales'), async (req,res)=>{
  const p = await prisma.payment.create({ data: req.body })
  if (req.body.scheduleId) {
    await prisma.paymentSchedule.update({ where:{ id: Number(req.body.scheduleId) }, data:{ status:'paid', paymentId: p.id } })
  }
  res.json(p)
})


// Mettre à jour un projet (ADMIN)
app.put('/api/admin/projects/:id', auth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { title, slug, description, coverImage, status, location, category, surface, units, startedAt, deliveredAt } = req.body

    const data = {}
    if (title !== undefined) data.title = title
    if (slug !== undefined) data.slug = slug
    if (description !== undefined) data.description = description
    if (coverImage !== undefined) data.coverImage = coverImage
    if (status !== undefined) data.status = normalizePhase(status) || status
    if (location !== undefined) data.location = location
    if (category !== undefined) data.category = category
    if (surface !== undefined) data.surface = surface ? Number(surface) : null
    if (units !== undefined) data.units = units ? Number(units) : null
    if (startedAt !== undefined) data.startedAt = startedAt ? new Date(startedAt) : null
    if (deliveredAt !== undefined) data.deliveredAt = deliveredAt ? new Date(deliveredAt) : null

    const before = await prisma.project.findUnique({ where: { id } })
    const project = await prisma.project.update({
      where: { id },
      data
    })

    await audit(prisma, {
      userId: req.user?.sub,
      action: 'update',
      entity: 'Project',
      entityId: id,
      before,
      after: project
    })

    res.json(project)
  } catch (e) {
    console.error('UPDATE PROJECT ERROR:', e)
    res.status(500).json({ error: 'Failed to update project', details: e.message })
  }
})

// Supprimer un projet (ADMIN)
app.delete('/api/admin/projects/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const before = await prisma.project.findUnique({ where: { id } })

    // Supprimer d'abord les médias associés
    await prisma.projectmedia.deleteMany({
      where: { projectId: id }
    })

    // Puis supprimer le projet
    await prisma.project.delete({
      where: { id }
    })

    await audit(prisma, {
      userId: req.user?.sub,
      action: 'delete',
      entity: 'Project',
      entityId: id,
      before
    })

    res.json({ ok: true })
  } catch (e) {
    console.error('DELETE PROJECT ERROR:', e)
    res.status(500).json({ error: 'Failed to delete project', details: e.message })
  }
})

// Ajouter un média à un projet (ADMIN)
app.post('/api/admin/projects/:id/medias', auth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const projectId = Number(req.params.id)
    const { kind = 'image', url, alt = null, order = 0 } = req.body

    if (!url) return res.status(400).json({ error: 'url required' })

    const media = await prisma.projectmedia.create({
      data: { projectId, kind, url, alt, order: Number(order) }
    })

    res.json(media)
  } catch (e) {
    console.error('ADD PROJECT MEDIA ERROR:', e)
    res.status(500).json({ error: 'Failed to add media', details: e.message })
  }
})

// Supprimer un média d'un projet (ADMIN)
app.delete('/api/admin/projects/:id/medias/:mediaId', auth, requireRole('admin'), async (req, res) => {
  try {
    const mediaId = Number(req.params.mediaId)
    await prisma.projectmedia.delete({
      where: { id: mediaId }
    })
    res.json({ ok: true })
  } catch (e) {
    console.error('DELETE PROJECT MEDIA ERROR:', e)
    res.status(500).json({ error: 'Failed to delete media', details: e.message })
  }
})

// ============ PROPERTIES ADMIN ROUTES (compléments) ============

// Ajouter une image à une propriété (ADMIN)
app.post('/api/admin/properties/:id/images', auth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const propertyId = Number(req.params.id)
    const { url, alt = null, order = 0 } = req.body

    if (!url) return res.status(400).json({ error: 'url required' })

    const image = await prisma.propertyimage.create({
      data: { propertyId, url, alt, order: Number(order) }
    })

    res.json(image)
  } catch (e) {
    console.error('ADD PROPERTY IMAGE ERROR:', e)
    res.status(500).json({ error: 'Failed to add image', details: e.message })
  }
})

// Supprimer une image d'une propriété (ADMIN)
app.delete('/api/admin/properties/:id/images/:imageId', auth, requireRole('admin'), async (req, res) => {
  try {
    const imageId = Number(req.params.imageId)
    await prisma.propertyimage.delete({
      where: { id: imageId }
    })
    res.json({ ok: true })
  } catch (e) {
    console.error('DELETE PROPERTY IMAGE ERROR:', e)
    res.status(500).json({ error: 'Failed to delete image', details: e.message })
  }
})

// Obtenir les images d'une propriété
app.get('/api/properties/:id/images', async (req, res) => {
  try {
    const propertyId = Number(req.params.id)
    const images = await prisma.propertyimage.findMany({
      where: { propertyId },
      orderBy: { order: 'asc' }
    })
    res.json(images)
  } catch (e) {
    console.error('GET PROPERTY IMAGES ERROR:', e)
    res.status(500).json({ error: 'Failed to get images', details: e.message })
  }
})

// Obtenir les médias d'un projet
app.get('/api/projects/:id/medias', async (req, res) => {
  try {
    const projectId = Number(req.params.id)
    const medias = await prisma.projectmedia.findMany({
      where: { projectId },
      orderBy: { order: 'asc' }
    })
    res.json(medias)
  } catch (e) {
    console.error('GET PROJECT MEDIAS ERROR:', e)
    res.status(500).json({ error: 'Failed to get medias', details: e.message })
  }
})

// ============ ANALYTICS / STATISTIQUES ============

// Statistiques globales (ADMIN)
app.get('/api/admin/stats', auth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const [
      totalProperties,
      totalProjects,
      totalClients,
      totalDeals,
      propertiesByStatus,
      projectsByStatus,
      recentDeals
    ] = await Promise.all([
      prisma.property.count(),
      prisma.project.count(),
      prisma.client.count(),
      prisma.deal.count(),
      prisma.property.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.project.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.deal.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { client: true, property: true }
      })
    ])

    res.json({
      totalProperties,
      totalProjects,
      totalClients,
      totalDeals,
      propertiesByStatus,
      projectsByStatus,
      recentDeals
    })
  } catch (e) {
    console.error('STATS ERROR:', e)
    res.status(500).json({ error: 'Failed to get stats', details: e.message })
  }
})

// ============ RECHERCHE AVANCÉE ============

// Recherche globale (ADMIN)
app.get('/api/admin/search', auth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) return res.json({ properties: [], projects: [], clients: [], services: [] })

    const [properties, projects, clients, services] = await Promise.all([
      prisma.property.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { location: { contains: q } },
            { description: { contains: q } }
          ]
        },
        take: 10
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { location: { contains: q } },
            { description: { contains: q } }
          ]
        },
        take: 10
      }),
      prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } }
          ]
        },
        take: 10
      }),
      prisma.service.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } }
          ]
        },
        take: 10
      })
    ])

    res.json({ properties, projects, clients, services })
  } catch (e) {
    console.error('SEARCH ERROR:', e)
    res.status(500).json({ error: 'Failed to search', details: e.message })
  }
})

// ============ BULK OPERATIONS ============

// Import CSV de clients (ADMIN)
app.post('/api/admin/clients/import', auth, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    // Cette route nécessiterait un parser CSV comme papaparse côté serveur
    // Pour l'instant, retourner une réponse basique
    res.json({ message: 'Import feature coming soon' })
  } catch (e) {
    console.error('IMPORT ERROR:', e)
    res.status(500).json({ error: 'Failed to import', details: e.message })
  }
})

// Export personnalisé (ADMIN)
app.get('/api/admin/export/custom', auth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const { type, format = 'json' } = req.query
    
    let data = []
    switch (type) {
      case 'properties':
        data = await prisma.property.findMany({ include: { images: true } })
        break
      case 'projects':
        data = await prisma.project.findMany({ include: { medias: true } })
        break
      case 'clients':
        data = await prisma.client.findMany()
        break
      case 'deals':
        data = await prisma.deal.findMany({ include: { client: true, property: true } })
        break
      default:
        return res.status(400).json({ error: 'Invalid type' })
    }

    if (format === 'csv') {
      // Conversion simple en CSV
      const headers = Object.keys(data[0] || {})
      const csv = [headers.join(',')]
        .concat(data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(',')))
        .join('\n')
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`)
      return res.send(csv)
    }

    res.json(data)
  } catch (e) {
    console.error('EXPORT ERROR:', e)
    res.status(500).json({ error: 'Failed to export', details: e.message })
  }
})

// ============ NOTIFICATIONS / AUDIT LOG ============

// Obtenir les logs d'audit (ADMIN)
app.get('/api/admin/audit-logs', auth, requireRole('admin'), async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50
    const offset = Number(req.query.offset) || 0

    const logs = await prisma.auditlog.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.auditlog.count()

    res.json({ logs, total, limit, offset })
  } catch (e) {
    console.error('AUDIT LOGS ERROR:', e)
    res.status(500).json({ error: 'Failed to get audit logs', details: e.message })
  }
})

// Obtenir les leads/demandes de contact
app.get('/api/admin/leads', auth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const status = req.query.status // pour filtrer par statut si besoin
    const where = status ? { status } : {}
    
    const leads = await prisma.contactlead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    res.json(leads)
  } catch (e) {
    console.error('LEADS ERROR:', e)
    res.status(500).json({ error: 'Failed to get leads', details: e.message })
  }
})

// Mettre à jour le statut d'un lead
app.patch('/api/admin/leads/:id', auth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { status, notes } = req.body

    const data = {}
    if (status) data.status = status
    if (notes !== undefined) data.notes = notes

    const lead = await prisma.contactlead.update({
      where: { id },
      data
    })

    res.json(lead)
  } catch (e) {
    console.error('UPDATE LEAD ERROR:', e)
    res.status(500).json({ error: 'Failed to update lead', details: e.message })
  }
})

// Obtenir les inquiries (demandes d'information)
app.get('/api/admin/inquiries', auth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    res.json(inquiries)
  } catch (e) {
    console.error('INQUIRIES ERROR:', e)
    res.status(500).json({ error: 'Failed to get inquiries', details: e.message })
  }
})

// Mettre à jour une inquiry
app.patch('/api/admin/inquiries/:id', auth, requireRole('admin', 'sales'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { status, notes } = req.body

    const data = {}
    if (status) data.status = status
    // Note: le modèle inquiry n'a pas de champ notes par défaut, 
    // vous pourriez l'ajouter au schema si nécessaire

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data
    })

    res.json(inquiry)
  } catch (e) {
    console.error('UPDATE INQUIRY ERROR:', e)
    res.status(500).json({ error: 'Failed to update inquiry', details: e.message })
  }
})

// ============ GESTION DES UTILISATEURS (ADMIN ONLY) ============

// Liste des utilisateurs
app.get('/api/admin/users', auth, requireRole('admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isStaff: true,
        createdAt: true
      }
    })
    res.json(users)
  } catch (e) {
    console.error('USERS ERROR:', e)
    res.status(500).json({ error: 'Failed to get users', details: e.message })
  }
})

// Créer un utilisateur (ADMIN)
app.post('/api/admin/users', auth, requireRole('admin'), async (req, res) => {
  try {
    const { email, password, name, role = 'admin', isStaff = true } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    const hash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hash, name, role, isStaff },
      select: { id: true, email: true, name: true, role: true, isStaff: true }
    })

    await audit(prisma, {
      userId: req.user?.sub,
      action: 'create',
      entity: 'User',
      entityId: user.id,
      after: user
    })

    res.json(user)
  } catch (e) {
    console.error('CREATE USER ERROR:', e)
    res.status(500).json({ error: 'Failed to create user', details: e.message })
  }
})

// Mettre à jour un utilisateur (ADMIN)
app.put('/api/admin/users/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { email, name, role, isStaff, password } = req.body

    const data = {}
    if (email) data.email = email
    if (name !== undefined) data.name = name
    if (role) data.role = role
    if (isStaff !== undefined) data.isStaff = isStaff
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }

    const before = await prisma.user.findUnique({ where: { id } })
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isStaff: true }
    })

    await audit(prisma, {
      userId: req.user?.sub,
      action: 'update',
      entity: 'User',
      entityId: id,
      before,
      after: user
    })

    res.json(user)
  } catch (e) {
    console.error('UPDATE USER ERROR:', e)
    res.status(500).json({ error: 'Failed to update user', details: e.message })
  }
})

// Supprimer un utilisateur (ADMIN)
app.delete('/api/admin/users/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    
    // Empêcher la suppression de son propre compte
    if (id === req.user?.sub) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    const before = await prisma.user.findUnique({ where: { id } })
    await prisma.user.delete({ where: { id } })

    await audit(prisma, {
      userId: req.user?.sub,
      action: 'delete',
      entity: 'User',
      entityId: id,
      before
    })

    res.json({ ok: true })
  } catch (e) {
    console.error('DELETE USER ERROR:', e)
    res.status(500).json({ error: 'Failed to delete user', details: e.message })
  }
})

// Expenses
app.get('/api/admin/expenses', auth, requireRole('admin','sales'), async (req,res)=>{
  res.json(await prisma.expense.findMany({ orderBy:{ date:'desc' } }))
})
app.post('/api/admin/expenses', auth, requireRole('admin','sales'), async (req,res)=>{
  res.json(await prisma.expense.create({ data: req.body }))
})

// Co-ownership
app.get('/api/admin/properties/:id/coowners', auth, requireRole('admin','sales'), async (req,res)=>{
  const propertyId = Number(req.params.id)
  const data = await prisma.coOwnership.findMany({ where:{ propertyId }, include:{ client:true } })
  res.json(data)
})
app.post('/api/admin/properties/:id/coowners', auth, requireRole('admin','sales'), async (req,res)=>{
  const propertyId = Number(req.params.id)
  const { clientId, share } = req.body
  const c = await prisma.coOwnership.create({ data: { propertyId, clientId: Number(clientId), share: share || 0 } })
  res.json(c)
})
app.delete('/api/admin/properties/:id/coowners/:coId', auth, requireRole('admin','sales'), async (req,res)=>{
  await prisma.coOwnership.delete({ where:{ id: Number(req.params.coId) } })
  res.json({ ok:true })
})

// Exports
app.get('/api/admin/export/properties.csv', auth, requireRole('admin','sales'), async (req,res)=>{
  const rows = await prisma.property.findMany()
  const headers = Object.keys(rows[0] || {id:1})
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n')
  res.setHeader('Content-Type','text/csv; charset=utf-8')
  res.setHeader('Content-Disposition','attachment; filename="properties.csv"')
  res.send(csv)
})
app.get('/api/admin/export/all.xlsx', auth, requireRole('admin','sales'), async (req,res)=>{
  const [properties, services, deals, invoices, payments, expenses] = await Promise.all([
    prisma.property.findMany(), prisma.service.findMany(), prisma.deal.findMany(), prisma.invoice.findMany(),
    prisma.payment.findMany(), prisma.expense.findMany()
  ])
  const buf = await excelTransactions({ properties, services, deals, invoices, payments, expenses })
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition','attachment; filename="export.xlsx"')
  res.send(buf)
})

// Récupérer toutes les infos de l'entreprise
app.get('/api/company-info', async (req, res) => {
  try {
    const category = req.query.category
    const where = category ? { category, isActive: true } : { isActive: true }
    
    const infos = await prisma.companyinfo.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ]
    })
    
    // Organiser par catégorie pour faciliter l'utilisation
    const organized = infos.reduce((acc, info) => {
      if (!acc[info.category]) {
        acc[info.category] = {}
      }
      acc[info.category][info.key] = info.value
      return acc
    }, {})
    
    res.json(organized)
  } catch (e) {
    console.error(' COMPANY INFO ERROR:', e)
    res.status(500).json({ error: 'Failed to get company info' })
  }
})

// Récupérer une info spécifique par clé
app.get('/api/company-info/:key', async (req, res) => {
  try {
    const info = await prisma.companyinfo.findUnique({
      where: { key: req.params.key }
    })
    
    if (!info) {
      return res.status(404).json({ error: 'Info not found' })
    }
    
    res.json(info)
  } catch (e) {
    console.error(' COMPANY INFO ERROR:', e)
    res.status(500).json({ error: 'Failed to get company info' })
  }
})

// ====================== ADMIN COMPANY INFO API ======================

// Mettre à jour une info d'entreprise (ADMIN)
app.put('/api/admin/company-info/:key', auth, requireRole('admin'), async (req, res) => {
  try {
    const { value, label, category, order, isActive } = req.body
    const key = req.params.key
    
    const data = {}
    if (value !== undefined) data.value = value
    if (label !== undefined) data.label = label
    if (category !== undefined) data.category = category
    if (order !== undefined) data.order = order
    if (isActive !== undefined) data.isActive = isActive
    
    const info = await prisma.companyinfo.update({
      where: { key },
      data
    })
    
    await audit(prisma, { 
      userId: req.user?.sub, 
      action: 'update', 
      entity: 'CompanyInfo', 
      entityId: info.id, 
      after: info 
    })
    
    res.json(info)
  } catch (e) {
    console.error(' UPDATE COMPANY INFO ERROR:', e)
    res.status(500).json({ error: 'Failed to update company info' })
  }
})

// Créer une nouvelle info d'entreprise (ADMIN)
app.post('/api/admin/company-info', auth, requireRole('admin'), async (req, res) => {
  try {
    const { key, value, category, label, order } = req.body
    
    if (!key || !value || !category) {
      return res.status(400).json({ error: 'key, value and category are required' })
    }
    
    const info = await prisma.companyinfo.create({
      data: { key, value, category, label, order: order || 0 }
    })
    
    await audit(prisma, { 
      userId: req.user?.sub, 
      action: 'create', 
      entity: 'CompanyInfo', 
      entityId: info.id, 
      after: info 
    })
    
    res.json(info)
  } catch (e) {
    console.error(' CREATE COMPANY INFO ERROR:', e)
    res.status(500).json({ error: 'Failed to create company info' })
  }
})

// Supprimer une info d'entreprise (ADMIN)
app.delete('/api/admin/company-info/:key', auth, requireRole('admin'), async (req, res) => {
  try {
    const info = await prisma.companyinfo.findUnique({
      where: { key: req.params.key }
    })
    
    if (!info) {
      return res.status(404).json({ error: 'Info not found' })
    }
    
    await prisma.companyinfo.delete({
      where: { key: req.params.key }
    })
    
    await audit(prisma, { 
      userId: req.user?.sub, 
      action: 'delete', 
      entity: 'CompanyInfo', 
      entityId: info.id, 
      before: info 
    })
    
    res.json({ ok: true })
  } catch (e) {
    console.error(' DELETE COMPANY INFO ERROR:', e)
    res.status(500).json({ error: 'Failed to delete company info' })
  }
})

// start
app.listen(PORT, () => {
  console.log(` API listening on http://localhost:${PORT}`)
  console.log(` CORS activé pour:`, CORS_ORIGINS)
  console.log(` Dossier uploads: ${uploadDir}`)
})