import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// Report (/items/new) and edit (/items/:id) page.
// Both routes are wrapped in <ProtectedRoute>.

const defaults = { title: '', description: '', category: 'other', status: 'lost', location: '' }

const STATUSES = ['lost', 'found', 'claimed']
const CATEGORIES = ['electronics', 'clothing', 'documents', 'accessories', 'other']

const inputClass = 'w-full border rounded px-3 py-2'

function errorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong'
}

export default function ItemForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  // Edit mode: when there is an `id`, load the item and fill the form.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    setError('')
    api
      .get(`/items/${id}`)
      .then((res) => {
        if (cancelled) return
        const item = res.data?.item || res.data
        setForm({
          title: item.title ?? '',
          status: item.status ?? defaults.status,
          category: item.category ?? defaults.category,
          location: item.location ?? '',
          description: item.description ?? ''
        })
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [id])

  // Update `form` when any input changes (input `name` matches the form key).
  function onChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  // POST a new item, or PATCH the existing one when editing, then go back to /items.
  // Note: `reportedBy` is never sent; the server takes it from the token.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const { title, status, category, location, description } = form
    const payload = { title, status, category, location, description }
    try {
      if (id) await api.patch(`/items/${id}`, payload)
      else await api.post('/items', payload)
      nav('/items')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Report'} Item</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className={inputClass}
          name="title"
          placeholder="Black backpack"
          value={form.title}
          onChange={onChange}
          required
        />

        <select className={inputClass} name="status" value={form.status} onChange={onChange}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select className={inputClass} name="category" value={form.category} onChange={onChange}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          className={inputClass}
          name="location"
          placeholder="Library 2nd floor (optional)"
          value={form.location}
          onChange={onChange}
        />

        <textarea
          className={inputClass}
          name="description"
          placeholder="Description (optional)"
          rows={4}
          value={form.description}
          onChange={onChange}
        />

        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit">Save</button>
      </form>
    </div>
  )
}
