"use client"

import { useEffect, useState } from "react"
import api from "../api"
import { useNavigate } from "react-router-dom"
import "../styles.css"

export default function Services() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name: "", description: "", icon: "🏗️" })
  const nav = useNavigate()

  useEffect(() => {
    ;(async () => {
      try {
        setItems((await api.get("/api/services")).data)
      } catch {
        nav("/login")
      }
    })()
  }, [])

  async function create() {
    const { data } = await api.post("/api/admin/services", form)
    setItems([data, ...items])
    setForm({ name: "", description: "", icon: "🏗️" })
  }

  async function remove(id) {
    await api.delete(`/api/admin/services/${id}`)
    setItems(items.filter((i) => i.id !== id))
  }

  return (
    <div className="container">
      <h1>Services</h1>

      <div className="card">
        <h2>Ajouter un service</h2>
        <div className="grid">
          <div>
            <label>Nom du service</label>
            <input
              placeholder="Ex: Construction"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label>Description</label>
            <input
              placeholder="Description du service"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" onClick={create}>
            Ajouter
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Liste des services</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center", padding: "2rem" }}>
                    Aucun service enregistré
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td>{i.description}</td>
                    <td>
                      <button className="btn" style={{ background: "#ef4444" }} onClick={() => remove(i.id)}>
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
