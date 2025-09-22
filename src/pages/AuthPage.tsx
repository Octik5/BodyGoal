import React, { useState } from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm'
import { motion, AnimatePresence } from 'framer-motion'

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-apple-gray-50 to-apple-gray-100"></div>

      <div className="absolute top-20 left-20 w-32 h-32 bg-apple-gray-200/30 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-apple-gray-300/20 rounded-full blur-xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-apple-gray-200/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold text-apple-gray-900 mb-4">
              Body<span className="text-apple-blue">Goal</span>
            </h1>
            <p className="text-xl text-apple-gray-600">
              Ваш персональный помощник для достижения целей
            </p>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, x: isLogin ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isLogin ? 50 : -50 }}
            transition={{ duration: 0.3 }}
          >
            {isLogin ? (
              <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
            )}
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-12"
        >
          <div className="flex items-center justify-center space-x-8 text-sm text-apple-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-apple-green rounded-full mr-2"></div>
              Отслеживание прогресса
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-apple-blue rounded-full mr-2"></div>
              Персональные планы
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-apple-orange rounded-full mr-2"></div>
              Анализ питания
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
