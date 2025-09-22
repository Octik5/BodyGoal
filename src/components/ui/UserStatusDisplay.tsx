import React from 'react'
import { OnlineIndicator } from './OnlineIndicator'

interface UserStatusDisplayProps {
  className?: string
}

export const UserStatusDisplay: React.FC<UserStatusDisplayProps> = ({ className = '' }) => {

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <OnlineIndicator status="online" size="sm" />
      <span className="text-xs text-green-600">Онлайн</span>
    </div>
  )
}
