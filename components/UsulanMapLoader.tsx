'use client'

import dynamic from 'next/dynamic'

const UsulanMap = dynamic(() => import('./UsulanMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50">
      <p className="text-slate-500">Memuat peta...</p>
    </div>
  ),
})

export default function UsulanMapLoader() {
  return <UsulanMap />
}
