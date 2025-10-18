<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const property = ref(null)
const form = ref({ name: '', email: '', phone: '', message: '' })
const isSubmitting = ref(false)
const currentImageIndex = ref(0)

const images = computed(() => {
  if (!property.value) return []
  
  const allImages = []
  
  // Ajouter mainImage en premier si elle existe
  if (property.value.mainImage) {
    const mainImageUrl = api.getImageUrl(property.value.mainImage)
    if (mainImageUrl) {
      allImages.push(mainImageUrl)
    }
  }
  
  // Ajouter les images de la galerie (en évitant les doublons)
  if (Array.isArray(property.value.images)) {
    property.value.images.forEach(img => {
      const imageUrl = api.getImageUrl(img.url)
      // Vérifier si l'image n'est pas déjà dans le tableau
      if (imageUrl && !allImages.includes(imageUrl)) {
        allImages.push(imageUrl)
      }
    })
  }
  
  return allImages.length ? allImages : ['/placeholder.svg?height=600&width=800']
})

const statusLabel = computed(() => {
  if (!property.value?.status) return 'Bien'
  const map = {
    sale: 'À vendre',
    rent: 'À louer',
    sold: 'Vendu',
    rented: 'Loué'
  }
  return map[property.value.status.toLowerCase()] || property.value.status
})

const statusClass = computed(() => {
  if (!property.value?.status) return 'status-default'
  const map = {
    sale: 'status-sale',
    rent: 'status-rent',
    sold: 'status-sold',
    rented: 'status-rented'
  }
  return map[property.value.status.toLowerCase()] || 'status-default'
})

function nextImage() {
  currentImageIndex.value = (currentImageIndex.value + 1) % images.value.length
}

function prevImage() {
  currentImageIndex.value = (currentImageIndex.value - 1 + images.value.length) % images.value.length
}

function selectImage(index) {
  currentImageIndex.value = index
}

function formatFcfa(n) {
  if (n == null) return ''
  return new Intl.NumberFormat('fr-FR').format(Number(n)) + ' FCFA'
}

async function send() {
  if (!form.value.name || !form.value.email || !form.value.phone) {
    Swal.fire({
      icon: 'warning',
      title: 'Attention !',
      text: 'Veuillez remplir tous les champs obligatoires',
      confirmButtonColor: '#0d7c8c',
      confirmButtonText: 'OK'
    })
    return
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    Swal.fire({
      icon: 'error',
      title: 'Email invalide',
      text: 'Veuillez entrer une adresse email valide',
      confirmButtonColor: '#0d7c8c',
      confirmButtonText: 'OK'
    })
    return
  }
  
  isSubmitting.value = true
  
  try {
    await api.submitLead({ 
      ...form.value, 
      message: `Intéressé par le bien: ${property.value.title}\n\n${form.value.message}`,
      propertyId: property.value.id
    })
    
    await Swal.fire({
      icon: 'success',
      title: 'Message envoyé !',
      html: `
        <p>Merci <strong>${form.value.name}</strong> pour votre intérêt !</p>
        <p>Nous vous contacterons très bientôt à l'adresse <strong>${form.value.email}</strong>.</p>
      `,
      confirmButtonColor: '#0d7c8c',
      confirmButtonText: 'Parfait !',
      timer: 5000,
      timerProgressBar: true
    })
    
    form.value = { name: '', email: '', phone: '', message: '' }
    
  } catch (error) {
    console.error('Erreur:', error)
    
    Swal.fire({
      icon: 'error',
      title: 'Erreur d\'envoi',
      html: `
        <p>Une erreur est survenue lors de l'envoi de votre message.</p>
        <p class="text-sm text-gray-600">Veuillez réessayer ou nous contacter directement par téléphone.</p>
      `,
      confirmButtonColor: '#0d7c8c',
      confirmButtonText: 'Réessayer',
      footer: '<a href="/contact">Voir nos autres moyens de contact</a>'
    })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  try {
    const slug = route.params.slug
    console.log(' Chargement du bien avec slug:', slug)
    
    property.value = await api.getPropertyBySlug(slug)
    
    console.log(' Bien chargé:', property.value)
    
    currentImageIndex.value = 0
  } catch (error) {
    console.error(' Error loading property:', error)
    
    Swal.fire({
      icon: 'error',
      title: 'Erreur de chargement',
      text: 'Impossible de charger les détails de ce bien',
      confirmButtonColor: '#0d7c8c',
      confirmButtonText: 'Retour aux biens'
    }).then(() => {
      router.push('/biens')
    })
  }
})
</script>

