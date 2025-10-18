"use client"

import { useEffect, useState } from "react"
import api from "../api"
import { useNavigate } from "react-router-dom"

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 50)
}

export default function Properties() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    title: "",
    slug: "",
    location: "",
    price: "",
    status: "sale",
    mainImage: "",
    isCopropertyOpen: false,
  })
  const nav = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        setItems((await api.get("/api/properties")).data)
      } catch {
        nav("/login")
      }
    })()
  }, [])

  async function create() {
    const payload = { ...form, price: form.price ? Number(form.price) : null, slug: form.slug || slugify(form.title) }
    const { data } = await api.post("/api/admin/properties", payload)
    setItems([data, ...items])
    setForm({ title: "", slug: "", location: "", price: "", status: "sale", mainImage: "", isCopropertyOpen: false })
  }

  async function remove(id) {
    await api.delete(`/api/admin/properties/${id}`)
    setItems(items.filter((i) => i.id !== id))
  }

  return (
    <div className="container">
      <h1 className="page-title">Offres immobiliers</h1>

      {/* Formulaire d’ajout */}
      <div className="card">
        <h2 className="section-title">Ajouter une offres</h2>
        <div className="grid-form">
          <div>
            <label>Titre</label>
            <input
              placeholder="Titre de l'offre"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })}
            />
          </div>

          <div>
            <label>Localisation</label>
            <input
              placeholder="Ville, quartier"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div>
            <label>Prix (FCFA)</label>
            <input
              placeholder="Prix"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>

          <div>
            <label>Statut</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="sale">À vendre</option>
              <option value="rent">À louer</option>
              <option value="sold">Vendu</option>
            </select>
          </div>

          <div>
            <label>Image</label>
            <label className="btn btn-secondary upload-btn">
              {form.mainImage ? "✓ Image ajoutée" : "Choisir une image"}
              <input
                type="file"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const fd = new FormData()
                  fd.append("file", f)
                  const { data } = await api.post("/api/admin/upload", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                  })
                  setForm({ ...form, mainImage: data.url })
                }}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              checked={form.isCopropertyOpen}
              onChange={(e) => setForm({ ...form, isCopropertyOpen: e.target.checked })}
            />
            <span>Co-propriété ouverte</span>
          </div>

          <button className="btn btn-primary" onClick={create}>
            Ajouter l'offre
          </button>
        </div>
      </div>

      {/* Liste des biens */}
      <div className="card">
        <h2 className="section-title">Liste des offres</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Localisation</th>
                <th>Prix</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-message">
                    Aucune offres enregistré
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.title}</td>
                    <td>{i.location}</td>
                    <td className="price">{i.price ? Number(i.price).toLocaleString() + " FCFA" : "—"}</td>
                    <td>
                      <span className={`status ${i.status}`}>{i.status === "À vendre" ? "À vendre" : i.status === "À louer" ? "À louer" : "Vendu"}</span>
                    </td>
                    <td>
                      <button onClick={() => remove(i.id)} className="btn btn-delete">
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
