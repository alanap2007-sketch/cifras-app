import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useBackButton() {
  const navigate = useNavigate()

  useEffect(() => {
    // Captura o botão voltar do Android
    const handleBackButton = async () => {
      const { App } = await import('@capacitor/app')
      
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          navigate(-1) // Volta para a tela anterior
        } else {
          // Se não tem para onde voltar, minimiza o app
          App.exitApp()
        }
      })

      return () => {
        App.removeAllListeners()
      }
    }

    handleBackButton()
  }, [navigate])
}