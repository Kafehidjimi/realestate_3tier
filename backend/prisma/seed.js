// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function slugify(str) {
  return String(str).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50)
}

async function seedUsers() {
  const hash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hash },
    create: { 
      email: 'admin@example.com', 
      password: hash, 
      name: 'Admin', 
      isStaff: true,
      role: 'admin'
    }
  })
  console.log('✅ User admin créé : admin@example.com / admin123')
}

async function seedServices() {
  const SERVICES = [
    { 
      name: 'Aménagement foncier',
      title: 'Aménagement foncier',
      description: 'Lotissement, viabilisation, études topographiques et planification urbaine',
      icon: '/uploads/stickers/construction.png',
      slug: 'amenagement-foncier',
      content: 'Services complets d\'aménagement foncier pour transformer vos terrains en espaces viabilisés et prêts à construire.'
    },
    { 
      name: 'Vente de terrains',
      title: 'Vente de terrains',
      description: 'Titres sécurisés, zones stratégiques en Côte d\'Ivoire',
      icon: '/uploads/stickers/vente.png',
      slug: 'vente-terrains',
      content: 'Large sélection de terrains titrés dans les meilleures zones d\'Abidjan et environs.'
    },
    { 
      name: 'Construction clé en main',
      title: 'Construction clé en main',
      description: 'Maisons, villas, immeubles - De la conception à la livraison',
      icon: '/uploads/stickers/cleenmain.png',
      slug: 'construction-cle-en-main',
      content: 'Construction complète de votre maison ou villa, du plan architectural à la remise des clés.'
    },
    {
      name: "Gestion immobilière",
      title: "Gestion immobilière",
      description: "Administration de biens, location et gestion locative",
      icon: "/uploads/stickers/gestion.png",
      slug: "gestion-immobiliere",
      content: "Confiez-nous la gestion de vos biens immobiliers pour une rentabilité optimale."
    },
    {
      name: "Transaction immobilière",
      title: "Transaction immobilière",
      description: "Achat, vente et location de propriétés",
      icon: "/uploads/stickers/payment.png",
      slug: "transaction-immobiliere",
      content: "Accompagnement personnalisé dans toutes vos transactions immobilières."
    }
  ]

  for (const s of SERVICES) {
    const existing = await prisma.service.findFirst({ where: { slug: s.slug } })
    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data: s })
      console.log(`  ↻ Service mis à jour: ${s.name}`)
    } else {
      await prisma.service.create({ data: s })
      console.log(`  ✨ Service créé: ${s.name}`)
    }
  }
  console.log('✅ Services OK (5 services)')
}

