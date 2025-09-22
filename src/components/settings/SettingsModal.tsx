import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Lock, Mail, Camera, Eye, EyeOff, Save, Upload } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Минимум 6 символов'),
  newPassword: z.string().min(6, 'Минимум 6 символов'),
  confirmPassword: z.string().min(6, 'Минимум 6 символов'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

const emailSchema = z.object({
  newEmail: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Введите пароль для подтверждения'),
})

type PasswordFormData = z.infer<typeof passwordSchema>
type EmailFormData = z.infer<typeof emailSchema>

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, profile, updateProfile, updatePassword, updateEmail, uploadAvatar } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'email'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  const tabs = [
    { id: 'profile' as const, label: 'Профиль', icon: User },
    { id: 'password' as const, label: 'Пароль', icon: Lock },
    { id: 'email' as const, label: 'Email', icon: Mail },
  ]

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Можно загружать только изображения')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер: 5MB')
      return
    }

    setError(null)
    setAvatarFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      await updatePassword(data.currentPassword, data.newPassword)

      setSuccess('Пароль успешно изменён')
      passwordForm.reset()
    } catch (err: any) {
      setError(err.message || 'Ошибка смены пароля')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = async (data: EmailFormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      await updateEmail(data.newEmail, data.password)

      setSuccess('Email успешно изменён. Проверьте почту для подтверждения.')
      emailForm.reset()
    } catch (err: any) {
      setError(err.message || 'Ошибка смены email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      await uploadAvatar(avatarFile)

      setSuccess('Аватар успешно обновлён')
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки аватара')
    } finally {
      setIsLoading(false)
    }
  }

  const resetMessages = () => {
    setSuccess(null)
    setError(null)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="card-apple bg-white border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-8 border-b border-gray-100">
            <h2 className="text-2xl font-light text-foreground tracking-tight">
              Настройки профиля
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    resetMessages()
                  }}
                  className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-foreground bg-gray-50 border-b-2 border-gray-800'
                      : 'text-muted-foreground hover:text-foreground hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div className="p-8 overflow-y-auto max-h-[60vh]">
            {(success || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl mb-6 ${
                  success
                    ? 'bg-green/10 border border-green/20 text-green'
                    : 'bg-red/10 border border-red/20 text-red'
                }`}
              >
                <p className="text-sm font-medium">
                  {success || error}
                </p>
              </motion.div>
            )}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-gray-600" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors duration-200 shadow-lg">
                      <Camera className="w-5 h-5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {avatarFile && (
                    <div className="mt-4">
                      <button
                        onClick={handleAvatarUpload}
                        disabled={isLoading}
                        className="btn-primary disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="loading-spinner mr-2"></div>
                            Загружаем...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Upload className="w-4 h-4 mr-2" />
                            Сохранить аватар
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Имя</label>
                    <input
                      type="text"
                      value={profile?.name || 'Пользователь'}
                      className="input-apple"
                      placeholder="Ваше имя"
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Имя можно изменить в калькуляторе здоровья
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="input-apple"
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Для смены email используйте соответствующую вкладку
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'password' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Текущий пароль</label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('currentPassword')}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="input-apple pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="form-error">{passwordForm.formState.errors.currentPassword.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Новый пароль</label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('newPassword')}
                        type={showNewPassword ? 'text' : 'password'}
                        className="input-apple pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="form-error">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Подтвердите новый пароль</label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('confirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="input-apple pr-12"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="form-error">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="loading-spinner mr-2"></div>
                        Обновление...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Save className="w-4 h-4 mr-2" />
                        Изменить пароль
                      </div>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
            {activeTab === 'email' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Текущий email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="input-apple"
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Новый email</label>
                    <input
                      {...emailForm.register('newEmail')}
                      type="email"
                      className="input-apple"
                      placeholder="new@email.com"
                    />
                    {emailForm.formState.errors.newEmail && (
                      <p className="form-error">{emailForm.formState.errors.newEmail.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Подтвердите паролем</label>
                    <input
                      {...emailForm.register('password')}
                      type="password"
                      className="input-apple"
                      placeholder="••••••••"
                    />
                    {emailForm.formState.errors.password && (
                      <p className="form-error">{emailForm.formState.errors.password.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Введите текущий пароль для подтверждения смены email
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="loading-spinner mr-2"></div>
                        Обновление...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Save className="w-4 h-4 mr-2" />
                        Изменить email
                      </div>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
