import { useEffect, useCallback, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'


export const useSimplePresence = () => {
  const { user } = useAuth()

  const setOnline = useCallback(async () => {
    if (!user) return

    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: 'online',
          last_seen: new Date().toISOString(),
          last_activity: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
    } catch (error) {
    }
  }, [user])

  const setOffline = useCallback(async () => {
    if (!user) return

    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: 'offline',
          last_seen: new Date().toISOString(),
          last_activity: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
    } catch (error) {
    }
  }, [user])

  useEffect(() => {
    if (!user) return


    setOnline()


    const heartbeat = setInterval(setOnline, 15000)


    const cleanup = setInterval(async () => {

      try {
        const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
        const { data, error } = await supabase
          .from('user_presence')
          .update({ status: 'offline', last_seen: new Date().toISOString() })
          .eq('status', 'online')
          .lt('last_activity', oneMinuteAgo)

        if (error) {
        } else {
        }
      } catch (error) {
      }


      try {
        const { data, error } = await supabase.rpc('update_offline_users')
        if (error) {
        } else {
        }
      } catch (error) {
      }
    }, 15000)


    const handleBeforeUnload = () => {

      setOffline()
    }


    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline()
      } else {
        setOnline()
      }
    }


    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)
    window.addEventListener('unload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)


    return () => {
      clearInterval(heartbeat)
      clearInterval(cleanup)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
      window.removeEventListener('unload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      setOffline()
    }
  }, [user, setOnline, setOffline])
}


export const useFriendsOnlineStatus = (friendIds: string[]) => {
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (friendIds.length === 0) {
      setOnlineStatuses({})
      return
    }

    const loadStatuses = async () => {
      try {
        const { data } = await supabase
          .from('user_presence')
          .select('user_id, status, last_activity')
          .in('user_id', friendIds)

        const statuses: Record<string, boolean> = {}
        const now = new Date()

        friendIds.forEach(id => {
          const presence = data?.find(p => p.user_id === id)
          if (!presence) {
            statuses[id] = false
            return
          }


          const lastActivity = new Date(presence.last_activity)
          const secondsSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / 1000)


          statuses[id] = presence.status === 'online' && secondsSinceActivity <= 45
        })
        setOnlineStatuses(statuses)
      } catch (error) {
      }
    }

    loadStatuses()


    const statusCheckInterval = setInterval(loadStatuses, 5000)


    const subscription = supabase
      .channel(`presence_changes_${Math.random()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload: any) => {

          const newRecord = payload.new
          const oldRecord = payload.old
          const eventType = payload.eventType

          if (eventType === 'DELETE' && oldRecord) {

            if (friendIds.includes(oldRecord.user_id)) {
              setOnlineStatuses(prev => ({
                ...prev,
                [oldRecord.user_id]: false
              }))
            }
          } else if (newRecord && typeof newRecord === 'object' && newRecord.user_id) {

            if (friendIds.includes(newRecord.user_id)) {

              const now = new Date()
              const lastActivity = new Date(newRecord.last_activity)
              const secondsSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / 1000)


              const actuallyOnline = newRecord.status === 'online' && secondsSinceActivity <= 45
              setOnlineStatuses(prev => ({
                ...prev,
                [newRecord.user_id]: actuallyOnline
              }))
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
        }
        if (status === 'SUBSCRIBED') {
        }
      })

    return () => {
      clearInterval(statusCheckInterval)
      subscription.unsubscribe()
    }
  }, [friendIds.join(',')])

  return onlineStatuses
}
