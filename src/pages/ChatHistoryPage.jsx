import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, Avatar, Spinner, Button } from '@nextui-org/react'
import { MessageSquare, Clock, Trash2, AlertCircle } from 'lucide-react'
import { getChats, deleteChat } from '../services/api'

export default function ChatHistoryPage() {
  const navigate = useNavigate()
  const [chats, setChats] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getChats()
      setChats(data)
    } catch (err) {
      setError('Не удалось загрузить историю чатов')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async (chatId, e) => {
    // e.stopPropagation()
    if (!confirm('Вы уверены, что хотите удалить этот чат?')) {
      return
    }

    try {
      setDeletingId(chatId)
      await deleteChat(chatId)
      setChats(chats.filter((chat) => chat.id !== chatId))
      // Удаляем сообщения чата из localStorage
      try {
        localStorage.removeItem(`chat_messages_${chatId}`)
      } catch (error) {
        console.error('Error removing chat messages from localStorage:', error)
      }
    } catch (err) {
      alert('Не удалось удалить чат')
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return 'Сегодня'
    } else if (days === 1) {
      return 'Вчера'
    } else if (days < 7) {
      return `${days} дней назад`
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleChatClick = (chat) => {
    navigate(`/chat/${chat.assistant.id}/${chat.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="w-16 h-16 text-danger mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <Button color="primary" onPress={loadChats}>
          Попробовать снова
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-[1024px] mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
          История чатов
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Все ваши предыдущие разговоры с ИИ ассистентами
        </p>
      </div>

      {chats.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              У вас пока нет истории чатов
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              Начните общение с любым ассистентом
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {chats.map((chat) => (
            <Card
              key={chat.id}
              isPressable
              isHoverable
              onPress={() => handleChatClick(chat)}
              className="transition-all hover:shadow-lg"
            >
              <CardBody className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={
                      chat.assistant?.photo ||
                      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
                    }
                    alt={chat.assistant?.name || 'Ассистент'}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          {chat.name || chat.assistant?.name || 'Чат'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {chat.assistant?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatDate(chat.updatedAt || chat.createdAt)}
                          </span>
                          <span>•</span>
                          <span>
                            {formatTime(chat.updatedAt || chat.createdAt)}
                          </span>
                        </div>
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="light"
                          onPress={(e) => {
                            // e.stopPropagation()
                            handleDeleteChat(chat.id, e)
                          }}
                          isLoading={deletingId === chat.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
