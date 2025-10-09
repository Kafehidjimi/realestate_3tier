<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const services = ref([])
const isVisible = ref(false)

onMounted(async () => { 
  services.value = (await axios.get(`${API}/api/services`)).data
  
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
            <div class="service-icon">{{ s.icon || '🏗️' }}</div>
            <div class="icon-bg"></div>
          </div>
          <h3 class="service-title">{{ s.name }}</h3>
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



