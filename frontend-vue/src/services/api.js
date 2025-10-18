// frontend-vue/src/services/api.js
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const api = {
  // Helper pour construire les URLs d'images
  getImageUrl(path) {
    if (!path) return '/placeholder.jpg'
    if (path.startsWith('http')) return path
    // Si le path commence par /uploads, on ajoute l'URL du backend
    if (path.startsWith('/uploads')) {
      return `${API_URL}${path}`
    }
    // Sinon on ajoute /uploads/ si ce n'est pas déjà présent
    return `${API_URL}/uploads/${path.replace(/^\//, '')}`
  },

  // Services
  async getServices() {
    const res = await fetch(`${API_URL}/api/services`)
    return res.json()
  },

  // Properties
  async getProperties(params = {}) {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${API_URL}/api/properties${query ? '?' + query : ''}`)
    return res.json()
  },

  async getPropertyBySlug(slug) {
    const res = await fetch(`${API_URL}/api/properties/${slug}`)
    return res.json()
  },

  // Projects
  async getProjects(params = {}) {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${API_URL}/api/projects${query ? '?' + query : ''}`)
    return res.json()
  },

  // 🆕 MÉTHODE AJOUTÉE : Récupérer un projet par son slug
  async getProjectBySlug(slug) {
    const res = await fetch(`${API_URL}/api/projects/${slug}`)
    if (!res.ok) {
      throw new Error(`Erreur ${res.status}: Projet non trouvé`)
    }
    return res.json()
  },

  // Page Content
  async getPageContent(page) {
    const res = await fetch(`${API_URL}/api/page/${page}`)
    return res.json()
  },

  // Contact Lead
  async submitLead(data) {
    const res = await fetch(`${API_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },

  // Company Info
  async getCompanyInfo(category = null) {
    const url = category 
      ? `${API_URL}/api/company-info?category=${category}`
      : `${API_URL}/api/company-info`
    const res = await fetch(url)
    return res.json()
  },

  async getCompanyInfoByKey(key) {
    const res = await fetch(`${API_URL}/api/company-info/${key}`)
    return res.json()
  },

  // Admin - Company Info
  async updateCompanyInfo(key, data, token) {
    const res = await fetch(`${API_URL}/api/admin/company-info/${key}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    return res.json()
  },

  async createCompanyInfo(data, token) {
    const res = await fetch(`${API_URL}/api/admin/company-info`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    return res.json()
  },

  async deleteCompanyInfo(key, token) {
    const res = await fetch(`${API_URL}/api/admin/company-info/${key}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    })
    return res.json()
  }
}

export default api