import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

const PORT = process.env.PORT || 3000
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)

app.use(express.json())
app.use(helmet())
app.use(morgan('dev'))
app.use(cors({ origin: CORS_ORIGINS.length ? CORS_ORIGINS : true }))

// Helper function
function slugify(str) {
  return String(str).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50)
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, isStaff: user.isStaff }, process.env.JWT_SECRET || 'dev', { expiresIn: '12h' })
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

// ---- Auth ----
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })
  const ok = await bcrypt.compare(password || '', user.password)
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
  res.json({ token: signToken(user), user: { id: user.id, email: user.email, name: user.name, isStaff: user.isStaff } })
})

// ---- Public API ----
app.get('/api/health', (req, res) => res.json({ ok: true }))

app.get('/api/services', async (req, res) => {
  res.json(await prisma.service.findMany())
})

app.get('/api/projects', async (req, res) => {
  const { q, category } = req.query
  const where = {}
  if (category) where.category = String(category)
  if (q) {
    where.OR = [
      { title: { contains: String(q), mode: 'insensitive' } },
      { location: { contains: String(q), mode: 'insensitive' } },
    ]
  }
  const data = await prisma.project.findMany({ where, orderBy: { id: 'desc' } })
  res.json(data)
})

app.get('/api/projects/:slug', async (req, res) => {
  const project = await prisma.project.findUnique({ where: { slug: req.params.slug } })
  if (!project) return res.status(404).json({ error: 'Not found' })
  res.json(project)
})


app.get('/api/properties', async (req, res) => {
  const { q, status } = req.query
  const where = {}
  if (status) where.status = String(status)
  if (q) {
    where.OR = [
      { title: { contains: String(q), mode: 'insensitive' } },
      { location: { contains: String(q), mode: 'insensitive' } },
    ]
  }
  const data = await prisma.property.findMany({ where, orderBy: { createdAt: 'desc' } })
  res.json(data)
})

app.get('/api/properties/:slug', async (req, res) => {
  const prop = await prisma.property.findUnique({ where: { slug: req.params.slug } })
  if (!prop) return res.status(404).json({ error: 'Not found' })
  res.json(prop)
})

app.post('/api/leads', async (req, res) => {
  const { name, email, phone, message, propertyId } = req.body || {}
  if (!name || !message) return res.status(400).json({ error: 'name and message required' })
  const lead = await prisma.contactLead.create({
    data: { name, email, phone, message, propertyId: propertyId || null }
  })
  res.json(lead)
})

// ---- Admin API (protected) ----
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

// CRUD examples for admin
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

// Similarly basic endpoints for properties
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

// ---- Uploads ----
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { pdfInvoice, excelTransactions, uploadToS3IfConfigured } from './utils.js'
import { requireRole } from './middleware.js'
import { log as audit } from './audit.js'

const uploadDir = process.env.UPLOAD_DIR || 'uploads'
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
const upload = multer({ dest: uploadDir })

// local static to preview uploaded files
app.use('/uploads', express.static(path.resolve(uploadDir)))

app.post('/api/admin/upload', auth, requireRole('admin','sales'), upload.single('file'), async (req, res) => {
  // if S3 configured, push to S3 and delete local temp
  const s3Url = await uploadToS3IfConfigured(req.file.path, req.file.originalname, process.env)
  const url = s3Url || `/${uploadDir}/${req.file.filename}`
  res.json({ url })
})

// ---- Projects CRUD (Admin) ----
app.get('/api/admin/projects', auth, requireRole('admin','sales'), async (req, res) => {
  res.json(await prisma.project.findMany({ orderBy: { createdAt: 'desc' } }))
})

