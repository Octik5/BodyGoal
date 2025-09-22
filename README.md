# BodyGoal - Персональный Фитнес Помощник

Современное React-приложение для отслеживания фитнес-целей с дизайном в стиле Apple 2025.

## 🚀 Возможности

- **Авторизация и регистрация** с валидацией форм
- **Калькулятор здоровья** - расчет ИМТ, BMR, TDEE
- **Персональный планировщик** питания с готовыми шаблонами
- **Трекер прогресса** с интерактивными графиками
- **Анализ калорий по фото** с использованием ИИ
- **Современный дизайн** в стиле Apple (черно-белая тема)

## 🛠 Технологии

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Анимации**: Framer Motion
- **Графики**: Recharts
- **Формы**: React Hook Form + Zod
- **База данных**: Supabase
- **ИИ**: OpenRouter (Mistral Small 3.2 24B)

## 📦 Установка

1. Установите зависимости:
```bash
npm install
```

2. Запустите приложение:
```bash
npm start
```

Приложение откроется по адресу [http://localhost:3000](http://localhost:3000).

## 🗄️ База данных

Приложение использует Supabase с следующими таблицами:

### profiles
```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  height NUMERIC,
  weight NUMERIC,
  gender TEXT CHECK (gender IN ('male', 'female')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal TEXT CHECK (goal IN ('lose', 'maintain', 'gain')),
  target_weight NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### weight_records
```sql
CREATE TABLE weight_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### meal_plans
```sql
CREATE TABLE meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('lose', 'maintain', 'gain')),
  calories_per_day INTEGER,
  plan_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎨 Дизайн

Приложение выполнено в стиле Apple 2025 с использованием:
- Черно-белой цветовой палитры
- Скругленных углов и мягких теней
- Плавных анимаций
- Минималистичного интерфейса
- Эффектов размытия (backdrop-blur)

## 🔧 Конфигурация

### Supabase
Подключение к базе данных настроено в `src/lib/supabase.ts`

### OpenRouter API
Анализ фотографий настроен в `src/lib/openrouter.ts` с использованием модели Mistral Small 3.2 24B

## 📱 Функциональность

### 1. Авторизация
- Регистрация с валидацией email и пароля
- Вход в систему
- Автоматическое создание профиля пользователя

### 2. Калькулятор
- Расчет ИМТ (Индекс Массы Тела)
- BMR (Базовый Метаболизм)
- TDEE (Общий Расход Энергии)
- Рекомендации по калориям для достижения цели

### 3. Планировщик
- Выбор цели (похудение, поддержание, набор веса)
- Готовые шаблоны планов питания
- Расчет калорийности под индивидуальные потребности

### 4. Трекер
- Добавление замеров веса
- Интерактивные графики прогресса
- Статистика изменений
- Отслеживание движения к цели

### 5. Анализ фото
- Загрузка фотографий блюд
- ИИ-анализ калорийности
- Детальная информация о БЖУ
- Рекомендации по фотографированию

## 🚀 Запуск в продакшене

```bash
npm run build
```

Создаст оптимизированную сборку в папке `build/`.

## 🤝 Поддержка

При возникновении вопросов или проблем, создайте issue в репозитории.

---

**BodyGoal** - ваш надежный спутник на пути к здоровому образу жизни! 💪
