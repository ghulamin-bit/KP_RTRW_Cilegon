'use client'

import Image from 'next/image'
import cilegonLogo from '../app/Lambang_Kota_Cilegon.png'
import { memo, useEffect, useMemo, useState, useRef } from 'react'
import SearchControl from './SearchControl';

type Usulan = {
  id: number
  nama_pengusul: string
  kategori_usulan: string
  deskripsi: string
  lembaga_instansi: string | null
  lokasi: string | { type: string; coordinates: [number, number] } | null
}

type BaseMapType = 'osm' | 'google_sat' | 'bing_sat'

function getBaseMapConfig(baseMap: BaseMapType) {
  switch (baseMap) {
    case 'google_sat':
      return {
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        attribution: '&copy; Google Satellite',
      }
    case 'bing_sat':
      return {
        url: 'https://ecn.t3.tiles.virtualearth.net/tiles/a{q}.jpeg?g=1&mkt=id-ID&shading=hill',
        attribution: '&copy; Bing Maps',
      }
    case 'osm':
    default:
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
  }
}

function getPolaFillColor(namobj: string | null | undefined) {
  const name = (namobj || '').trim()
  switch (name) {
    case 'Kawasan Hortikultura': return '#E6FF4B'
    case 'Kawasan Hutan Lindung': return '#325F28'
    case 'Kawasan Hutan Produksi Tetap': return '#69B437'
    case 'Kawasan Industri': return '#690000'
    case 'Kawasan Kesehatan': return '#DF73FF'
    case 'Kawasan Konservasi Pesisir dan Pulau-Pulau Kecil': return '#1496AA'
    case 'Kawasan Olahraga': return '#9ED7C2'
    case 'Kawasan Pariwisata': return '#FFA5FF'
    case 'Kawasan Pembangkitan Tenaga Listrik': return '#00FFCD'
    case 'Kawasan Pendidikan': return '#00A884'
    case 'Kawasan Perdagangan dan Jasa': return '#FF4646'
    case 'Kawasan Peribadatan': return '#A900A9'
    case 'Kawasan Perkantoran': return '#9B9B9B'
    case 'Kawasan Perkebunan': return '#AFAF37'
    case 'Kawasan Pertahanan dan Keamanan': return '#9B00FF'
    case 'Kawasan Perumahan': return '#FFA000'
    case 'Kawasan Ruang Terbuka Non Hijau': return '#006969'
    case 'Kawasan Sekitar Danau atau Waduk': return '#B8FFC7'
    case 'Kawasan Tanaman Pangan': return '#C8F546'
    case 'Kawasan Transportasi': return '#D73700'
    case 'Ruang Terbuka Hijau (RTH)': return '#72DC00'
    case 'Sempadan Jalan': return '#A3FF73'
    case 'Sempadan Mata Air': return '#BF3319'
    case 'Sempadan Pantai': return '#CCFFCC'
    case 'Sempadan Rel Kereta Api': return '#BEFFE8'
    case 'Sempadan Sungai': return '#C2FFCC'
    case 'Sentra Industri Kecil dan Menengah': return '#EDEDD3'
    default: return '#cccccc'
  }
}

function ZoomToFeature({ selectedFeature, useMapHook, L }: { selectedFeature: any; useMapHook: any; L: any }) {
  const map = useMapHook()
  const lastFeatureKey = useRef<string | null>(null)

  const selectedFeatureKey = useMemo(() => {
    if (!selectedFeature) return null
    const props = selectedFeature.properties || {}
    const kec = String(props.KECAMATAN ?? props.Kecamatan ?? '').trim()
    const desa = String(props.DESA ?? props.Desa ?? props.Kelurahan ?? '').trim()
    const type = String(selectedFeature.type || '')
    return `${kec}|${desa}|${type}`
  }, [selectedFeature])

  useEffect(() => {
    if (!selectedFeature || !selectedFeatureKey) return
    if (lastFeatureKey.current === selectedFeatureKey) return
    lastFeatureKey.current = selectedFeatureKey
    try {
      const geoJsonLayer = L.geoJSON(selectedFeature)
      const bounds = geoJsonLayer.getBounds()
      if (bounds && typeof bounds.isValid === 'function' ? bounds.isValid() : true) {
        map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 })
      }
    } catch (err) {
      console.debug('ZoomToFeature error', err)
    }
  }, [selectedFeatureKey, map, L])

  return null
}

function FitOnTrigger({ fitTrigger, showAdminLayer, adminGeoJson, showPolaLayer, polaGeoJson, useMapHook, L }: any) {
  const map = useMapHook()
  useEffect(() => {
    if (typeof fitTrigger === 'undefined') return
    try {
      const layers: any[] = []
      if (showAdminLayer && adminGeoJson) layers.push(L.geoJSON(adminGeoJson))
      if (showPolaLayer && polaGeoJson) layers.push(L.geoJSON(polaGeoJson))

      if (layers.length === 0) return

      let bounds = layers[0].getBounds()
      for (let i = 1; i < layers.length; i++) {
        bounds = bounds.extend(layers[i].getBounds())
      }

      if (bounds && (typeof bounds.isValid === 'function' ? bounds.isValid() : true)) {
        map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.0 })
      }
    } catch (err) {
      console.debug('FitOnTrigger error', err)
    }
  }, [fitTrigger, showAdminLayer, adminGeoJson, showPolaLayer, polaGeoJson, map, L])
  return null
}

function LocationMarkerInner({ onSelect, useMapEventsHook }: { onSelect: (latlng: [number, number]) => void; useMapEventsHook: any }) {
  useMapEventsHook({
    click(event: any) {
      onSelect([event.latlng.lat, event.latlng.lng])
    },
  })
  return null
}

function BingTileLayer({ useMapHook, L }: { useMapHook: any; L: any }) {
  const map = useMapHook()
  useEffect(() => {
    if (!L || !map) return

    const getQuadKey = (x: number, y: number, z: number) => {
      let quadKey = ''
      for (let i = z; i > 0; i--) {
        let digit = 0
        const mask = 1 << (i - 1)
        if ((x & mask) !== 0) digit += 1
        if ((y & mask) !== 0) digit += 2
        quadKey += digit.toString()
      }
      return quadKey
    }

    const layer = L.tileLayer('', {
      attribution: '&copy; Bing Maps',
      subdomains: ['0', '1', '2', '3'],
    })

    layer.getTileUrl = function (tilePoint: any) {
      const quadKey = getQuadKey(tilePoint.x, tilePoint.y, tilePoint.z)
      const subdomain = this._getSubdomain(tilePoint)
      return `https://ecn.t${subdomain}.tiles.virtualearth.net/tiles/a${quadKey}.jpeg?g=1&mkt=id-ID&shading=hill`
    }

    layer.addTo(map)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, L])
  return null
}

function MapController({ setMapRef }: { setMapRef: (map: any) => void }) {
  const map = useMap()
  useEffect(() => {
    if (map) {
      setMapRef(map)
    }
  }, [map, setMapRef])
  return null
}

