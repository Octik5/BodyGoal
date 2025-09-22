import axios from 'axios'

const OPENROUTER_API_KEY = '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'
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export const analyzeCaloriesFromImage = async (imageBase64: string): Promise<any> => {
  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Ты профессиональный нутрициолог с 20-летним опытом. Твоя задача - проанализировать изображение еды и дать максимально точную оценку питательной ценности.

ОБЯЗАТЕЛЬНО изучи изображение внимательно и опиши что видишь, затем дай оценку.

КРИТИЧЕСКИ ВАЖНО: Ответь строго в JSON формате без дополнительного текста:

{
  "dish_name": "точное название блюда (например: 'Куриная грудка с рисом и овощами')",
  "portion_weight": 200,
  "calories": 350,
  "protein": 28,
  "fats": 8,
  "carbs": 35,
  "description": "детальное описание видимых ингредиентов и способа приготовления",
  "recommendations": "практические советы по питанию"
}

ПРАВИЛА АНАЛИЗА:
1. Внимательно изучи все видимые ингредиенты
2. Оцени размер порции по отношению к тарелке/посуде  
3. Учти способ приготовления (жареное, вареное, запеченное)
4. Дай реалистичные числа на основе стандартных порций
5. НЕ используй "N/A" - всегда давай числовые оценки
6. Белки: 15-40г, Жиры: 5-25г, Углеводы: 20-60г, Калории: 200-800

Пример хорошего ответа:
{"dish_name":"Гречневая каша с курицей","portion_weight":250,"calories":420,"protein":32,"fats":12,"carbs":45,"description":"Порция гречневой каши с кусочками отварной куриной грудки","recommendations":"Отличный сбалансированный прием пищи"}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Внимательно изучи это изображение еды. Определи что это за блюдо, оцени размер порции и рассчитай питательную ценность. Ответь строго в JSON формате как показано в примере системного промпта. Обязательно укажи конкретные числовые значения для всех параметров, не используй N/A.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'BodyGoal App'
        }
      }
    )
    
    const content = response.data.choices[0].message.content
    
    // Отладочная информация
    console.log('Ответ от OpenRouter API:', content)
    
    try {
      // Пытаемся парсить JSON
      const parsed = JSON.parse(content)
      console.log('Успешно распарсен JSON:', parsed)
      return parsed
    } catch (parseError) {
      console.log('Ошибка парсинга JSON:', parseError)
      console.log('Пытаемся извлечь данные из текста...')
      
      // Если не удается парсить JSON, пытаемся извлечь данные из текста
      const fallbackData = {
        dish_name: extractValue(content, /блюдо[:\s]*([^\n]+)/i) || 'Неизвестное блюдо',
        portion_weight: extractValue(content, /вес[:\s]*(\d+)/i) || 150,
        calories: extractValue(content, /калории?[:\s]*(\d+)/i) || 250,
        protein: extractValue(content, /белки?[:\s]*(\d+)/i) || 15,
        fats: extractValue(content, /жиры?[:\s]*(\d+)/i) || 10,
        carbs: extractValue(content, /углеводы?[:\s]*(\d+)/i) || 30,
        description: 'Анализ выполнен на основе визуальной оценки блюда',
        recommendations: 'Рекомендуем учесть данные при планировании рациона'
      }
      
      console.log('Fallback данные:', fallbackData)
      return fallbackData
    }
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error('Ошибка авторизации API. Проверьте ключ доступа.')
      } else if (error.response.status === 429) {
        throw new Error('Превышен лимит запросов. Попробуйте позже.')
      } else if (error.response.status === 400) {
        throw new Error('Неверный формат изображения или запроса.')
      }
    }

    throw new Error('Не удалось проанализировать изображение. Попробуйте еще раз.')
  }
}

// Вспомогательная функция для извлечения значений из текста
const extractValue = (text: string, regex: RegExp): string | null => {
  const match = text.match(regex)
  return match ? match[1].trim() : null
}

export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Установим максимальные размеры для оптимизации
      const maxWidth = 800
      const maxHeight = 600
      
      let { width, height } = img
      
      // Пропорциональное масштабирование
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = width * ratio
        height = height * ratio
      }
      
      canvas.width = width
      canvas.height = height
      
      // Рисуем изображение на canvas
      ctx?.drawImage(img, 0, 0, width, height)
      
      // Конвертируем в base64 с оптимизацией качества
      const dataURL = canvas.toDataURL('image/jpeg', 0.8)
      const base64 = dataURL.split(',')[1]
      resolve(base64)
    }
    
    img.onerror = reject
    
    // Читаем файл как data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}


export interface UserProfile {
  age: number
  weight: number
  height: number
  gender: 'male' | 'female'
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal: 'lose' | 'maintain' | 'gain'
  target_weight?: number
  tdee: number
}

export interface MealPlanRequest {
  profile: UserProfile
  preferences?: string[]
  restrictions?: string[]
  cuisine?: string
  budget?: 'low' | 'medium' | 'high'
}

export interface AlternativeRequest {
  originalPlan: string
  reason: string
  preferences?: string[]
}


