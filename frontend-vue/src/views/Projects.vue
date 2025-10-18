<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const allProjects = ref([])
const q = ref('')
const status = ref('')
const category = ref('')
const isLoading = ref(false)
const hoveredProject = ref(null)
const sectionsVisible = ref({
  header: false,
  filters: false,
  projects: false,
  cta: false
})

function statusToCategory(statusCode) {
  const map = { planned: 'Planifié', ongoing: 'En cours', delivered: 'Livré' }
  if (!statusCode) return 'Projet'
  const s = String(statusCode).toLowerCase()
  return map[s] || statusCode
}

// Fonction de chargement - charge TOUS les projets
async function loadAll() {
  isLoading.value = true
  
  try {
    const rows = await api.getProjects()
    allProjects.value = rows.map((r, idx) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category || statusToCategory(r.status),
      location: r.location || '',
      image: api.getImageUrl(
        r.coverImage || (r.medias?.find(m => m.kind === 'image')?.url) || `/images/projet${(idx % 16) + 1}.png`
      ),
      year: r.startedAt ? String(new Date(r.startedAt).getFullYear()) : '',
      description: r.description || '',
      surface: r.surface || '',
      units: r.units || '',
      status: r.status
    }))
  } catch (error) {
    console.error('Error loading projects:', error)
  } finally {
    isLoading.value = false
  }

  setTimeout(() => { observeSections() }, 100)
}

// Catégories uniques basées sur TOUS les projets
const categories = computed(() => {
  const set = new Set(allProjects.value.map(p => p.category).filter(Boolean))
  return [...set].sort()
})

// Projets filtrés côté client
const filteredProjects = computed(() => {
  let result = allProjects.value

  // Filtre par recherche
  if (q.value) {
    const search = q.value.toLowerCase()
    result = result.filter(p => 
      p.title?.toLowerCase().includes(search) ||
      p.location?.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search)
    )
  }

  // Filtre par statut
  if (status.value) {
    result = result.filter(p => p.status === status.value)
  }

  // Filtre par catégorie
  if (category.value) {
    result = result.filter(p => p.category === category.value)
  }

  return result
})

const observeSections = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionName = entry.target.dataset.section
          if (sectionName) {
            sectionsVisible.value[sectionName] = true
          }
        }
      })
    },
    { threshold: 0.2 }
  )

  document.querySelectorAll('[data-section]').forEach((section) => observer.observe(section))
  return observer
}

onMounted(async () => {
  await loadAll()
})
</script>

<template>
  <div class="projects-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Nos Projets</h1>
          <p class="page-subtitle">Découvrez nos réalisations d'exception qui façonnent le paysage immobilier d'Abidjan</p>
        </div>
        
        <div class="filters">
          <!-- Filtres par catégorie en haut -->
          <div class="category-filters">
            <button 
              @click="category = ''"
              :class="['category-btn', { active: category === '' }]"
            >
              Tous les projets
            </button>
            <button 
              v-for="cat in categories" 
              :key="cat"
              @click="category = cat"
              :class="['category-btn', { active: category === cat }]"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Barre de recherche et filtre de statut en bas -->
          <form class="filter-group" @submit.prevent>
            <input 
              v-model="q" 
              placeholder="Rechercher un projet..." 
              class="search-input"
              type="search"
            />
            <select v-model="status" class="status-select" aria-label="Statut du projet">
              <option value="">Tous les statuts</option>
              <option value="planned">Planifié</option>
              <option value="ongoing">En cours</option>
              <option value="delivered">Livré</option>
            </select>
            <button class="filter-btn" type="button" :disabled="isLoading">
              <span v-if="!isLoading">Filtrer</span>
              <span v-else class="loading-spinner"></span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <div class="projects-container">
      <!-- État de chargement -->
      <div v-if="isLoading" class="loading-state">
        <div class="loader"></div>
        <p>Chargement des projets...</p>
      </div>

      <!-- État vide -->
      <div v-else-if="filteredProjects.length === 0" class="empty-state">
        <div class="empty-icon">🏗️</div>
        <h3>Aucun projet trouvé</h3>
        <p>Essayez de modifier vos critères de recherche</p>
      </div>

      <!-- Grille de projets -->
      <div v-else class="projects-grid">
              <RouterLink
        :to="`/projets/${project.slug}`"
        v-for="(project, index) in filteredProjects"
        :key="project.id"
        class="project-card visible"
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
            {{ project.location }}
          </p>
          <p class="project-description">{{ project.description }}</p>
        </div>
      </RouterLink>
      </div>
    </div>
  </div>
</template>
<style scoped>
.project-card {
  display: block;
  text-decoration: none;
  color: inherit;
}
</style>