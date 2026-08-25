'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/store/userStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setIsLoading } = useUserStore()
  const pathname = usePathname()

  useEffect(() => {
    let profileSubscription: any = null

    const fetchLatestProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, phone, created_at')
        .eq('id', userId)
        .single()
        
      if (profile) {
        setProfile(profile)
      }
    }

    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        if (session?.user) {
          setUser(session.user)
          
          // Auto-sync/initialize profile for Google OAuth/external login
          const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
          const email = session.user.email || '';

          try {
            await supabase.from('profiles').upsert({
              id: session.user.id,
              email: email,
              full_name: fullName,
            }, { onConflict: 'id' });
          } catch (profileError) {
            console.error('Error during initializeAuth profile sync:', profileError);
          }

          await fetchLatestProfile(session.user.id)

          // Subscribe to real-time changes on profiles table for this user
          if (profileSubscription) {
            profileSubscription.unsubscribe()
          }

          profileSubscription = supabase
            .channel(`profile:${session.user.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${session.user.id}`,
              },
              (payload) => {
                console.log('Real-time profile update received:', payload.new)
                if (payload.new) {
                  setProfile(payload.new as any)
                }
              }
            )
            .subscribe()
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Error loading auth state:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for changes on auth state (log in, log out, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true)
        
        if (session?.user) {
          setUser(session.user)
          
          // Auto-sync/initialize profile for Google OAuth/external login
          const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
          const email = session.user.email || '';

          try {
            await supabase.from('profiles').upsert({
              id: session.user.id,
              email: email,
              full_name: fullName,
            }, { onConflict: 'id' });
          } catch (profileError) {
            console.error('Error during onAuthStateChange profile sync:', profileError);
          }

          await fetchLatestProfile(session.user.id)

          // Subscribe to real-time changes on profiles table for this user
          if (profileSubscription) {
            profileSubscription.unsubscribe()
          }

          profileSubscription = supabase
            .channel(`profile:${session.user.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${session.user.id}`,
              },
              (payload) => {
                console.log('Real-time profile update received:', payload.new)
                if (payload.new) {
                  setProfile(payload.new as any)
                }
              }
            )
            .subscribe()
        } else {
          setUser(null)
          setProfile(null)
          if (profileSubscription) {
            profileSubscription.unsubscribe()
            profileSubscription = null
          }
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
      if (profileSubscription) {
        profileSubscription.unsubscribe()
      }
    }
  }, [setUser, setProfile, setIsLoading, pathname])

  return <>{children}</>
}
