import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hqlkagrzztwgecxhbdgu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxbGthZ3J6enR3Z2VjeGhiZGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Njg2ODUsImV4cCI6MjA3NDA0NDY4NX0.s-bsUDRkVXbTWhPb3fcvSwEkk4wFWCM_cP4FjC0oq-8'


let supabaseInstance: SupabaseClient | null = null

const createSupabaseClient = () => {
  if (supabaseInstance) {
    return supabaseInstance
  }
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'bodygoal-app'
      }
    }
  })

  return supabaseInstance
}

export const supabase = createSupabaseClient()


export interface Profile {
  id: string
  user_id: string
  name?: string
  age?: number
  height?: number
  weight?: number
  gender?: 'male' | 'female'
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal?: 'lose' | 'maintain' | 'gain'
  target_weight?: number
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface WeightRecord {
  id: string
  user_id: string
  weight: number
  date: string
  notes?: string
  created_at: string
}

export interface MealPlan {
  id: string
  user_id: string
  name: string
  type: 'lose' | 'maintain' | 'gain'
  calories_per_day: number
  plan_data: any
  created_at: string
  updated_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  updated_at: string
}

export interface Chat {
  id: string
  type: 'direct' | 'group'
  name?: string
  created_by?: string
  created_at: string
  updated_at: string
  last_message_at: string
}

export interface ChatParticipant {
  id: string
  chat_id: string
  user_id: string
  joined_at: string
  last_read_at?: string
  is_admin: boolean
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content?: string
  message_type: 'text' | 'image' | 'video' | 'file'
  file_url?: string
  file_name?: string
  file_size?: number
  reply_to?: string
  created_at: string
  updated_at: string
  is_edited: boolean
  is_deleted: boolean
}
