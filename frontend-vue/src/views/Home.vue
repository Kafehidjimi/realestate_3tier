<script setup>
import axios from 'axios'
import { ref, onMounted, onUnmounted } from 'vue'

const services = ref([])
const properties = ref([])
const projects = ref([])

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const currentSlide = ref(0)
const hoveredProject = ref(null)
const hoveredProperty = ref(null)
const statsVisible = ref(false)
const animatedStats = ref({
  biens: 0,
  annees: 0,
  satisfaction: 0,
  projets: 0
})
const sectionsVisible = ref({
  projects: false,
  services: false,
  properties: false,
  cta: false
})
let slideInterval = null

const observeSections = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionName = entry.target.dataset.section
          if (sectionName === 'stats') {
            statsVisible.value = true
            animateCounters()
          } else if (sectionName) {
            sectionsVisible.value[sectionName] = true
          }
        }
      })
    },
    { threshold: 0.2 }
  )

  // Observe all sections
  document.querySelectorAll('[data-section]').forEach((section) => {
    observer.observe(section)
  })

  return observer
}

const animateCounters = () => {
  const duration = 2000
  const steps = 60
  const stepDuration = duration / steps

  const animate = (target, key, suffix = '') => {
    let current = 0
    const increment = target / steps
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        animatedStats.value[key] = target + suffix
        clearInterval(timer)
      } else {
        animatedStats.value[key] = Math.floor(current) + suffix
      }
    }, stepDuration)
  }

  animate(250, 'biens', '+')
  animate(5, 'annees', '+')
  animate(98, 'satisfaction', '%')
  animate(50, 'projets', '+')
}

onMounted(async () => {
  try {
    services.value = (await axios.get(`${API}/api/services`)).data
    properties.value = (await axios.get(`${API}/api/properties`)).data.slice(0, 6)
    projects.value = (await axios.get(`${API}/api/projects`)).data.slice(0, 6)
  } catch (error) {
    console.error('Error loading data:', error)
  }
  
  // Auto-slide hero
  slideInterval = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % 3
  }, 5000)

  setTimeout(() => {
    observeSections()
  }, 100)
})

onUnmounted(() => {
  if (slideInterval) {
    clearInterval(slideInterval)
  }
})
</script>