async function seedProperties() {
  const PROPERTIES = [
    { 
      title: 'Terrain résidentiel 500 m² - Bingerville', 
      slug: 'terrain-500m2-bingerville',
      location: 'Bingerville', 
      price: 12500000, 
      status: 'sale',
      category: 'terrain',  // ← AJOUT
      mainImage: '/uploads/terrain1.jpg',
      description: 'Magnifique terrain de 500 m² situé à Bingerville, dans un quartier résidentiel calme et sécurisé. Titre foncier disponible.',
      area_m2: 500,
      surfaceHabitable: 500,
      type: 'Terrain',
      yearOfConstruction: null,
      capacity: null,
      additionalImages: ['/uploads/terrain1.jpg', '/uploads/terrain2.jpg', '/uploads/terrain3.jpg']  // ← AJOUT
    },
    { 
      title: 'Villa moderne 4 chambres - Cocody', 
      slug: 'villa-moderne-cocody',
      location: 'Abidjan - Cocody', 
      price: 95000000, 
      status: 'sale',
      category: 'maison',  // ← AJOUT
      mainImage: '/uploads/terrain2.jpg',
      description: 'Superbe villa moderne de 4 chambres avec jardin, piscine et garage à Cocody. Quartier calme et prestigieux.',
      area_m2: 300,
      bedrooms: 4,
      bathrooms: 3,
      surfaceHabitable: 300,
      type: 'Villa',
      yearOfConstruction: 2022,
      capacity: 8,
      additionalImages: ['/uploads/terrain2.jpg', '/uploads/terrain3.jpg', '/uploads/terrain4.jpg', '/uploads/terrain5.jpg']  // ← AJOUT
    },
    { 
      title: 'Appartement meublé - Plateau', 
      slug: 'appartement-meuble-plateau',
      location: 'Abidjan - Plateau', 
      price: 450000, 
      status: 'rent',
      category: 'maison',  // ← AJOUT
      mainImage: '/uploads/terrain3.jpg',
      description: 'Bel appartement meublé au cœur du Plateau, proche des ministères et commerces. Idéal pour professionnels.',
      area_m2: 85,
      bedrooms: 2,
      bathrooms: 1,
      surfaceHabitable: 85,
      type: 'Appartement',
      yearOfConstruction: 2020,
      capacity: 4,
      additionalImages: ['/uploads/terrain3.jpg', '/uploads/terrain4.jpg', '/uploads/terrain5.jpg']  // ← AJOUT
    },
    { 
      title: 'Grand terrain 1200 m² - Anyama', 
      slug: 'grand-terrain-anyama',
      location: 'Anyama', 
      price: 28000000, 
      status: 'sale',
      category: 'terrain',  // ← AJOUT
      mainImage: '/uploads/terrain4.jpg',
      description: 'Vaste terrain viabilisé de 1200 m² à Anyama. Zone en plein développement, accès facile.',
      area_m2: 1200,
      surfaceHabitable: 1200,
      type: 'Terrain',
      yearOfConstruction: null,
      capacity: null,
      additionalImages: ['/uploads/terrain4.jpg', '/uploads/terrain5.jpg', '/uploads/terrain6.jpg']  // ← AJOUT
    },
    { 
      title: 'Duplex standing - Riviera Golf', 
      slug: 'duplex-standing-riviera',
      location: 'Abidjan - Riviera', 
      price: 135000000, 
      status: 'sale',
      category: 'maison',  // ← AJOUT
      mainImage: '/uploads/terrain5.jpg',
      description: 'Magnifique duplex haut standing avec vue, piscine privée et jardin paysager à Riviera Golf.',
      area_m2: 380,
      bedrooms: 5,
      bathrooms: 4,
      surfaceHabitable: 380,
      type: 'Duplex',
      yearOfConstruction: 2023,
      capacity: 10,
      additionalImages: ['/uploads/terrain5.jpg', '/uploads/terrain6.jpg', '/uploads/terrain7.jpg', '/uploads/terrain8.jpg']  // ← AJOUT
    },
    { 
      title: 'Terrain commercial 800 m² - Adjamé', 
      slug: 'terrain-commercial-adjame',
      location: 'Abidjan - Adjamé', 
      price: 45000000, 
      status: 'sale',
      category: 'import-export',  // ← AJOUT
      mainImage: '/uploads/terrain6.jpg',
      description: 'Terrain idéal pour commerce ou immeuble, bien situé à Adjamé. Fort potentiel commercial.',
      area_m2: 800,
      surfaceHabitable: 800,
      type: 'Terrain Commercial',
      yearOfConstruction: null,
      capacity: null,
      additionalImages: ['/uploads/terrain6.jpg', '/uploads/terrain7.jpg', '/uploads/terrain8.jpg']  // ← AJOUT
    },
    { 
      title: 'Villa bord de mer - Grand-Bassam', 
      slug: 'villa-bord-mer-grand-bassam',
      location: 'Grand-Bassam', 
      price: 78000000, 
      status: 'sale',
      category: 'maison',  // ← AJOUT
      mainImage: '/uploads/terrain7.jpg',
      description: 'Charmante villa les pieds dans l\'eau à Grand-Bassam. Vue mer exceptionnelle, 3 chambres.',
      area_m2: 220,
      bedrooms: 3,
      bathrooms: 2,
      surfaceHabitable: 220,
      type: 'Villa',
      yearOfConstruction: 2021,
      capacity: 6,
      additionalImages: ['/uploads/terrain7.jpg', '/uploads/terrain8.jpg', '/uploads/terrain1.jpg', '/uploads/terrain2.jpg']  // ← AJOUT
    },
    { 
      title: 'Terrain vendu - Bingerville Centre', 
      slug: 'terrain-vendu-bingerville',
      location: 'Bingerville', 
      price: 15000000, 
      status: 'sold',
      category: 'terrain',  // ← AJOUT
      mainImage: '/uploads/terrain8.jpg',
      description: 'Terrain de 600 m² - VENDU. Exemple de nos réalisations.',
      area_m2: 600,
      surfaceHabitable: 600,
      type: 'Terrain',
      yearOfConstruction: null,
      capacity: null,
      additionalImages: ['/uploads/terrain8.jpg', '/uploads/terrain1.jpg']  // ← AJOUT
    }
  ]

  for (const p of PROPERTIES) {
    const propertyData = {
      title: p.title,
      slug: p.slug,
      location: p.location,
      price: p.price,
      status: p.status,
      category: p.category,  // ← AJOUT
      mainImage: p.mainImage,
      description: p.description,
      area_m2: p.area_m2,
      surfaceHabitable: p.surfaceHabitable,
      type: p.type,
      yearOfConstruction: p.yearOfConstruction,
      capacity: p.capacity
    }

    if (p.bedrooms !== undefined) propertyData.bedrooms = p.bedrooms
    if (p.bathrooms !== undefined) propertyData.bathrooms = p.bathrooms

    const prop = await prisma.property.upsert({
      where: { slug: p.slug },
      update: propertyData,
      create: propertyData
    })
    
    // ← AJOUT : Créer plusieurs images par bien
    if (p.additionalImages && p.additionalImages.length > 0) {
      // Supprimer les anciennes images
      await prisma.propertyimage.deleteMany({
        where: { propertyId: prop.id }
      })
      
      // Créer les nouvelles images
      for (let i = 0; i < p.additionalImages.length; i++) {
        await prisma.propertyimage.create({
          data: {
            propertyId: prop.id,
            url: p.additionalImages[i],
            alt: `${p.title} - Image ${i + 1}`,
            order: i
          }
        })
      }
    }
  }
  
  console.log('✅ Properties OK (8 propriétés avec catégories et images multiples)')
}

