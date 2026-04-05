'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * SessionGuard invalidates old auth sessions whenever the dev server restarts.
 * It compares NEXT_PUBLIC_DEV_SESSION_ID (generated fresh on each server start)
 * with a value stored in localStorage. If they differ, the user is signed out.
 */
export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const currentId = process.env.NEXT_PUBLIC_DEV_SESSION_ID || ''
      const storedId = localStorage.getItem('smarthop_session_id')

      if (storedId && storedId !== currentId) {
        // Server restarted — invalidate old session
        console.log('Dev server restarted. Clearing old session...')
        const supabase = createSupabaseBrowserClient()
        await supabase.auth.signOut()
        localStorage.setItem('smarthop_session_id', currentId)
      } else if (!storedId) {
        localStorage.setItem('smarthop_session_id', currentId)
      }

      setReady(true)
    }

    checkSession()
  }, [])

  if (!ready) return null

  return <>{children}</>
}
