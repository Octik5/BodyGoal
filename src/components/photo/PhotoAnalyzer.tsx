import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, Sparkles, AlertCircle } from 'lucide-react'
import { analyzeCaloriesFromImage, convertImageToBase64 } from '../../lib/openrouter'

interface PhotoAnalyzerProps {}

export const PhotoAnalyzer: React.FC<PhotoAnalyzerProps> = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setError(null)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setError(null)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const analyzePhoto = async () => {
    if (!selectedFile) return

    try {
      setIsLoading(true)
      setError(null)

      const base64Image = await convertImageToBase64(selectedFile)
      const result = await analyzeCaloriesFromImage(base64Image)

      setAnalysis(result)
    } catch (err: any) {
      setError(err.message || 'Ошибка анализа изображения')
    } finally {
      setIsLoading(false)
    }
  }


  const clearAll = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setAnalysis(null)
    setError(null)
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
            <Camera className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-light text-foreground mb-4 tracking-tight">ИИ анализ еды</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-normal">
            Загрузите фото блюда для мгновенной оценки калорий и питательной ценности
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-apple bg-white border border-gray-100 max-w-2xl mx-auto"
      >
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-gray-300 transition-colors duration-200"
        >
          {previewUrl ? (
            <div className="space-y-6">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Предварительный просмотр"
                  className="max-w-full max-h-80 mx-auto rounded-xl object-cover shadow-md"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-xs font-medium text-gray-600">
                  {selectedFile?.name}
                </div>
              </div>
              <div className="flex justify-center space-x-4">
                <motion.button
                  onClick={analyzePhoto}
                  disabled={isLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="loading-spinner mr-3"></div>
                      Анализируем...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Sparkles className="w-5 h-5 mr-3" />
                      Анализировать с ИИ
                    </div>
                  )}
                </motion.button>
                <button
                  onClick={clearAll}
                  className="btn-secondary"
                >
                  Выбрать другое фото
                </button>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <div className="space-y-6">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center">
                  <Upload className="w-10 h-10 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-foreground mb-2">
                    Загрузите фото блюда
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Перетащите изображение в эту область или выберите файл с устройства
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          )}
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-apple bg-red-50 border border-red-200 max-w-2xl mx-auto"
        >
          <div className="flex items-start p-2">
            <AlertCircle className="w-5 h-5 text-red-600 mr-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800 mb-2">Ошибка анализа</h3>
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={clearAll}
                className="mt-4 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="card-apple bg-white border border-gray-100 max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Результат анализа</h3>
                <p className="text-muted-foreground">ИИ проанализировал ваше блюдо</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {analysis.dish_name && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="text-lg font-semibold text-foreground mb-2">{analysis.dish_name}</h4>
                  {analysis.portion_weight && (
                    <p className="text-sm text-muted-foreground">Примерный вес порции: {analysis.portion_weight}г</p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">{analysis.calories || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Калории</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{analysis.protein || 'N/A'}г</div>
                  <div className="text-sm text-muted-foreground">Белки</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{analysis.carbs || 'N/A'}г</div>
                  <div className="text-sm text-muted-foreground">Углеводы</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-600">{analysis.fats || 'N/A'}г</div>
                  <div className="text-sm text-muted-foreground">Жиры</div>
                </div>
              </div>
              
              {analysis.description && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <p className="text-blue-800">{analysis.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-apple bg-blue-50 border border-blue-200 max-w-2xl mx-auto">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Рекомендации</h4>
                <p className="text-sm text-blue-800">
                  {analysis.recommendations || 'Данные о блюде успешно проанализированы и добавлены в ваш дневник питания.'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}