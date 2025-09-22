import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  updateEmail: (newEmail: string, password: string) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {

    if (isInitialized) {
      return
    }


    const getSession = async () => {
      try {
        setIsInitialized(true)


        if (!navigator.onLine) {
          setLoading(false)
          return
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          setLoading(false)
          return
        }
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          try {
            await fetchProfile(session.user.id)
          } catch (profileError) {

          }
        }

        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }


    const timeout = setTimeout(() => {
      setLoading(false)
    }, 10000)

    getSession().finally(() => {
      clearTimeout(timeout)
    })


    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            try {
              await fetchProfile(session.user.id)
            } catch (profileError) {
            }
          } else {
            setProfile(null)
          }

          setLoading(false)
        } catch (error) {
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [isInitialized])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setProfile(null)
          return
        }
        setProfile(null)
        return
      }
      setProfile(data)
    } catch (error) {
      setProfile(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.user) {
        setUser(data.user)
        setSession(data.session)
        await fetchProfile(data.user.id)
      }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }


    if (data.user && !data.user.email_confirmed_at) {
    } else if (data.user) {
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: data.user.id,
            name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          })

        if (profileError) {
        } else {
        }
      } catch (error) {
      }
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }


      setUser(null)
      setSession(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      throw new Error('Пользователь не авторизован')
    }
    try {

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (existingProfile) {

        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }
        setProfile(data)
      } else {

        const { data, error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            name: updates.name || 'Пользователь',
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          throw new Error(error.message)
        }
        setProfile(data)
      }
    } catch (error: any) {
      throw new Error(error.message || 'Не удалось сохранить профиль')
    }
  }

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error('Пользователь не авторизован')
    }

    try {

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error('Неверный текущий пароль')
      }


      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error: any) {
      throw new Error(error.message || 'Не удалось изменить пароль')
    }
  }

  const updateEmail = async (newEmail: string, password: string) => {
    if (!user) {
      throw new Error('Пользователь не авторизован')
    }

    try {

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      })

      if (signInError) {
        throw new Error('Неверный пароль')
      }


      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error: any) {
      throw new Error(error.message || 'Не удалось изменить email')
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!user) {
      throw new Error('Пользователь не авторизован')
    }

    try {

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Файл слишком большой. Максимальный размер: 5MB')
      }


      if (!file.type.startsWith('image/')) {
        throw new Error('Можно загружать только изображения')
      }


      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const fileName = `avatar_${timestamp}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      if (profile?.avatar_url) {
        try {
          const oldPath = profile.avatar_url.split('/avatars/')[1]
          if (oldPath) {
            await supabase.storage.from('avatars').remove([oldPath])
          }
        } catch (deleteError) {
        }
      }


      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw new Error(`Ошибка загрузки: ${uploadError.message}`)
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Не удалось получить URL аватарки')
      }

      const avatarUrl = urlData.publicUrl

      await updateProfile({ avatar_url: avatarUrl })
      return avatarUrl
    } catch (error: any) {
      throw new Error(error.message || 'Не удалось загрузить аватарку')
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error: any) {
      throw new Error(error.message || 'Не удалось отправить email для сброса пароля')
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    updateEmail,
    uploadAvatar,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
