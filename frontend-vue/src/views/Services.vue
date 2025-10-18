<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const services = ref([])

onMounted(async () => { 
  try {
    services.value = await api.getServices()
  } catch (error) {
    console.error('Error loading services:', error)
  }
  
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1 })
    
    document.querySelectorAll('.service-card').forEach(el => observer.observe(el))
  }, 100)
})
</script>

<template>
  <div class="services-page"> 
    <div class="services-hero">
      <div class="hero-content">
        <h1 class="hero-title">Nos Services</h1>
        <p class="hero-subtitle">Des solutions immobilières complètes pour tous vos projets</p>
      </div>
      <div class="hero-decoration"></div>
    </div>

    <div class="services-container">
      <div class="services-grid">
        <div class="service-card" v-for="(s, index) in services" :key="s.id" :style="{ animationDelay: `${index * 0.1}s` }">
          <div class="service-icon-wrapper">
            <!-- Image du service -->
            <div class="service-icon">
              <img 
                v-if="s.icon" 
                :src="`http://localhost:3000${s.icon}`" 
                :alt="s.title || s.name"
                class="service-image"
                @error="(e) => e.target.style.display = 'none'"
              />
              <span v-else class="service-placeholder">🏗️</span>
            </div>
            <div class="icon-bg"></div>
          </div>
          <h3 class="service-title">{{ s.title || s.name }}</h3>
          <p class="service-description">{{ s.description }}</p>
          <div class="service-hover-effect"></div>
        </div>
      </div>
    </div>

    <div class="cta-section">
      <div class="cta-content">
        <h2>Besoin d'un service personnalisé ?</h2>
        <p>Notre équipe est à votre disposition pour répondre à tous vos besoins immobiliers</p>
        <RouterLink to="/contact" class="cta-button">Nous contacter</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* —— Zone image (sticker) —— */
.service-icon-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
}

/* pastille derrière l'icône (halo doux) */
.icon-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border-radius: 30px;
  background: radial-gradient(
    60% 60% at 50% 50%,
    rgba(13, 124, 140, 0.12) 0%,
    rgba(10, 95, 109, 0.08) 60%,
    transparent 100%
  );
  z-index: 1;
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0.9;
}

.service-card:hover .icon-bg {
  transform: translate(-50%, -50%) scale(1.08);
  opacity: 1;
}

/* conteneur du sticker : carré, fond clair, arrondi, ombre légère */
.service-icon {
  width: 80px;            /* même taille que ton test visuel */
  height: 80px;
  padding: 10px;          /* respiration interne pour le sticker */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: #ffffff;    /* fond clair pour bien faire ressortir le PNG */
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 10px rgba(13, 124, 140, 0.08);
  position: relative;
  z-index: 2;             /* au-dessus du halo */
  overflow: hidden;
}

/* image sticker : toujours contenue, jamais étirée */
.service-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: auto;      /* rendu net */
  -webkit-user-drag: none;    /* évite le drag involontaire */
  transition: transform 0.25s ease;
}

/* léger zoom au hover pour le “pop” */
.service-card:hover .service-image {
  transform: scale(1.06);
}

/* placeholder (fallback) si pas d’image */
.service-placeholder {
  font-size: 2rem;
  opacity: 0.7;
}

/* Optionnel : petit effet sur la carte au survol */
.service-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}
</style>
