<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api' // ← Importer le service

const items = ref([])
const q = ref('')
const status = ref('')
const category = ref('')
const isLoading = ref(false)

async function load() {
  isLoading.value = true
  const params = {}
  if (q.value) params.q = q.value
  if (status.value) params.status = status.value
  if (category.value) params.category = category.value
  
  try {
    items.value = await api.getProperties(params)
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

function formatFcfa(n) {
  if (n == null) return ''
  return new Intl.NumberFormat('fr-FR').format(Number(n)) + ' FCFA'
}

onMounted(load)
</script>

<template>
  <div class="properties-page"> 
    <div class="page-header">
      <div class="header-content">
        <div class="header-text">
          <h1 class="page-title">Nos Offres</h1>
        
          <p class="page-subtitle">Découvrez notre sélection de propriétés d'exception</p>
        </div>
        
        <!-- Ajout des filtres par catégorie -->
        <div class="filters">
          <div class="category-filters">
            <button 
              @click="category = ''; load()"
              :class="['category-btn', { active: category === '' }]"
            >
              Tous les Offres
            </button>
            <button 
              @click="category = 'terrain'; load()"
              :class="['category-btn', { active: category === 'terrain' }]"
            >
              Terrain
            </button>
            <button 
              @click="category = 'maison'; load()"
              :class="['category-btn', { active: category === 'maison' }]"
            >
              Maison
            </button>
            <button 
              @click="category = 'import-export'; load()"
              :class="['category-btn', { active: category === 'import-export' }]"
            >
              Import & Export
            </button>
          </div>
          
          <form class="filter-group" @submit.prevent="load" with="30px">
  <input 
    v-model="q" 
    placeholder="Rechercher une offre..." 
    class="search-input"
  />
  <select v-model="status" class="status-select" aria-label="Statut de l'offre">
    <option value="">Tous les statuts</option>
    <option value="sale">À vendre</option>
    <option value="rent">À louer</option>
    <option value="sold">Vendu</option>
  </select>
  <button class="filter-btn" type="submit" :disabled="isLoading">
    <span v-if="!isLoading">Filtrer</span>
    <span v-else class="loading-spinner"></span>
  </button>
          </form>

        </div>
      </div>
    </div>
 
    <div class="properties-container">
      <div v-if="isLoading" class="loading-state">
        <div class="loader"></div>
        <p>Chargement des Offres...</p>
      </div>
      
      <div v-else-if="items.length === 0" class="empty-state">
        <div class="empty-icon">🏠</div>
        <h3>Aucun Offre trouvé</h3>
        <p>Essayez de modifier vos critères de recherche</p>
      </div>
      
      <div v-else class="properties-grid">
        <div v-for="(p, index) in items" :key="p.id" class="property-card" :style="{ animationDelay: `${index * 0.1}s` }">
          <RouterLink :to="`/biens/${p.slug}`" class="property-link">
            <div class="property-image-wrapper">
              <img 
                :src="api.getImageUrl(p.mainImage || (p.images && p.images[0] && p.images[0].url))" 
                :alt="p.title"
                class="property-image" 
              />

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
                À partir de {{ formatFcfa(p.price) }}
              </div>

            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
