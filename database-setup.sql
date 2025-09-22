-- BodyGoal Database Setup Script
-- Выполните этот скрипт в SQL Editor вашего проекта Supabase

-- 1. Создание таблицы профилей пользователей
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  age INTEGER CHECK (age > 0 AND age < 150),
  height NUMERIC CHECK (height > 0 AND height < 300),
  weight NUMERIC CHECK (weight > 0 AND weight < 500),
  gender TEXT CHECK (gender IN ('male', 'female')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal TEXT CHECK (goal IN ('lose', 'maintain', 'gain')),
  target_weight NUMERIC CHECK (target_weight > 0 AND target_weight < 500),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавление поля avatar_url в существующую таблицу (если оно отсутствует)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Создание таблицы записей веса
CREATE TABLE IF NOT EXISTS weight_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL CHECK (weight > 0 AND weight < 500),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3. Создание таблицы планов питания
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('lose', 'maintain', 'gain')),
  calories_per_day INTEGER CHECK (calories_per_day > 0),
  plan_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Создание индексов для оптимизации производительности
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_user_id ON weight_records(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_date ON weight_records(date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_type ON meal_plans(type);

-- 5. Настройка Row Level Security (RLS)

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для таблицы weight_records
CREATE POLICY "Users can view own weight records" ON weight_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight records" ON weight_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight records" ON weight_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight records" ON weight_records
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для таблицы meal_plans
CREATE POLICY "Users can view own meal plans" ON meal_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans" ON meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans" ON meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans" ON meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at 
  BEFORE UPDATE ON meal_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Вставка тестовых данных (опционально, для разработки)
-- Раскомментируйте следующие строки для добавления тестовых данных

/*
-- Примеры планов питания (будут доступны всем пользователям через приложение)
INSERT INTO meal_plans (user_id, name, type, calories_per_day, plan_data) VALUES
(
  '00000000-0000-0000-0000-000000000000', -- placeholder user_id
  'План для похудения',
  'lose',
  1500,
  '{
    "breakfast": ["Овсяная каша с ягодами (200 кал)", "Омлет из 2 яиц с овощами (180 кал)"],
    "lunch": ["Куриная грудка с овощами (300 кал)", "Салат с тунцом (280 кал)"],
    "dinner": ["Запеченная рыба с салатом (250 кал)", "Творожная запеканка (200 кал)"],
    "snacks": ["Яблоко (80 кал)", "Горсть миндаля (160 кал)"]
  }'
);
*/

-- 9. Создание дополнительных таблиц для функций друзей и чата

-- Создание таблицы присутствия пользователей (для онлайн статуса)
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы дружбы
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Создание таблицы сообщений
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Функция для автоматического обновления статуса пользователей в офлайн
CREATE OR REPLACE FUNCTION update_offline_users()
RETURNS void AS $$
BEGIN
  UPDATE user_presence 
  SET status = 'offline'
  WHERE status = 'online' 
  AND last_activity < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Индексы для новых таблиц
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_activity ON user_presence(last_activity);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- RLS для новых таблиц
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Политики для user_presence
CREATE POLICY "Users can view own presence" ON user_presence
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presence" ON user_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence" ON user_presence
  FOR UPDATE USING (auth.uid() = user_id);

-- Политики для friendships
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can insert friendships as requester" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're involved in" ON friendships
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Политики для messages
CREATE POLICY "Users can view messages they sent or received" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages as sender" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received (for read status)" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Триггеры для новых таблиц
CREATE TRIGGER update_user_presence_updated_at 
  BEFORE UPDATE ON user_presence 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at 
  BEFORE UPDATE ON friendships 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Готово! База данных настроена для работы с приложением BodyGoal
