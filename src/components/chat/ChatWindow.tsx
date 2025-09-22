import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Paperclip,
  Image,
  Video,
  Smile,
  MoreVertical,
  ArrowLeft,
  Phone,
  VideoIcon,
  ArrowUp
} from 'lucide-react'
import { FriendsApi } from '../../lib/friendsApi'
import { useAuth } from '../../contexts/AuthContext'
import { Message, supabase } from '../../lib/supabase'
import { OnlineIndicator } from '../ui/OnlineIndicator'
import { useFriendsOnlineStatus } from '../../hooks/useSimplePresence'

interface ChatWindowProps {
  chatId?: string
  friendId?: string
  onBack: () => void
}

interface ChatMessage extends Message {
  sender?: {
    user_id: string
    name?: string
    avatar_url?: string
  }
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, friendId, onBack }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId)
  const [friendInfo, setFriendInfo] = useState<{
    user_id: string
    name?: string
    avatar_url?: string
    isOnline?: boolean
  } | null>(null)

  const onlineStatuses = useFriendsOnlineStatus(friendId ? [friendId] : [])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesStartRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const subscriptionRef = useRef<any>(null)
  const friendProfileSubscriptionRef = useRef<any>(null)
  const myProfileSubscriptionRef = useRef<any>(null)
  const profilesCacheRef = useRef<Map<string, any>>(new Map())
  const [showScrollToTop, setShowScrollToTop] = useState(false)

  useEffect(() => {
    if (friendId && !chatId) {
      initializeDirectChat()
    } else if (chatId) {
      setCurrentChatId(chatId)
      loadMessages()
    }
  }, [chatId, friendId])

  useEffect(() => {
    if (friendId) {
      loadFriendInfo()
      subscribeToFriendProfileChanges()
    }

    return () => {
      if (friendProfileSubscriptionRef.current) {
        friendProfileSubscriptionRef.current.unsubscribe()
        friendProfileSubscriptionRef.current = null
      }
    }
  }, [friendId])

  useEffect(() => {
    if (user?.id) {
      subscribeToMyProfileChanges()
    }

    return () => {
      if (myProfileSubscriptionRef.current) {
        myProfileSubscriptionRef.current.unsubscribe()
        myProfileSubscriptionRef.current = null
      }
    }
  }, [user?.id])

  useEffect(() => {
    if (currentChatId) {
      loadMessages()
      subscribeToNewMessages()
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [currentChatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {

    const messagesContainer = messagesContainerRef.current
    const body = document.body
    const html = document.documentElement

    const handleScroll = (source: string) => () => {

      const containers = [
        { name: 'messagesContainer', element: messagesContainer },
        { name: 'body', element: body },
        { name: 'html', element: html }
      ]

      containers.forEach(({ name, element }) => {
        if (element) {
          const { scrollTop, scrollHeight, clientHeight } = element

          const scrolledDown = scrollTop > 200
          const hasScrollableContent = scrollHeight > clientHeight + 200
          const shouldShow = scrolledDown && hasScrollableContent

          if (scrollHeight > clientHeight && shouldShow !== showScrollToTop) {
            setShowScrollToTop(shouldShow)
          }
        }
      })
    }

    const elementHandlers: Array<{ element: Element, handler: () => void }> = []
    let windowHandler: (() => void) | null = null

    if (messagesContainer) {
      const handler = handleScroll('messagesContainer')
      messagesContainer.addEventListener('scroll', handler, { passive: true })
      elementHandlers.push({ element: messagesContainer, handler })
    }

    const bodyHandler = handleScroll('body')
    body.addEventListener('scroll', bodyHandler, { passive: true })
    elementHandlers.push({ element: body, handler: bodyHandler })

    windowHandler = handleScroll('window')
    window.addEventListener('scroll', windowHandler, { passive: true })

    handleScroll('initial')()

    return () => {
      elementHandlers.forEach(({ element, handler }) => {
        element.removeEventListener('scroll', handler)
      })
      if (windowHandler) {
        window.removeEventListener('scroll', windowHandler)
      }
    }
  }, [currentChatId, messages.length, showScrollToTop])

  useEffect(() => {
    return () => {

      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }

      if (friendProfileSubscriptionRef.current) {
        friendProfileSubscriptionRef.current.unsubscribe()
        friendProfileSubscriptionRef.current = null
      }

      if (myProfileSubscriptionRef.current) {
        myProfileSubscriptionRef.current.unsubscribe()
        myProfileSubscriptionRef.current = null
      }
    }
  }, [])

  const loadFriendInfo = async () => {
    if (!friendId) return

    try {

      const { data: friendProfile, error } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, created_at')
        .eq('user_id', friendId)
        .single()

      if (error) {
        return
      }
      setFriendInfo({
        user_id: friendProfile.user_id,
        name: friendProfile.name,
        avatar_url: friendProfile.avatar_url,
        isOnline: onlineStatuses[friendId] || false
      })
    } catch (err: any) {
    }
  }

  const updateMessageAvatars = (userId: string, newAvatarUrl: string, newName: string) => {

    const updatedProfile = {
      user_id: userId,
      avatar_url: newAvatarUrl,
      name: newName
    }
    profilesCacheRef.current.set(userId, updatedProfile)
    setMessages(prevMessages => {
      const updatedMessages = prevMessages.map(message => {
        if (message.sender_id === userId) {
          return {
            ...message,
            sender: updatedProfile
          }
        }
        return message
      })
      return updatedMessages
    })
  }

  const subscribeToFriendProfileChanges = () => {
    if (!friendId) return

    if (friendProfileSubscriptionRef.current) {
      friendProfileSubscriptionRef.current.unsubscribe()
    }

    friendProfileSubscriptionRef.current = supabase
      .channel(`friend-profile-${friendId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${friendId}`
        },
        (payload) => {

          setFriendInfo(prev => ({
            ...prev,
            user_id: payload.new.user_id,
            name: payload.new.name,
            avatar_url: payload.new.avatar_url,
            isOnline: prev?.isOnline || true
          }))

          updateMessageAvatars(payload.new.user_id, payload.new.avatar_url, payload.new.name)
        }
      )
      .subscribe((status) => {
      })
  }

  const subscribeToMyProfileChanges = () => {
    if (!user?.id) return

    if (myProfileSubscriptionRef.current) {
      myProfileSubscriptionRef.current.unsubscribe()
    }

    myProfileSubscriptionRef.current = supabase
      .channel(`my-profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {

          updateMessageAvatars(payload.new.user_id, payload.new.avatar_url, payload.new.name)
        }
      )
      .subscribe((status) => {
      })
  }

  const initializeDirectChat = async () => {
    if (!friendId) return

    try {
      const result = await FriendsApi.createDirectChat(friendId)
      setCurrentChatId(result.chat_id)
    } catch (err) {
    }
  }

  const loadMessages = async () => {
    if (!currentChatId) return

    try {
      const data = await FriendsApi.getChatMessages(currentChatId)

      data.forEach(msg => {
        if (msg.sender && msg.sender_id) {
          profilesCacheRef.current.set(msg.sender_id, msg.sender)
        }
      })
      setMessages(data)
      await FriendsApi.markAsRead(currentChatId)
    } catch (err) {
    }
  }

  const subscribeToNewMessages = () => {
    if (!currentChatId) return

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }
    const subscription = FriendsApi.subscribeToMessages(currentChatId, async (payload) => {
      if (payload.new) {
        const newMessage = payload.new
        try {

          let senderProfile = profilesCacheRef.current.get(newMessage.sender_id)

          if (!senderProfile) {

            const { data, error } = await supabase
              .from('profiles')
              .select('user_id, name, avatar_url')
              .eq('user_id', newMessage.sender_id)
              .single()

            if (error) {
            } else {
              senderProfile = data

              profilesCacheRef.current.set(newMessage.sender_id, senderProfile)
            }
          } else {
          }

          const messageWithSender = {
            ...newMessage,
            sender: senderProfile || null
          }
          setMessages(prev => [...prev, messageWithSender])
          scrollToBottom()
        } catch (err) {

          setMessages(prev => [...prev, { ...newMessage, sender: null }])
          scrollToBottom()
        }
      }
    })

    subscriptionRef.current = subscription
    return subscription
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToTop = () => {

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })

    setTimeout(() => {
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }, 10)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentChatId || isLoading) return

    setIsLoading(true)
    try {
      await FriendsApi.sendMessage(currentChatId, newMessage.trim())
      setNewMessage('')
    } catch (err) {
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentChatId) return

    setIsUploading(true)
    try {
      let messageType: 'image' | 'video' | 'file' = 'file'

      if (file.type.startsWith('image/')) {
        messageType = 'image'
      } else if (file.type.startsWith('video/')) {
        messageType = 'video'
      }

      await FriendsApi.sendMediaMessage(currentChatId, file, messageType)
    } catch (err) {
    } finally {
      setIsUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.sender_id === user?.id
    const sender = message.sender

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex items-end space-x-2 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {!isOwnMessage && (
            <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {sender?.avatar_url ? (
                <img
                  src={sender.avatar_url}
                  alt={sender.name || 'Пользователь'}
                  className="w-full h-full object-cover rounded-full"
                  onLoad={() => {
                  }}
                  onError={(e) => {

                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      const fallback = parent.querySelector('.avatar-fallback') as HTMLElement
                      if (fallback) {
                        fallback.style.display = 'flex'
                      }
                    }
                  }}
                  style={{
                    minWidth: '32px',
                    minHeight: '32px',
                    maxWidth: '32px',
                    maxHeight: '32px'
                  }}
                />
              ) : null}
              <div
                className={`avatar-fallback w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center ${sender?.avatar_url ? 'hidden' : 'flex'}`}
              >
                <span className="text-white text-xs font-medium">
                  {sender?.name ? sender.name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            </div>
          )}
          <div
            className={`rounded-2xl px-4 py-3 ${
              isOwnMessage
                ? 'bg-gray-800 text-white rounded-br-md'
                : 'bg-gray-100 text-foreground rounded-bl-md'
            }`}
          >
            {message.message_type === 'text' && message.content && (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
            {message.message_type === 'image' && message.file_url && (
              <div className="max-w-sm">
                <img
                  src={message.file_url}
                  alt="Изображение"
                  className="rounded-lg max-w-full h-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden p-4 bg-gray-100 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Ошибка загрузки изображения</p>
                  <p className="text-xs text-gray-500 mt-1">URL: {message.file_url}</p>
                </div>
                {message.content && (
                  <p className="text-sm mt-2 whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            )}
            {message.message_type === 'video' && message.file_url && (
              <div className="max-w-sm">
                <video
                  src={message.file_url}
                  controls
                  className="rounded-lg max-w-full h-auto"
                />
                {message.content && (
                  <p className="text-sm mt-2 whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            )}
            {message.message_type === 'file' && message.file_url && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {message.file_name || 'Файл'}
                  </p>
                  {message.file_size && (
                    <p className="text-xs text-gray-500">
                      {(message.file_size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                </div>
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-gray-200 px-2 py-1 rounded"
                >
                  Скачать
                </a>
              </div>
            )}
            <div className={`text-xs mt-1 ${isOwnMessage ? 'text-gray-300' : 'text-gray-500'}`}>
              {formatMessageTime(message.created_at)}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (!currentChatId && !friendId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Выберите чат для начала общения</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {friendInfo?.avatar_url ? (
                <img
                  src={friendInfo.avatar_url}
                  alt={friendInfo.name || 'Друг'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {friendInfo?.name ? friendInfo.name.charAt(0).toUpperCase() : 'Д'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {friendInfo?.name || 'Загрузка...'}
              </p>
               <OnlineIndicator
                 status={friendId && onlineStatuses[friendId] ? 'online' : 'offline'}
                 showText={true}
               />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200">
            <VideoIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 relative"
      >
        <div ref={messagesStartRef} />
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
        <AnimatePresence>
          {showScrollToTop && (
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToTop}
              className="fixed bottom-24 right-6 w-14 h-14 bg-white/90 backdrop-blur-md border border-gray-200/50 hover:bg-white hover:border-gray-300/50 text-gray-700 hover:text-gray-900 rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 z-50 group"
              title="Перейти к верху страницы"
            >
              <ArrowUp className="w-6 h-6 transition-transform duration-200 group-hover:-translate-y-0.5" />
            </motion.button>
          )}
        </AnimatePresence>

        {isUploading && (
          <div className="flex justify-center py-4">
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
              <div className="loading-spinner"></div>
              <span className="text-sm text-gray-600">Загрузка файла...</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-end space-x-2">
          <div className="relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Напишите сообщение..."
              className="w-full max-h-24 resize-none border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <button className="absolute right-3 bottom-3 text-gray-400 hover:text-gray-600">
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="loading-spinner border-white"></div>
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
