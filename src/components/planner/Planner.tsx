import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Utensils, Target, Clock, Plus, ChefHat, Apple, Coffee, Camera, Sparkles, RefreshCw, Edit3, Send, Brain, Wand2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { generateAIMealPlan, generateMealAlternatives, type MealPlanRequest, type AlternativeRequest, type UserProfile } from '../../lib/openrouter'

export const Planner: React.FC = () => {
  const { profile } = useAuth()
  const [targetCalories, setTargetCalories] = useState<number | null>(null)
  const [aiMealPlan, setAiMealPlan] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingAlternative, setIsGeneratingAlternative] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const [preferences, setPreferences] = useState<string[]>([])
  const [restrictions, setRestrictions] = useState<string[]>([])
  const [cuisine, setCuisine] = useState('')
  const [budget, setBudget] = useState<'low' | 'medium' | 'high'>('medium')


  const [alternativeReason, setAlternativeReason] = useState('')
  const [showAlternativeForm, setShowAlternativeForm] = useState(false)

  useEffect(() => {
    if (profile?.weight && profile?.height && profile?.age && profile?.gender && profile?.activity_level) {

      let bmr: number
      if (profile.gender === 'male') {
        bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age)
      } else {
        bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age)
      }

      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      }

      let tdee = bmr * activityMultipliers[profile.activity_level]


      if (profile.goal === 'lose') {
        tdee -= 500
      } else if (profile.goal === 'gain') {
        tdee += 300
      }

      setTargetCalories(Math.round(tdee))
    }
  }, [profile])

  const generatePlan = async () => {
    if (!profile || !targetCalories) return

    try {
      setIsGenerating(true)
      setError(null)

      const userProfile: UserProfile = {
        age: profile.age!,
        weight: profile.weight!,
        height: profile.height!,
        gender: profile.gender!,
        activity_level: profile.activity_level!,
        goal: profile.goal!,
        target_weight: profile.target_weight,
        tdee: targetCalories
      }

      const request: MealPlanRequest = {
        profile: userProfile,
        preferences,
        restrictions,
        cuisine,
        budget
      }

      const plan = await generateAIMealPlan(request)
      setAiMealPlan(plan)
      setShowAlternativeForm(false)
    } catch (err: any) {
      setError(err.message || 'Не удалось сгенерировать план питания')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAlternative = async () => {
    if (!aiMealPlan || !alternativeReason.trim()) return

    try {
      setIsGeneratingAlternative(true)
      setError(null)

      const request: AlternativeRequest = {
        originalPlan: aiMealPlan,
        reason: alternativeReason,
        preferences
      }

      const alternative = await generateMealAlternatives(request)
      setAiMealPlan(alternative)
      setAlternativeReason('')
      setShowAlternativeForm(false)
    } catch (err: any) {
      setError(err.message || 'Не удалось сгенерировать альтернативы')
    } finally {
      setIsGeneratingAlternative(false)
    }
  }

  const predefinedPreferences = [
    'Вегетарианство', 'Веганство', 'Безглютеновая диета', 'Кето-диета',
    'Палео-диета', 'Средиземноморская диета', 'Белковая диета', 'Низкоуглеводная диета'
  ]

  const predefinedRestrictions = [
    'Лактозная непереносимость', 'Аллергия на орехи', 'Аллергия на морепродукты',
    'Диабет', 'Гипертония', 'Без сахара', 'Без соли', 'Без красного мяса'
  ]

  const cuisineOptions = [
    { value: '', label: 'Любая кухня' },
    { value: 'русская', label: 'Русская' },
    { value: 'итальянская', label: 'Итальянская' },
    { value: 'азиатская', label: 'Азиатская' },
    { value: 'средиземноморская', label: 'Средиземноморская' },
    { value: 'японская', label: 'Японская' },
    { value: 'индийская', label: 'Индийская' }
  ]

  const togglePreference = (pref: string) => {
    setPreferences(prev =>
      prev.includes(pref)
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    )
  }

  const toggleRestriction = (restriction: string) => {
    setRestrictions(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    )
  }

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div>
          <motion.div
            className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-sm"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Utensils className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-light text-foreground mb-4 tracking-tight">Планировщик питания</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-normal">
            Создавайте персонализированные планы питания с помощью ИИ на основе ваших целей здоровья
          </p>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-apple bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 max-w-4xl mx-auto"
      >
        <div className="text-center space-y-6">
          <Brain className="w-12 h-12 text-purple-600 mx-auto" />
          <div>
            <h3 className="text-xl font-medium text-foreground mb-4">ИИ диетолог BodyGoal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                  <span className="font-semibold text-purple-600">1</span>
                </div>
                <h4 className="font-medium text-foreground">Анализ профиля</h4>
                <p>ИИ учитывает ваш возраст, вес, активность и цели для расчёта потребностей</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                  <span className="font-semibold text-purple-600">2</span>
                </div>
                <h4 className="font-medium text-foreground">Персонализация</h4>
                <p>Создаёт план с учётом ваших предпочтений, ограничений и бюджета</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                  <span className="font-semibold text-purple-600">3</span>
                </div>
                <h4 className="font-medium text-foreground">Детальный план</h4>
                <p>Предоставляет рецепты, калории, БЖУ и рекомендации по приготовлению</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {!profile?.weight || !profile?.height || !profile?.age ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-apple bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 text-center max-w-2xl mx-auto"
        >
          <Clock className="w-12 h-12 text-orange-600 mx-auto mb-6" />
          <h3 className="text-xl font-medium text-foreground mb-4">Заполните профиль для начала</h3>
          <p className="text-muted-foreground mb-6">
            Для создания персонализированного плана питания нам нужны данные из Калькулятора здоровья
          </p>
          <button className="btn-primary">
            Перейти к калькулятору
          </button>
        </motion.div>
      ) : (
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-apple bg-white border border-gray-100 text-center max-w-md mx-auto"
          >
            <Target className="w-8 h-8 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Дневная цель калорий</h3>
            <div className="text-3xl font-light text-foreground mb-2">{targetCalories?.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">
              Для {profile.goal === 'lose' ? 'снижения веса' : profile.goal === 'gain' ? 'набора веса' : 'поддержания веса'}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-apple bg-white border border-gray-100 max-w-4xl mx-auto"
          >
            <h3 className="text-xl font-medium text-foreground mb-6">Настройки плана питания</h3>

            <div className="space-y-8">
              <div>
                <h4 className="font-medium text-foreground mb-4">Диетические предпочтения</h4>
                <div className="flex flex-wrap gap-2">
                  {predefinedPreferences.map(pref => (
                    <motion.button
                      key={pref}
                      onClick={() => togglePreference(pref)}
                      className={`px-4 py-2 text-sm rounded-xl border transition-colors duration-200 ${
                        preferences.includes(pref)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {pref}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-4">Ограничения и аллергии</h4>
                <div className="flex flex-wrap gap-2">
                  {predefinedRestrictions.map(restriction => (
                    <motion.button
                      key={restriction}
                      onClick={() => toggleRestriction(restriction)}
                      className={`px-4 py-2 text-sm rounded-xl border transition-colors duration-200 ${
                        restrictions.includes(restriction)
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {restriction}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Кухня</label>
                  <select
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="input-apple"
                  >
                    {cuisineOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Бюджет</label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value as 'low' | 'medium' | 'high')}
                    className="input-apple"
                  >
                    <option value="low">Экономный</option>
                    <option value="medium">Средний</option>
                    <option value="high">Премиум</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <motion.button
                onClick={generatePlan}
                disabled={isGenerating}
                className="btn-primary text-base py-4 px-8"
                whileHover={{ scale: isGenerating ? 1 : 1.02 }}
                whileTap={{ scale: isGenerating ? 1 : 0.98 }}
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="loading-spinner mr-3"></div>
                    Генерируем план с ИИ...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-3" />
                    Сгенерировать план с ИИ
                  </div>
                )}
              </motion.button>
            </div>
          </motion.div>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-apple bg-red-50 border border-red-200 max-w-2xl mx-auto"
            >
              <p className="text-red-700 text-center">{error}</p>
            </motion.div>
          )}
          {aiMealPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="card-apple bg-white border border-gray-100 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                      <Wand2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-foreground">Ваш персональный план питания</h3>
                      <p className="text-sm text-muted-foreground">Создан ИИ диетологом специально для вас</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <motion.button
                      onClick={() => setShowAlternativeForm(!showAlternativeForm)}
                      className="btn-secondary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Изменить
                    </motion.button>
                    <motion.button
                      onClick={generatePlan}
                      disabled={isGenerating}
                      className="btn-secondary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Новый план
                    </motion.button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="whitespace-pre-line text-foreground leading-relaxed font-normal">
                    {aiMealPlan}
                  </div>
                </div>
              </div>
              {showAlternativeForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="card-apple bg-blue-50 border border-blue-200 max-w-2xl mx-auto"
                >
                  <h4 className="font-medium text-foreground mb-4">Предложить изменения</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Что бы вы хотели изменить?</label>
                      <textarea
                        value={alternativeReason}
                        onChange={(e) => setAlternativeReason(e.target.value)}
                        className="input-apple min-h-[100px] resize-none"
                        placeholder="Например: заменить рыбу на курицу, убрать молочные продукты, сделать более сытным..."
                      />
                    </div>
                    <div className="flex space-x-3">
                      <motion.button
                        onClick={generateAlternative}
                        disabled={isGeneratingAlternative || !alternativeReason.trim()}
                        className="btn-primary flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isGeneratingAlternative ? (
                          <div className="flex items-center justify-center">
                            <div className="loading-spinner mr-2"></div>
                            Создаём альтернативу...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Send className="w-4 h-4 mr-2" />
                            Получить альтернативу
                          </div>
                        )}
                      </motion.button>
                      <button
                        onClick={() => setShowAlternativeForm(false)}
                        className="btn-secondary"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-apple bg-gray-50 border border-gray-100 max-w-4xl mx-auto"
      >
        <h3 className="text-lg font-medium text-foreground mb-6 text-center">Связанные функции</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto shadow-sm">
              <Target className="w-6 h-6 text-gray-700" />
            </div>
            <h4 className="font-medium text-foreground">Трекер прогресса</h4>
            <p className="text-sm text-muted-foreground">
              Отслеживайте, как ваши планы питания помогают достигать целей по весу
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto shadow-sm">
              <Camera className="w-6 h-6 text-gray-700" />
            </div>
            <h4 className="font-medium text-foreground">ИИ анализ еды</h4>
            <p className="text-sm text-muted-foreground">
              Фотографируйте блюда и сравнивайте с рекомендациями из плана
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}