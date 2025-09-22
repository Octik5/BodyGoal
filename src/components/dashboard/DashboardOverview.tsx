import React from 'react'
import { motion } from 'framer-motion'
import {
  Calculator as CalcIcon,
  Target,
  TrendingUp,
  Camera,
  User,
  Activity,
  Calendar,
  BarChart3
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { profile, user } = useAuth()

  const features = [
    {
      id: 'calculator',
      title: 'Калькулятор здоровья',
      description: 'Рассчитайте ИМТ, базовый метаболизм и суточную норму калорий',
      icon: CalcIcon,
      color: 'from-blue-500 to-blue-600',
      status: profile ? 'Профиль заполнен' : 'Заполните профиль'
    },
    {
      id: 'planner',
      title: 'Планировщик целей',
      description: 'Выберите цель и получите персональный план питания',
      icon: Target,
      color: 'from-green-500 to-green-600',
      status: profile?.goal ? `Цель: ${profile.goal === 'lose' ? 'Сбросить вес' : profile.goal === 'gain' ? 'Набрать вес' : 'Удержать вес'}` : 'Выберите цель'
    },
    {
      id: 'tracker',
      title: 'Трекер прогресса',
      description: 'Отслеживайте свой вес и прогресс достижения целей',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      status: 'Добавьте первый замер'
    },
    {
      id: 'photo',
      title: 'Анализатор калорий',
      description: 'Загрузите фото еды и узнайте количество калорий',
      icon: Camera,
      color: 'from-orange-500 to-orange-600',
      status: 'ИИ анализ фотографий'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-apple-gray-900 mb-2">
          Добро пожаловать в BodyGoal
        </h1>
        <p className="text-apple-gray-600">
          {profile?.name ? `Привет, ${profile.name}!` : `Привет, ${user?.email}!`}
          {' '}Выберите инструмент для достижения ваших целей
        </p>
      </motion.div>
      {profile && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="bg-white rounded-apple p-4 border border-apple-gray-200">
            <div className="flex items-center">
              <User className="w-8 h-8 text-apple-blue mr-3" />
              <div>
                <p className="text-sm text-apple-gray-600">Возраст</p>
                <p className="text-xl font-semibold">{profile.age || '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-apple p-4 border border-apple-gray-200">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-apple-green mr-3" />
              <div>
                <p className="text-sm text-apple-gray-600">Рост</p>
                <p className="text-xl font-semibold">{profile.height ? `${profile.height} см` : '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-apple p-4 border border-apple-gray-200">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-apple-purple mr-3" />
              <div>
                <p className="text-sm text-apple-gray-600">Вес</p>
                <p className="text-xl font-semibold">{profile.weight ? `${profile.weight} кг` : '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-apple p-4 border border-apple-gray-200">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-apple-orange mr-3" />
              <div>
                <p className="text-sm text-apple-gray-600">Цель</p>
                <p className="text-xl font-semibold">{profile.target_weight ? `${profile.target_weight} кг` : '—'}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <motion.div
              key={feature.id}
              variants={itemVariants}
              className="group cursor-pointer"
              onClick={() => onNavigate(feature.id)}
            >
              <div className="bg-white rounded-apple p-6 border border-apple-gray-200 hover:border-apple-gray-300 transition-all duration-300 hover:shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-apple bg-gradient-to-r ${feature.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-apple-gray-900 mb-2 group-hover:text-apple-blue transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-apple-gray-600 text-sm mb-3">
                      {feature.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-apple-gray-100 text-apple-gray-600 rounded-full">
                        {feature.status}
                      </span>
                      <span className="text-apple-blue text-sm font-medium group-hover:translate-x-1 transition-transform">
                        Открыть →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
      {!profile && (
        <motion.div
          className="mt-8 p-6 bg-apple-blue/5 rounded-apple border border-apple-blue/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-apple-blue mt-0.5" />
            <div>
              <h4 className="font-medium text-apple-blue mb-1">Начните с калькулятора здоровья</h4>
              <p className="text-sm text-apple-gray-600">
                Заполните ваш профиль, чтобы получить персонализированные рекомендации и планы питания
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
