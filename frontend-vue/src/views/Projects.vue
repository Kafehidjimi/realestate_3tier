<script setup>
import axios from 'axios'
import { ref, onMounted, watch } from 'vue'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const projects = ref([])
const q = ref('')
const status = ref('')
const category = ref('')
const isLoading = ref(false)
const sectionsVisible = ref({
  projects: false
})
const hoveredProject = ref(null)

async function load() {
  isLoading.value = true
  const params = new URLSearchParams()
  if (q.value) params.set('q', q.value)
  if (status.value) params.set('status', status.value)
  if (category.value) params.set('category', category.value)
  
  try {
    projects.value = (await axios.get(`${API}/api/projects?${params.toString()}`)).data
  } catch (error) {
    console.error('Error loading projects:', error)
  } finally {
    isLoading.value = false
  }
  
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          sectionsVisible.value.projects = true
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1 })
    
    document.querySelectorAll('.project-card').forEach(el => observer.observe(el))
  }, 100)
}

function filterByCategory(cat) {
  category.value = cat
  load()
}

onMounted(load)
</script>

<template>
  <div class="projects-page">
     Added styled header with gradient like Properties.vue 
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Nos Projets</h1>
          <p class="page-subtitle">Découvrez nos réalisations d'exception qui façonnent le paysage immobilier d'Abidjan</p>
        </div>
        
        <div class="category-tabs">
          <button 
            class="category-tab" 
            :class="{ active: category === '' }"
            @click="filterByCategory('')"
          >
            <i class="fa fa-th"></i>
            <span>Tous</span>
          </button>
          <button 
            class="category-tab" 
            :class="{ active: category === 'résidentiel' }"
            @click="filterByCategory('résidentiel')"
          >
            <i class="fa fa-building"></i>
            <span>Résidentiel</span>
          </button>
          <button 
            class="category-tab" 
            :class="{ active: category === 'commercial' }"
            @click="filterByCategory('commercial')"
          >
            <i class="fa fa-briefcase"></i>
            <span>Commercial</span>
          </button>
          <button 
            class="category-tab" 
            :class="{ active: category === 'infrastructure' }"
            @click="filterByCategory('infrastructure')"
          >
            <i class="fa fa-road"></i>
            <span>Infrastructure</span>
          </button>
        </div>

        <div class="filters">
          <div class="filter-group">
            <input 
              v-model="q" 
              placeholder="Rechercher un projet..." 
              class="search-input"
              @keyup.enter="load"
            />
            <select v-model="status" class="status-select">
              <option value="">Tous les statuts</option>
              <option value="en-cours">En cours</option>
              <option value="terminé">Terminé</option>
              <option value="planifié">Planifié</option>
            </select>
            <button class="filter-btn" @click="load">
              <span v-if="!isLoading">Filtrer</span>
              <span v-else class="loading-spinner"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="properties-container">
      <div v-if="isLoading" class="loading-state">
        <div class="loader"></div>
        <p>Chargement des projets...</p>
      </div>
      
      <div v-else-if="projects.length === 0" class="empty-state">
        <div class="empty-icon">🏗️</div>
        <h3>Aucun projet trouvé</h3>
        <p>Essayez de modifier vos critères de recherche</p>
      </div>
      
      <div v-else class="container">
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
    </div>
  </div>
</template>
