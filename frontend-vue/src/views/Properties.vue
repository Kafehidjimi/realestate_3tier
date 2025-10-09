<script setup>
import axios from 'axios'
import { ref, onMounted, watch } from 'vue'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const items = ref([])
const q = ref('')
const status = ref('')
const category = ref('')
const isLoading = ref(false)

async function load() {
  isLoading.value = true
  const params = new URLSearchParams()
  if (q.value) params.set('q', q.value)
  if (status.value) params.set('status', status.value)
  if (category.value) params.set('category', category.value)
  
  try {
    items.value = (await axios.get(`${API}/api/properties?${params.toString()}`)).data
  } catch (error) {
    console.error('Error loading properties:', error)
  } finally {
    isLoading.value = false
  }
  
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1 })
    
    document.querySelectorAll('.property-card').forEach(el => observer.observe(el))
  }, 100)
}

function filterByCategory(cat) {
  category.value = cat
  load()
}

onMounted(load)
</script>

<template>
  <div class="properties-page"> 
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Nos Biens</h1>
          <p class="page-subtitle">Découvrez notre sélection de propriétés d'exception</p>
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
            :class="{ active: category === 'terrain' }"
            @click="filterByCategory('terrain')"
          >
            <i class="fa fa-map"></i>
            <span>Terrain</span>
          </button>
          <button 
            class="category-tab" 
            :class="{ active: category === 'maison' }"
            @click="filterByCategory('maison')"
          >
            <i class="fa fa-home"></i>
            <span>Maison</span>
          </button>
          <button 
            class="category-tab" 
            :class="{ active: category === 'import-export' }"
            @click="filterByCategory('import-export')"
          >
            <i class="fa fa-ship"></i>
            <span>Import & Export</span>
          </button>
        </div>
 
        <div class="filters">
          <div class="filter-group">
            <input 
              v-model="q" 
              placeholder="Rechercher un bien..." 
              class="search-input"
              @keyup.enter="load"
            />
            <select v-model="status" class="status-select">
              <option value="">Tous les statuts</option>
              <option value="sale">À vendre</option>
              <option value="rent">À louer</option>
              <option value="sold">Vendu</option>
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
        <p>Chargement des biens...</p>
      </div>
      
      <div v-else-if="items.length === 0" class="empty-state">
        <div class="empty-icon">🏠</div>
        <h3>Aucun bien trouvé</h3>
        <p>Essayez de modifier vos critères de recherche</p>
      </div>
      
      <div v-else class="properties-grid">
        <div v-for="(p, index) in items" :key="p.id" class="property-card" :style="{ animationDelay: `${index * 0.1}s` }">
          <RouterLink :to="`/biens/${p.slug}`" class="property-link">
            <div class="property-image-wrapper">
              <img :src="p.mainImage || '/images/prop9.jpg'" :alt="p.title" class="property-image" />
              <div class="image-overlay">
                <span class="view-details">Voir les détails</span>
              </div>
              <span class="property-badge" :class="`badge-${p.status}`">
                {{ p.status === 'sale' ? 'À vendre' : p.status === 'rent' ? 'À louer' : 'Vendu' }}
              </span>
            </div>
            
            <div class="property-content">
              <h3 class="property-title">{{ p.title }}</h3>
              <div class="property-location">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {{ p.location }}
              </div>
              <div v-if="p.price" class="property-price">
                {{ new Intl.NumberFormat().format(p.price) }} FCFA
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>



