import { supabase, Friendship, Chat, Message, ChatParticipant } from './supabase'

export class FriendsApi {

  static async searchUsers(query: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url, created_at')
        .ilike('name', `%${query}%`)
        .not('name', 'is', null)
        .neq('name', '')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        throw new Error(`Ошибка поиска: ${error.message}`)
      }

      return data || []
    } catch (err) {
      throw err
    }
  }


  static async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url, created_at')
      .not('name', 'is', null)
      .neq('name', '')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return []
    }

    return data || []
  }


  static async sendFriendRequest(addresseeId: string) {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) throw new Error('Не авторизован')

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: currentUser.user.id,
        addressee_id: addresseeId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }


  static async acceptFriendRequest(friendshipId: string) {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .select()
      .single()

    if (error) throw error
    return data
  }


  static async removeFriendship(friendshipId: string) {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)

    if (error) throw error
  }


  static async blockUser(friendshipId: string) {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'blocked' })
      .eq('id', friendshipId)
      .select()
      .single()

    if (error) throw error
    return data
  }


  static async getFriends() {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) throw new Error('Не авторизован')

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:profiles!friendships_requester_id_fkey(user_id, name, avatar_url),
        addressee:profiles!friendships_addressee_id_fkey(user_id, name, avatar_url)
      `)
      .or(`requester_id.eq.${currentUser.user.id},addressee_id.eq.${currentUser.user.id}`)
      .eq('status', 'accepted')

    if (error) throw error
    return data
  }


  static async getPendingRequests() {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) throw new Error('Не авторизован')

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:profiles!friendships_requester_id_fkey(user_id, name, avatar_url)
      `)
      .eq('addressee_id', currentUser.user.id)
      .eq('status', 'pending')

    if (error) throw error
    return data
  }


  static async getSentRequests() {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) throw new Error('Не авторизован')

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        addressee:profiles!friendships_addressee_id_fkey(user_id, name, avatar_url)
      `)
      .eq('requester_id', currentUser.user.id)
      .eq('status', 'pending')

    if (error) throw error
    return data
  }

  static async createDirectChat(friendId: string) {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) throw new Error('Не авторизован')


    const { data: existingChat } = await supabase
      .from('chat_participants')
      .select(`
        chat_id,
        chats!inner(type)
      `)
      .eq('user_id', currentUser.user.id)
      .eq('chats.type', 'direct')

    if (existingChat) {
      for (const participant of existingChat) {
        const { data: otherParticipant } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', participant.chat_id)
          .neq('user_id', currentUser.user.id)
          .single()

        if (otherParticipant?.user_id === friendId) {

          return { chat_id: participant.chat_id, exists: true }
        }
      }
    }


    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        type: 'direct',
        created_by: currentUser.user.id
      })
      .select()
      .single()

    if (chatError) throw chatError


    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert([
        { chat_id: chat.id, user_id: currentUser.user.id, is_admin: true },
        { chat_id: chat.id, user_id: friendId, is_admin: false }
      ])

    if (participantsError) throw participantsError

    return { chat_id: chat.id, exists: false }
  }


  static async getUserChats() {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) throw new Error('Не авторизован')

    const { data, error } = await supabase
      .from('chat_participants')
      .select(`
        *,
        chats!inner(*)
      `)
      .eq('user_id', currentUser.user.id)
      .order('chats(last_message_at)', { ascending: false })

    if (error) throw error
    return data
  }

  static async sendMessage(chatId: string, content: string, replyTo?: string) {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) throw new Error('Не авторизован')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: currentUser.user.id,
        content,
        message_type: 'text',
        reply_to: replyTo
      })
      .select()
      .single()

    if (error) throw error
    return data
  }


  static async sendMediaMessage(
    chatId: string,
    file: File,
    messageType: 'image' | 'video' | 'file'
  ) {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) throw new Error('Не авторизован')

    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${messageType}_${timestamp}.${fileExt}`
    const filePath = `${currentUser.user.id}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: currentUser.user.id,
        message_type: messageType,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size
      })
      .select()
      .single()

    if (error) throw error
    return data
  }


  static async getChatMessages(chatId: string, limit = 50, offset = 0) {

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (messagesError) {
      throw messagesError
    }
    if (!messages || messages.length === 0) {
      return []
    }


    const senderIds = Array.from(new Set(messages.map(msg => msg.sender_id)))

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url')
      .in('user_id', senderIds)

    if (profilesError) {

    }

    const profilesMap = new Map()
    profiles?.forEach(profile => {
      profilesMap.set(profile.user_id, profile)
    })


    const messagesWithSenders = messages.map(message => ({
      ...message,
      sender: profilesMap.get(message.sender_id) || null
    }))
    return messagesWithSenders.reverse()
  }


  static subscribeToMessages(chatId: string, callback: (message: any) => void) {
    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe((status) => {
      })

    return subscription
  }


  static async markAsRead(chatId: string) {
    const { data: currentUser } = await supabase.auth.getUser()
    if (!currentUser.user) throw new Error('Не авторизован')

    const { error } = await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', currentUser.user.id)

    if (error) throw error
  }
}
