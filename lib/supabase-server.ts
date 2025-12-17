import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false // Disable session persistence on the server
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // These are required but won't be used since persistSession is false
        set() {},
        remove() {}
      }
    }
  )
}
