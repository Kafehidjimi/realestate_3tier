<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const project = ref(null)
const form = ref({ name: '', email: '', phone: '', message: '' })
const isSubmitting = ref(false)
const currentImageIndex = ref(0)

const images = computed(() => {
  if (!project.value) return []
  
  const allImages = []
  
  // Ajouter coverImage en premier si elle existe
  if (project.value.coverImage) {
    const coverImageUrl = api.getImageUrl(project.value.coverImage)
    if (coverImageUrl) {
      allImages.push(coverImageUrl)
    }
  }
  
  // Ajouter les images des medias (en évitant les doublons)
  if (Array.isArray(project.value.medias)) {
    project.value.medias
      .filter(m => m.kind === 'image')
      .forEach(m => {
        const imageUrl = api.getImageUrl(m.url)
        // Vérifier si l'image n'est pas déjà dans le tableau
        if (imageUrl && !allImages.includes(imageUrl)) {
          allImages.push(imageUrl)
        }
      })
  }
  
  return allImages.length ? allImages : ['/placeholder.svg?height=600&width=800']
})

const statusLabel = computed(() => {
  if (!project.value?.status) return 'Projet'
  const map = {
    planned: 'Planifié',
    ongoing: 'En cours',
    delivered: 'Livré'
  }
  return map[project.value.status.toLowerCase()] || project.value.status
})

const statusClass = computed(() => {
  if (!project.value?.status) return 'status-default'
  const map = {
    planned: 'status-planned',
    ongoing: 'status-ongoing',
    delivered: 'status-delivered'
  }
  return map[project.value.status.toLowerCase()] || 'status-default'
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
      message: `Intéressé par le projet: ${project.value.title}\n\n${form.value.message}`
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
    console.log(' Chargement du projet avec slug:', slug)
    
    project.value = await api.getProjectBySlug(slug)
    
    console.log(' Projet chargé:', project.value)
    
    currentImageIndex.value = 0
  } catch (error) {
    console.error(' Error loading project:', error)
    
    Swal.fire({
      icon: 'error',
      title: 'Erreur de chargement',
      text: 'Impossible de charger les détails de ce projet',
      confirmButtonColor: '#0d7c8c',
      confirmButtonText: 'Retour aux projets'
    }).then(() => {
      router.push('/projets')
    })
  }
})
</script>

<template>
  <div v-if="project" class="project-detail">
    <!-- Galerie d'images avec navigation -->
    <div class="gallery-section">
      <div class="main-image-wrapper">
        <img 
          :src="images[currentImageIndex]" 
          :alt="project.title" 
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

    <!-- Informations du projet -->
    <div class="project-info-section">
      <div class="info-container">
        <div class="info-main">
          <div class="project-header">
            <div>
              <div class="breadcrumb">
                <RouterLink to="/">Accueil</RouterLink>
                <span class="separator">/</span>
                <RouterLink to="/projets">Projets</RouterLink>
                <span class="separator">/</span>
                <span class="current">{{ project.title }}</span>
              </div>
              
              <h1 class="project-title">{{ project.title }}</h1>
              <div v-if="project.location" class="project-location">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {{ project.location }}
              </div>
            </div>
            
            <div class="project-meta">
              <span :class="['project-badge', statusClass]">
                {{ statusLabel }}
              </span>
              <span v-if="project.startedAt" class="project-year">
                {{ new Date(project.startedAt).getFullYear() }}
              </span>
            </div>
          </div>

          <div class="project-description">
            <h2 class="section-title">À propos du projet</h2>
            <p>{{ project.description || 'Description du projet à venir.' }}</p>
          </div>

          <!-- Caractéristiques du projet -->
          <div v-if="project.surface || project.units || project.startedAt || project.deliveredAt || project.category" class="project-features">
            <h2 class="section-title">Caractéristiques</h2>
            <div class="features-grid">
              <div v-if="project.surface" class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
                <div>
                  <div class="feature-label">Surface totale</div>
                  <div class="feature-value">{{ project.surface }} m²</div>
                </div>
              </div>
              
              <div v-if="project.units" class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                <div>
                  <div class="feature-label">Nombre d'unités</div>
                  <div class="feature-value">{{ project.units }}</div>
                </div>
              </div>
              
              <div v-if="project.startedAt" class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <div>
                  <div class="feature-label">Date de début</div>
                  <div class="feature-value">
                    {{ new Date(project.startedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }}
                  </div>
                </div>
              </div>
              
              <div v-if="project.deliveredAt" class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <div>
                  <div class="feature-label">Date de livraison</div>
                  <div class="feature-value">
                    {{ new Date(project.deliveredAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }}
                  </div>
                </div>
              </div>
              
              <div v-if="project.category" class="feature-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 7h-9"></path>
                  <path d="M14 17H5"></path>
                  <circle cx="17" cy="17" r="3"></circle>
                  <circle cx="7" cy="7" r="3"></circle>
                </svg>
                <div>
                  <div class="feature-label">Catégorie</div>
                  <div class="feature-value">{{ project.category }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulaire de contact -->
        <div class="contact-sidebar">
          <div class="contact-card">
            <h3 class="contact-title">Intéressé par ce projet ?</h3>
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
        <RouterLink to="/projets" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Retour aux projets
          </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-detail {
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
.project-info-section {
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

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid #e9ecef;
}

.project-title {
  font-size: 32px;
  font-weight: 700;
  color: #212529;
  margin-bottom: 10px;
}

.project-location {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c757d;
  font-size: 16px;
}

.project-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.project-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-planned {
  background: #e3f2fd;
  color: #1976d2;
}

.status-ongoing {
  background: #fff3e0;
  color: #f57c00;
}

.status-delivered {
  background: #e8f5e9;
  color: #388e3c;
}

.status-default {
  background: #f5f5f5;
  color: #757575;
}

.project-year {
  font-size: 18px;
  font-weight: 600;
  color: #0d7c8c;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #212529;
  margin-bottom: 20px;
}

.project-description {
  margin-bottom: 40px;
}

.project-description p {
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
  
  .project-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .project-meta {
    align-items: flex-start;
    flex-direction: row;
  }
  
  .project-title {
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