app.post('/api/admin/projects', auth, requireRole('admin','sales'), async (req, res) => {
  try {
    const { title, category, location, image, annee } = req.body
    if (!title) return res.status(400).json({ error: 'Title required' })
    
    const slug = slugify(title)
    const p = await prisma.project.create({ 
      data: { title, category, location, image, annee, slug } 
    })
    await audit(prisma, { 
      userId: req.user?.sub, 
      action: 'create', 
      entity: 'Project', 
      entityId: p.id, 
      after: p 
    })
    res.json(p)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

app.put('/api/admin/projects/:id', auth, requireRole('admin','sales'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const before = await prisma.project.findUnique({ where: { id } })
    
    const { title, category, location, image, annee } = req.body
    const data = { category, location, image, annee }
    
    // Update slug if title changed
    if (title && title !== before?.title) {
      data.title = title
      data.slug = slugify(title)
    }
    
    const p = await prisma.project.update({ where: { id }, data })
    await audit(prisma, { 
      userId: req.user?.sub, 
      action: 'update', 
      entity: 'Project', 
      entityId: id, 
      before, 
      after: p 
    })
    res.json(p)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

app.delete('/api/admin/projects/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const before = await prisma.project.findUnique({ where: { id } })
    await prisma.project.delete({ where: { id } })
    await audit(prisma, { 
      userId: req.user?.sub, 
      action: 'delete', 
      entity: 'Project', 
      entityId: id, 
      before 
    })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

// ---- Clients CRUD ----
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

// ---- Deals CRUD + schedules ----
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

// schedules
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

// ---- Invoices CRUD + PDF ----
app.get('/api/admin/invoices', auth, requireRole('admin','sales'), async (req,res)=>{
  res.json(await prisma.invoice.findMany({ include:{ deal:true }, orderBy:{ issueDate:'desc' } }))
})
app.post('/api/admin/invoices', auth, requireRole('admin','sales'), async (req,res)=>{
  // number auto: INVYYYYMM-####
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

// ---- Payments CRUD ----
app.get('/api/admin/payments', auth, requireRole('admin','sales'), async (req,res)=>{
  res.json(await prisma.payment.findMany({ include:{ deal:true, invoice:true }, orderBy:{ date:'desc' } }))
})
app.post('/api/admin/payments', auth, requireRole('admin','sales'), async (req,res)=>{
  const p = await prisma.payment.create({ data: req.body })
  // If scheduleId is provided, link and mark paid
  if (req.body.scheduleId) {
    await prisma.paymentSchedule.update({ where:{ id: Number(req.body.scheduleId) }, data:{ status:'paid', paymentId: p.id } })
  }
  res.json(p)
})

// ---- Expenses CRUD ----
app.get('/api/admin/expenses', auth, requireRole('admin','sales'), async (req,res)=>{
  res.json(await prisma.expense.findMany({ orderBy:{ date:'desc' } }))
})
app.post('/api/admin/expenses', auth, requireRole('admin','sales'), async (req,res)=>{
  res.json(await prisma.expense.create({ data: req.body }))
})

// ---- Co-ownership management ----
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

// ---- Exports ----
app.get('/api/admin/export/properties.csv', auth, requireRole('admin','sales'), async (req,res)=>{
  const rows = await prisma.property.findMany()
  const headers = Object.keys(rows[0] || {id:1})
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n')
  res.setHeader('Content-Type','text/csv; charset=utf-8')
  res.setHeader('Content-Disposition','attachment; filename="properties.csv"')
  res.send(csv)
})

app.get('/api/admin/export/all.xlsx', auth, requireRole('admin','sales'), async (req,res)=>{
  const [properties, services, deals, invoices, payments, expenses, projects] = await Promise.all([
    prisma.property.findMany(), prisma.service.findMany(), prisma.deal.findMany(), prisma.invoice.findMany(),
    prisma.payment.findMany(), prisma.expense.findMany(), prisma.project.findMany()
  ])
  const buf = await excelTransactions({ properties, services, deals, invoices, payments, expenses, projects })
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition','attachment; filename="export.xlsx"')
  res.send(buf)
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})