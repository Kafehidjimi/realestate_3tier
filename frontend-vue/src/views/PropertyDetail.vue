<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const p = ref(null)
const form = ref({ name:'', email:'', phone:'', message:'' })
const isSubmitting = ref(false)
const currentImageIndex = ref(0)
const images = ref([])

function nextImage() {
  currentImageIndex.value = (currentImageIndex.value + 1) % images.value.length
}

function prevImage() {
  currentImageIndex.value = (currentImageIndex.value - 1 + images.value.length) % images.value.length
}

function selectImage(index) {
  currentImageIndex.value = index
}

async function send() {
  if (!form.value.name || !form.value.email || !form.value.phone) {
    alert('Veuillez remplir tous les champs obligatoires')
    return
  }
  
  isSubmitting.value = true
  try {
    await axios.post(`${API}/api/leads`, { ...form.value, propertyId: p.value.id })
    alert('Merci ! Nous vous contacterons très bientôt.')
    form.value = { name:'', email:'', phone:'', message:'' }
  } catch (error) {
    alert('Une erreur est survenue. Veuillez réessayer.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  p.value = (await axios.get(`${API}/api/properties/${route.params.slug}`)).data
  
  images.value = [
    p.value.mainImage || '/images/prop4.jpg',
    '/images/prop5.jpg',
    '/images/prop6.jpg'
  ]
})
</script>

<template>
  <div v-if="p" class="property-detail">
    <!-- Galerie d'images avec navigation -->
    <div class="gallery-section">
      <div class="main-image-wrapper">
        <img 
          :src="image[currentImageIndex]" 
          :alt="p.title" 
          class="main-image"
        />
        <button class="gallery-nav prev" @click="prevImage">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button class="gallery-nav next" @click="nextImage">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        
        <div class="gallery-indicators">
          <button 
            v-for="(image, index) in images" 
            :key="index"
            :class="['indicator', { active: currentImageIndex === index }]"
            @click="selectImage(index)"
          ></button>
        </div>
      </div>
      
      <div class="thumbnail-grid">
        <div 
          v-for="(image, index) in images" 
          :key="index"
          :class="['thumbnail', { active: currentImageIndex === index }]"
          @click="selectImage(index)"
        >
          <img :src="image" :alt="`Image ${index + 1}`" />
        </div>
      </div>
    </div>

    <!-- Informations du bien avec design amélioré -->
    <div class="property-info-section">
      <div class="info-container">
        <div class="info-main">
          <div class="property-header">
            <div>
              <h1 class="property-title">{{ p.title }}</h1>
              <div class="property-location">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {{ p.location }}
              </div>
            </div>
            
            <div class="property-meta">
              <span class="property-badge" :class="`badge-${p.status}`">
                {{ p.status === '-À vendre' ? 'À vendre' : p.status === 'À louer' ? 'À louer' : 'Vendu' }}
              </span>
              <div v-if="p.price" class="property-price">
                {{ new Intl.NumberFormat().format(p.price) }} FCFA
              </div>
            </div>
          </div>

          <div class="property-description">
            <h2 class="section-title">Description</h2>
            <p>{{ p.description }}</p>
          </div>

          <!-- Caractéristiques du bien -->
          <div class="property-features">
            <h2 class="section-title">Caractéristiques</h2>
            <div class="features-grid">
              <div class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
                <span>{{ p.surfaceHabitable }} m²</span>
              </div>
              <div class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>{{ p.type }}</span>
              </div>
              <div class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{{ p.yearOfConstruction }}</span>
              </div>
              <div class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>{{ p.capacity }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulaire de contact amélioré -->
        <div class="contact-sidebar">
          <div class="contact-card">
            <h3 class="contact-title">Intéressé par ce bien ?</h3>
            <p class="contact-subtitle">Remplissez le formulaire et nous vous contacterons rapidement</p>
            
            <form @submit.prevent="send" class="contact-form">
              <div class="form-group">
                <label for="name">Nom complet *</label>
                <input 
                  id="name"
                  v-model="form.name" 
                  type="text"
                  placeholder="Votre nom" 
                  required
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label for="email">Email *</label>
                <input 
                  id="email"
                  v-model="form.email" 
                  type="email"
                  placeholder="votre@email.com" 
                  required
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label for="phone">Téléphone *</label>
                <input 
                  id="phone"
                  v-model="form.phone" 
                  type="tel"
                  placeholder="+225 XX XX XX XX XX" 
                  required
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label for="message">Message</label>
                <textarea 
                  id="message"
                  v-model="form.message" 
                  placeholder="Votre message..." 
                  rows="4"
                  class="form-textarea"
                ></textarea>
              </div>
              
              <button type="submit" class="submit-btn" :disabled="isSubmitting">
                <span v-if="!isSubmitting">Être recontacté</span>
                <span v-else class="loading-spinner"></span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



