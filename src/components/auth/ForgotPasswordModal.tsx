import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Mail, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

const resetSchema = z.object({
  email: z.string().email('Введите корректный email'),
})

type ResetFormData = z.infer<typeof resetSchema>

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { resetPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetFormData) => {
    try {
      setIsLoading(true)
      setError('')
      await resetPassword(data.email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSuccess(false)
    setError('')
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="card-apple bg-white border border-gray-100 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-8 border-b border-gray-100">
            <h2 className="text-xl font-light text-foreground tracking-tight">
              Восстановление пароля
            </h2>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="p-8">
            {success ? (

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <motion.div
                  className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-6"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <motion.div
                    className="w-10 h-10 bg-green rounded-full flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <CheckCircle className="w-6 h-6 text-white" />
                  </motion.div>
                </motion.div>

                <h3 className="text-lg font-medium text-foreground mb-3">
                  Email отправлен!
                </h3>

                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                  Мы отправили инструкции по восстановлению пароля на вашу электронную почту.
                  Проверьте входящие сообщения и следуйте указаниям в письме.
                </p>

                <motion.button
                  onClick={handleClose}
                  className="btn-primary w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  Понятно
                </motion.button>
              </motion.div>
            ) : (

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-6">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Введите ваш email адрес, и мы отправим вам ссылку для восстановления пароля.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">
                      Электронная почта
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <input
                        {...register('email')}
                        type="email"
                        className="input-apple pl-12"
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="form-error"
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl bg-red/10 border border-red/20"
                    >
                      <p className="text-sm text-red">{error}</p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="loading-spinner mr-3"></div>
                        Отправка...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        Отправить ссылку
                        <ArrowRight className="w-5 h-5 ml-2" />
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
