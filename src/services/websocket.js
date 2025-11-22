const WS_BASE_URL =
  import.meta.env.VITE_WS_BASE_URL ||
  'wss://api.hackathon-eldik.makalabox.com'

export class ChatWebSocket {
  constructor(chatId, onMessage, onConnect, onError, onClose) {
    this.chatId = chatId
    this.onMessage = onMessage
    this.onConnect = onConnect
    this.onError = onError
    this.onClose = onClose
    this.ws = null
    this.isConnected = false
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    const wsUrl = `${WS_BASE_URL}/ws/chats/${this.chatId}/`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.isConnected = true
    }

    this.ws.onmessage = (event) => {
      const data = event.data

      // Проверяем, является ли это сообщением о подключении
      if (data.startsWith('{')) {
        try {
          const parsed = JSON.parse(data)
          if (parsed.message === 'Connected') {
            this.onConnect(parsed)
            return
          }
        } catch (e) {
          // Не JSON, продолжаем обработку
        }
      }

      // Проверяем, является ли это завершающим маркером
      if (data === '[COMPLETE]') {
        this.onMessage({ type: 'complete' })
        return
      }

      // Обычное текстовое сообщение (часть ответа)
      this.onMessage({ type: 'chunk', data })
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.onError(error)
    }

    this.ws.onclose = () => {
      console.log('WebSocket closed')
      this.isConnected = false
      this.onClose()
    }
  }

  sendMessage(text) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')
      return false
    }

    const message = JSON.stringify({ text })
    this.ws.send(message)
    return true
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.isConnected = false
    }
  }
}