async function seedProjects() {
  const PROJECTS = [
    {
      title: 'Lotissement Bingerville Phase 1',
      slug: 'lotissement-bingerville-phase-1',
      description: 'Aménagement de 50 parcelles viabilisées à Bingerville avec voirie, électricité et eau potable.',
      coverImage: '/uploads/projet1.png',
      status: 'delivered',
      category: 'lotissement',
      location: 'Bingerville',
      surface: 5000,       
      units: 50,    
      deliveredAt: new Date('2024-02-15'),        
      startedAt: new Date('2023-03-01'),
      medias: [
        { kind: 'image', url: '/uploads/projet1.png', alt: 'Vue d\'ensemble', order: 0 },
        { kind: 'image', url: '/uploads/projet2.png', alt: 'Voirie terminée', order: 1 }
      ]
    },
    {
      title: 'Résidentiel Anyama - Les Palmiers',
      slug: 'residentiel-anyama-palmiers',
      description: 'Construction d\'un ensemble résidentiel de 30 villas modernes à Anyama.',
      coverImage: '/uploads/projet3.png',
      status: 'ongoing',
      location: 'Anyama',
      category: 'résidentiel',
      surface: 3000,       
      units: 30,    
      deliveredAt: new Date('2025-06-15'), 
      startedAt: new Date('2024-06-15'),
      medias: [
        { kind: 'image', url: '/uploads/projet3.png', alt: 'Travaux en cours', order: 0 },
        { kind: 'image', url: '/uploads/projet4.png', alt: 'Phase 2', order: 1 }
      ]
    },
    {
      title: 'Complexe Riviera Premium',
      slug: 'complexe-riviera-premium',
      description: 'Ensemble résidentiel haut standing avec équipements (piscine, salle de sport, sécurité 24/7).',
      coverImage: '/uploads/projet5.png',
      status: 'delivered',
      location: 'Riviera',
      category: 'résidentiel',
      surface: 8000,       
      units: 60,    
      deliveredAt: new Date('2024-02-15'), 
      startedAt: new Date('2022-09-01'),
      medias: [
        { kind: 'image', url: '/uploads/projet5.png', alt: 'Vue finale', order: 0 },
        { kind: 'image', url: '/uploads/projet6.png', alt: 'Espaces communs', order: 1 }
      ]
    },
    {
      title: 'Lotissement Cocody Extension',
      slug: 'lotissement-cocody-extension',
      description: 'Viabilisation de terrains dans la zone d\'extension de Cocody.',
      coverImage: '/uploads/projet7.png',
      status: 'ongoing',
      location: 'Cocody',
      category: 'lotissement',
      surface: 4500,       
      units: 40,    
      deliveredAt: new Date('2025-12-01'), 
      startedAt: new Date('2024-09-01'),
      medias: [
        { kind: 'image', url: '/uploads/projet7.png', alt: 'Début des travaux', order: 0 },
        { kind: 'image', url: '/uploads/projet8.png', alt: 'Avancement', order: 1 }
      ]
    },
    {
      title: 'Immeuble Commercial Plateau',
      slug: 'immeuble-commercial-plateau',
      description: 'Construction d\'un immeuble R+5 à usage commercial et bureaux au Plateau.',
      coverImage: '/uploads/projet9.png',
      status: 'planned',
      location: 'Plateau',
      category: 'commercial',
      surface: 2500,       
      units: 25,    
      deliveredAt: new Date('2026-06-01'), 
      startedAt: new Date('2025-02-01'),
      medias: [
        { kind: 'image', url: '/uploads/projet9.png', alt: 'Plans architecturaux', order: 0 },
        { kind: 'image', url: '/uploads/projet10.png', alt: 'Maquette 3D', order: 1 }
      ]
    },
    {
      title: 'Village Artisanal Grand-Bassam',
      slug: 'village-artisanal-grand-bassam',
      description: 'Aménagement d\'un espace culturel et artisanal à Grand-Bassam.',
      coverImage: '/uploads/projet11.png',
      status: 'ongoing',
      location: 'Grand-Bassam',
      category: 'culturel',
      surface: 6000,       
      units: 45,    
      deliveredAt: new Date('2025-08-01'), 
      startedAt: new Date('2024-04-01'),
      medias: [
        { kind: 'image', url: '/uploads/projet11.png', alt: 'Site en construction', order: 0 },
        { kind: 'image', url: '/uploads/projet12.png', alt: 'Ateliers', order: 1 }
      ]
    },
    {
      title: 'Résidence Les Jardins d\'Abidjan',
      slug: 'residence-jardins-abidjan',
      description: '40 appartements standing dans un cadre verdoyant à Marcory.',
      coverImage: '/uploads/projet13.png',
      status: 'delivered',
      location: 'Marcory',
      category: 'résidentiel',
      surface: 3500,       
      units: 40,    
      deliveredAt: new Date('2024-01-15'), 
      startedAt: new Date('2022-01-15'),
      medias: [
        { kind: 'image', url: '/uploads/projet13.png', alt: 'Résidence terminée', order: 0 },
        { kind: 'image', url: '/uploads/projet14.png', alt: 'Intérieur type', order: 1 }
      ]
    },
    {
      title: 'Zone Industrielle Yopougon',
      slug: 'zone-industrielle-yopougon',
      description: 'Aménagement d\'une zone dédiée aux PME et industries légères.',
      coverImage: '/uploads/projet15.png',
      status: 'planned',
      category: 'industriel',
      location: 'Yopougon',
      surface: 12000,       
      units: 80,    
      deliveredAt: new Date('2026-12-01'), 
      startedAt: new Date('2025-06-01'),
      medias: [
        { kind: 'image', url: '/uploads/projet15.png', alt: 'Étude de faisabilité', order: 0 },
        { kind: 'image', url: '/uploads/projet16.png', alt: 'Planification', order: 1 }
      ]
    }
  ]

  for (const pj of PROJECTS) {
    const { medias, ...projectData } = pj
    
    const proj = await prisma.project.upsert({
      where: { slug: pj.slug },
      update: projectData,
      create: projectData
    })

    // Supprimer les anciens médias
    await prisma.projectmedia.deleteMany({
      where: { projectId: proj.id }
    })

    // Créer les nouveaux médias
    for (const m of medias) {
      await prisma.projectmedia.create({ 
        data: { projectId: proj.id, ...m } 
      })
    }
  }
  console.log('✅ Projects OK (8 projets avec surfaces, unités et dates de livraison)')
}

