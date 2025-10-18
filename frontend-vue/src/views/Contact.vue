<script setup>
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api from '@/services/api'

const form = ref({ 
  name: '', 
  email: '', 
  phone: '', 
  message: '' 
})

const companyInfo = ref(null)
const errors = ref({})
const isSubmitting = ref(false)
const showSuccess = ref(false)

function validateForm() {
  errors.value = {}
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Le nom est requis'
  }
  
  if (!form.value.email.trim()) {
    errors.value.email = 'L\'email est requis'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Email invalide'
  }
  
  if (!form.value.phone.trim()) {
    errors.value.phone = 'Le téléphone est requis'
  }
  
  if (!form.value.message.trim()) {
    errors.value.message = 'Le message est requis'
  }
  
  return Object.keys(errors.value).length === 0
}

async function send() {
  if (!validateForm()) return
  
  isSubmitting.value = true
  
  try {
    await api.submitLead(form.value)
    showSuccess.value = true
    form.value = { name: '', email: '', phone: '', message: '' }
    
    setTimeout(() => {
      showSuccess.value = false
    }, 5000)
  } catch (error) {
    alert('Une erreur est survenue. Veuillez réessayer.')
  } finally {
    isSubmitting.value = false
  }
}

// Fonction pour valider et parser les coordonnées
function parseCoordinate(value, defaultValue) {
  if (!value) return defaultValue
  
  // Nettoyer la valeur (enlever espaces, virgules au lieu de points, etc.)
  const cleaned = String(value).trim().replace(',', '.')
  const parsed = parseFloat(cleaned)
  
  // Vérifier que c'est un nombre valide
  if (isNaN(parsed)) {
    console.warn(` Coordonnée invalide: "${value}" - Utilisation de la valeur par défaut: ${defaultValue}`)
    return defaultValue
  }
  
  return parsed
}

