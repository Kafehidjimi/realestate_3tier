
import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export function pdfInvoice({ invoice, deal, client, property }) {
  const doc = new PDFDocument({ margin: 50 })
  const chunks = []
  doc.on('data', c => chunks.push(c))
  doc.on('end', () => {})
  doc.fontSize(18).text('FACTURE', { align:'right' })
  doc.moveDown()
  doc.fontSize(12).text(`Numéro: ${invoice.number}`)
  doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`)
  doc.text(`Statut: ${invoice.status}`)
  doc.moveDown()
  doc.text(`Client: ${client?.name || ''}`)
  doc.text(`Email: ${client?.email || ''}`)
  doc.text(`Téléphone: ${client?.phone || ''}`)
  doc.moveDown()
  if (property) {
    doc.text(`Bien: ${property.title}`)
    doc.text(`Localisation: ${property.location || ''}`)
  }
  doc.moveDown()

  doc.fontSize(14).text('Montant TTC:', { continued:true }).font('Helvetica-Bold').text(` ${Number(invoice.amount).toLocaleString()} FCFA`)
  doc.font('Helvetica')
  doc.moveDown(2)
  doc.text('Merci pour votre confiance.', { align:'center' })
  doc.end()
  return Buffer.concat(chunks)
}

export async function excelTransactions({ properties, services, deals, invoices, payments, expenses }) {
  const wb = new ExcelJS.Workbook()
  function addSheet(name, rows) {
    const ws = wb.addWorksheet(name)
    if (!rows || !rows.length) return ws
    ws.columns = Object.keys(rows[0]).map(k => ({ header: k, key: k }))
    rows.forEach(r => ws.addRow(r))
    return ws
  }
  addSheet('Properties', properties)
  addSheet('Services', services)
  addSheet('Deals', deals)
  addSheet('Invoices', invoices)
  addSheet('Payments', payments)
  addSheet('Expenses', expenses)
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

export async function uploadToS3IfConfigured(filePath, fileName, env) {
  const { S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BASE_URL } = env
  if (!S3_BUCKET || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return null
  const client = new S3Client({ region: S3_REGION, credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY } })
  const body = fs.readFileSync(filePath)
  const Key = `uploads/${Date.now()}-${fileName}`
  await client.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key, Body: body, ContentType: 'application/octet-stream' }))
  if (S3_BASE_URL) return `${S3_BASE_URL}/${Key}`
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${Key}`
}
