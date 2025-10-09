"use client"

import { useEffect, useState } from "react"
import api from "../api"
import { useNavigate } from "react-router-dom"

export default function Deals() {
  const [items, setItems] = useState([])
  const [clients, setClients] = useState([])
  const [properties, setProperties] = useState([])
  const [form, setForm] = useState({
    clientId: "",
    propertyId: "",
    type: "sale",
    status: "draft",
    basePrice: "",
    discount: "",
    taxRate: "18",
    commissionRate: "",
  })
  const nav = useNavigate()
  useEffect(() => {
    ;(async () => {
      try {
        setItems((await api.get("/api/admin/deals")).data)
        setClients((await api.get("/api/admin/clients")).data)
        setProperties((await api.get("/api/properties")).data)
      } catch {
        nav("/login")
      }
    })()
  }, [])
  async function create() {
    const payload = {
      ...form,
      clientId: Number(form.clientId),
      propertyId: form.propertyId ? Number(form.propertyId) : null,
      basePrice: form.basePrice ? Number(form.basePrice) : 0,
      discount: form.discount ? Number(form.discount) : 0,
      taxRate: form.taxRate ? Number(form.taxRate) : 0,
      commissionRate: form.commissionRate ? Number(form.commissionRate) : 0,
    }
    const { data } = await api.post("/api/admin/deals", payload)
    setItems([data, ...items])
  }
  return (
    <div className="container">
      <h1 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "2rem", color: "var(--text-dark)" }}>Affaires</h1>
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem", color: "var(--text-dark)" }}>
          Créer une affaire
        </h2>
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", alignItems: "end" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
                color: "var(--text-dark)",
              }}
            >
              Client
            </label>
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
                color: "var(--text-dark)",
              }}
            >
              Bien (optionnel)
            </label>
            <select
              value={form.propertyId}
              onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">Aucun bien</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
                color: "var(--text-dark)",
              }}
            >
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="sale">Vente</option>
              <option value="purchase">Achat</option>
              <option value="rent">Location</option>
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
                color: "var(--text-dark)",
              }}
            >
              Prix de base (FCFA)
            </label>
            <input
              placeholder="Prix"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              style={{ width: "100%" }}
            />
          </div>
          <button className="btn btn-primary" onClick={create}>
            Créer l'affaire
          </button>
        </div>
      </div>
      <div className="card">
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem", color: "var(--text-dark)" }}>
          Liste des affaires
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Bien</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Prix</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "var(--text-light)", padding: "2rem" }}>
                    Aucune affaire enregistrée
                  </td>
                </tr>
              ) : (
                items.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: "600" }}>#{d.id}</td>
                    <td>{d.client?.name}</td>
                    <td>{d.property?.title || "—"}</td>
                    <td>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          background: d.type === "sale" ? "#dcfce7" : d.type === "purchase" ? "#dbeafe" : "#fef3c7",
                          color: d.type === "sale" ? "#166534" : d.type === "purchase" ? "#1e40af" : "#92400e",
                        }}
                      >
                        {d.type === "sale" ? "Vente" : d.type === "purchase" ? "Achat" : "Location"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          background: d.status === "closed" ? "#dcfce7" : "#fef3c7",
                          color: d.status === "closed" ? "#166534" : "#92400e",
                        }}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: "600", color: "var(--primary-color)" }}>
                      {Number(d.basePrice).toLocaleString()} FCFA
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
