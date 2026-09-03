'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/store/userStore'
import { RealtimeChannel } from '@supabase/supabase-js'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setIsLoading } = useUserStore()
  const pathname = usePathname()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const currentUserIdRef = useRef<string | null>(null)

  useEffect(() => {
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

    const setupProfileSubscription = (userId: string) => {
      // Avoid duplicate subscriptions if already subscribed to this user
      if (currentUserIdRef.current === userId && channelRef.current) {
        return
      }

      // Safely remove existing channel from Supabase client
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      currentUserIdRef.current = userId

      const newChannel = supabase
        .channel(`profile:${userId}:${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            console.log('Real-time profile update received:', payload.new)
            if (payload.new) {
              setProfile(payload.new as any)
            }
          }
        )
        .subscribe()

      channelRef.current = newChannel
    }

    const clearUserAndSubscription = () => {
      setUser(null)
      setProfile(null)
      currentUserIdRef.current = null
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }

    const handleUserSession = async (user: any) => {
      if (!user) {
        clearUserAndSubscription()
        return
      }

      setUser(user)

      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      const email = user.email || ''

      try {
        await supabase.from('profiles').upsert(
          {
            id: user.id,
            email: email,
            full_name: fullName,
          },
          { onConflict: 'id' }
        )
      } catch (profileError) {
        console.error('Error during profile sync:', profileError)
      }

      await fetchLatestProfile(user.id)
      setupProfileSubscription(user.id)
    }

    // Check active session on mount
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        await handleUserSession(session?.user || null)
      } catch (error) {
        console.error('Error loading auth state:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true)
        await handleUserSession(session?.user || null)
        setIsLoading(false)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [setUser, setProfile, setIsLoading, pathname])

  return <>{children}</>
}
