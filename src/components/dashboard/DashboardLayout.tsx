import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  Calculator,
  Target,
  TrendingUp,
  Camera,
  User,
  LogOut,
  Home,
  Settings,
  MessageCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { SettingsModal } from '../settings/SettingsModal'
import { UserStatusDisplay } from '../ui/UserStatusDisplay'
import { useSimplePresence } from '../../hooks/useSimplePresence'

interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onTabChange
}) => {
  const { user, profile, signOut } = useAuth()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)


  useSimplePresence()

  const navigation = [
    { id: 'overview', name: 'Обзор', icon: Home },
    { id: 'calculator', name: 'Калькулятор', icon: Calculator },
    { id: 'planner', name: 'Планировщик', icon: Target },
    { id: 'tracker', name: 'Трекер', icon: TrendingUp },
    { id: 'photo', name: 'Анализ фото', icon: Camera },
    { id: 'social', name: 'Чаты', icon: MessageCircle },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {

    }
  }

  return (
    <div className="min-h-screen bg-background flex font-refined">

      <div className="sidebar-apple">
        <div className="flex flex-col h-full p-8">

          <div className="mb-12">
            <div className="text-center mb-10">
              <motion.div
                className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-sm"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-2xl font-light text-primary-foreground tracking-tight">BG</span>
              </motion.div>
              <h1 className="text-2xl font-medium text-foreground mb-2 tracking-tight">
                BodyGoal
              </h1>
              <p className="text-sm text-muted-foreground font-normal">
                Контроль здоровья и фитнеса
              </p>
            </div>

            {profile && (
              <motion.div
                className="bg-gray-50 bg-opacity-50 rounded-2xl p-6 border border-gray-100 border-opacity-50 backdrop-blur-sm"
                whileHover={{ scale: 1.01, backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
                transition={{ duration: 0.2 }}
              >
                       <div className="flex items-center space-x-4">
                         <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                           {profile?.avatar_url ? (
                             <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                           ) : (
                             <User className="w-5 h-5 text-gray-600" />
                           )}
                         </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {profile.name || 'Пользователь'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <UserStatusDisplay />
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-8 h-8 bg-white bg-opacity-80 rounded-lg flex items-center justify-center hover:bg-white transition-colors duration-200 shadow-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          <nav className="flex-1">
            <ul className="space-y-2">
              {navigation.map((item, index) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={`nav-item w-full group ${isActive ? 'active' : ''}`}
                    >
                      <Icon className="w-5 h-5 mr-4" />
                      <span className="font-medium">{item.name}</span>

                      {isActive && (
                        <motion.div
                          className="ml-auto w-1.5 h-1.5 bg-gray-800 rounded-full"
                          layoutId="activeIndicator"
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </button>
                  </motion.li>
                )
              })}
            </ul>
          </nav>

          <div className="mt-8 pt-8 border-t border-gray-100 border-opacity-50 space-y-4">
            <motion.button
              onClick={handleSignOut}
              className="w-full group flex items-center px-6 py-4 text-muted-foreground hover:text-red-600 hover:bg-red-50 hover:bg-opacity-50 rounded-xl transition-all duration-200"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <LogOut className="w-4 h-4 mr-4" />
              <span className="font-medium">Выйти</span>
            </motion.button>

            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground text-opacity-60 font-normal">
                BodyGoal v2.0
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">

        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 from-opacity-50 to-transparent"></div>
        </div>

        <main className="relative flex-1 flex justify-center p-8">
          <div className="w-full max-w-6xl mx-auto">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.3,
                ease: "easeOut"
              }}
              className="relative z-10"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}