<template>
  <div v-if="property" class="property-detail">
    <!-- Galerie d'images avec navigation -->
    <div class="gallery-section">
      <div class="main-image-wrapper">
        <img 
          :src="images[currentImageIndex]" 
          :alt="property.title" 
          class="main-image"
        />
        <button v-if="images.length > 1" class="gallery-nav prev" @click="prevImage">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button v-if="images.length > 1" class="gallery-nav next" @click="nextImage">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        
        <div v-if="images.length > 1" class="gallery-indicators">
          <button 
            v-for="(img, index) in images" 
            :key="index"
            :class="['indicator', { active: currentImageIndex === index }]"
            @click="selectImage(index)"
          ></button>
        </div>
      </div>
      
      <div v-if="images.length > 1" class="thumbnail-grid">
        <div 
          v-for="(img, index) in images" 
          :key="index"
          :class="['thumbnail', { active: currentImageIndex === index }]"
          @click="selectImage(index)"
        >
          <img :src="img" :alt="`Image ${index + 1}`" />
        </div>
      </div>
    </div>

    <!-- Informations du bien -->
    <div class="property-info-section">
      <div class="info-container">
        <div class="info-main">
          <div class="property-header">
            <div>
              <div class="breadcrumb">
                <RouterLink to="/">Accueil</RouterLink>
                <span class="separator">/</span>
                <RouterLink to="/biens">Offres</RouterLink>
                <span class="separator">/</span>
                <span class="current">{{ property.title }}</span>
              </div>
              
              <h1 class="property-title">{{ property.title }}</h1>
              <div v-if="property.location" class="property-location">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {{ property.location }}
              </div>
            </div>
            
            <div class="property-meta">
              <span :class="['property-badge', statusClass]">
                {{ statusLabel }}
              </span>
              <div v-if="property.price" class="property-price">
                À partir de {{ formatFcfa(property.price) }}
              </div>
            </div>
          </div>

          <div class="property-description">
            <h2 class="section-title">À propos de l'Offre</h2>
            <p>{{ property.description || 'Description de l\'offre à venir.' }}</p>
          </div>

          <!-- Caractéristiques du bien -->
          <div v-if="property.surfaceHabitable || property.type || property.yearOfConstruction || property.capacity" class="property-features">
            <h2 class="section-title">Caractéristiques</h2>
            <div class="features-grid">
              <div v-if="property.surfaceHabitable" class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
                <div>
                  <div class="feature-label">Surface habitable</div>
                  <div class="feature-value">{{ property.surfaceHabitable }} m²</div>
                </div>
              </div>
              
              <div v-if="property.type" class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <div>
                  <div class="feature-label">Type d'Offre</div>
                  <div class="feature-value">{{ property.type }}</div>
                </div>
              </div>
              
              <div v-if="property.yearOfConstruction" class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <div>
                  <div class="feature-label">Année de construction</div>
                  <div class="feature-value">{{ property.yearOfConstruction }}</div>
                </div>
              </div>
              
              <div v-if="property.capacity" class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <div>
                  <div class="feature-label">Capacité</div>
                  <div class="feature-value">{{ property.capacity }} personnes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulaire de contact -->
        <div class="contact-sidebar">
          <div class="contact-card">
            <h3 class="contact-title">Intéressé par cet Offre ?</h3>
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
                  :disabled="isSubmitting"
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
                  :disabled="isSubmitting"
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
                  :disabled="isSubmitting"
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
                  :disabled="isSubmitting"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                class="submit-btn" 
                :disabled="isSubmitting"
              >
                <span v-if="!isSubmitting">Envoyer ma demande</span>
                <span v-else>Envoi en cours...</span>
              </button>
            </form>
          </div>
        </div>
        <RouterLink to="/biens" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Retour aux Offres
          </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.property-detail {
  min-height: 100vh;
  background: #f8f9fa;
}

