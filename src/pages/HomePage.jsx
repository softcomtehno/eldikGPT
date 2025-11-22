import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Image,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@nextui-org/react'
import {
  MessageCircle,
  AlertCircle,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react'
import AssistantModal from '../components/AssistantModal'
import {
  getAssistants,
  createAssistant,
  updateAssistant,
  deleteAssistant,
} from '../services/api'

export default function HomePage() {
  const [assistants, setAssistants] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAssistant, setEditingAssistant] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadAssistants()
  }, [])

  const loadAssistants = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAssistants()
      setAssistants(data)
    } catch (err) {
      setError('Не удалось загрузить ассистентов')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAssistant = async (assistantData) => {
    try {
      setIsSaving(true)
      await createAssistant(assistantData)
      await loadAssistants()
      setIsModalOpen(false)
      setEditingAssistant(null)
    } catch (err) {
      alert('Не удалось создать ассистента')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateAssistant = async (assistantData) => {
    try {
      setIsSaving(true)
      await updateAssistant(editingAssistant.id, assistantData)
      await loadAssistants()
      setIsModalOpen(false)
      setEditingAssistant(null)
    } catch (err) {
      alert('Не удалось обновить ассистента')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAssistant = async (assistantId) => {
    if (!confirm('Вы уверены, что хотите удалить этого ассистента?')) {
      return
    }

    try {
      await deleteAssistant(assistantId)
      await loadAssistants()
    } catch (err) {
      alert('Не удалось удалить ассистента')
      console.error(err)
    }
  }

  const handleOpenModal = (assistant = null) => {
    setEditingAssistant(assistant)
    setIsModalOpen(true)
  }

  const handleStartChat = (assistantId, e) => {
    if (e) {
      // e.stopPropagation()
    }
    navigate(`/chat/${assistantId}`)
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
        <Button color="primary" onPress={loadAssistants}>
          Попробовать снова
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-[1024px] mx-auto">
      <div className="flex justify-between items-center mb-8 flex-col gap-2 md:flex-row ">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 text-center md:text-left">
            ИИ Ассистенты
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Выберите ассистента для начала общения
          </p>
        </div>
        <Button
          color="primary"
          size="lg"
          startContent={<Plus className="w-5 h-5" />}
          onPress={() => handleOpenModal()}
        >
          Создать ассистента
        </Button>
      </div>

      {assistants.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Ассистенты не найдены
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map((assistant) => (
            <Card
              key={assistant.id}
              className="hover:shadow-xl transition-shadow"
              isPressable
              onPress={() => handleOpenModal(assistant)}
            >
              <CardHeader className="flex flex-col items-center pb-0 pt-6 relative">
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      className="absolute top-2 right-2"
                      onPress={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Actions">
                    <DropdownItem
                      key="edit"
                      startContent={<Edit className="w-4 h-4" />}
                      onPress={() => handleOpenModal(assistant)}
                    >
                      Редактировать
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      startContent={<Trash2 className="w-4 h-4" />}
                      onPress={() => handleDeleteAssistant(assistant.id)}
                    >
                      Удалить
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Image
                  src={
                    assistant.photo ||
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
                  }
                  alt={assistant.name}
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {assistant.name}
                </h3>
              </CardHeader>
              <CardBody className="text-center pt-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {assistant.description || 'Нет описания'}
                </p>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<MessageCircle className="w-4 h-4" />}
                  onPress={(e) => handleStartChat(assistant.id, e)}
                  className="w-full"
                >
                  Начать чат
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <AssistantModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingAssistant(null)
        }}
        onSave={
          editingAssistant ? handleUpdateAssistant : handleCreateAssistant
        }
        assistant={editingAssistant}
        isLoading={isSaving}
      />
    </div>
  )
}
