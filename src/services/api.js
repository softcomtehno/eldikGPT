const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://api.hackathon-eldik.makalabox.com'

// Функция для получения токена из localStorage
const getAccessToken = () => {
  return localStorage.getItem('access_token')
}

// Функция для получения refresh токена
const getRefreshToken = () => {
  return localStorage.getItem('refresh_token')
}

// Функция для сохранения токенов
const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access)
  if (refresh) {
    localStorage.setItem('refresh_token', refresh)
  }
}

// Функция для удаления токенов
const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

// Функция для обновления access токена
const refreshAccessToken = async () => {
  const refresh = getRefreshToken()
  if (!refresh) {
    throw new Error('No refresh token')
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/jwt/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const data = await response.json()
    setTokens(data.access, null)
    return data.access
  } catch (error) {
    clearTokens()
    throw error
  }
}

// Функция для выполнения запроса с автоматическим обновлением токена
const fetchWithAuth = async (url, options = {}) => {
  const token = getAccessToken()

  const headers = {
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response = await fetch(url, {
    ...options,
    headers,
  })

  // Если получили 401, пробуем обновить токен
  if (response.status === 401 && token) {
    try {
      const newToken = await refreshAccessToken()
      headers.Authorization = `Bearer ${newToken}`
      response = await fetch(url, {
        ...options,
        headers,
      })
    } catch (error) {
      clearTokens()
      window.location.href = '/login'
      throw error
    }
  }

  return response
}

// ========== АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ ==========

// Авторизация
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jwt/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Ошибка авторизации')
    }

    const data = await response.json()
    setTokens(data.access, data.refresh)
    return data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

// Регистрация
export const register = async (email, fullName, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, fullName, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Ошибка регистрации')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error registering:', error)
    throw error
  }
}

// Подтверждение email
export const verifyEmail = async (email, code) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify-email/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Ошибка подтверждения email')
    }

    const data = await response.json()
    setTokens(data.access, data.refresh)
    return data
  } catch (error) {
    console.error('Error verifying email:', error)
    throw error
  }
}

// Получение профиля пользователя
export const getProfile = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/profile/`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching profile:', error)
    throw error
  }
}

// Выход
export const logout = () => {
  clearTokens()
}

// Проверка авторизации
export const isAuthenticated = () => {
  return !!getAccessToken()
}

// ========== АССИСТЕНТЫ ==========

// Получение списка ассистентов
export const getAssistants = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/rag/assistants/`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching assistants:', error)
    throw error
  }
}

// Получение списка чатов
export const getChats = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/rag/chats/`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching chats:', error)
    throw error
  }
}

// Создание нового чата
export const createChat = async (name, assistantId) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/rag/chats/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        assistant: assistantId,
      }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating chat:', error)
    throw error
  }
}

// Получение одного чата по ID
export const getChat = async (chatId) => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/rag/chats/${chatId}/`
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching chat:', error)
    throw error
  }
}

// Обновление названия чата
export const updateChatName = async (chatId, name) => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/rag/chats/${chatId}/`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      }
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error updating chat name:', error)
    throw error
  }
}

// Удаление чата
export const deleteChat = async (chatId) => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/rag/chats/${chatId}/`,
      {
        method: 'DELETE',
      }
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return true
  } catch (error) {
    console.error('Error deleting chat:', error)
    throw error
  }
}

// ========== МЕТОДЫ ДЛЯ АССИСТЕНТОВ ==========

// Получение одного ассистента по ID
export const getAssistant = async (assistantId) => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/rag/assistants/${assistantId}/`
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching assistant:', error)
    throw error
  }
}

// Создание нового ассистента
export const createAssistant = async (data) => {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('description', data.description || '')
  formData.append('systemPrompt', data.systemPrompt || '')
  formData.append('llmModel', data.llmModel || '')

  if (data.photo instanceof File) {
    formData.append('photo', data.photo)
  }

  const response = await fetchWithAuth(`${API_BASE_URL}/api/rag/assistants/`, {
    method: 'POST',
    body: formData, // ❗ без headers для FormData!!!
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

// Обновление ассистента (PUT - полное обновление)
export const updateAssistant = async (id, data) => {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('description', data.description || '')
  formData.append('systemPrompt', data.systemPrompt || '')
  formData.append('llmModel', data.llmModel || '')

  if (data.photo instanceof File) {
    formData.append('photo', data.photo)
  }

  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/rag/assistants/${id}/`,
    {
      method: 'PUT',
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

// Частичное обновление ассистента (PATCH)
export const patchAssistant = async (id, data) => {
  const formData = new FormData()

  if (data.name) formData.append('name', data.name)
  if (data.description) formData.append('description', data.description)
  if (data.systemPrompt !== undefined)
    formData.append('systemPrompt', data.systemPrompt || '')
  if (data.llmModel !== undefined)
    formData.append('llmModel', data.llmModel || '')
  if (data.photo instanceof File) formData.append('photo', data.photo)

  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/rag/assistants/${id}/`,
    {
      method: 'PATCH',
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}

// Удаление ассистента
export const deleteAssistant = async (assistantId) => {
  try {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/rag/assistants/${assistantId}/`,
      {
        method: 'DELETE',
      }
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return true
  } catch (error) {
    console.error('Error deleting assistant:', error)
    throw error
  }
}

// Получение списка LLM моделей
export const getLLMModels = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rag/llm-models/`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching LLM models:', error)
    throw error
  }
}
