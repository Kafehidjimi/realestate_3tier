<template>
  <div class="app-wrapper">
    <nav class="main-nav">
      <div class="nav-container">
        <RouterLink to="/" class="logo">
          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-sTS9PORiyTNWvChLYWKvUMchFAJSMa.png" alt="Sankofa Afrik" class="logo-image" />
          <div class="logo-text-wrapper">
            <span class="logo-subtitle">Immobilier, Aménagement Foncier, Import-Export</span>
          </div>
        </RouterLink>
        <div class="nav-links">
          <RouterLink to="/" class="nav-link">Accueil</RouterLink>
          <RouterLink to="/services" class="nav-link">Services</RouterLink>
          <RouterLink to="/biens" class="nav-link">Biens</RouterLink>
          <RouterLink to="/projets" class="nav-link">Projets</RouterLink>
          <RouterLink to="/contact" class="nav-link">Contact</RouterLink>
          <a class="btn-backoffice" href="http://localhost:5174">Interface d’administration</a>
        </div>
      </div>
    </nav>
    
    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    
    <footer class="main-footer">
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-col"> 
            <div class="footer-logo">
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-sTS9PORiyTNWvChLYWKvUMchFAJSMa.png" alt="Sankofa Afrik" class="footer-logo-image" />
            </div>
            <p class="footer-text">Votre partenaire immobilier de confiance à Abidjan</p>
          </div>
          <div class="footer-col">
            <h4 class="footer-subtitle">Navigation</h4>
            <RouterLink to="/" class="footer-link">Accueil</RouterLink>
            <RouterLink to="/services" class="footer-link">Services</RouterLink>
            <RouterLink to="/biens" class="footer-link">Biens</RouterLink>
            <RouterLink to="/projets" class="footer-link">Projets</RouterLink>
            <RouterLink to="/contact" class="footer-link">Contact</RouterLink>
          </div>
          <div class="footer-col">
            <h4 class="footer-subtitle">Contact</h4>
            <p class="footer-text">Abidjan, Côte d'Ivoire</p>
            <p class="footer-text">+225 05 85 83 33 45</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© {{ new Date().getFullYear() }} Sankofa Afrik • Tous droits réservés</p>
        </div>
      </div>
    </footer>
  </div>
</template>
