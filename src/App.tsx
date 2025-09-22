import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import './index.css'

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
          <p className="text-sm text-muted-foreground mt-2">Подключение к BodyGoal...</p>

          <div className="mt-6 p-4 card-apple bg-white border border-gray-100">
            <p className="text-xs text-muted-foreground mb-2">Диагностика:</p>
            <div className="text-xs text-left space-y-1">
              <div>• База данных: <span className="text-green">✓ Активна</span></div>
              <div>• Сеть: <span className="text-orange">⏳ Проверка...</span></div>
              <div>• Авторизация: <span className="text-orange">⏳ Инициализация...</span></div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Если загрузка затягивается, проверьте консоль (F12)
            </p>
          </div>
        </div>
      </div>
    )
  }

  return user ? <DashboardPage /> : <AuthPage />
}

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
