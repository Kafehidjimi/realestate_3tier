<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const form = ref({ 
  name: '', 
  email: '', 
  phone: '', 
  message: '' 
})

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
    await axios.post(`${API}/api/leads`, form.value)
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

onMounted(() => {
  const map = L.map('map').setView([5.345317, -4.024429], 13)
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)
  
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div style="background:#0d7c8c;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.3)"><div style="width:10px;height:10px;background:#ff0000;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg)"></div></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  })
  
  L.marker([5.345317, -4.024429], { icon: customIcon })
    .addTo(map)
    .bindPopup('<strong>Sankofa Afrik</strong><br>Abidjan, Côte d\'Ivoire')
  
  // Scroll animations
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
          <p>Abidjan, 2 Plateau Valon immeuble Vanda RDC appartement 01<br>Côte d'Ivoire</p>
        </div>

        <div class="info-card">
          <div class="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h3>Téléphone</h3>
          <p>+225 05 85 83 33 45<br>+225 05 85 83 33 45</p>
        </div>

        <div class="info-card">
          <div class="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3>Email</h3>
          <p>contact@sankofaafrik.com<br>info@sankofaafrik.com</p>
        </div>

        <div class="info-card">
          <div class="info-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>Horaires</h3>
          <p>Lun - Ven: 8h - 17h<br>Sam: 9h - 13h</p>
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

  <div id="map" class="map-container">
    <iframe
      src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d899.5818814154741!2d-3.9924955405160776!3d5.362001626150351!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sfr!2sci!4v1759998719201!5m2!1sfr!2sci"
      width="100%"
      height="450"
      style="border:0; border-radius: 12px;"
      allowfullscreen=""
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade">
    </iframe>
  </div>
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
      href="https://wa.me/2250749781485" 
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