async function seedPageContent() {
  const blocks = [
    // HOME / HERO
    { page: 'home', section: 'hero', key: 'title', value: 'Sankofa Afrik – Immobilier & Aménagement' },
    { page: 'home', section: 'hero', key: 'subtitle', value: 'Des solutions complètes et sécurisées pour vos projets immobiliers' },
    { page: 'home', section: 'hero', key: 'image', value: '/uploads/projet1.png' },
    { page: 'home', section: 'hero', key: 'cta_text', value: 'Découvrir nos biens' },
    { page: 'home', section: 'hero', key: 'cta_link', value: '/properties' },

    // HOME / STATS
    { page: 'home', section: 'stats', key: 'projects_completed', value: 150 },
    { page: 'home', section: 'stats', key: 'happy_clients', value: 500 },
    { page: 'home', section: 'stats', key: 'years_experience', value: 15 },

    // ABOUT
    { page: 'about', section: 'intro', key: 'title', value: 'À propos de Sankofa Afrik' },
    { page: 'about', section: 'intro', key: 'text', value: 'Nous accompagnons vos projets fonciers et immobiliers depuis plus de 15 ans en Côte d\'Ivoire.' },
    { page: 'about', section: 'intro', key: 'image', value: '/uploads/projet5.png' },
    
    { page: 'about', section: 'mission', key: 'title', value: 'Notre Mission' },
    { page: 'about', section: 'mission', key: 'text', value: 'Offrir des solutions immobilières sûres, transparentes et adaptées à chaque client.' },

    { page: 'about', section: 'values', key: 'title', value: 'Nos Valeurs' },
    { page: 'about', section: 'values', key: 'value1', value: 'Intégrité' },
    { page: 'about', section: 'values', key: 'value2', value: 'Excellence' },
    { page: 'about', section: 'values', key: 'value3', value: 'Innovation' },

    // CONTACT
    { page: 'contact', section: 'info', key: 'phone', value: '+225 07 08 09 10 11' },
    { page: 'contact', section: 'info', key: 'email', value: 'contact@sankofa-afrik.com' },
    { page: 'contact', section: 'info', key: 'address', value: 'Abidjan – Cocody, Riviera Palmeraie' },
    { page: 'contact', section: 'info', key: 'hours', value: 'Lun - Ven: 8h - 18h | Sam: 9h - 13h' },

    // FOOTER
    { page: 'footer', section: 'company', key: 'name', value: 'Sankofa Afrik' },
    { page: 'footer', section: 'company', key: 'description', value: 'Votre partenaire immobilier de confiance en Côte d\'Ivoire' },
    { page: 'footer', section: 'social', key: 'facebook', value: 'https://facebook.com/sankofa-afrik' },
    { page: 'footer', section: 'social', key: 'linkedin', value: 'https://linkedin.com/company/sankofa-afrik' },
    { page: 'footer', section: 'social', key: 'instagram', value: 'https://instagram.com/sankofa_afrik' }
  ]
  
  for (const b of blocks) {
    await prisma.pagecontent.upsert({
      where: { page_section_key: { page: b.page, section: b.section, key: b.key } },
      update: { value: b.value },
      create: { page: b.page, section: b.section, key: b.key, value: b.value }
    })
  }
  console.log('✅ Page content OK (5 pages configurées)')
}

