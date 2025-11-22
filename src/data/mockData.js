// Mock данные для ассистентов
export const mockAssistants = [
  {
    id: '1',
    name: 'Финансовый консультант',
    description:
      'Помогает с вопросами по инвестициям, кредитам и финансовому планированию',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    settingsFile: null,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Специалист по картам',
    description: 'Консультации по банковским картам, бонусам и льготам',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    settingsFile: null,
    createdAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '3',
    name: 'Эксперт по вкладам',
    description: 'Помощь в выборе оптимальных вкладов и депозитов',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    settingsFile: null,
    createdAt: '2024-01-25T09:15:00Z',
  },
]

// Mock данные для истории чатов
export const mockChatHistory = [
  {
    id: 'chat1',
    assistantId: '1',
    assistantName: 'Финансовый консультант',
    lastMessage:
      'Рекомендую рассмотреть индексные фонды для долгосрочных инвестиций',
    timestamp: '2024-01-28T15:30:00Z',
    messageCount: 12,
  },
  {
    id: 'chat2',
    assistantId: '2',
    assistantName: 'Специалист по картам',
    lastMessage: 'Ваша карта поддерживает кэшбэк до 5% в выбранных категориях',
    timestamp: '2024-01-27T11:20:00Z',
    messageCount: 8,
  },
  {
    id: 'chat3',
    assistantId: '1',
    assistantName: 'Финансовый консультант',
    lastMessage:
      'Для вашей ситуации подойдет ипотечный кредит с фиксированной ставкой',
    timestamp: '2024-01-26T16:45:00Z',
    messageCount: 15,
  },
  {
    id: 'chat4',
    assistantId: '3',
    assistantName: 'Эксперт по вкладам',
    lastMessage: 'Срок вклада влияет на процентную ставку',
    timestamp: '2024-01-25T10:10:00Z',
    messageCount: 6,
  },
]

// Mock данные для сообщений в чате
export const mockMessages = {
  chat1: [
    {
      id: 'msg1',
      role: 'user',
      content: 'Здравствуйте! Хочу начать инвестировать. С чего начать?',
      timestamp: '2024-01-28T15:00:00Z',
    },
    {
      id: 'msg2',
      role: 'assistant',
      content:
        'Здравствуйте! Отличное решение начать инвестировать. Для начала рекомендую определить ваши финансовые цели и горизонт инвестирования. Какие цели вы преследуете?',
      timestamp: '2024-01-28T15:00:15Z',
    },
    {
      id: 'msg3',
      role: 'user',
      content: 'Хочу накопить на пенсию, мне 30 лет',
      timestamp: '2024-01-28T15:01:00Z',
    },
    {
      id: 'msg4',
      role: 'assistant',
      content:
        'Отлично! У вас большой горизонт инвестирования - около 30 лет. Это позволяет использовать более агрессивные стратегии. Рекомендую рассмотреть индексные фонды для долгосрочных инвестиций, они диверсифицированы и имеют низкие комиссии.',
      timestamp: '2024-01-28T15:01:20Z',
    },
  ],
}

