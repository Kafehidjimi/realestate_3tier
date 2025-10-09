import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function slugify(str) {
  return String(str).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50)
}

async function main() {
  // admin user
  const hash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', password: hash, name: 'Admin', isStaff: true }
  })

  // services
  const services = [
    { name: 'Aménagement foncier', description: 'Lotissement, viabilisation, études topographiques', icon: '🏗️' },
    { name: 'Vente de terrains', description: 'Titres sécurisés, zones stratégiques en Côte d\'Ivoire', icon: '📜' },
    { name: 'Construction clé en main', description: 'Maisons, villas, immeubles', icon: '🏠' },
    { name: 'Architecture intérieur', description: 'Concevoir et aménager les espaces intérieurs d\'un bâtiment', icon: '🪑' },
    { name: 'Import & Export', description: 'les activités de commerce international', icon: '✈️' }
  ]
  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } })
    if (!existing) {
      await prisma.service.create({ data: s })
    }
  }

  // projects
  const projects = [
    {
      title: "Lotissement Grand-Bassam",
      category: "Aménagement foncier",
      location: "Grand-Bassam",
      image: "/images/hero4.png",
      annee: "2023"
    }
  ] 
  for (const pr of projects) {
    const slug = slugify(pr.title)
    await prisma.project.upsert({
      where: { slug },
      update: {},
      create: { ...pr, slug }
    })
  }

  // properties
  const props = [
    { 
      title: 'Terrain 600 m² à Bingerville', 
      location: 'Bingerville', 
      price: 15000000, 
      status: 'A louer', 
      mainImage: '/images/prop4.jpg',
      description: 'Terrain viabilisé prêt à construire',
      area_m2: 600
    },
    { 
      title: 'Villa 4 pièces à Cocody', 
      location: 'Abidjan - Cocody', 
      price: 85000000, 
      status: 'À vendre', 
      mainImage: '/images/prop5.jpg',
      description: 'Belle villa moderne avec jardin',
      bedrooms: 4,
      bathrooms: 3,
      area_m2: 250
    },
    { 
      title: 'Appartement à louer Plateau', 
      location: 'Abidjan - Plateau', 
      price: 500000, 
      status: 'A louer', 
      mainImage: '/images/prop6.jpg',
      description: 'Appartement meublé en centre ville',
      bedrooms: 2,
      bathrooms: 1,
      area_m2: 80
    }
  ]
  for (const p of props) {
    const slug = slugify(p.title)
    await prisma.property.upsert({
      where: { slug },
      update: {},
      create: { ...p, slug }
    })
  }

  console.log('Seed done. Admin: admin@example.com / admin123')
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })