import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardBody, Input, Button } from '@nextui-org/react'
import { register, verifyEmail, getProfile } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const [step, setStep] = useState(1) // 1 - регистрация, 2 - подтверждение
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login: setUser } = useAuth()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await register(email, fullName, password)
      setStep(2)
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await verifyEmail(email, code)
      const profile = await getProfile()
      setUser(profile)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Неверный код подтверждения')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardBody className="p-8">
            <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
              Подтверждение email
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Мы отправили код подтверждения на {email}
            </p>
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <Input
                label="Код подтверждения"
                placeholder="Введите код из письма"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                isRequired
                variant="bordered"
              />
              <Button
                type="submit"
                color="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Подтвердить
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Назад
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardBody className="p-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
            Регистрация
          </h1>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            <Input
              label="Полное имя"
              placeholder="Иван Иванов"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              isRequired
              variant="bordered"
            />
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isRequired
              variant="bordered"
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isRequired
              variant="bordered"
            />
            <Button
              type="submit"
              color="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Зарегистрироваться
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Уже есть аккаунт?{' '}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Войти
              </Link>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

