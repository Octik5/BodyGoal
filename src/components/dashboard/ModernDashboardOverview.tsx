import React, { useState, useEffect, useCallback } from 'react'
import { motion } from "framer-motion"
import {
  Target,
  TrendingUp,
  Camera,
  Calculator as CalcIcon,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Activity,
  Heart,
  Calendar,
  Scale,
  Utensils,
  Edit3,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void
}

interface Goal {
  id: string
  title: string
  is_completed: boolean
  user_id: string
  created_at?: string
  updated_at?: string
}

interface UserStats {
  currentWeight: number | null
  weightChange: number | null
  weightRecords: number
  bmi: number | null
  bmr: number | null
  tdee: number | null
}

export const ModernDashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingGoalTitle, setEditingGoalTitle] = useState('')
  const [userStats, setUserStats] = useState<UserStats>({
    currentWeight: null,
    weightChange: null,
    weightRecords: 0,
    bmi: null,
    bmr: null,
    tdee: null
  })
  const [loading, setLoading] = useState(true)


  const fetchGoals = useCallback(async () => {
    if (!user) return

    try {
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error


      setGoals(goals || [])
    } catch (error) {
    }
  }, [user])


  const handleAddGoal = async () => {
    if (!user || !newGoalTitle.trim()) return

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: newGoalTitle.trim(),
          is_completed: false
        })
        .select()
        .single()

      if (error) throw error

      setGoals(prev => [...prev, data])
      setNewGoalTitle('')
      setIsAddingGoal(false)
    } catch (error) {
    }
  }


  const handleToggleGoal = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_completed: !goal.is_completed })
        .eq('id', goalId)

      if (error) throw error

      setGoals(prev => prev.map(g =>
        g.id === goalId ? { ...g, is_completed: !g.is_completed } : g
      ))
    } catch (error) {
    }
  }


  const handleEditGoal = async (goalId: string) => {
    if (!editingGoalTitle.trim()) return

    try {
      const { error } = await supabase
        .from('goals')
        .update({ title: editingGoalTitle.trim() })
        .eq('id', goalId)

      if (error) throw error

      setGoals(prev => prev.map(g =>
        g.id === goalId ? { ...g, title: editingGoalTitle.trim() } : g
      ))
      setEditingGoalId(null)
      setEditingGoalTitle('')
    } catch (error) {
    }
  }


  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)

      if (error) throw error

      setGoals(prev => prev.filter(g => g.id !== goalId))
    } catch (error) {
    }
  }


  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user || !profile) {
        setLoading(false)
        return
      }

      try {

        const { data: weightRecords, error: weightError } = await supabase
          .from('weight_records')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true })

        if (weightError) throw weightError


        const stats: UserStats = {
          currentWeight: null,
          weightChange: null,
          weightRecords: weightRecords?.length || 0,
          bmi: null,
          bmr: null,
          tdee: null
        }

        if (weightRecords && weightRecords.length > 0) {
          const latestWeight = weightRecords[weightRecords.length - 1]
          stats.currentWeight = latestWeight.weight

          if (weightRecords.length > 1) {
            const firstWeight = weightRecords[0]
            stats.weightChange = latestWeight.weight - firstWeight.weight
          }
        }


        if (profile.weight && profile.height) {
          stats.bmi = profile.weight / ((profile.height / 100) * (profile.height / 100))
        }

        if (profile.weight && profile.height && profile.age && profile.gender && profile.activity_level) {

          if (profile.gender === 'male') {
            stats.bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age)
          } else {
            stats.bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age)
          }


          const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9,
          }

          if (stats.bmr) {
            stats.tdee = stats.bmr * activityMultipliers[profile.activity_level]
          }
        }

        setUserStats(stats)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    fetchUserStats()
    fetchGoals()
  }, [user, profile, fetchGoals])


  const getStatsData = () => {
    const data = []


    if (userStats.bmi) {
      const bmiCategory = userStats.bmi < 18.5 ? 'Низкий' :
                         userStats.bmi < 25 ? 'Норма' :
                         userStats.bmi < 30 ? 'Высокий' : 'Очень высокий'
      const bmiPercentage = Math.min((userStats.bmi / 30) * 100, 100)

      data.push({
        name: "Индекс массы тела",
        stat: userStats.bmi.toFixed(1),
        limit: "25.0",
        percentage: bmiPercentage,
        icon: Heart,
        status: bmiCategory === 'Низкий' ? 'Низкий' :
                bmiCategory === 'Норма' ? 'Норма' :
                bmiCategory === 'Высокий' ? 'Высокий' : 'Очень высокий'
      })
    }


    if (userStats.tdee) {
      data.push({
        name: "Дневные калории",
        stat: Math.round(userStats.tdee).toLocaleString(),
        limit: "Цель",
        percentage: 85,
        icon: Activity,
        status: "Рассчитано"
      })
    }


    if (userStats.currentWeight) {
      data.push({
        name: "Текущий вес",
        stat: `${userStats.currentWeight} кг`,
        limit: profile?.target_weight ? `${profile.target_weight} кг` : "Цель",
        percentage: profile?.target_weight ?
          Math.abs((userStats.currentWeight - profile.target_weight) / userStats.currentWeight * 100) : 50,
        icon: Scale,
        status: userStats.weightChange ?
          (userStats.weightChange > 0 ? `+${userStats.weightChange.toFixed(1)} кг` : `${userStats.weightChange.toFixed(1)} кг`) :
          "Без изменений"
      })
    }


    data.push({
      name: "Записи веса",
      stat: userStats.weightRecords.toString(),
      limit: "Всего",
      percentage: Math.min(userStats.weightRecords * 10, 100),
      icon: TrendingUp,
      status: userStats.weightRecords > 0 ? "Активно" : "Начать отслеживание"
    })

    return data
  }

  const statsData = getStatsData()

  const features = [
    {
      id: 'calculator',
      title: 'Калькулятор здоровья',
      description: 'Настройка профиля с метриками тела (ИМТ, БМР, КДАЖ) и целями здоровья',
      icon: CalcIcon,
      status: profile ? 'Завершено' : 'Требует настройки',
      purpose: 'Основа для всех расчётов здоровья и персонализированных рекомендаций'
    },
    {
      id: 'tracker',
      title: 'Трекер прогресса',
      description: 'Ведите записи ежедневных измерений веса и отслеживайте прогресс',
      icon: TrendingUp,
      status: userStats.weightRecords > 0 ? `${userStats.weightRecords} записей` : 'Начать отслеживание',
      purpose: 'Отслеживайте свой путь к целевому весу и измеряйте достижения'
    },
    {
      id: 'planner',
      title: 'Планировщик питания',
      description: 'Создание персонализированных планов питания на основе ваших целей и потребностей в калориях',
      icon: Utensils,
      status: userStats.tdee ? 'Доступно' : 'Сначала заполните профиль',
      purpose: 'Создавайте планы питания, соответствующие вашему КДАЖ и фитнес-целям'
    },
    {
      id: 'photo',
      title: 'ИИ анализ еды',
      description: 'Загружайте фото еды для мгновенной оценки калорий и питательной ценности',
      icon: Camera,
      status: 'ИИ готов',
      purpose: 'Быстрое отслеживание питания через визуальное распознавание продуктов'
    },
  ]

  const completedGoals = goals.filter(goal => goal.is_completed).length
  const goalProgress = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0

  if (loading) {
    return (
      <div className="space-y-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загружаем ваши данные о здоровье...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <motion.div
        className="text-center space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-5xl font-light text-foreground mb-4 tracking-tight">
            {new Date().getHours() < 6 ? 'Доброй ночи' :
             new Date().getHours() < 12 ? 'Доброе утро' :
             new Date().getHours() < 18 ? 'Добрый день' : 'Добрый вечер'}
            {profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-lg text-muted-foreground font-normal max-w-2xl mx-auto">
            Ваш путь к здоровью продолжается сегодня
          </p>
        </div>
      </motion.div>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {statsData.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              whileHover={{ y: -2 }}
              className="stat-card bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-6">
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="text-xs text-muted-foreground font-medium">
                  {item.status || 'Текущий'}
                </span>
              </div>

              <div className="stat-label mb-2">{item.name}</div>
              <div className="stat-value mb-6">{item.stat}</div>

              <div className="space-y-3">
                <div className="progress-apple">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{Math.round(item.percentage)}%</span>
                  <span className="text-muted-foreground">{item.limit}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="card-apple bg-white border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-medium text-foreground mb-2">Сегодняшние цели</h3>
              <p className="text-sm text-muted-foreground">{completedGoals} из {goals.length} выполнено</p>
            </div>
            <button
              onClick={() => setIsAddingGoal(true)}
              className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
            >
              <Plus className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="mb-8">
            <div className="progress-apple">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </div>
            <div className="flex justify-between mt-3 text-sm">
              <span className="text-foreground font-medium">{Math.round(goalProgress)}% выполнено</span>
              <span className="text-muted-foreground">{goals.length} целей</span>
            </div>
          </div>
          {isAddingGoal && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="Введите новую цель..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                />
                <button
                  onClick={handleAddGoal}
                  disabled={!newGoalTitle.trim()}
                  className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsAddingGoal(false)
                    setNewGoalTitle('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
          <div className="space-y-3">
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                className={`group flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                  goal.is_completed
                    ? 'bg-gray-50 border border-gray-100'
                    : 'hover:bg-gray-50 border border-transparent hover:border-gray-100'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.05 }}
              >
                {editingGoalId === goal.id ? (
                  <>
                    <CheckCircle2
                      className={`w-5 h-5 transition-colors duration-200 ${
                        goal.is_completed ? 'text-gray-800' : 'text-gray-300'
                      }`}
                    />
                    <input
                      type="text"
                      value={editingGoalTitle}
                      onChange={(e) => setEditingGoalTitle(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-gray-300"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handleEditGoal(goal.id)}
                    />
                    <button
                      onClick={() => handleEditGoal(goal.id)}
                      disabled={!editingGoalTitle.trim()}
                      className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingGoalId(null)
                        setEditingGoalTitle('')
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggleGoal(goal.id)}
                      className="flex-shrink-0"
                    >
                      <CheckCircle2
                        className={`w-5 h-5 transition-colors duration-200 ${
                          goal.is_completed ? 'text-gray-800' : 'text-gray-300'
                        }`}
                      />
                    </button>
                    <span
                      className={`text-sm text-left flex-1 transition-colors duration-200 ${
                        goal.is_completed
                          ? 'text-muted-foreground line-through'
                          : 'text-foreground'
                      }`}
                    >
                      {goal.title}
                    </span>
                    <button
                      onClick={() => {
                        setEditingGoalId(goal.id)
                        setEditingGoalTitle(goal.title)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </motion.div>
            ))}
            {goals.length === 0 && !isAddingGoal && (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <h4 className="text-lg font-medium text-gray-700 mb-2">Начните с ваших целей</h4>
                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                  Создайте персональные цели для отслеживания вашего прогресса в здоровье и фитнесе
                </p>
                <button
                  onClick={() => setIsAddingGoal(true)}
                  className="btn-primary text-sm px-6 py-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить первую цель
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="card-apple bg-white border border-gray-100">
          <div className="mb-8">
            <h3 className="text-xl font-medium text-foreground mb-2">Быстрый доступ</h3>
            <p className="text-sm text-muted-foreground">Основные инструменты здоровья под рукой</p>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="group cursor-pointer"
                  onClick={() => onNavigate(feature.id)}
                >
                  <div className="flex items-start p-6 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-100 hover:border-gray-200">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow transition-shadow duration-200 mr-4">
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground group-hover:text-gray-900 transition-colors duration-200">
                          {feature.title}
                        </h4>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium border ${
                          feature.status === 'Завершено' || feature.status === 'Доступно' || feature.status === 'ИИ готов' ?
                            'bg-green-50 text-green-700 border-green-200' :
                          feature.status.includes('записей') ?
                            'bg-blue-50 text-blue-700 border-blue-200' :
                          feature.status === 'Требует настройки' || feature.status === 'Сначала заполните профиль' ?
                            'bg-orange-50 text-orange-700 border-orange-200' :
                          feature.status === 'Начать отслеживание' ?
                            'bg-gray-50 text-gray-600 border-gray-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {feature.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">
                        {feature.description}
                      </p>
                      <p className="text-xs text-gray-500 mb-4 italic">
                        {feature.purpose}
                      </p>
                      <div className="flex items-center text-gray-700 text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                        {feature.status === 'Требует настройки' || feature.status === 'Сначала заполните профиль' ? 'Настроить' :
                         feature.status === 'Начать отслеживание' ? 'Начать' : 'Открыть'}
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
      {!profile && (
        <motion.div
          className="card-apple bg-gray-50 text-center border border-gray-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-6" />
          <h4 className="text-xl font-medium text-foreground mb-4">Заполните ваш профиль</h4>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Настройте профиль здоровья для получения персонализированной аналитики и отслеживания вашего пути к здоровью
          </p>
          <motion.button
            className="btn-primary"
            onClick={() => onNavigate('calculator')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CalcIcon className="w-5 h-5 mr-3" />
            Начать
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}