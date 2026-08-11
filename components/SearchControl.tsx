'use client'

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

interface SearchResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  boundingbox: string[]
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
}

interface SearchControlProps {
  onSelectLocation={(lat, lng, displayName) => {
  if (mapRef.current) {
    mapRef.current.setView([lat, lng], 16, {
      animate: true,
      duration: 1.5
    });
  }
}}
}

export default function SearchControl({ onSelectLocation }: SearchControlProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      // Nominatim search with bounding box to prioritize Kota Cilegon
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}&viewbox=105.8814,-6.1685,106.1852,-5.8677&bounded=1&addressdetails=1&limit=6`
      
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Error fetching search results:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex rounded-2xl border-2 border-[#01008C] bg-white shadow-lg overflow-hidden">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!e.target.value) {
              setResults([])
              setIsOpen(false)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Cari lokasi di Cilegon..."
          className="w-full px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        <button
          onClick={() => handleSearch(query)}
          disabled={isLoading}
          className="bg-[#01008C] hover:bg-[#01008C]/90 text-[#FFF411] px-4 py-2.5 flex items-center justify-center transition duration-150 cursor-pointer"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[9999] max-h-64 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.place_id}
              onClick={() => {
                onSelectLocation(parseFloat(result.lat), parseFloat(result.lon), result.display_name)
                setQuery(result.display_name.split(',')[0]) // abbreviate to first part
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0 text-xs text-slate-700 leading-relaxed block"
            >
              <p className="font-semibold text-slate-900 truncate">
                {result.display_name.split(',')[0]}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {result.display_name}
              </p>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && query && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 text-center text-xs text-slate-500 z-[9999]">
          Tidak menemukan lokasi "{query}" di Cilegon.
        </div>
      )}
    </div>
  )
}
