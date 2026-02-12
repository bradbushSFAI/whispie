import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NavHeader } from '@/components/layout/nav-header'
import { CommunityContent } from './community-content'

export default async function CommunityPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background-dark">
      <NavHeader displayName={profile?.display_name || user.email?.split('@')[0] || 'User'} />
      <CommunityContent />
    </div>
  )
}
