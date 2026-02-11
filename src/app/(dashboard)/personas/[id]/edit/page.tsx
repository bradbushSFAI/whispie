import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PersonaEditForm } from './persona-edit-form'

export default async function EditPersonaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: persona } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .single()

  if (!persona) redirect('/personas/my')

  // Only allow editing own personas
  if (persona.created_by !== user.id) redirect('/personas/my')

  // Fetch linked scenarios
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, title, category, context, objectives')
    .eq('persona_id', id)
    .eq('is_active', true)

  return <PersonaEditForm persona={persona} scenarios={scenarios || []} />
}
