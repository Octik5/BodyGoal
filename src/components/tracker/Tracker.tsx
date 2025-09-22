import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { TrendingUp, Plus, Calendar, Weight, Target, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase, WeightRecord } from '../../lib/supabase'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export const Tracker: React.FC = () => {
  const { user, profile } = useAuth()
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingRecord, setIsAddingRecord] = useState(false)

  const fetchWeightRecords = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('weight_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (error) throw error
      setWeightRecords(data || [])
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchWeightRecords()
    }
  }, [user, fetchWeightRecords])

  const addWeightRecord = async () => {
    if (!user || !newWeight || !newDate) return

    const weightValue = parseFloat(newWeight)
    if (weightValue <= 0 || weightValue >= 500) {
      alert('Пожалуйста, введите корректный вес от 0.1 до 499.9 кг')
      return
    }

    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from('weight_records')
        .upsert({
          user_id: user.id,
          weight: weightValue,
          date: newDate,
          notes: notes.trim() || null,
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      const existingIndex = weightRecords.findIndex(
        record => record.user_id === user.id && record.date === newDate
      )

      let updatedRecords
      if (existingIndex >= 0) {
        updatedRecords = [...weightRecords]
        updatedRecords[existingIndex] = data
      } else {
        updatedRecords = [...weightRecords, data]
      }

      setWeightRecords(updatedRecords.sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ))

      setNewWeight('')
      setNewDate(new Date().toISOString().split('T')[0])
      setNotes('')
      setIsAddingRecord(false)
    } catch (error: any) {
      alert(`Ошибка сохранения: ${error.message || 'Неизвестная ошибка'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getProgressStats = () => {
    if (weightRecords.length < 2) return null

    const firstRecord = weightRecords[0]
    const lastRecord = weightRecords[weightRecords.length - 1]
    const weightChange = lastRecord.weight - firstRecord.weight
    const target = profile?.target_weight

    return {
      startWeight: firstRecord.weight,
      currentWeight: lastRecord.weight,
      weightChange,
      target,
      progress: target ? ((firstRecord.weight - lastRecord.weight) / (firstRecord.weight - target)) * 100 : null
    }
  }

  const chartData = weightRecords.map(record => ({
    date: format(new Date(record.date), 'dd.MM', { locale: ru }),
    weight: record.weight,
    fullDate: record.date
  }))

  const stats = getProgressStats()

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
            <TrendingUp className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-light text-foreground mb-4 tracking-tight">Трекер прогресса</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-normal">
            Ведите записи ежедневных измерений веса и отслеживайте прогресс к целям здоровья
          </p>
          <div className="max-w-md mx-auto mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Как это связано:</strong> Ваши данные о весе здесь обновляют статистику в Обзоре и помогают оценить эффективность ваших Планов питания.
            </p>
          </div>
        </div>
      </motion.div>
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <div className="stat-card bg-white border border-gray-100 text-center">
            <div className="flex items-center justify-center mb-4">
              <Target className="w-5 h-5 text-gray-600" />
            </div>
            <div className="stat-label">Начальный вес</div>
            <div className="stat-value">{stats.startWeight} kg</div>
          </div>

          <div className="stat-card bg-white border border-gray-100 text-center">
            <div className="flex items-center justify-center mb-4">
              <Weight className="w-5 h-5 text-gray-600" />
            </div>
            <div className="stat-label">Текущий вес</div>
            <div className="stat-value">{stats.currentWeight} kg</div>
          </div>

          <div className="stat-card bg-white border border-gray-100 text-center">
            <div className="flex items-center justify-center mb-4">
              {stats.weightChange > 0 ?
                <TrendingUp className="w-5 h-5 text-gray-600" /> :
                <TrendingDown className="w-5 h-5 text-gray-600" />
              }
            </div>
            <div className="stat-label">Изменение</div>
            <div className="stat-value">
              {stats.weightChange > 0 ? '+' : ''}{stats.weightChange.toFixed(1)} kg
            </div>
          </div>

          {stats.target && (
            <div className="stat-card bg-white border border-gray-100 text-center">
              <div className="flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-gray-600" />
              </div>
              <div className="stat-label">Целевой вес</div>
              <div className="stat-value">{stats.target} kg</div>
              {stats.progress && (
                <div className="mt-4">
                  <div className="progress-apple">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(Math.max(stats.progress, 0), 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {Math.round(stats.progress)}% to goal
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-apple bg-white border border-gray-100"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-medium text-foreground mb-2">Прогресс веса</h2>
              <p className="text-sm text-muted-foreground">Динамика изменения веса во времени</p>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center">
                <div className="w-3 h-0.5 bg-gray-800 mr-2"></div>
                Тенденция веса
              </div>
              {profile?.target_weight && (
                <div className="flex items-center">
                  <div className="w-3 h-0.5 bg-gray-400 mr-2"></div>
                  Цель: {profile.target_weight} кг
                </div>
              )}
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--gray-400)"
                  fontSize={12}
                />
                <YAxis
                  stroke="var(--gray-400)"
                  fontSize={12}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => [`${value} кг`, 'Вес']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return format(new Date(payload[0].payload.fullDate), 'dd MMMM yyyy', { locale: ru })
                    }
                    return label
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--gray-800)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--gray-800)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'var(--gray-800)' }}
                />
                {profile?.target_weight && (
                  <Line
                    type="monotone"
                    dataKey={() => profile.target_weight}
                    stroke="var(--gray-400)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-apple bg-white border border-gray-100"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-medium text-foreground mb-2">Записи веса</h2>
            <p className="text-sm text-muted-foreground">Отслеживайте ежедневные измерения</p>
          </div>
          <motion.button
            onClick={() => setIsAddingRecord(!isAddingRecord)}
            className="btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить запись
          </motion.button>
        </div>

        {isAddingRecord && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100"
          >
            <h3 className="text-lg font-medium text-foreground mb-6">Новая запись веса</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="form-group">
                <label className="form-label">Вес (кг)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="499.9"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="input-apple"
                  placeholder="70.5"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Дата</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="input-apple"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Заметки (необязательно)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-apple"
                  placeholder="Утром, после тренировки..."
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <motion.button
                onClick={addWeightRecord}
                disabled={isLoading || !newWeight || !newDate}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="loading-spinner mr-2"></div>
                    Сохранение...
                  </div>
                ) : (
                  'Сохранить запись'
                )}
              </motion.button>
              <button
                onClick={() => setIsAddingRecord(false)}
                className="btn-secondary"
              >
                Отмена
              </button>
            </div>
          </motion.div>
        )}
        <div className="space-y-3">
          {weightRecords.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Weight className="w-16 h-16 mx-auto mb-6 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Пока нет записей веса</h3>
              <p className="text-sm">Добавьте первое измерение для начала отслеживания прогресса</p>
            </div>
          ) : (
            weightRecords.slice().reverse().map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors duration-200 border border-gray-100"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-200">
                    <Weight className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-lg">
                      {record.weight} kg
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(record.date), 'EEEE, dd MMMM yyyy', { locale: ru })}
                    </div>
                    {record.notes && (
                      <div className="text-sm text-muted-foreground italic mt-1">
                        "{record.notes}"
                      </div>
                    )}
                  </div>
                </div>

                <Calendar className="w-5 h-5 text-gray-400" />
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}