/* Galerie */
.gallery-section {
  background: #fff;
}

.main-image-wrapper {
  position: relative;
  width: 100%;
  height: 500px;
  overflow: hidden;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.gallery-nav:hover {
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.gallery-nav.prev {
  left: 20px;
}

.gallery-nav.next {
  right: 20px;
}

.gallery-indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  background: #fff;
  width: 30px;
  border-radius: 5px;
}

.thumbnail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  padding: 20px;
  background: #fff;
  border-top: 1px solid #e9ecef;
}

.thumbnail {
  position: relative;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.thumbnail:hover,
.thumbnail.active {
  border-color: #0d7c8c;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Info section */
.property-info-section {
  padding: 40px 20px;
}

.info-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 40px;
}

.info-main {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 20px;
}

.breadcrumb a {
  color: #0d7c8c;
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb a:hover {
  color: #0a5f6d;
}

.separator {
  color: #dee2e6;
}

.current {
  color: #495057;
}

.property-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid #e9ecef;
}

.property-title {
  font-size: 32px;
  font-weight: 700;
  color: #212529;
  margin-bottom: 10px;
}

.property-location {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c757d;
  font-size: 16px;
}

.property-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.property-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-sale {
  background: #e3f2fd;
  color: #1976d2;
}

.status-rent {
  background: #fff3e0;
  color: #f57c00;
}

.status-sold {
  background: #f3e5f5;
  color: #7b1fa2;
}

.status-rented {
  background: #e8f5e9;
  color: #388e3c;
}

.status-default {
  background: #f5f5f5;
  color: #757575;
}

.property-price {
  font-size: 24px;
  font-weight: 700;
  color: #0d7c8c;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #212529;
  margin-bottom: 20px;
}

.property-description {
  margin-bottom: 40px;
}

.property-description p {
  line-height: 1.8;
  color: #495057;
  font-size: 16px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.feature-item svg {
  color: #0d7c8c;
  flex-shrink: 0;
}

.feature-label {
  font-size: 13px;
  color: #6c757d;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.feature-value {
  font-size: 16px;
  font-weight: 600;
  color: #212529;
}

/* Sidebar contact */
.contact-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-card {
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 20px;
}

.contact-title {
  font-size: 20px;
  font-weight: 700;
  color: #212529;
  margin-bottom: 10px;
}

.contact-subtitle {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 25px;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.form-input,
.form-textarea {
  padding: 12px 16px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #0d7c8c;
  box-shadow: 0 0 0 3px rgba(13, 124, 140, 0.1);
}

.form-input:disabled,
.form-textarea:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.submit-btn {
  padding: 14px 24px;
  background: #0d7c8c;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #0a5f6d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 124, 140, 0.3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: #fff;
  color: #0d7c8c;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.back-link:hover {
  background: #0d7c8c;
  color: #fff;
  transform: translateX(-5px);
}

/* Responsive */
@media (max-width: 992px) {
  .info-container {
    grid-template-columns: 1fr;
  }
  
  .contact-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .main-image-wrapper {
    height: 300px;
  }
  
  .property-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .property-meta {
    align-items: flex-start;
    flex-direction: row;
  }
  
  .property-title {
    font-size: 24px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .info-main {
    padding: 20px;
  }
  
  .contact-card {
    padding: 20px;
  }
}
</style>