export const generateAIMealPlan = async (request: MealPlanRequest): Promise<string> => {
  try {
    const { profile, preferences = [], restrictions = [], cuisine = '', budget = 'medium' } = request


    let targetCalories = profile.tdee
    if (profile.goal === 'lose') {
      targetCalories = profile.tdee - 500
    } else if (profile.goal === 'gain') {
      targetCalories = profile.tdee + 300
    }


    const prompt = `Создай подробный план питания на один день для человека со следующими характеристиками:

ПРОФИЛЬ:
- Возраст: ${profile.age} лет
- Пол: ${profile.gender === 'male' ? 'мужской' : 'женский'}
- Рост: ${profile.height} см
- Вес: ${profile.weight} кг
- Уровень активности: ${getActivityLevelText(profile.activity_level)}
- Цель: ${getGoalText(profile.goal)}${profile.target_weight ? ` (целевой вес: ${profile.target_weight} кг)` : ''}
- КДАЖ: ${profile.tdee.toFixed(0)} калорий
- Целевые калории: ${targetCalories.toFixed(0)} калорий/день

ТРЕБОВАНИЯ:
${preferences.length > 0 ? `- Предпочтения: ${preferences.join(', ')}` : ''}
${restrictions.length > 0 ? `- Ограничения: ${restrictions.join(', ')}` : ''}
${cuisine ? `- Кухня: ${cuisine}` : ''}
- Бюджет: ${budget === 'low' ? 'экономный' : budget === 'high' ? 'премиум' : 'средний'}

ФОРМАТ ОТВЕТА:
Создай план на русском языке в следующем формате:

🌅 ЗАВТРАК (25% от дневных калорий - ${Math.round(targetCalories * 0.25)} ккал)
• Название блюда
  - Ингредиенты с количеством
  - Способ приготовления (кратко)
  - Калории: XXX ккал | Б: XXг | Ж: XXг | У: XXг

🌞 ОБЕД (35% от дневных калорий - ${Math.round(targetCalories * 0.35)} ккал)
• Название блюда
  - Ингредиенты с количеством
  - Способ приготовления (кратко)
  - Калории: XXX ккал | Б: XXг | Ж: XXг | У: XXг

🌙 УЖИН (30% от дневных калорий - ${Math.round(targetCalories * 0.30)} ккал)
• Название блюда
  - Ингредиенты с количеством
  - Способ приготовления (кратко)
  - Калории: XXX ккал | Б: XXг | Ж: XXг | У: XXг

🍎 ПЕРЕКУС (10% от дневных калорий - ${Math.round(targetCalories * 0.10)} ккал)
• Название
  - Состав
  - Калории: XXX ккал | Б: XXг | Ж: XXг | У: XXг

📊 ИТОГО ЗА ДЕНЬ:
Калории: ~${targetCalories} ккал
Белки: XXг (XX%)
Жиры: XXг (XX%)
Углеводы: XXг (XX%)

💡 РЕКОМЕНДАЦИИ:
- Практические советы по соблюдению плана
- Советы по приготовлению
- Рекомендации по времени приёма пищи

Создай сбалансированный, вкусный и реалистичный план с доступными продуктами.`

    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Ты профессиональный диетолог и нутрициолог. Создаёшь персонализированные планы питания, учитывая индивидуальные потребности, цели и предпочтения клиентов. Отвечаешь только на русском языке.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'BodyGoal App'
        }
      }
    )
    return response.data.choices[0].message.content
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error('Ошибка авторизации API. Проверьте ключ доступа.')
      } else if (error.response.status === 429) {
        throw new Error('Превышен лимит запросов. Попробуйте позже.')
      } else if (error.response.status === 400) {
        throw new Error('Неверный формат запроса.')
      }
    }

    throw new Error('Не удалось сгенерировать план питания. Попробуйте еще раз.')
  }
}


export const generateMealAlternatives = async (request: AlternativeRequest): Promise<string> => {
  try {
    const { originalPlan, reason, preferences = [] } = request

    const prompt = `Создай альтернативный план питания на основе следующего:

ИСХОДНЫЙ ПЛАН:
${originalPlan}

ПРИЧИНА ИЗМЕНЕНИЯ:
${reason}

${preferences.length > 0 ? `ДОПОЛНИТЕЛЬНЫЕ ПРЕДПОЧТЕНИЯ:
${preferences.join(', ')}` : ''}

ЗАДАЧА:
Создай альтернативный вариант с учётом указанной причины, сохраняя:
- Общую калорийность и баланс БЖУ
- Структуру питания (завтрак, обед, ужин, перекус)
- Формат представления

Предложи конкретные замены блюд с объяснением, почему эти альтернативы лучше подходят.

Отвечай на русском языке в том же формате, что и исходный план.`

    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Ты профессиональный диетолог. Создаёшь альтернативные планы питания, учитывая пожелания и ограничения клиентов. Отвечаешь только на русском языке.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'BodyGoal App'
        }
      }
    )
    return response.data.choices[0].message.content
  } catch (error: any) {
    throw new Error('Не удалось сгенерировать альтернативы. Попробуйте еще раз.')
  }
}


const getActivityLevelText = (level: string): string => {
  switch (level) {
    case 'sedentary': return 'малоподвижный'
    case 'light': return 'лёгкая активность'
    case 'moderate': return 'умеренная активность'
    case 'active': return 'активный'
    case 'very_active': return 'очень активный'
    default: return level
  }
}

const getGoalText = (goal: string): string => {
  switch (goal) {
    case 'lose': return 'снижение веса'
    case 'maintain': return 'поддержание веса'
    case 'gain': return 'набор веса'
    default: return goal
  }
}
