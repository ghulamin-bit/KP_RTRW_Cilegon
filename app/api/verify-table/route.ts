import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

const TABLE_NAME = 'usulan_warga'
const TABLE_SCHEMA = 'public'

export async function GET() {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select(
      'column_name,data_type,udt_name,is_nullable,character_maximum_length,ordinal_position'
    )
    .eq('table_name', TABLE_NAME)
    .eq('table_schema', TABLE_SCHEMA)
    .order('ordinal_position', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ table: TABLE_NAME, columns: data })
}