async function seedCompanyInfo() {
  const COMPANY_INFO = [
    // Informations de contact
    { 
      key: 'company_name', 
      value: 'Sankofa Afrik', 
      category: 'contact', 
      label: 'Nom de l\'entreprise',
      order: 1
    },
    { 
      key: 'phone_primary', 
      value: '+225 07 08 09 10 11', 
      category: 'contact', 
      label: 'Téléphone principal',
      order: 2
    },
    { 
      key: 'phone_secondary', 
      value: '+225 01 02 03 04 05', 
      category: 'contact', 
      label: 'Téléphone secondaire',
      order: 3
    },
    { 
      key: 'whatsapp', 
      value: '+2250708091011', 
      category: 'contact', 
      label: 'WhatsApp',
      order: 4
    },
    { 
      key: 'email', 
      value: 'contact@sankofaafrik.com', 
      category: 'contact', 
      label: 'Email',
      order: 5
    },
    { 
      key: 'address', 
      value: 'Abidjan, Cocody Riviera – Côte d\'Ivoire', 
      category: 'contact', 
      label: 'Adresse',
      order: 6
    },
    { 
      key: 'hours', 
      value: 'Lun - Ven: 8h - 18h<br>Sam: 9h - 13h', 
      category: 'contact', 
      label: 'Horaires',
      order: 7
    },
    
    // Coordonnées GPS pour la carte
    { 
      key: 'latitude', 
      value: '5.345317', 
      category: 'location', 
      label: 'Latitude',
      order: 1
    },
    { 
      key: 'longitude', 
      value: '-4.024429', 
      category: 'location', 
      label: 'Longitude',
      order: 2
    },
    { 
      key: 'map_zoom', 
      value: '13', 
      category: 'location', 
      label: 'Zoom de la carte',
      order: 3
    },
    
    // Réseaux sociaux
    { 
      key: 'facebook', 
      value: 'https://facebook.com/sankofaafrik', 
      category: 'social', 
      label: 'Facebook',
      order: 1
    },
    { 
      key: 'instagram', 
      value: 'https://instagram.com/sankofaafrik', 
      category: 'social', 
      label: 'Instagram',
      order: 2
    },
    { 
      key: 'linkedin', 
      value: 'https://linkedin.com/company/sankofa-afrik', 
      category: 'social', 
      label: 'LinkedIn',
      order: 3
    },
    { 
      key: 'twitter', 
      value: 'https://twitter.com/sankofaafrik', 
      category: 'social', 
      label: 'Twitter',
      order: 4
    },
    
    // Informations légales
    { 
      key: 'registration_number', 
      value: 'CI-ABJ-2024-B-12345', 
      category: 'legal', 
      label: 'Numéro d\'enregistrement',
      order: 1
    },
    { 
      key: 'tax_id', 
      value: '1234567890', 
      category: 'legal', 
      label: 'Numéro fiscal',
      order: 2
    },
    
    // À propos
    { 
      key: 'description', 
      value: 'Votre partenaire immobilier de confiance en Côte d\'Ivoire', 
      category: 'about', 
      label: 'Description courte',
      order: 1
    },
    { 
      key: 'about_text', 
      value: 'Sankofa Afrik est une entreprise spécialisée dans l\'immobilier et l\'aménagement foncier en Côte d\'Ivoire. Depuis plus de 15 ans, nous accompagnons nos clients dans la réalisation de leurs projets immobiliers avec professionnalisme et transparence.', 
      category: 'about', 
      label: 'Texte à propos',
      order: 2
    }
  ]

  for (const info of COMPANY_INFO) {
    await prisma.companyinfo.upsert({
      where: { key: info.key },
      update: { 
        value: info.value,
        category: info.category,
        label: info.label,
        order: info.order
      },
      create: info
    })
  }
  
  console.log('✅ Company Info OK (20 informations d\'entreprise)')
}

// N'oubliez pas d'appeler cette fonction dans la fonction main()
async function main() {
  console.log('🌱 Début du seed...\n')
  await seedUsers()
  await seedServices()
  await seedProperties()
  await seedProjects()
  await seedPageContent()
  await seedCompanyInfo()  // ← AJOUT ICI
  console.log('\n✅ Seed terminé avec succès !')
  console.log('\n📊 Résumé:')
  console.log('   - 1 utilisateur admin')
  console.log('   - 5 services (avec images)')
  console.log('   - 8 propriétés')
  console.log('   - 8 projets (16 photos)')
  console.log('   - 5 pages de contenu')
  console.log('   - 20 informations d\'entreprise\n')  // ← AJOUT ICI
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Erreur seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })