import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('usulan_warga')
    .select('id,nama_pengusul,kategori_usulan,deskripsi,lembaga_instansi,lokasi')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { nama_pengusul, kategori_usulan, deskripsi, lokasi, lembaga_instansi } = body

  if (!nama_pengusul || !kategori_usulan || !deskripsi || !lokasi) {
    return NextResponse.json({ error: 'Field required: nama_pengusul, kategori_usulan, deskripsi, lokasi' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('usulan_warga').insert([
    {
      nama_pengusul,
      kategori_usulan,
      deskripsi,
      lokasi,
      lembaga_instansi: lembaga_instansi || null,
    },
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
