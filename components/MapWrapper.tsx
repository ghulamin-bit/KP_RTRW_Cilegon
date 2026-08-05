'use client'

import dynamic from 'next/dynamic'

// Dynamic import dengan ssr: false -> komponen HANYA di-render di browser,
// tidak pernah dicoba di-render di server. Ini mencegah hydration mismatch
// karena Leaflet memanipulasi DOM secara langsung (di luar kendali React SSR).
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <p className="text-gray-500">Memuat peta...</p>
    </div>
  ),
})

export default function MapWrapper() {
  return <MapComponent />
}
