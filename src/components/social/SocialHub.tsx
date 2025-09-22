import React, { useState } from 'react'
import { FriendsManager } from '../friends/FriendsManager'
import { ChatWindow } from '../chat/ChatWindow'

export const SocialHub: React.FC = () => {
  const [activeView, setActiveView] = useState<'friends' | 'chat'>('friends')
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null)

  const handleOpenChat = (friendId: string) => {
    setSelectedFriendId(friendId)
    setSelectedChatId(null)
    setActiveView('chat')
  }

  const handleBackToFriends = () => {
    setActiveView('friends')
    setSelectedChatId(null)
    setSelectedFriendId(null)
  }

  return (
    <div className="h-full">
      {activeView === 'friends' ? (
        <FriendsManager onOpenChat={handleOpenChat} />
      ) : (
        <ChatWindow
          chatId={selectedChatId || undefined}
          friendId={selectedFriendId || undefined}
          onBack={handleBackToFriends}
        />
      )}
    </div>
  )
}
