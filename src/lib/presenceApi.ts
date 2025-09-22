import { supabase } from './supabase'

export interface UserPresence {
  id: string
  user_id: string
  status: 'online' | 'offline' | 'away' | 'busy'
  last_seen: string
  last_activity: string
  created_at: string
  updated_at: string
}

export class PresenceApi {

  static async setUserOnline() {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) return null

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('user_presence')
      .upsert({
        user_id: currentUser.user.id,
        status: 'online',
        last_seen: now,
        last_activity: now
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      return null
    }

    return data
  }


  static async setUserOffline() {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) return null

    const { data, error } = await supabase
      .from('user_presence')
      .update({
        status: 'offline',
        last_seen: new Date().toISOString()
      })
      .eq('user_id', currentUser.user.id)
      .select()
      .single()

    if (error) {
      return null
    }

    return data
  }


  static async getUserPresence(userId: string): Promise<UserPresence | null> {
    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      return null
    }

    return data
  }


  static async getMultipleUserPresence(userIds: string[]): Promise<UserPresence[]> {
    if (userIds.length === 0) return []

    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .in('user_id', userIds)

    if (error) {
      return []
    }

    return data || []
  }


  static async updateActivity() {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) return

    await supabase
      .from('user_presence')
      .update({
        last_activity: new Date().toISOString()
      })
      .eq('user_id', currentUser.user.id)
  }
}