const LazyLeafletMap = memo(function LazyLeafletMap(props: any) {
  const {
    center,
    zoom,
    selectedPosition,
    usulanList,
    showAdminLayer,
    adminGeoJson,
    adminWeight,
    adminOpacity,
    showPolaLayer,
    polaGeoJson,
    polaWeight,
    polaOpacity,
    regencyGeoJson,
    setMapRef,
  } = props

  const [RL, setRL] = useState<any>(null)
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    if (typeof window === 'undefined') return
    Promise.all([import('react-leaflet'), import('leaflet')])
      .then(([rl, Llib]) => {
        if (!mounted) return
        setRL(rl)
        setL(Llib)
      })
      .catch((err) => console.error('Failed to load leaflet libs', err))
    return () => {
      mounted = false
    }
  }, [])

  if (!RL || !L) {
    return <div className="h-full w-full flex items-center justify-center">Memuat peta...</div>
  }

  const { MapContainer, TileLayer, Marker, Popup, useMapEvents, GeoJSON, useMap } = RL

  function createCategoryIcon(category: string) {
    const color = CATEGORY_COLORS[category] ?? '#0f172a'
    return new L.DivIcon({
      html: `
        <svg width="34" height="48" viewBox="0 0 34 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 0C8.715 0 2 6.715 2 15c0 10.987 13.783 27.944 14.756 29.108a3 3 0 0 0 4.488 0C18.217 42.944 32 25.987 32 15 32 6.715 25.285 0 17 0Z" fill="${color}" stroke="white" stroke-width="3"/>
          <circle cx="17" cy="15" r="6" fill="white" opacity="0.95" />
        </svg>
      `,
      className: '',
      iconSize: [34, 48],
      iconAnchor: [17, 48],
      popupAnchor: [0, -46],
    })
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <MapController />

      {props.baseMap === 'bing_sat' ? (
        <BingTileLayer useMapHook={useMap} L={L} />
      ) : (
        <TileLayer
          attribution={getBaseMapConfig(props.baseMap).attribution}
          url={getBaseMapConfig(props.baseMap).url}
        />
      )}

      <LocationMarkerInner onSelect={props.onSetSelectedPosition} useMapEventsHook={useMapEvents} />
      <ZoomToFeature selectedFeature={props.selectedAdminFeature} useMapHook={useMap} L={L} />
      <FitOnTrigger
        fitTrigger={props.fitTrigger}
        showAdminLayer={showAdminLayer}
        adminGeoJson={adminGeoJson}
        showPolaLayer={showPolaLayer}
        polaGeoJson={polaGeoJson}
        useMapHook={useMap}
        L={L}
      />

      {showAdminLayer && adminGeoJson && (
        <GeoJSON data={adminGeoJson} style={() => ({ color: '#0b5', weight: adminWeight, fillOpacity: adminOpacity })} />
      )}

      {showPolaLayer && polaGeoJson && (
        <GeoJSON
          data={polaGeoJson}
          style={(feature: any) => {
            const name = feature?.properties?.NAMOBJ ?? feature?.properties?.namobj ?? null
            const fill = getPolaFillColor(name)
            return {
              color: '#333',
              weight: polaWeight,
              fillColor: fill,
              fillOpacity: polaOpacity,
            }
          }}
        />
      )}

      {regencyGeoJson && (
        <GeoJSON
          data={regencyGeoJson}
          style={() => ({
            color: '#ff9900',
            weight: 2,
            opacity: 1,
            fillOpacity: 0,
            dashArray: '6,6',
          })}
          onEachFeature={(feature: any, layer: any) => {
            const label =
              feature?.properties?.NAMA_KABKOT ??
              feature?.properties?.NAMA ??
              feature?.properties?.NAME ??
              feature?.properties?.KABKOT ??
              feature?.properties?.KAB ??
              feature?.properties?.NM_KABKOT ??
              feature?.properties?.KABKOTA ??
              feature?.properties?.name ??
              ''
            if (label) {
              layer.bindTooltip(label, {
                permanent: true,
                direction: 'center',
                className: 'leaflet-admin-label',
                opacity: 0.9,
              })
            }
          }}
        />
      )}

      {selectedPosition && (
        <Marker
          position={selectedPosition}
          icon={createCategoryIcon('lainnya')}
          draggable={true}
          eventHandlers={{
            dragend(event: any) {
              const marker = event.target
              const latlng = marker.getLatLng()
              props.onSetSelectedPosition([latlng.lat, latlng.lng])
            },
          }}
        >
          <Popup>
            <div className="space-y-2">
              <p className="font-semibold text-blue-700">Lokasi Usulan Baru</p>
              <p className="text-sm text-slate-600">{formatCoordinates(selectedPosition)}</p>
              <p className="text-sm text-slate-500">Geser marker untuk menyesuaikan lokasi jika diperlukan.</p>
            </div>
          </Popup>
        </Marker>
      )}

      {usulanList.map((usulan: any) => {
        const position = parseLocation(usulan.lokasi)
        if (!position) return null
        return (
          <Marker key={usulan.id} position={position} icon={createCategoryIcon(usulan.kategori_usulan)}>
            <Popup>
              <div className="space-y-2">
                <p className="font-semibold text-slate-900">Usulan: {usulan.kategori_usulan}</p>
                <p className="text-sm text-slate-600">{usulan.deskripsi}</p>
                <p className="text-sm text-slate-500">Pengusul: {usulan.nama_pengusul}</p>
                {usulan.lembaga_instansi && <p className="text-sm text-slate-500">Instansi: {usulan.lembaga_instansi}</p>}
                <p className="text-xs text-slate-400">{formatCoordinates(position)}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
})

const CATEGORY_COLORS: Record<string, string> = {
  'perubahan rencana pola ruang': '#7c3aed',
  'perumahan yang aman, terjangkau, bebas kumuh': '#16a34a',
  'transportasi berkelanjutan': '#0ea5e9',
  'energi dan telekomunikasi': '#f97316',
  'perlindungan warisan dan cagar budaya': '#c2410c',
  'pengurangan risiko bencana': '#ef4444',
  'peningkatan kualitas udara': '#22c55e',
  'penanganan limbah dan sampah': '#64748b',
  'Sistem Pengelolaan Air Minum': '#0f766e',
  'Lansekap Alami dan Ruang Terbuka Hijau': '#15803d',
  'sarana perdagangan jasa': '#db2777',
  'pengembangan kawasan/kegiatan industri': '#334155',
  'pengembangan sentra UMKM / IKM': '#14b8a6',
  'pangan, pertanian, dan perikanan': '#84cc16',
  'estetika dan kenyamanan kota': '#f59e0b',
  'keamanan kota': '#7c2d12',
  'fasilitas pendidikan': '#2563eb',
  'fasilitas kesehatan': '#dc2626',
  'fasilitas kesenian dan olahraga': '#9333ea',
  'lainnya': '#475569',
}

const PROPOSAL_CATEGORIES = [
  'perubahan rencana pola ruang',
  'perumahan yang aman, terjangkau, bebas kumuh',
  'transportasi berkelanjutan',
  'energi dan telekomunikasi',
  'perlindungan warisan dan cagar budaya',
  'pengurangan risiko bencana',
  'peningkatan kualitas udara',
  'penanganan limbah dan sampah',
  'Sistem Pengelolaan Air Minum',
  'Lansekap Alami dan Ruang Terbuka Hijau',
  'sarana perdagangan jasa',
  'pengembangan kawasan/kegiatan industri',
  'pengembangan sentra UMKM / IKM',
  'pangan, pertanian, dan perikanan',
  'estetika dan kenyamanan kota',
  'keamanan kota',
  'fasilitas pendidikan',
  'fasilitas kesehatan',
  'fasilitas kesenian dan olahraga',
  'lainnya',
]

type LatLngExpression = [number, number]
const CILEGON_CENTER: LatLngExpression = [-6.0152, 106.0520]
const DEFAULT_ZOOM = 12

function parseLocation(lokasi: Usulan['lokasi']): [number, number] | null {
  if (!lokasi) return null

  if (typeof lokasi === 'string') {
    const match = lokasi.match(/POINT\(([-0-9.]+) ([-0-9.]+)\)/)
    if (match) {
      return [parseFloat(match[2]), parseFloat(match[1])]
    }
    return null
  }

  if (typeof lokasi === 'object' && Array.isArray(lokasi.coordinates)) {
    return [lokasi.coordinates[1], lokasi.coordinates[0]]
  }

  return null
}

function formatCoordinates(position: [number, number] | null) {
  if (!position) return 'Tidak tersedia'
  return `Lat: ${position[0].toFixed(6)}, Lng: ${position[1].toFixed(6)}`
}

function isPointInGeoJSON(lat: number, lng: number, geojson: any): boolean {
  if (!geojson) return true
  const features = geojson.features || (geojson.type === 'FeatureCollection' ? [] : [geojson])
  
  const pointInPolygon = (x: number, y: number, ring: any[]) => {
    let inside = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1]
      const xj = ring[j][0], yj = ring[j][1]
      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  for (const feature of features) {
    const geom = feature.geometry
    if (!geom) continue
    
    if (geom.type === 'Polygon') {
      const rings = geom.coordinates
      if (rings && rings.length > 0) {
        if (pointInPolygon(lng, lat, rings[0])) {
          return true
        }
      }
    } else if (geom.type === 'MultiPolygon') {
      for (const polygon of geom.coordinates) {
        if (polygon && polygon.length > 0) {
          if (pointInPolygon(lng, lat, polygon[0])) {
            return true
          }
        }
      }
    }
  }
  return false
}

export default function UsulanMap() {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('perubahan rencana pola ruang')
  const [description, setDescription] = useState('')
  const [institution, setInstitution] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usulanList, setUsulanList] = useState<Usulan[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [notification, setNotification] = useState<string | null>(null)
  const [showAdminLayer, setShowAdminLayer] = useState(false)
  const [showPolaLayer, setShowPolaLayer] = useState(true)
  const [adminOpacity, setAdminOpacity] = useState(0.05)
  const [adminWeight, setAdminWeight] = useState(2)
  const [polaOpacity, setPolaOpacity] = useState(0.8)
  const [polaWeight, setPolaWeight] = useState(2)
  const [baseMap, setBaseMap] = useState<BaseMapType>('osm')
  const [adminGeoJson, setAdminGeoJson] = useState<any | null>(null)
  const [polaGeoJson, setPolaGeoJson] = useState<any | null>(null)
  const [regencyGeoJson, setRegencyGeoJson] = useState<any | null>(null)
  const [adminLoading, setAdminLoading] = useState(false)
  const [polaLoading, setPolaLoading] = useState(false)
  const [selectedKecamatan, setSelectedKecamatan] = useState('')
  const [selectedKelurahan, setSelectedKelurahan] = useState('')
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([])
  const [kelurahanOptions, setKelurahanOptions] = useState<string[]>([])
  const mapRef = useRef<any>(null)

  const handleSetSelectedPosition = (latlng: [number, number] | null) => {
    if (!latlng) {
      setSelectedPosition(null)
      return
    }
    const [lat, lng] = latlng
    if (adminGeoJson) {
      const inside = isPointInGeoJSON(lat, lng, adminGeoJson)
      if (!inside) {
        setNotification('Lokasi usulan harus berada di dalam wilayah administratif Kota Cilegon!')
        return
      }
    }
    setSelectedPosition(latlng)
    setNotification(null)
  }

  function getGeoJsonBounds(geoJson: any) {
    if (!geoJson) return null
    let minLat = Infinity
    let minLng = Infinity
    let maxLat = -Infinity
    let maxLng = -Infinity

    const updateBounds = (lat: number, lng: number) => {
      minLat = Math.min(minLat, lat)
      minLng = Math.min(minLng, lng)
      maxLat = Math.max(maxLat, lat)
      maxLng = Math.max(maxLng, lng)
    }

    const traverseCoords = (coords: any) => {
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        updateBounds(coords[1], coords[0])
        return
      }
      for (const part of coords) {
        traverseCoords(part)
      }
    }

    const traverseGeometry = (geometry: any) => {
      if (!geometry) return
      const type = geometry.type
      if (type === 'Point' || type === 'MultiPoint' || type === 'LineString') {
        traverseCoords(geometry.coordinates)
      } else if (type === 'MultiLineString' || type === 'Polygon') {
        for (const coords of geometry.coordinates) {
          traverseCoords(coords)
        }
      } else if (type === 'MultiPolygon') {
        for (const polygon of geometry.coordinates) {
          for (const ring of polygon) {
            traverseCoords(ring)
          }
        }
      }
    }

    const traverseFeature = (feature: any) => {
      if (!feature) return
      if (feature.type === 'Feature') {
        traverseGeometry(feature.geometry)
      } else if (feature.type === 'FeatureCollection') {
        for (const item of feature.features || []) {
          traverseFeature(item)
        }
      } else if (feature.type) {
        traverseGeometry(feature)
      }
    }

    traverseFeature(geoJson)
    if (minLat === Infinity || minLng === Infinity || maxLat === -Infinity || maxLng === -Infinity) {
      return null
    }
    return [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]]
  }

  function getGeoJsonFeatureBounds(feature: any) {
    if (!feature || !feature.geometry) return null
    return getGeoJsonBounds(feature)
  }

  function normalizeName(s: string) {
    return (s || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
  }

  function getAdminFeature(kecamatan: string, kelurahan: string) {
    if (!adminGeoJson?.features) return null
    const targetKecamatan = (kecamatan || '').trim().toLowerCase()
    const targetKelurahan = (kelurahan || '').trim().toLowerCase()

    const exact = adminGeoJson.features.find((feature: any) => {
      const props = feature.properties || {}
      const kec = String(props.KECAMATAN ?? props.Kecamatan ?? '').trim().toLowerCase()
      const desa = String(props.DESA ?? props.Desa ?? props.Kelurahan ?? '').trim().toLowerCase()
      return kec === targetKecamatan && desa === targetKelurahan
    })
    if (exact) return exact

    const normTargetKec = normalizeName(targetKecamatan)
    const normTargetDesa = normalizeName(targetKelurahan)

    return adminGeoJson.features.find((feature: any) => {
      const props = feature.properties || {}
      const kec = String(props.KECAMATAN ?? props.Kecamatan ?? '').trim().toLowerCase()
      const desa = String(props.DESA ?? props.Desa ?? props.Kelurahan ?? '').trim().toLowerCase()
      const nk = normalizeName(kec)
      const nd = normalizeName(desa)
      return (nk && (nk.includes(normTargetKec) || nk === normTargetKec)) && (nd && (nd.includes(normTargetDesa) || nd === normTargetDesa))
    })
  }

  function handleKelurahanChange(kelurahan: string) {
    setSelectedKelurahan(kelurahan)
    if (kelurahan) {
      setShowAdminLayer(true)
    }
  }

  useEffect(() => {
    if (!selectedKecamatan || !selectedKelurahan || !adminGeoJson || !mapRef.current) return
    const feature = getAdminFeature(selectedKecamatan, selectedKelurahan)
    if (!feature) return
    const bounds = getGeoJsonFeatureBounds(feature)
    if (bounds) {
      mapRef.current.fitBounds(bounds, { padding: [24, 24] })
      return
    }

    const geom = feature.geometry
    if (geom && geom.type === 'Point' && Array.isArray(geom.coordinates)) {
      const [lng, lat] = geom.coordinates
      mapRef.current.setView([lat, lng], 15)
      return
    }
  }, [selectedKecamatan, selectedKelurahan, adminGeoJson])

  function fitToVisibleGeoJsonLayers() {
    if (!mapRef.current) return

    const layersToFit: Array<[[number, number], [number, number]]> = []
    if (showAdminLayer && adminGeoJson) {
      const bounds = getGeoJsonBounds(adminGeoJson)
      if (bounds) layersToFit.push(bounds)
    }
    if (showPolaLayer && polaGeoJson) {
      const bounds = getGeoJsonBounds(polaGeoJson)
      if (bounds) layersToFit.push(bounds)
    }

    if (layersToFit.length === 0) return

    let combined = layersToFit[0]
    for (let i = 1; i < layersToFit.length; i++) {
      const next = layersToFit[i]
      combined = [
        [Math.min(combined[0][0], next[0][0]), Math.min(combined[0][1], next[0][1])],
        [Math.max(combined[1][0], next[1][0]), Math.max(combined[1][1], next[1][1])],
      ]
    }

    mapRef.current.fitBounds(combined, { padding: [24, 24] })
  }

  useEffect(() => {
    async function loadUsulan() {
      const response = await fetch('/api/usulan')
      const result = await response.json()
      if (response.ok) {
        const list = (result.data || []) as Usulan[]
        setUsulanList(list)
        const summary = list.reduce((acc: Record<string, number>, item: Usulan) => {
          acc[item.kategori_usulan] = (acc[item.kategori_usulan] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        setStats(summary)
      }
    }
    loadUsulan()
  }, [])

  useEffect(() => {
    async function loadAdmin() {
      setAdminLoading(true)
      try {
        const res = await fetch('/geo/admin_boundary.geojson')
        if (res.ok) {
          const data = await res.json()
          setAdminGeoJson(data)
        }
      } catch (e) {
        // ignore
      } finally {
        setAdminLoading(false)
      }
    }
    if (!adminGeoJson) loadAdmin()
  }, [adminGeoJson])

  useEffect(() => {
    if (!adminGeoJson?.features) return
    const kecamatanSet = new Set<string>()
    adminGeoJson.features.forEach((feature: any) => {
      const kec = String(feature.properties?.KECAMATAN ?? feature.properties?.Kecamatan ?? '').trim()
      if (kec) kecamatanSet.add(kec)
    })
    setKecamatanOptions(Array.from(kecamatanSet).sort((a, b) => a.localeCompare(b, 'id')))
  }, [adminGeoJson])

  useEffect(() => {
    async function loadRegencyBoundary() {
      try {
        const res = await fetch('/geo/regency_admin_boundary.geojson')
        if (res.ok) {
          const data = await res.json()
          setRegencyGeoJson(data)
        }
      } catch (e) {
        // ignore
      }
    }
    if (!regencyGeoJson) loadRegencyBoundary()
  }, [regencyGeoJson])

  useEffect(() => {
    if (!adminGeoJson?.features || !selectedKecamatan) {
      setKelurahanOptions([])
      return
    }
    const desaSet = new Set<string>()
    adminGeoJson.features.forEach((feature: any) => {
      const kec = String(feature.properties?.KECAMATAN ?? feature.properties?.Kecamatan ?? '').trim()
      if (kec.toLowerCase() !== selectedKecamatan.toLowerCase()) return
      const desa = String(feature.properties?.DESA ?? feature.properties?.Desa ?? feature.properties?.Kelurahan ?? '').trim()
      if (desa) desaSet.add(desa)
    })
    setKelurahanOptions(Array.from(desaSet).sort((a, b) => a.localeCompare(b, 'id')))
  }, [adminGeoJson, selectedKecamatan])

  useEffect(() => {
    async function loadPola() {
      setPolaLoading(true)
      try {
        const res = await fetch('/geo/pola_ruang.geojson')
        if (res.ok) {
          const data = await res.json()
          setPolaGeoJson(data)
        }
      } catch (e) {
        // ignore
      } finally {
        setPolaLoading(false)
      }
    }
    if (showPolaLayer && !polaGeoJson) loadPola()
  }, [showPolaLayer, polaGeoJson])

  async function handleSubmit() {
    if (!selectedPosition || !name || !description) return

    setIsSubmitting(true)

    const [latitude, longitude] = selectedPosition
    const locationWKT = `SRID=4326;POINT(${longitude} ${latitude})`

    const response = await fetch('/api/usulan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    setCategory('perubahan rencana pola ruang')
    setDescription('')
    setInstitution('')
    setSelectedPosition(null)
    setUsulanList((prev) => {
      const updated = [
        ...prev,
        {
          id: Date.now(),
          nama_pengusul: name,
          kategori_usulan: category,
          deskripsi: description,
          lembaga_instansi: institution || null,
          lokasi: locationWKT,
        },
      ]
      const summary = updated.reduce<Record<string, number>>((acc, item) => {
        acc[item.kategori_usulan] = (acc[item.kategori_usulan] || 0) + 1
        return acc
      }, {})
      setStats(summary)
      return updated
    })
  }

  const canFitGeoJson = showAdminLayer || showPolaLayer
  const isGeoJsonLoading = (showAdminLayer && adminLoading) || (showPolaLayer && polaLoading)
  const chartMax = Math.max(1, ...Object.values(stats))
  const [fitTrigger, setFitTrigger] = useState(0)

  const selectedAdminFeature = useMemo(
    () => (selectedKecamatan && selectedKelurahan && adminGeoJson ? getAdminFeature(selectedKecamatan, selectedKelurahan) : null),
    [selectedKecamatan, selectedKelurahan, adminGeoJson]
  )

  useEffect(() => {
    if (!mapRef.current) return
    if (showAdminLayer && adminGeoJson) {
      fitToVisibleGeoJsonLayers()
      return
    }
    if (showPolaLayer && polaGeoJson) {
      fitToVisibleGeoJsonLayers()
    }
  }, [adminGeoJson, polaGeoJson, showAdminLayer, showPolaLayer])

  function handleFitClick() {
    if (isGeoJsonLoading) {
      setNotification('Layer masih dimuat, tunggu selesai.')
      return
    }
    if (!showAdminLayer && !showPolaLayer) {
      setNotification('Pilih layer terlebih dahulu.')
      return
    }
    setFitTrigger((n) => n + 1)
    setNotification('Menyesuaikan peta ke layer aktif...')
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row gap-6 p-4">
      <aside className="lg:w-1/4 rounded-[32px] bg-lime-50 p-5 shadow-2xl ring-1 ring-lime-300">
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-300 bg-white/95 p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Legenda & Kontrol GeoJSON</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#0b5]" />
                <span>Batas Administrasi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#b85]" />
                <span>Rencana Pola Ruang</span>
              </div>
            </div>

            {showPolaLayer && (
              <div className="mt-3">
                <h3 className="text-sm font-medium text-slate-900">Legenda Pola Ruang</h3>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#E6FF4B' }} /> <span>Kawasan Hortikultura</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#325F28' }} /> <span>Kawasan Hutan Lindung</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#69B437' }} /> <span>Kawasan Hutan Produksi Tetap</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#690000' }} /> <span>Kawasan Industri</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#DF73FF' }} /> <span>Kawasan Kesehatan</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#1496AA' }} /> <span>Kawasan Konservasi Pesisir dan Pulau-Pulau Kecil</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#9ED7C2' }} /> <span>Kawasan Olahraga</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#FFA5FF' }} /> <span>Kawasan Pariwisata</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#00FFCD' }} /> <span>Kawasan Pembangkitan Tenaga Listrik</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#00A884' }} /> <span>Kawasan Pendidikan</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#FF4646' }} /> <span>Kawasan Perdagangan dan Jasa</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#A900A9' }} /> <span>Kawasan Peribadatan</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#9B9B9B' }} /> <span>Kawasan Perkantoran</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#AFAF37' }} /> <span>Kawasan Perkebunan</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#9B00FF' }} /> <span>Kawasan Pertahanan dan Keamanan</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#FFA000' }} /> <span>Kawasan Perumahan</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#006969' }} /> <span>Kawasan Ruang Terbuka Non Hijau</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#B8FFC7' }} /> <span>Kawasan Sekitar Danau atau Waduk</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#C8F546' }} /> <span>Kawasan Tanaman Pangan</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#D73700' }} /> <span>Kawasan Transportasi</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#72DC00' }} /> <span>Ruang Terbuka Hijau (RTH)</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#A3FF73' }} /> <span>Sempadan Jalan</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#BF3319' }} /> <span>Sempadan Mata Air</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#CCFFCC' }} /> <span>Sempadan Pantai</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#BEFFE8' }} /> <span>Sempadan Rel Kereta Api</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#C2FFCC' }} /> <span>Sempadan Sungai</span></div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: '#EDEDD3' }} /> <span>Sentra Industri Kecil dan Menengah</span></div>
                </div>
              </div>
            )}
            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <div>
                <label className="block text-sm font-medium text-slate-900">Kecamatan</label>
                <select
                  value={selectedKecamatan}
                  onChange={(event) => {
                    const value = event.target.value
                    setSelectedKecamatan(value)
                    setSelectedKelurahan('')
                  }}
                  className="mt-1 block w-full rounded-xl border border-slate-400 bg-amber-50 px-3 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500/20"
                >
                  <option value="">Pilih Kecamatan</option>
                  {kecamatanOptions.map((kecamatan) => (
                    <option key={kecamatan} value={kecamatan}>{kecamatan}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900">Kelurahan</label>
                <select
                  value={selectedKelurahan}
                  onChange={(event) => handleKelurahanChange(event.target.value)}
                  disabled={!selectedKecamatan || kelurahanOptions.length === 0}
                  className="mt-1 block w-full rounded-xl border border-slate-400 bg-amber-50 px-3 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Pilih Kelurahan</option>
                  {kelurahanOptions.map((kelurahan) => (
                    <option key={kelurahan} value={kelurahan}>{kelurahan}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showAdminLayer} onChange={(e) => setShowAdminLayer(e.target.checked)} />
                <span>Tampil Batas Administrasi</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showPolaLayer} onChange={(e) => setShowPolaLayer(e.target.checked)} />
                <span>Tampil Rencana Pola Ruang</span>
              </label>
            </div>
            <div className="mt-4 rounded-3xl border border-slate-300 bg-white/95 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Basemap</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input type="radio" name="basemap" value="osm" checked={baseMap === 'osm'} onChange={() => setBaseMap('osm')} />
                  <span>OpenStreetMap</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="basemap" value="google_sat" checked={baseMap === 'google_sat'} onChange={() => setBaseMap('google_sat')} />
                  <span>Google Satellite</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="basemap" value="bing_sat" checked={baseMap === 'bing_sat'} onChange={() => setBaseMap('bing_sat')} />
                  <span>Bing Satellite</span>
                </label>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFitClick}
              disabled={!canFitGeoJson || isGeoJsonLoading}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 relative z-50 pointer-events-auto"
            >
              {isGeoJsonLoading ? 'Memuat layer...' : 'Fit ke layer GeoJSON'}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-300 bg-white/95 p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Kontrol Batas Administrasi</h2>
            {showAdminLayer ? (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Opacity: {adminOpacity}</label>
                  <input
                    type="range"
                    min={0}
                    max={0.3}
                    step={0.01}
                    value={adminOpacity}
                    onChange={(e) => setAdminOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Ketebalan garis: {adminWeight}px</label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={1}
                    value={adminWeight}
                    onChange={(e) => setAdminWeight(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Aktifkan layer terlebih dahulu untuk melihat kontrol opacity.</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-300 bg-white/95 p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Kontrol Rencana Pola Ruang</h2>
            {showPolaLayer ? (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <label className="block text-xs font-medium text-slate-600">Opacity: {polaOpacity}</label>
                  <input
                    type="range"
                    min={0}
                    max={0.3}
                    step={0.01}
                    value={polaOpacity}
                    onChange={(e) => setPolaOpacity(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600">Ketebalan garis: {polaWeight}px</label>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={1}
                    value={polaWeight}
                    onChange={(e) => setPolaWeight(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Aktifkan layer terlebih dahulu untuk melihat kontrol opacity.</p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-300 bg-white/95 p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Rekap Total Usulan</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-3">
                <span>Total usulan</span>
                <span className="font-semibold text-slate-900">{usulanList.length}</span>
              </div>
              <div className="space-y-3">
                {PROPOSAL_CATEGORIES.map((kategori) => {
                  const jumlah = stats[kategori] || 0
                  const barColor = CATEGORY_COLORS[kategori] ?? '#475569'
                  return (
                    <div key={kategori} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="truncate">{kategori}</span>
                        <span className="font-semibold text-slate-900">{jumlah}</span>
                      </div>
                      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(jumlah / chartMax) * 100}%`, backgroundColor: barColor }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:w-2/4 h-[60vh] lg:h-[calc(100vh-2rem)] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-lime-300 relative">
        {/* KOTAK PENCARIAN TERHUBUNG KE PETA */}
        <div className="absolute top-4 left-4 right-4 z-[1000] max-w-md">
          <SearchControl 
            onSelectLocation={(lat, lng) => {
              if (mapRef.current) {
                mapRef.current.setView([lat, lng], 16, {
                  animate: true,
                  duration: 1.0
                })
              }
            }} 
          />
        </div>

        {typeof window === 'undefined' && (
          <div className="h-full w-full flex items-center justify-center">Memuat peta...</div>
        )}
        {typeof window !== 'undefined' && (
          <LazyLeafletMap
            center={CILEGON_CENTER}
            zoom={DEFAULT_ZOOM}
            selectedPosition={selectedPosition}
            onSetSelectedPosition={handleSetSelectedPosition}
            usulanList={usulanList}
            showAdminLayer={showAdminLayer}
            adminGeoJson={adminGeoJson}
            regencyGeoJson={regencyGeoJson}
            selectedAdminFeature={selectedAdminFeature}
            fitTrigger={fitTrigger}
            adminWeight={adminWeight}
            adminOpacity={adminOpacity}
            showPolaLayer={showPolaLayer}
            polaGeoJson={polaGeoJson}
            polaWeight={polaWeight}
            polaOpacity={polaOpacity}
            baseMap={baseMap}
            setMapRef={(m: any) => (mapRef.current = m)}
          />
        )}
      </div>

      <div className="lg:w-1/4 p-6 bg-lime-100 text-slate-900 shadow-2xl ring-1 ring-lime-300 rounded-[32px]">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Usulan Warga untuk Cilegon Lebih Baik</h1>
            <p className="mt-2 text-sm leading-5 text-slate-700">Laman Konsultasi Publik Revisi Rencana Tata Ruang Wilayah Kota Cilegon Tahun 2020-2040</p>
          </div>
          <div className="relative h-16 w-16 overflow-hidden rounded-3xl border border-lime-300 bg-white shadow-sm">
            <Image
              src={cilegonLogo}
              alt="Lambang Kota Cilegon"
              fill
              className="object-contain"
            />
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-700">Pilih titik di peta terlebih dahulu untuk mengaktifkan formulir usulan di bawah ini.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900">Nama Pengusul</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-400 bg-amber-50 px-3 py-3 text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500/20"
              placeholder="Masukkan nama pengusul"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900">Lembaga / Instansi</label>
            <input
              type="text"
              value={institution}
              onChange={(event) => setInstitution(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-400 bg-amber-50 px-3 py-3 text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500/20"
              placeholder="Opsional: Lembaga atau instansi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900">Kategori Usulan</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-400 bg-amber-50 px-3 py-3 text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500/20"
            >
              <option>perubahan rencana pola ruang</option>
              <option>perumahan yang aman, terjangkau, bebas kumuh</option>
              <option>transportasi berkelanjutan</option>
              <option>energi dan telekomunikasi</option>
              <option>perlindungan warisan dan cagar budaya</option>
              <option>pengurangan risiko bencana</option>
              <option>peningkatan kualitas udara</option>
              <option>penanganan limbah dan sampah</option>
              <option>Sistem Pengelolaan Air Minum</option>
              <option>Lansekap Alami dan Ruang Terbuka Hijau</option>
              <option>sarana perdagangan jasa</option>
              <option>pengembangan kawasan/kegiatan industri</option>
              <option>pengembangan sentra UMKM / IKM</option>
              <option>pangan, pertanian, dan perikanan</option>
              <option>estetika dan kenyamanan kota</option>
              <option>keamanan kota</option>
              <option>fasilitas pendidikan</option>
              <option>fasilitas kesehatan</option>
              <option>fasilitas kesenian dan olahraga</option>
              <option>lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900">Deskripsi Singkat</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-400 bg-amber-50 px-3 py-3 text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500/20"
              rows={4}
              placeholder="Jelaskan usulan anda beserta alasan mengapa usulan tersebut menjadi penting"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="w-full rounded-xl bg-blue-600 px-4 py-2 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={!selectedPosition || !name || !description || isSubmitting}
          >
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-white">→</span>
            {isSubmitting ? 'Mengirim...' : 'Kirim Usulan'}
          </button>

          {notification && (
            <div className="rounded-3xl border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-sm mt-4">
              {notification}
            </div>
          )}

          {selectedPosition && (
            <button
              type="button"
              onClick={() => setSelectedPosition(null)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 hover:bg-slate-800 mt-2"
            >
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-slate-100">×</span>
              Batalkan Lokasi Usulan
            </button>
          )}

          {!selectedPosition && (
            <div className="rounded-3xl border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700">
              Pilih titik di peta terlebih dahulu untuk mengaktifkan formulir.
            </div>
          )}

          <div className="mt-6 border-t border-slate-700 pt-4 text-right text-[10px] text-slate-500">
            dibuat oleh: Dinas Pekerjaan Umum dan Penataan Ruang Kota Cilegon, TA 2026
          </div>
        </div>
      </div>
    </div>
  )
}