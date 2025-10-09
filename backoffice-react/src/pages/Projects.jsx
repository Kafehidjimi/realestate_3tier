"use client"

import { useEffect, useState } from "react"
import api from "../api"
import { useNavigate } from "react-router-dom"
import "../styles.css"

export default function Projects() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    title: "",
    category: "",
    location: "",
    image: "",
    annee: "",
  })
  const nav = useNavigate()
// Dans Projects.jsx
useEffect(() => {
  ;(async () => {
    try {
      // ✅ Utiliser la route publique
      setItems((await api.get("/api/projects")).data)
    } catch (err) {
      console.error("Erreur:", err)
      // Ne pas rediriger vers /login pour une page publique
    }
  })()
}, [])

  async function create() {
    try {
      const { data } = await api.post("/api/admin/projects", form)
      setItems([data, ...items])
      setForm({
        title: "",
        category: "",
        location: "",
        image: "",
        annee: "",
      })
    } catch (err) {
      alert("Erreur lors de la création du projet")
    }
  }

  async function remove(id) {
    if (!confirm("Supprimer ce projet ?")) return
    try {
      await api.delete(`/api/admin/projects/${id}`)
      setItems(items.filter((i) => i.id !== id))
    } catch (err) {
      alert("Erreur lors de la suppression")
    }
  }

  return (
    <div className="container">
      <h1>Projets Immobiliers</h1>
      
      <div className="card">
        <h2>Ajouter un projet</h2>
        <div className="grid">
          <div>
            <label>Titre du projet</label>
            <input
              placeholder="Ex: Résidence Les Palmiers"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label>Catégorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">Sélectionner une catégorie</option>
              <option value="Résidentiel">Résidentiel</option>
              <option value="Commercial">Commercial</option>
              <option value="Aménagement foncier">Aménagement foncier</option>
              <option value="Mixte">Mixte</option>
            </select>
          </div>
          <div>
            <label>Localisation</label>
            <input
              placeholder="Ex: Cocody, Abidjan"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label>URL de l'image</label>
            <input
              placeholder="Ex: /images/project1.jpg"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </div>
          <div>
            <label>Année</label>
            <input
              placeholder="Ex: 2025"
              value={form.annee}
              onChange={(e) => setForm({ ...form, annee: e.target.value })}
            />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={create}
            disabled={!form.title}
          >
            Ajouter le projet
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Liste des projets ({items.length})</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Localisation</th>
                <th>Année</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                    Aucun projet enregistré
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id}>
                    <td><strong>{i.title}</strong></td>
                    <td>{i.category || "—"}</td>
                    <td>{i.location || "—"}</td>
                    <td>{i.annee || "—"}</td>
                    <td>
                      {i.image ? (
                        <img 
                          src={i.image} 
                          alt={i.title}
                          style={{ 
                            width: "60px", 
                            height: "40px", 
                            objectFit: "cover",
                            borderRadius: "4px"
                          }}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn" 
                        style={{ background: "#ef4444" }} 
                        onClick={() => remove(i.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}