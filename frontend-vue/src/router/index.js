import { createRouter, createWebHistory } from "vue-router"
import Home from "../views/Home.vue"
import Services from "../views/Services.vue"
import Projects from "../views/projects.vue"
import ProjectDetail from "../views/ProjectDetail.vue"
import Properties from "../views/Properties.vue"
import PropertyDetail from "../views/PropertyDetail.vue"
import Contact from "../views/Contact.vue"

const routes = [
  { path: "/", component: Home },
  { path: "/services", component: Services },
  { path: "/projets", component: Projects },
  { path: "/projets/:slug", component: ProjectDetail, name: 'projectDetail', props: true },
  { path: "/biens", component: Properties },
  { path: "/biens/:slug", component: PropertyDetail, props: true },
  { path: "/contact", component: Contact }
]

export default createRouter({ 
  history: createWebHistory(), 
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})