<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="hero-slides">
        <div 
          v-for="(slide, index) in 3" 
          :key="index"
          class="hero-slide"
          :class="{ active: currentSlide === index }"
          :style="{ backgroundImage: `url('/placeholder.svg?height=800&width=1600')` }"
        ></div>
      </div>
      <div class="hero-overlay">
        <div class="hero-content"> 
          <div class="hero-logo">
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-sTS9PORiyTNWvChLYWKvUMchFAJSMa.png" alt="Sankofa Afrik" class="logo-image" />
          </div>
          <h1 class="hero-title">
            <span class="hero-title-line">Votre satisfaction,</span>
            <span class="hero-title-line">est notre priorité absolue</span>
          </h1>
          <p class="hero-subtitle">Immobilier d'exception à Abidjan</p>
          <div class="hero-actions">
            <RouterLink to="/biens" class="btn btn-primary">
              <span>Découvrir nos biens</span>
              <i class="fa fa-arrow-right"></i>
            </RouterLink>
            <RouterLink to="/contact" class="btn btn-secondary">
              <span>Nous contacter</span>
              <i class="fa fa-envelope"></i>
            </RouterLink>
          </div>
        </div>
      </div>
      <div class="hero-indicators">
        <button 
          v-for="i in 3" 
          :key="i"
          @click="currentSlide = i - 1"
          class="indicator"
          :class="{ active: currentSlide === i - 1 }"
          :aria-label="`Slide ${i}`"
        ></button>
      </div>
      <div class="scroll-indicator">
        <div class="scroll-mouse">
          <div class="scroll-wheel"></div>
        </div>
        <span class="scroll-text">Défiler</span>
      </div>
    </section>

    <section class="stats-section" data-section="stats">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item" :class="{ visible: statsVisible }">
            <div class="stat-icon">
              <i class="fa fa-home"></i>
            </div>
            <div class="stat-number">{{ animatedStats.biens || '250+' }}</div>
            <div class="stat-label">Biens vendus</div>
          </div>
          <div class="stat-item" :class="{ visible: statsVisible }">
            <div class="stat-icon">
              <i class="fa fa-calendar"></i>
            </div>
            <div class="stat-number">{{ animatedStats.annees || '5+' }}</div>
            <div class="stat-label">Années d'expérience</div>
          </div>
          <div class="stat-item" :class="{ visible: statsVisible }">
            <div class="stat-icon">
              <i class="fa fa-smile-o"></i>
            </div>
            <div class="stat-number">{{ animatedStats.satisfaction || '98%' }}</div>
            <div class="stat-label">Clients satisfaits</div>
          </div>
          <div class="stat-item" :class="{ visible: statsVisible }">
            <div class="stat-icon">
              <i class="fa fa-building"></i>
            </div>
            <div class="stat-number">{{ animatedStats.projets || '50+' }}</div>
            <div class="stat-label">Projets réalisés</div>
          </div>
        </div>
      </div>
    </section>
 

    <section class="services-section" data-section="services">
      <div class="container">
        <div class="section-header" :class="{ visible: sectionsVisible.services }">
          <span class="section-number">01</span>
          <h2 class="section-title">Nos Services</h2>
          <p class="section-subtitle">Une expertise complète pour tous vos besoins immobiliers</p>
        </div>
        
        <div class="services-grid">
          <div 
            class="service-card" 
            v-for="(s, index) in services" 
            :key="s.id"
            :class="{ visible: sectionsVisible.services }"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="service-icon-wrapper">
              <div class="service-icon">{{ s.icon || '🏗️' }}</div>
              <div class="icon-bg"></div>
            </div>
            <h3 class="service-title">{{ s.name }}</h3>
            <p class="service-description">{{ s.description }}</p>
            <div class="service-hover-effect"></div>
          </div>
          <p v-if="!services.length" class="empty-state">Aucun service disponible pour le moment.</p>
        </div>
      </div>
    </section>

    <section class="properties-section" data-section="properties">
      <div class="container">
        <div class="section-header" :class="{ visible: sectionsVisible.properties }">
          <span class="section-number">02</span>
          <h2 class="section-title">Biens en Vitrine</h2>
          <p class="section-subtitle">Sélection de nos biens d'exception disponibles</p>
        </div>
        
        <div class="properties-grid">
          <div 
            v-for="(p, index) in properties" 
            :key="p.id" 
            class="property-card"
            :class="{ visible: sectionsVisible.properties }"
            :style="{ animationDelay: `${index * 0.1}s` }"
            @mouseenter="hoveredProperty = p.id"
            @mouseleave="hoveredProperty = null"
          >
            <div class="property-image-wrapper">
              <img :src="p.mainImage || '/images/prop9.jpg'" :alt="p.title" class="property-image">
              <span class="property-badge">{{ p.status }}</span>
              <div class="property-hover-overlay" :class="{ visible: hoveredProperty === p.id }">
                <RouterLink :to="`/biens/${p.slug}`" class="property-view-btn">
                  <i class="fa fa-eye"></i>
                  <span>Voir les détails</span>
                </RouterLink>
              </div>
            </div>
            <div class="property-content">
              <h3 class="property-title">
                <RouterLink :to="`/biens/${p.slug}`">{{ p.title }}</RouterLink>
              </h3>
              <p class="property-location">
                <i class="fa fa-map-marker"></i>
                {{ p.location }}
              </p>
              <div v-if="p.price" class="property-price">
                {{ new Intl.NumberFormat().format(p.price) }} FCFA
              </div>
            </div>
          </div>
          <p v-if="!properties.length" class="empty-state">Aucun bien disponible pour le moment.</p>
        </div>
        
        <div class="section-cta" :class="{ visible: sectionsVisible.properties }">
          <RouterLink to="/biens" class="btn btn-primary btn-large">
            <span>Voir tous les biens</span>
            <i class="fa fa-arrow-right"></i>
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="projects-section" data-section="projects">
      <div class="container">
        <div class="section-header" :class="{ visible: sectionsVisible.projects }">
          <span class="section-number">03</span>
          <h2 class="section-title">Nos Projets</h2>
          <p class="section-subtitle">Découvrez nos réalisations d'exception qui façonnent le paysage immobilier d'Abidjan</p>
        </div>
        
        <div class="projects-grid">
          <div 
            v-for="(project, index) in projects" 
            :key="project.id"
            class="project-card"
            :class="{ visible: sectionsVisible.projects }"
            :style="{ animationDelay: `${index * 0.1}s` }"
            @mouseenter="hoveredProject = project.id"
            @mouseleave="hoveredProject = null"
          >
            <div class="project-image-wrapper">
              <img :src="project.image" :alt="project.title" class="project-image" />
              <div class="project-overlay" :class="{ visible: hoveredProject === project.id }">
                <div class="project-year">{{ project.year }}</div>
                <div class="project-view">
                  <i class="fa fa-search-plus"></i>
                  <span>Voir le projet</span>
                </div>
              </div>
            </div>
            <div class="project-info">
              <span class="project-category">{{ project.category }}</span>
              <h3 class="project-title">{{ project.title }}</h3>
              <p class="project-location">
                <i class="fa fa-map-marker"></i>
                {{ project.location }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section" data-section="cta">
      <div class="container">
        <div class="cta-content" :class="{ visible: sectionsVisible.cta }">
          <div class="cta-icon">
            <i class="fa fa-comments"></i>
          </div>
          <h2 class="cta-title">Prêt à concrétiser votre projet ?</h2>
          <p class="cta-text">Nos experts sont à votre écoute pour vous accompagner dans toutes vos démarches immobilières</p>
          <RouterLink to="/contact" class="btn btn-light btn-large">
            <span>Contactez-nous</span>
            <i class="fa fa-paper-plane"></i>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
