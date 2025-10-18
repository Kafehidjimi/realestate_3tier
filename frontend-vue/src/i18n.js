import { createI18n } from 'vue-i18n'
const messages = {
  fr: { menu: { home:'Accueil', services:'Services', projects: 'Projets', properties:'Biens', contact:'Contact' }, hero:'Aménagement foncier, construction & immobilier en Côte d\'Ivoire' },
  en: { menu: { home:'Home', services:'Services', projects: 'Projects', properties:'Properties', contact:'Contact' }, hero:'Land development, construction & real estate in Côte d\'Ivoire' }
}
export default createI18n({ legacy:false, locale:'fr', fallbackLocale:'fr', messages })
