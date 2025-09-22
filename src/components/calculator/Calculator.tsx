import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calculator as CalcIcon, Save, Heart, Target, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

const profileSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  age: z.number().min(10, 'Возраст должен быть больше 10').max(120, 'Возраст должен быть меньше 120'),
  height: z.number().min(100, 'Рост должен быть больше 100 см').max(250, 'Рост должен быть меньше 250 см'),
  weight: z.number().min(30, 'Вес должен быть больше 30 кг').max(500, 'Вес должен быть меньше 500 кг'),
  gender: z.enum(['male', 'female']),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose', 'maintain', 'gain']),
  target_weight: z.number().min(30, 'Целевой вес должен быть больше 30 кг').max(500, 'Целевой вес должен быть меньше 500 кг').optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface CalculatorProps {
  onProfileSaved?: () => void
}

export const Calculator: React.FC<CalculatorProps> = ({ onProfileSaved }) => {
  const { profile, updateProfile } = useAuth()
  const [bmi, setBmi] = useState<number | null>(null)
  const [bmr, setBmr] = useState<number | null>(null)
  const [tdee, setTdee] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile || {},
  })

  const watchedValues = watch()

  useEffect(() => {
    if (profile) {
      const fields = ['name', 'age', 'height', 'weight', 'gender', 'activity_level', 'goal', 'target_weight'] as const
      fields.forEach(field => {
        if (profile[field] !== undefined) {
          setValue(field, profile[field] as any)
        }
      })
    }
  }, [profile, setValue])

  useEffect(() => {
    const { weight, height, age, gender, activity_level } = watchedValues

    if (weight && height) {
      const calculatedBmi = weight / ((height / 100) * (height / 100))
      setBmi(calculatedBmi)
    } else {
      setBmi(null)
    }

    if (weight && height && age && gender && activity_level) {
      let calculatedBmr: number
      if (gender === 'male') {
        calculatedBmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
      } else {
        calculatedBmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
      }
      setBmr(calculatedBmr)

      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      }
      const calculatedTdee = calculatedBmr * activityMultipliers[activity_level]
      setTdee(calculatedTdee)
    } else {
      setBmr(null)
      setTdee(null)
    }
  }, [watchedValues])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      await updateProfile(data)

      setSuccess(true)

      setTimeout(() => {
        setSuccess(false)
        onProfileSaved?.()
      }, 1500)
    } catch (error: any) {
      setError(error.message || 'Не удалось сохранить профиль')
    } finally {
      setIsLoading(false)
    }
  }

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Недостаточный вес', color: 'text-gray-600' }
    if (bmi < 25) return { category: 'Норма', color: 'text-gray-800' }
    if (bmi < 30) return { category: 'Избыточный вес', color: 'text-gray-600' }
    return { category: 'Ожирение', color: 'text-gray-600' }
  }

  const bmiCategory = bmi ? getBmiCategory(bmi) : null

  const activityLevels = [
    { value: 'sedentary', label: 'Малоподвижный (без упражнений)' },
    { value: 'light', label: 'Лёгкая активность (1-3 раза в неделю)' },
    { value: 'moderate', label: 'Умеренная активность (3-5 раз в неделю)' },
    { value: 'active', label: 'Активный (6-7 раз в неделю)' },
    { value: 'very_active', label: 'Очень активный (ежедневные интенсивные тренировки)' },
  ]

  const goals = [
    { value: 'lose', label: 'Снизить вес', description: 'Создать дефицит калорий' },
    { value: 'maintain', label: 'Поддерживать вес', description: 'Сбалансировать потребление и расход' },
    { value: 'gain', label: 'Набрать вес', description: 'Наращивать мышечную массу' },
  ]

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
            <CalcIcon className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h2 className="text-4xl font-light text-foreground mb-4 tracking-tight">Калькулятор здоровья</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-normal">
            Заполните профиль здоровья для получения персонализированной аналитики
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="card-apple bg-white border border-gray-100 max-w-4xl mx-auto"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <div className="space-y-8">
            <h3 className="text-xl font-medium text-foreground">Личная информация</h3>

            <div className="form-group">
              <label htmlFor="name" className="form-label">Полное имя</label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="input-apple"
                placeholder="Введите ваше полное имя"
              />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="form-group">
                <label htmlFor="age" className="form-label">Возраст</label>
                <input
                  id="age"
                  type="number"
                  {...register('age', { valueAsNumber: true })}
                  className="input-apple"
                  placeholder="25"
                />
                {errors.age && <p className="form-error">{errors.age.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="height" className="form-label">Рост (см)</label>
                <input
                  id="height"
                  type="number"
                  {...register('height', { valueAsNumber: true })}
                  className="input-apple"
                  placeholder="170"
                />
                {errors.height && <p className="form-error">{errors.height.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="weight" className="form-label">Вес (кг)</label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  {...register('weight', { valueAsNumber: true })}
                  className="input-apple"
                  placeholder="70.5"
                />
                {errors.weight && <p className="form-error">{errors.weight.message}</p>}
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <h3 className="text-xl font-medium text-foreground">Активность и цели</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="form-group">
                <label htmlFor="gender" className="form-label">Пол</label>
                <select
                  id="gender"
                  {...register('gender')}
                  className="input-apple"
                >
                  <option value="">Выберите пол</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
                {errors.gender && <p className="form-error">{errors.gender.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="activity_level" className="form-label">Уровень активности</label>
                <select
                  id="activity_level"
                  {...register('activity_level')}
                  className="input-apple"
                >
                  <option value="">Выберите уровень активности</option>
                  {activityLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
                {errors.activity_level && <p className="form-error">{errors.activity_level.message}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Цель</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goals.map(goal => (
                  <motion.label
                    key={goal.value}
                    className={`cursor-pointer transition-all duration-200 p-6 bg-gray-50 hover:bg-gray-100 rounded-xl border ${
                      watchedValues.goal === goal.value
                        ? 'border-gray-300 bg-gray-100'
                        : 'border-gray-100'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <input
                      type="radio"
                      {...register('goal')}
                      value={goal.value}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="font-medium text-foreground mb-1">{goal.label}</div>
                      <div className="text-sm text-muted-foreground">{goal.description}</div>
                    </div>
                  </motion.label>
                ))}
              </div>
              {errors.goal && <p className="form-error">{errors.goal.message}</p>}
            </div>

            {watchedValues.goal && watchedValues.goal !== 'maintain' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="form-group"
              >
                <label htmlFor="target_weight" className="form-label">Целевой вес (кг)</label>
                <input
                  id="target_weight"
                  type="number"
                  step="0.1"
                  {...register('target_weight', { valueAsNumber: true })}
                  className="input-apple"
                  placeholder="65.0"
                />
                {errors.target_weight && <p className="form-error">{errors.target_weight.message}</p>}
              </motion.div>
            )}
          </div>
          {(bmi || bmr || tdee) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-8 border-t border-gray-100"
            >
              <h3 className="text-xl font-medium text-foreground mb-8">Ваши показатели здоровья</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {bmi && (
                  <div className="stat-card bg-gray-50 border border-gray-100 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <Heart className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="stat-label">ИМТ</div>
                    <div className="stat-value">{bmi.toFixed(1)}</div>
                    {bmiCategory && (
                      <div className={`text-sm font-medium mt-2 ${bmiCategory.color}`}>
                        {bmiCategory.category}
                      </div>
                    )}
                  </div>
                )}
                {bmr && (
                  <div className="stat-card bg-gray-50 border border-gray-100 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <Zap className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="stat-label">БМР</div>
                    <div className="stat-value">{bmr.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground mt-2">калорий/день</div>
                  </div>
                )}
                {tdee && (
                  <div className="stat-card bg-gray-50 border border-gray-100 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <Target className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="stat-label">КДАЖ</div>
                    <div className="stat-value">{tdee.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground mt-2">калорий/день</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-gray-50 border border-gray-200"
            >
              <p className="text-sm text-foreground font-medium">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-gray-50 border border-gray-200"
            >
              <p className="text-sm text-foreground font-medium">✓ Профиль успешно сохранён</p>
              <p className="text-xs text-muted-foreground mt-1">Изменения применены</p>
            </motion.div>
          )}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full text-base py-4"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner mr-3"></div>
                Сохранение профиля...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Save className="w-5 h-5 mr-3" />
                Сохранить профиль здоровья
              </div>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}