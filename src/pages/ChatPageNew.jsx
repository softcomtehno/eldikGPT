import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  CardBody,
  Input,
  Button,
  Avatar,
  ScrollShadow,
  Spinner,
  Chip,
} from '@nextui-org/react'
import { Send, Plus, Trash2, Clock, MessageSquare, Menu, X } from 'lucide-react'
import {
  getAssistants,
  createChat,
  getChats,
  deleteChat,
  getChat,
  updateChatName,
} from '../services/api'
import { ChatWebSocket } from '../services/websocket'
import ReactMarkdown from 'react-markdown'

export default function ChatPageNew() {
  const { assistantId, chatId } = useParams()
  const navigate = useNavigate()
  const [assistant, setAssistant] = useState(null)
  const [chats, setChats] = useState([])
  const [currentChatId, setCurrentChatId] = useState(chatId)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef(null)
  const wsRef = useRef(null)
  const currentAssistantMessageIdRef = useRef(null)

  useEffect(() => {
    loadAssistant()
    loadChatsList()
  }, [assistantId])

  useEffect(() => {
    if (chatId && chatId !== currentChatId) {
      setCurrentChatId(chatId)
      loadChatMessages(chatId)
    }
  }, [chatId])

  useEffect(() => {
    if (currentChatId && assistant) {
      const timer = setTimeout(() => {
        connectWebSocket()
      }, 100)
      return () => {
        clearTimeout(timer)
        if (wsRef.current) {
          wsRef.current.disconnect()
          wsRef.current = null
        }
      }
    } else {
      if (wsRef.current) {
        wsRef.current.disconnect()
        wsRef.current = null
        setIsConnected(false)
      }
    }
  }, [currentChatId, assistant])

  const loadAssistant = async () => {
    try {
      setIsLoading(true)
      const assistants = await getAssistants()
      const found = assistants.find((a) => a.id.toString() === assistantId)
      if (!found) {
        navigate('/')
        return
      }
      setAssistant(found)
      if (!chatId) {
        setMessages([])
      } else {
        loadChatMessages(chatId)
      }
    } catch (error) {
      console.error('Error loading assistant:', error)
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

  const loadChatsList = async () => {
    try {
      setIsLoadingChats(true)
      const data = await getChats()
      // Фильтруем чаты только для текущего ассистента
      const filteredChats = data.filter(
        (chat) => chat.assistant.id.toString() === assistantId
      )
      setChats(filteredChats)
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setIsLoadingChats(false)
    }
  }

  const loadChatMessages = async (chatId) => {
    try {
      // Загружаем чат из API
      const chatData = await getChat(chatId)

      // Преобразуем сообщения из API формата в формат приложения
      if (chatData.messages && chatData.messages.length > 0) {
        const formattedMessages = chatData.messages.map((msg) => ({
          id: msg.id.toString(),
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.createdAt,
        }))
        setMessages(formattedMessages)
        // Сохраняем в localStorage для офлайн доступа
        saveChatMessages(chatId, formattedMessages)
      } else {
        // Если нет сообщений в API, пробуем загрузить из localStorage
        const savedMessages = localStorage.getItem(`chat_messages_${chatId}`)
        if (savedMessages) {
          try {
            const messages = JSON.parse(savedMessages)
            setMessages(messages)
          } catch (e) {
            setMessages([])
          }
        } else {
          setMessages([])
        }
      }
    } catch (error) {
      console.error('Error loading chat messages:', error)
      // Fallback на localStorage
      try {
        const savedMessages = localStorage.getItem(`chat_messages_${chatId}`)
        if (savedMessages) {
          const messages = JSON.parse(savedMessages)
          setMessages(messages)
        } else {
          setMessages([])
        }
      } catch (e) {
        setMessages([])
      }
    }
  }

  const saveChatMessages = (chatId, messages) => {
    try {
      localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages))
    } catch (error) {
      console.error('Error saving chat messages:', error)
    }
  }

  const connectWebSocket = () => {
    if (!currentChatId) return

    if (wsRef.current) {
      wsRef.current.disconnect()
    }

    const ws = new ChatWebSocket(
      currentChatId,
      handleWebSocketMessage,
      handleWebSocketConnect,
      handleWebSocketError,
      handleWebSocketClose
    )

    wsRef.current = ws
    ws.connect()
  }

  const handleWebSocketConnect = (data) => {
    console.log('WebSocket connected:', data)
    setIsConnected(true)
  }

  const handleWebSocketMessage = ({ type, data }) => {
    if (type === 'complete') {
      setIsTyping(false)
      currentAssistantMessageIdRef.current = null
      if (currentChatId) {
        setMessages((prev) => {
          const updated = [...prev]
          saveChatMessages(currentChatId, updated)
          // Обновляем список чатов после завершения ответа
          loadChatsList()
          return updated
        })
      }
      return
    }

    if (type === 'chunk') {
      if (!currentAssistantMessageIdRef.current) {
        const newMessageId = `msg-${Date.now()}`
        currentAssistantMessageIdRef.current = newMessageId
        setMessages((prev) => {
          const updated = [
            ...prev,
            {
              id: newMessageId,
              role: 'assistant',
              content: data,
              timestamp: new Date().toISOString(),
            },
          ]
          if (currentChatId) {
            saveChatMessages(currentChatId, updated)
          }
          return updated
        })
        setIsTyping(true)
      } else {
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === currentAssistantMessageIdRef.current
              ? { ...msg, content: msg.content + data }
              : msg
          )
          if (currentChatId) {
            saveChatMessages(currentChatId, updated)
          }
          return updated
        })
      }
    }
  }

  const handleWebSocketError = (error) => {
    console.error('WebSocket error:', error)
    setIsConnected(false)
  }

  const handleWebSocketClose = () => {
    console.log('WebSocket closed')
    setIsConnected(false)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleNewChat = () => {
    navigate(`/chat/${assistantId}`)
    setCurrentChatId(null)
    setMessages([])
  }

  const handleChatSelect = (chat) => {
    navigate(`/chat/${assistantId}/${chat.id}`)
    setCurrentChatId(chat.id)
    loadChatMessages(chat.id)
    // Закрываем боковую панель на мобильных
    setSidebarOpen(false)
  }

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation()
    if (!confirm('Вы уверены, что хотите удалить этот чат?')) {
      return
    }

    try {
      setDeletingId(chatId)
      await deleteChat(chatId)
      setChats(chats.filter((chat) => chat.id !== chatId))
      localStorage.removeItem(`chat_messages_${chatId}`)
      if (currentChatId === chatId.toString()) {
        navigate(`/chat/${assistantId}`)
        setCurrentChatId(null)
        setMessages([])
      }
    } catch (err) {
      alert('Не удалось удалить чат')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !assistant) return

    const messageText = inputValue.trim()
    setInputValue('')

    let chatIdToUse = currentChatId
    let isNewChat = false

    if (!chatIdToUse) {
      try {
        // Создаем чат с временным названием
        const newChat = await createChat('Новый чат', assistant.id)
        chatIdToUse = newChat.id
        setCurrentChatId(chatIdToUse)
        navigate(`/chat/${assistantId}/${chatIdToUse}`, { replace: true })
        isNewChat = true
        await loadChatsList()
      } catch (error) {
        console.error('Error creating chat:', error)
        alert('Не удалось создать чат')
        return
      }
    }

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => {
      const updated = [...prev, userMessage]
      saveChatMessages(chatIdToUse, updated)
      return updated
    })

    // Если это новый чат, обновляем название первым сообщением
    if (isNewChat) {
      try {
        // Обрезаем сообщение до 50 символов для названия
        const chatName =
          messageText.length > 50
            ? messageText.substring(0, 50) + '...'
            : messageText
        await updateChatName(chatIdToUse, chatName)
        await loadChatsList() // Обновляем список чатов
      } catch (error) {
        console.error('Error updating chat name:', error)
      }
    }

    if (!wsRef.current || !isConnected) {
      connectWebSocket()
      let attempts = 0
      const maxAttempts = 50
      const checkConnection = setInterval(() => {
        attempts++
        if (wsRef.current && wsRef.current.isConnected) {
          clearInterval(checkConnection)
          wsRef.current.sendMessage(messageText)
        } else if (attempts >= maxAttempts) {
          clearInterval(checkConnection)
          alert('Не удалось подключиться к чату. Попробуйте еще раз.')
        }
      }, 100)
    } else {
      if (wsRef.current && wsRef.current.isConnected) {
        const sent = wsRef.current.sendMessage(messageText)
        if (!sent) {
          alert('Не удалось отправить сообщение. Попробуйте еще раз.')
        }
      }
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Сегодня'
    if (days === 1) return 'Вчера'
    if (days < 7) return `${days} дней назад`
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  console.log(messages)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (!assistant) {
    return null
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 relative">
      {/* Кнопка для мобильных устройств */}
      <Button
        isIconOnly
        variant="flat"
        className="lg:hidden fixed top-20 left-4 z-50"
        onPress={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Боковая панель с историей чатов */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:static w-80 flex-shrink-0 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full lg:h-auto z-40 transition-transform duration-300`}
      >
        <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700">
          <Button
            color="primary"
            className="w-full"
            size="sm"
            startContent={<Plus className="w-4 h-4" />}
            onPress={handleNewChat}
          >
            Новый чат
          </Button>
        </div>
        <ScrollShadow className="flex-1 overflow-y-auto">
          {isLoadingChats ? (
            <div className="flex justify-center items-center p-8">
              <Spinner size="sm" />
            </div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Нет чатов</p>
            </div>
          ) : (
            <div className="p-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className={`p-2 md:p-3 rounded-lg mb-1 md:mb-2 cursor-pointer transition-colors ${
                    currentChatId === chat.id.toString()
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs md:text-sm text-gray-800 dark:text-white truncate">
                        {chat.name || 'Без названия'}
                      </p>
                      <div className="flex items-center gap-1 md:gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {formatDate(chat.updatedAt || chat.createdAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      className="flex-shrink-0"
                      onPress={(e) => handleDeleteChat(chat.id, e)}
                      isLoading={deletingId === chat.id}
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollShadow>
      </div>

      {/* Overlay для мобильных */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Основная область чата */}
      <div className="flex-1 flex flex-col w-full lg:w-auto min-w-0">
        <div className="flex items-center gap-2 md:gap-3 mb-4">
          <Avatar
            src={
              assistant.photo ||
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
            }
            alt={assistant.name}
            size="md"
            className="md:w-12 md:h-12"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white truncate">
              {assistant.name}
            </h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
              {assistant.description}
            </p>
          </div>
          {currentChatId && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:inline">
                {isConnected ? 'Подключено' : 'Подключение...'}
              </span>
            </div>
          )}
        </div>

        <Card className="flex-1 flex flex-col">
          <CardBody className="flex-1 overflow-hidden p-0">
            <ScrollShadow className="h-full p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">
                      Начните общение с ассистентом
                    </p>
                    <p className="text-sm">Задайте любой вопрос</p>
                  </div>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar
                      src={
                        assistant.photo ||
                        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
                      }
                      alt={assistant.name}
                      size="sm"
                    />
                  )}
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 md:px-4 py-2 md:py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white'
                    }`}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <Avatar
                      name="Вы"
                      size="sm"
                      className="bg-gray-300 dark:bg-gray-600"
                    />
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <Avatar
                    src={
                      assistant.photo ||
                      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
                    }
                    alt={assistant.name}
                    size="sm"
                  />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollShadow>
          </CardBody>
          <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Введите сообщение..."
                variant="bordered"
                className="flex-1"
                disabled={isTyping}
                size="md"
              />
              <Button
                color="primary"
                isIconOnly
                onPress={handleSendMessage}
                isDisabled={!inputValue.trim() || isTyping}
                size="lg"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
