import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Image,
} from '@nextui-org/react'
import { Upload, X } from 'lucide-react'
import Select from 'react-select'
import { getLLMModels } from '../services/api'

export default function AssistantModal({
  isOpen,
  onClose,
  onSave,
  assistant,
  isLoading = false,
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [llmModel, setLlmModel] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [llmModels, setLlmModels] = useState([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)

  // Загружаем список моделей при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      loadLLMModels()
    }
  }, [isOpen])

  useEffect(() => {
    if (assistant) {
      setName(assistant.name || '')
      setDescription(assistant.description || '')
      setSystemPrompt(assistant.systemPrompt || '')
      
      // Устанавливаем выбранную модель
      if (assistant.llmModel) {
        setLlmModel({
          value: assistant.llmModel,
          label: assistant.llmModel,
        })
      } else {
        setLlmModel(null)
      }

      // если фото строка – подставляем как превью
      if (typeof assistant.photo === 'string' && assistant.photo !== '') {
        setPhotoPreview(assistant.photo)
        setPhoto(null)
      }
    } else {
      setName('')
      setDescription('')
      setSystemPrompt('')
      setLlmModel(null)
      setPhoto(null)
      setPhotoPreview('')
    }
  }, [assistant, isOpen])

  const loadLLMModels = async () => {
    try {
      setIsLoadingModels(true)
      const models = await getLLMModels()
      const options = models.map((model) => ({
        value: model,
        label: model,
      }))
      setLlmModels(options)
    } catch (error) {
      console.error('Error loading LLM models:', error)
    } finally {
      setIsLoadingModels(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = () => {
    if (!name.trim()) return

    onSave({
      name,
      description,
      systemPrompt: systemPrompt.trim() || '',
      llmModel: llmModel?.value || '',
      photo,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent className="pb-2">
        <ModalHeader className="flex flex-col gap-1 text-xl font-semibold">
          {assistant ? 'Редактировать ассистента' : 'Создать нового ассистента'}
        </ModalHeader>

        <ModalBody>
          <div className="flex flex-col items-center gap-6 py-2">
            {/* Аватар */}
            <div className="relative group">
              {photoPreview ? (
                <div className="relative">
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover shadow-md"
                  />

                  {/* Кнопка удаления */}
                  <button
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition"
                    onClick={() => {
                      setPhoto(null)
                      setPhotoPreview('')
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-inner">
                  <Upload className="w-10 h-10 text-gray-400" />
                </div>
              )}

              {/* Файл-инпут */}
              <label className="block mt-3">
                <span className="cursor-pointer px-4 py-1.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition">
                  Выбрать фото
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* Поля */}
            <div className="w-full flex flex-col gap-4">
              <Input
                label="Название ассистента"
                placeholder="Введите название"
                value={name}
                onChange={(e) => setName(e.target.value)}
                isRequired
                variant="bordered"
              />

              <Textarea
                label="Описание"
                placeholder="Опишите функции и особенности (необязательно)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                minRows={2}
                variant="bordered"
              />

              <Textarea
                label="Системный промпт"
                placeholder="Опишите, как должен работать ассистент. Например: 'Ты ассистент, который отвечает за маркетинг...'"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                minRows={3}
                variant="bordered"
                description="Определяет поведение и специализацию ассистента"
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  LLM Модель
                </label>
                <Select
                  value={llmModel}
                  onChange={(selected) => setLlmModel(selected)}
                  options={llmModels}
                  isLoading={isLoadingModels}
                  placeholder="Выберите модель..."
                  isSearchable
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '40px',
                      borderColor: 'rgb(229, 231, 235)',
                      '&:hover': {
                        borderColor: 'rgb(209, 213, 219)',
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                    }),
                  }}
                  theme={(theme) => ({
                    ...theme,
                    colors: {
                      ...theme.colors,
                      primary: 'rgb(59, 130, 246)',
                      primary25: 'rgb(239, 246, 255)',
                      primary50: 'rgb(219, 234, 254)',
                      primary75: 'rgb(191, 219, 254)',
                    },
                  })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Выберите модель для генерации ответов
                </p>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            isDisabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            isDisabled={!name.trim() || isLoading}
            isLoading={isLoading}
          >
            {assistant ? 'Сохранить' : 'Создать'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
