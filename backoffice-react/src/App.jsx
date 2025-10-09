import { Routes, Route, Link } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Clients from "./pages/Clients"
import Deals from "./pages/Deals"
import Invoices from "./pages/Invoices"
import Payments from "./pages/Payments"
import Expenses from "./pages/Expenses"
import Login from "./pages/Login"
import Projects from "./pages/Projects"
import Services from "./pages/Services"
import Properties from "./pages/Properties"
import "./styles.css"

export default function App() {
  return (
    <div className="app-wrapper">
      <nav className="main-nav">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-text">Interface d’administration</span>
            <span className="logo-subtitle">Sankofa Afrik</span>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">
              Tableau de bord
            </Link>
            <Link to="/services" className="nav-link">
              Services
            </Link>
            <Link to="/properties" className="nav-link">
              Biens
            </Link>
            <Link to="/projects" className="nav-link">
              Projets
            </Link>
            <Link to="/clients" className="nav-link">
              Clients
            </Link>
            <Link to="/deals" className="nav-link">
              Affaires
            </Link>
            <Link to="/invoices" className="nav-link">
              Factures
            </Link>
            <Link to="/payments" className="nav-link">
              Paiements
            </Link>
            <Link to="/expenses" className="nav-link">
              Dépenses
            </Link>
            <a className="btn-site" href="http://localhost:5173">
              Aller au site
            </a>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/services" element={<Services />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/expenses" element={<Expenses />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