onMounted(async () => {
  try {
    // Récupérer les informations de l'entreprise
    companyInfo.value = await api.getCompanyInfo()
    console.log(' Company Info reçue:', companyInfo.value)
  } catch (e) {
    console.warn(' Impossible de charger les infos de l\'entreprise', e)
  }

  // Coordonnées par défaut (Abidjan - Cocody)
  const DEFAULT_LAT = 5.3622428
  const DEFAULT_LNG = -3.9915301
  const DEFAULT_ZOOM = 13

  // Parser les coordonnées avec validation
  const lat = parseCoordinate(
    companyInfo.value?.location?.latitude,
    DEFAULT_LAT
  )
  
  const lng = parseCoordinate(
    companyInfo.value?.location?.longitude,
    DEFAULT_LNG
  )
  
  const zoom = parseInt(companyInfo.value?.location?.map_zoom || DEFAULT_ZOOM)

  console.log(` Initialisation carte: lat=${lat}, lng=${lng}, zoom=${zoom}`)

  // Vérification finale avant d'initialiser la carte
  if (isNaN(lat) || isNaN(lng)) {
    console.error(' Coordonnées invalides après parsing, utilisation des valeurs par défaut')
    lat = DEFAULT_LAT
    lng = DEFAULT_LNG
  }

  // Initialiser la carte Leaflet
  try {
    const map = L.map('map').setView([lat, lng], zoom)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // Icône personnalisée
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background:#0d7c8c;width:30px;height:30px;border-radius:50%;position:relative;"><div style="position:absolute;left:50%;top:50%;width:14px;height:14px;background:#fff;border-radius:50%;transform:translate(-50%,-50%)"></div><div style="position:absolute;left:50%;top:100%;width:14px;height:14px;background:#0d7c8c;border-radius:2px;transform:translate(-50%,-50%) rotate(45deg)"></div></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    })
    
    const companyName = companyInfo.value?.contact?.company_name || 'Sankofa Afrik'
    const address = companyInfo.value?.contact?.address || 'Abidjan, Côte d\'Ivoire'
    
    L.marker([lat, lng], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<strong>${companyName}</strong><br>${address}`)

    console.log(' Carte initialisée avec succès')
  } catch (error) {
    console.error(' Erreur lors de l\'initialisation de la carte:', error)
  }

  // Animation des éléments au scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in')
      }
    })
  }, { threshold: 0.1 })
  
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el))
})
</script>

<template>
  <div class="contact-page">
    <section class="contact-hero">
      <div class="hero-content">
        <h1 class="hero-title">Contactez-nous</h1>
        <p class="hero-subtitle">
          Notre équipe est à votre écoute pour répondre à toutes vos questions
        </p>
      </div>
      <div class="hero-gradient"></div>
    </section>

    <div class="contact-container">
      <section class="contact-info fade-in">
        <div class="info-card">
          <div class="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3>Adresse</h3>
          <p>{{ companyInfo?.contact?.address || "Abidjan, Cocody Riviera – Côte d'Ivoire" }}</p>
        </div>

        <div class="info-card">
          <div class="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h3>Téléphone</h3>
          <p>{{ companyInfo?.contact?.phone_primary || "+225 01 02 03 04 05" }}</p>
          <p v-if="companyInfo?.contact?.phone_secondary" style="font-size: 0.9em; opacity: 0.8;">
            {{ companyInfo.contact.phone_secondary }}
          </p>
        </div>

        <div class="info-card">
          <div class="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3>Email</h3>
          <p>{{ companyInfo?.contact?.email || "contact@sankofaafrik.com" }}</p>
        </div>

        <div class="info-card">
          <div class="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>Horaires</h3>
          <p v-html="companyInfo?.contact?.hours || 'Lun - Ven: 8h - 18h<br>Sam: 9h - 13h'"></p>
        </div>
      </section>

      <section class="contact-content">
        <div class="form-section fade-in">
          <h2 class="section-title">Envoyez-nous un message</h2>
          <p class="section-subtitle">
            Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais
          </p>

          <div v-if="showSuccess" class="success-message">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Merci ! Votre message a été envoyé avec succès.</span>
          </div>

          <form @submit.prevent="send" class="contact-form">
            <div class="form-row">
              <div class="form-group">
                <label for="name">Nom complet *</label>
                <input 
                  id="name"
                  v-model="form.name" 
                  type="text"
                  placeholder="Votre nom"
                  :class="{ 'error': errors.name }"
                />
                <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
              </div>

              <div class="form-group">
                <label for="phone">Téléphone *</label>
                <input 
                  id="phone"
                  v-model="form.phone" 
                  type="tel"
                  placeholder="+225 XX XX XX XX XX"
                  :class="{ 'error': errors.phone }"
                />
                <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input 
                id="email"
                v-model="form.email" 
                type="email"
                placeholder="votre@email.com"
                :class="{ 'error': errors.email }"
              />
              <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
            </div>

            <div class="form-group">
              <label for="message">Message *</label>
              <textarea 
                id="message"
                v-model="form.message" 
                rows="6"
                placeholder="Décrivez votre projet ou posez-nous vos questions..."
                :class="{ 'error': errors.message }"
              ></textarea>
              <span v-if="errors.message" class="error-message">{{ errors.message }}</span>
            </div>

            <button 
              type="submit" 
              class="submit-btn"
              :disabled="isSubmitting"
            >
              <span v-if="!isSubmitting">Envoyer le message</span>
              <span v-else class="loading">
                <span class="spinner"></span>
                Envoi en cours...
              </span>
            </button>
          </form>
        </div>

        <div class="map-section fade-in">
          <h2 class="section-title">Notre localisation</h2>
          <p class="section-subtitle">
            Visitez notre agence à Abidjan pour discuter de vos projets immobiliers
          </p>
          <div id="map" class="map-container"></div>
        </div>
      </section>

      <section class="faq-section fade-in">
        <h2 class="section-title">Questions fréquentes</h2>
        <div class="faq-grid">
          <div class="faq-card">
            <h3>Quels sont vos délais de réponse ?</h3>
            <p>Nous nous engageons à répondre à toutes les demandes dans un délai de 24 heures ouvrées.</p>
          </div>
          <div class="faq-card">
            <h3>Proposez-vous des visites virtuelles ?</h3>
            <p>Oui, nous offrons des visites virtuelles 360° pour tous nos biens immobiliers.</p>
          </div>
          <div class="faq-card">
            <h3>Accompagnez-vous dans le financement ?</h3>
            <p>Nous travaillons avec plusieurs partenaires bancaires pour faciliter vos démarches de financement.</p>
          </div>
          <div class="faq-card">
            <h3>Intervenez-vous dans toute la Côte d'Ivoire ?</h3>
            <p>Nous sommes principalement basés à Abidjan mais intervenons dans toute la Côte d'Ivoire.</p>
          </div>
        </div>
      </section>
    </div>

    <a 
      :href="`https://wa.me/${companyInfo?.contact?.whatsapp || '2250102030405'}`"
      target="_blank" 
      class="whatsapp-btn"
      aria-label="Contactez-nous sur WhatsApp"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    </a>
  </div>
</template>