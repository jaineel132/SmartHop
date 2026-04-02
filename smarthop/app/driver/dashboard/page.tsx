'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function Page() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className='flex flex-col items-center justify-center p-8 space-y-4 min-h-screen'>
      <h1 className="text-3xl font-bold">Driver Dashboard</h1>
      <p className="text-slate-500">Coming soon in Step 8...</p>
      <Button variant="destructive" onClick={handleSignOut} className="mt-8">
        Sign Out (To Test Flow Again)
      </Button>
    </div>
  )
}
