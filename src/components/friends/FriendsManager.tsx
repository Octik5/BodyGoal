import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  MessageCircle,
  MoreVertical,
  UserMinus,
  Shield
} from 'lucide-react'
import { FriendsApi } from '../../lib/friendsApi'
import { useAuth } from '../../contexts/AuthContext'
import { OnlineIndicator } from '../ui/OnlineIndicator'
import { useFriendsOnlineStatus } from '../../hooks/useSimplePresence'
import { supabase } from '../../lib/supabase'

interface Friend {
  id: string
  requester_id: string
  addressee_id: string
  status: string
  requester?: any
  addressee?: any
}

interface FriendsManagerProps {
  onOpenChat: (friendId: string) => void
}

export const FriendsManager: React.FC<FriendsManagerProps> = ({ onOpenChat }) => {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [sentRequests, setSentRequests] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set())


  const getFriendProfile = (friendship: Friend) => {
    if (!user) return null
    return friendship.requester_id === user.id
      ? friendship.addressee
      : friendship.requester
  }

  const getFriendId = (friendship: Friend) => {
    if (!user) return null
    return friendship.requester_id === user.id
      ? friendship.addressee_id
      : friendship.requester_id
  }


  const getFriendshipStatus = (userId: string) => {
    if (!user || userId === user.id) return 'self'


    const existingFriendship = friends.find(friendship =>
      getFriendId(friendship) === userId
    )
    if (existingFriendship) return 'friend'


    const outgoingRequest = sentRequests.find(request =>
      request.addressee_id === userId
    )
    if (outgoingRequest) return 'request_sent'


    const incomingRequest = pendingRequests.find(request =>
      request.requester_id === userId
    )
    if (incomingRequest) return 'request_received'


    return 'none'
  }

  const tabs = [
    { id: 'friends' as const, label: 'Друзья', icon: Users },
    { id: 'requests' as const, label: 'Запросы', icon: UserPlus },
    { id: 'search' as const, label: 'Поиск', icon: Search },
  ]


  const loadFriends = useCallback(async () => {
    try {
      const data = await FriendsApi.getFriends()
      setFriends(data)
    } catch (err: any) {
      setError('Ошибка загрузки друзей')
    }
  }, [])

  const loadPendingRequests = useCallback(async () => {
    try {
      const data = await FriendsApi.getPendingRequests()
      setPendingRequests(data)
    } catch (err: any) {
      setError('Ошибка загрузки запросов')
    }
  }, [])

  const loadSentRequests = useCallback(async () => {
    try {
      const data = await FriendsApi.getSentRequests()
      setSentRequests(data)
    } catch (err: any) {
      setError('Ошибка загрузки отправленных запросов')
    }
  }, [])


  const friendIds = friends.map(friend => getFriendId(friend)).filter(Boolean) as string[]
  const onlineStatuses = useFriendsOnlineStatus(friendIds)

  useEffect(() => {
    loadFriends()
    loadPendingRequests()
    loadSentRequests()


    const channelName = `friendships_${user?.id || 'anonymous'}_${Date.now()}`

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships'
        },
        (payload: any) => {

          const eventType = payload.eventType
          const newRecord = payload.new
          const oldRecord = payload.old


          const isRelevant = user && (
            (newRecord && typeof newRecord === 'object' &&
             (newRecord.requester_id === user.id || newRecord.addressee_id === user.id)) ||
            (oldRecord && typeof oldRecord === 'object' &&
             (oldRecord.requester_id === user.id || oldRecord.addressee_id === user.id))
          )

          if (isRelevant) {

            loadFriends()
            loadPendingRequests()
            loadSentRequests()
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {

        } else if (status === 'CHANNEL_ERROR') {

        }
      })


    const fallbackInterval = setInterval(() => {
      loadFriends()
      loadPendingRequests()
      loadSentRequests()
    }, 30000)


    return () => {
      subscription.unsubscribe()
      clearInterval(fallbackInterval)
    }
  }, [loadFriends, loadPendingRequests, loadSentRequests, user])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Введите текст для поиска')
      return
    }

    setIsLoading(true)
    setError('')
    setSearchResults([])

    try {

      const results = await FriendsApi.searchUsers(searchQuery.trim())

      if (results && results.length > 0) {

      }


      const resultsWithFlags = results.map(u => ({
        ...u,
        isCurrentUser: u.user_id === user?.id
      }))

      setSearchResults(resultsWithFlags)

      if (resultsWithFlags.length === 0) {
        setError('Пользователи не найдены')
      }
    } catch (err: any) {

      setError(err.message || 'Ошибка поиска пользователей')
    } finally {
      setIsLoading(false)

    }
  }

  const handleShowAllUsers = async () => {
    setIsLoading(true)
    setError('')
    setSearchResults([])

    try {

      const results = await FriendsApi.getAllUsers()


      const resultsWithFlags = results.map(u => ({
        ...u,
        isCurrentUser: u.user_id === user?.id
      }))

      setSearchResults(resultsWithFlags)

      if (resultsWithFlags.length === 0) {
        setError('Других пользователей не найдено')
      }
    } catch (err: any) {

      setError('Ошибка получения списка пользователей')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendRequest = async (userId: string) => {

    const status = getFriendshipStatus(userId)

    if (status === 'friend') {
      setError('Этот пользователь уже у вас в друзьях')
      return
    }

    if (status === 'request_sent') {
      setError('Запрос в друзья уже отправлен этому пользователю')
      return
    }

    if (status === 'request_received') {
      setError('Этот пользователь уже отправил вам запрос в друзья. Проверьте вкладку "Запросы"')
      return
    }

    if (status === 'self') {
      setError('Нельзя добавить самого себя в друзья')
      return
    }

    try {
      setProcessingRequests(prev => new Set(prev).add(userId))
      setError('')

      await FriendsApi.sendFriendRequest(userId)


      await Promise.all([
        loadFriends(),
        loadPendingRequests(),
        loadSentRequests()
      ])

    } catch (err: any) {

      setError(err.message || 'Ошибка отправки запроса')
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(friendshipId))

      await FriendsApi.acceptFriendRequest(friendshipId)


      await Promise.all([
        loadFriends(),
        loadPendingRequests(),
        loadSentRequests()
      ])

    } catch (err: any) {

      setError('Ошибка принятия запроса')
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(friendshipId)
        return newSet
      })
    }
  }

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(friendshipId))

      await FriendsApi.removeFriendship(friendshipId)


      await Promise.all([
        loadPendingRequests(),
        loadSentRequests()
      ])

    } catch (err: any) {

      setError('Ошибка отклонения запроса')
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(friendshipId)
        return newSet
      })
    }
  }

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      await FriendsApi.removeFriendship(friendshipId)


      await loadFriends()

    } catch (err: any) {

      setError('Ошибка удаления друга')
    }
  }

  const handleOpenChat = async (friendId: string) => {
    try {
      onOpenChat(friendId)
    } catch (err: any) {
      setError('Ошибка открытия чата')
    }
  }


  const isFriendOnline = (friendId: string) => {
    return onlineStatuses[friendId] || false
  }

  return (
    <div className="h-full flex flex-col bg-white">

      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-light text-foreground tracking-tight mb-6">
          Друзья и чаты
        </h1>

        <div className="flex space-x-1 bg-gray-50 rounded-xl p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id


            if (tab.id === 'requests') {

            }

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)

                  if (tab.id === 'friends') {
                    loadFriends()
                  } else if (tab.id === 'requests') {
                    loadPendingRequests()
                    loadSentRequests()
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'requests' && pendingRequests.length > 0 && (

                  <motion.span
                    className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center shadow-md animate-pulse"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {pendingRequests.length}
                  </motion.span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {activeTab === 'friends' && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto p-6"
            >
              {friends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    У вас пока нет друзей. Найдите пользователей в поиске!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friends.map((friendship) => {
                    const friend = getFriendProfile(friendship)
                    const friendId = getFriendId(friendship)

                    if (!friend || !friendId) return null

                    return (
                      <motion.div
                        key={friendship.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                              {friend.avatar_url ? (
                                <img src={friend.avatar_url} alt={friend.name} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-6 h-6 text-gray-600" />
                              )}
                            </div>

                            <div className="absolute -bottom-1 -right-1">
                              <OnlineIndicator
                                status={isFriendOnline(friendId) ? 'online' : 'offline'}
                                size="lg"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {friend.name || 'Пользователь'}
                            </p>
                            <OnlineIndicator
                              status={isFriendOnline(friendId) ? 'online' : 'offline'}
                              showText={true}
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenChat(friendId)}
                            className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200"
                          >
                            <MessageCircle className="w-5 h-5 text-white" />
                          </button>
                          <button
                            onClick={() => handleRemoveFriend(friendship.id)}
                            disabled={processingRequests.has(friendship.id)}
                            className={`w-10 h-10 bg-red/10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                              processingRequests.has(friendship.id)
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-red/20'
                            }`}
                          >
                            {processingRequests.has(friendship.id) ? (
                              <div className="loading-spinner w-4 h-4"></div>
                            ) : (
                              <UserMinus className="w-5 h-5 text-red" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto p-6"
            >
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Нет входящих запросов в друзья
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      className="flex items-center justify-between p-4 bg-blue/5 border border-blue/20 rounded-xl"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center overflow-hidden">
                          {request.requester?.avatar_url ? (
                            <img src={request.requester.avatar_url} alt={request.requester.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {request.requester?.name || 'Пользователь'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Хочет добавить вас в друзья
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={processingRequests.has(request.id)}
                          className={`w-10 h-10 bg-green/10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                            processingRequests.has(request.id)
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-green/20'
                          }`}
                        >
                          {processingRequests.has(request.id) ? (
                            <div className="loading-spinner w-4 h-4"></div>
                          ) : (
                            <Check className="w-5 h-5 text-green" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingRequests.has(request.id)}
                          className={`w-10 h-10 bg-red/10 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                            processingRequests.has(request.id)
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-red/20'
                          }`}
                        >
                          {processingRequests.has(request.id) ? (
                            <div className="loading-spinner w-4 h-4"></div>
                          ) : (
                            <X className="w-5 h-5 text-red" />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto p-6"
            >

              <div className="mb-6">
                <div className="flex space-x-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск пользователей..."
                      className="input-apple pl-12"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || !searchQuery.trim()}
                    className="btn-primary px-6 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      'Найти'
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={handleShowAllUsers}
                    disabled={isLoading}
                    className="btn-secondary px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      'Показать всех пользователей'
                    )}
                  </button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((user: any) => (
                    <motion.div
                      key={user.user_id}
                      className={`flex items-center justify-between p-4 rounded-xl ${
                        user.isCurrentUser
                          ? 'bg-blue/5 border border-blue/20'
                          : 'bg-gray-50'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.name || 'Пользователь'}
                            {user.isCurrentUser && (
                              <span className="ml-2 text-xs text-blue font-medium bg-blue/10 px-2 py-1 rounded-full">
                                Это вы
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {(() => {
                        if (user.isCurrentUser) return null

                        const friendshipStatus = getFriendshipStatus(user.user_id)
                        const isProcessing = processingRequests.has(user.user_id)


                        let buttonText = ''
                        let buttonStyle = ''
                        let isDisabled = false

                        switch (friendshipStatus) {
                          case 'friend':
                            buttonText = 'Уже в друзьях'
                            buttonStyle = 'bg-green/10 text-green border border-green/20'
                            isDisabled = true
                            break
                          case 'request_sent':
                            buttonText = 'Запрос отправлен'
                            buttonStyle = 'bg-blue/10 text-blue border border-blue/20'
                            isDisabled = true
                            break
                          case 'request_received':
                            buttonText = 'Ответить на запрос'
                            buttonStyle = 'bg-orange/10 text-orange border border-orange/20'
                            isDisabled = true
                            break
                          default:
                            buttonText = 'Добавить в друзья'
                            buttonStyle = 'bg-gray-800 text-white hover:bg-gray-700'
                            isDisabled = false
                        }

                        return (
                          <button
                            onClick={() => handleSendRequest(user.user_id)}
                            disabled={isDisabled || isProcessing}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center ${
                              isDisabled || isProcessing
                                ? `${buttonStyle} cursor-not-allowed opacity-75`
                                : buttonStyle
                            }`}
                          >
                            {isProcessing ? (
                              <>
                                <div className="loading-spinner w-4 h-4 mr-2"></div>
                                Отправка...
                              </>
                            ) : (
                              buttonText
                            )}
                          </button>
                        )
                      })()}
                    </motion.div>
                  ))}
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red/10 border border-red/20 rounded-xl">
                  <p className="text-sm text-red">{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
