'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

// Koordinat pusat Kota Cilegon
const CILEGON_CENTER: LatLngExpression = [-6.0152, 106.0520]
const DEFAULT_ZOOM = 12

function LocationMarker({ onSelect }: { onSelect: (latlng: [number, number]) => void }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng])
    },
  })
  return null
}

export default function MapComponent() {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Infrastruktur')
  const [description, setDescription] = useState('')
  const [institution, setInstitution] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  async function handleSubmit() {
    if (!selectedPosition || !name || !description) {
      return
    }

    setIsSubmitting(true)

    const [latitude, longitude] = selectedPosition
    const locationWKT = `SRID=4326;POINT(${longitude} ${latitude})`

    const response = await fetch('/api/usulan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nama_pengusul: name,
        kategori_usulan: category,
        deskripsi: description,
        lokasi: locationWKT,
        lembaga_instansi: institution || null,
      }),
    })

    const result = await response.json()
    setIsSubmitting(false)

    if (!response.ok) {
      setNotification(`Gagal mengirim usulan: ${result.error ?? 'unknown error'}`)
      return
    }

    setNotification('Usulan berhasil dikirim!')
    setName('')
    setCategory('Infrastruktur')
    setDescription('')
    setInstitution('')
    setSelectedPosition(null)
  }

  return (
    <div className="flex h-full min-h-screen flex-col lg:flex-row">
      <div className="lg:w-2/3 h-[60vh] lg:h-full">
        <MapContainer
          center={CILEGON_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onSelect={setSelectedPosition} />
          {selectedPosition && <Marker position={selectedPosition} />}
        </MapContainer>
      </div>

      <div className="lg:w-1/3 p-4 bg-white shadow-lg">
        <h2 className="text-xl font-semibold mb-3">Usulan Warga</h2>
        <p className="text-sm text-gray-600 mb-4">
          Klik peta untuk memilih lokasi usulan. Setelah marker muncul, lengkapi formulir berikut.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Kategori Usulan</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option>Infrastruktur</option>
              <option>Lingkungan/Kawasan Lindung</option>
              <option>Fasilitas Umum</option>
              <option>Potensi Ekonomi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Deskripsi Singkat</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={4}
              placeholder="Jelaskan singkat usulan Anda"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lembaga / Instansi</label>
            <input
              type="text"
              value={institution}
              onChange={(event) => setInstitution(event.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Opsional: Lembaga atau instansi"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            disabled={!selectedPosition || !name || !description || isSubmitting}
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Usulan'}
          </button>

          {notification && (
            <div className="rounded border border-slate-300 bg-white p-3 text-sm text-slate-900 mt-4">
              {notification}
            </div>
          )}

          {!selectedPosition && (
            <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700">
              Pilih titik di peta terlebih dahulu untuk mengaktifkan formulir.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
