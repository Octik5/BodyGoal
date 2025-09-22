import React from 'react'

interface OnlineIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  lastSeen?: string
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  status,
  size = 'md',
  showText = false,
  lastSeen
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const colorClasses = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  }

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'Онлайн'
      case 'away':
        return 'Отошел'
      case 'busy':
        return 'Занят'
      case 'offline':
        if (!lastSeen) return 'Оффлайн'

        const lastSeenDate = new Date(lastSeen)
        const now = new Date()
        const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60))

        if (diffMinutes < 1) return 'Только что был в сети'
        if (diffMinutes < 60) return `Был в сети ${diffMinutes} мин назад`
        if (diffMinutes < 1440) return `Был в сети ${Math.floor(diffMinutes / 60)} ч назад`
        return `Был в сети ${Math.floor(diffMinutes / 1440)} дн назад`
      default:
        return 'Неизвестно'
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`
          ${sizeClasses[size]}
          ${colorClasses[status]}
          rounded-full
          border-2
          border-white
          ${status === 'online' ? 'animate-pulse' : ''}
        `}
      />
      {showText && (
        <span className="text-sm text-gray-600">
          {getStatusText()}
        </span>
      )}
    </div>
  )
}
