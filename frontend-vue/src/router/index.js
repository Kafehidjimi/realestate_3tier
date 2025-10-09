import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Services from '../views/Services.vue'
import Properties from '../views/Properties.vue'
import projects from '../views/projects.vue'
import PropertyDetail from '../views/PropertyDetail.vue'
import Contact from '../views/Contact.vue'
const routes = [
  { path: '/', component: Home },
  { path: '/services', component: Services },
  { path: '/biens', component: Properties },
  { path: '/projets', component: projects },
  { path: '/biens/:slug', component: PropertyDetail, props: true },
  { path: '/contact', component: Contact },
]

export default createRouter({ history: createWebHistory(), routes })
