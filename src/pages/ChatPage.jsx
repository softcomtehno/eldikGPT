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
} from '@nextui-org/react'
import { Send, ArrowLeft } from 'lucide-react'
import { getAssistants, createChat } from '../services/api'
import { ChatWebSocket } from '../services/websocket'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ChatPage() {
  const { assistantId, chatId } = useParams()
  const navigate = useNavigate()
  const [assistant, setAssistant] = useState(null)
  const [currentChatId, setCurrentChatId] = useState(chatId)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const wsRef = useRef(null)
  const currentAssistantMessageIdRef = useRef(null)

  useEffect(() => {
    loadAssistant()
  }, [assistantId])

  // Загружаем сообщения при изменении chatId
  useEffect(() => {
    if (chatId && chatId !== currentChatId) {
      setCurrentChatId(chatId)
      loadChatMessages(chatId)
    }
  }, [chatId])

  useEffect(() => {
    // Подключаемся к WebSocket, если есть chatId
    if (currentChatId && assistant) {
      // Небольшая задержка для гарантии, что компонент готов
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
      // Если нет chatId, отключаем WebSocket
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
      // Если chatId нет, создаем новый чат при первом сообщении
      if (!chatId) {
        setMessages([])
      } else {
        // Загружаем сообщения из localStorage
        loadChatMessages(chatId)
      }
    } catch (error) {
      console.error('Error loading assistant:', error)
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

  // Загрузка сообщений из localStorage
  const loadChatMessages = (chatId) => {
    try {
      const savedMessages = localStorage.getItem(`chat_messages_${chatId}`)
      if (savedMessages) {
        const messages = JSON.parse(savedMessages)
        setMessages(messages)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('Error loading chat messages:', error)
      setMessages([])
    }
  }

  // Сохранение сообщений в localStorage
  const saveChatMessages = (chatId, messages) => {
    try {
      localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages))
    } catch (error) {
      console.error('Error saving chat messages:', error)
    }
  }

  const connectWebSocket = () => {
    if (!currentChatId) return

    // Отключаем предыдущее соединение, если есть
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
      // Сохраняем сообщения после завершения ответа
      if (currentChatId) {
        setMessages((prev) => {
          const updated = [...prev]
          saveChatMessages(currentChatId, updated)
          return updated
        })
      }
      return
    }

    if (type === 'chunk') {
      // Если еще нет сообщения ассистента, создаем его
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
          // Сохраняем при создании нового сообщения
          if (currentChatId) {
            saveChatMessages(currentChatId, updated)
          }
          return updated
        })
        setIsTyping(true)
      } else {
        // Обновляем существующее сообщение
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === currentAssistantMessageIdRef.current
              ? { ...msg, content: msg.content + data }
              : msg
          )
          // Сохраняем при обновлении
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
  console.log(messages);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !assistant) return

    const messageText = inputValue.trim()
    setInputValue('')

    // Если чата еще нет, создаем его
    let chatIdToUse = currentChatId
    if (!chatIdToUse) {
      try {
        const newChat = await createChat(
          `Чат с ${assistant.name}`,
          assistant.id
        )
        chatIdToUse = newChat.id
        setCurrentChatId(chatIdToUse)
        // Обновляем URL без перезагрузки страницы
        navigate(`/chat/${assistantId}/${chatIdToUse}`, { replace: true })
      } catch (error) {
        console.error('Error creating chat:', error)
        alert('Не удалось создать чат')
        return
      }
    }

    // Добавляем сообщение пользователя в список
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => {
      const updated = [...prev, userMessage]
      // Сохраняем сообщения пользователя
      saveChatMessages(chatIdToUse, updated)
      return updated
    })

    // Подключаемся к WebSocket и отправляем сообщение
    if (!wsRef.current || !isConnected) {
      connectWebSocket()
      // Ждем подключения перед отправкой
      let attempts = 0
      const maxAttempts = 50 // 5 секунд максимум
      const checkConnection = setInterval(() => {
        attempts++
        if (wsRef.current && wsRef.current.isConnected) {
          clearInterval(checkConnection)
          wsRef.current.sendMessage(messageText)
        } else if (attempts >= maxAttempts) {
          clearInterval(checkConnection)
          alert(
            'Не удалось подключиться к чату. Попробуйте отправить сообщение еще раз.'
          )
        }
      }, 100)
    } else {
      // Отправляем сообщение через WebSocket
      if (wsRef.current && wsRef.current.isConnected) {
        const sent = wsRef.current.sendMessage(messageText)
        if (!sent) {
          alert('Не удалось отправить сообщение. Попробуйте еще раз.')
        }
      } else {
        // Если WebSocket не подключен, подключаемся
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
            alert(
              'Не удалось подключиться к чату. Попробуйте отправить сообщение еще раз.'
            )
          }
        }, 100)
      }
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button isIconOnly variant="light" onPress={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar
            src={
              assistant.photo ||
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
            }
            alt={assistant.name}
            size="lg"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {assistant.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {assistant.description}
            </p>
          </div>
          {currentChatId && (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isConnected ? 'Подключено' : 'Подключение...'}
              </span>
            </div>
          )}
        </div>
      </div>

      <Card className="h-[calc(100vh-250px)] flex flex-col">
        <CardBody className="flex-1 overflow-hidden p-0">
          <ScrollShadow className="h-full p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <p className="text-lg mb-2">Начните общение с ассистентом</p>
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
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white'
                  }`}
                >
                  <ReactMarkdown
                    // remarkPlugins={[remarkGfm]}
                    // className="prose prose-invert max-w-none"
                  >
                    {message.content}
                  </ReactMarkdown>{' '}
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
              // disabled={isTyping || !isConnected}
            />
            <Button
              color="primary"
              isIconOnly
              onPress={handleSendMessage}
              // isDisabled={!inputValue.trim() || isTyping || !isConnected}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
