"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Wifi, WifiOff, CheckCircle, AlertCircle, MessageSquare } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

// Add these helper functions before the component
const isWhatsAppBrowser = () => {
  if (typeof window === "undefined") return false
  return (
    navigator.userAgent.toLowerCase().includes("whatsapp") || navigator.userAgent.toLowerCase().includes("wamobile")
  )
}

const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Define the structure for the form data
interface FormData {
  returnLikelihood: number
  venueRating: number
  foodRating: number
  mentorExperience: number
  miniGamesRating: number
  taskAndOutputRating: number
  pitchDynamicRating: number
  judgesDecisionRating: number
  whatToKeep: string
  whatToChange: string
  whatToAdd: string
  submissionId: string // Add submissionId to the form data
  sessionId: string
  isWhatsApp: boolean
  userAgent: string
  timestamp: string
}

const SUBMISSION_KEY = "lastSubmissionTime"
const SUBMISSION_COOLDOWN_MS = 300000 // 5 minutes cooldown

export default function FormularioPage() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isWhatsApp, setIsWhatsApp] = useState(false)
  const [sessionId] = useState(() => generateSessionId())
  const formRef = useRef<HTMLFormElement>(null)

  // Check for WhatsApp browser and fresh parameter
  useEffect(() => {
    const whatsappDetected = isWhatsAppBrowser()
    const freshParam = searchParams?.get("fresh") === "true"

    setIsWhatsApp(whatsappDetected)

    if (whatsappDetected || freshParam) {
      // Clear localStorage for WhatsApp users or fresh requests
      localStorage.removeItem(SUBMISSION_KEY)
      setHasSubmitted(false)
      console.log("WhatsApp browser or fresh request detected - clearing cache")
    }
  }, [searchParams])

  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial check
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Check for recent submission in localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !isWhatsApp && searchParams?.get("fresh") !== "true") {
      const lastSubmissionTime = localStorage.getItem(SUBMISSION_KEY)
      if (lastSubmissionTime) {
        const timeDiff = Date.now() - Number.parseInt(lastSubmissionTime, 10)
        if (timeDiff < SUBMISSION_COOLDOWN_MS) {
          setHasSubmitted(true)
          toast({
            title: "Encuesta ya enviada",
            description:
              "Parece que ya enviaste una encuesta recientemente. Puedes enviar una nueva respuesta si lo necesitas.",
            variant: "default",
          })
        }
      }
    }
  }, [toast, isWhatsApp, searchParams])

  const checkConnectivity = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 seconds timeout for connectivity check
      const response = await fetch("https://httpbin.org/status/200", { signal: controller.signal })
      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      console.error("Connectivity check failed:", error)
      return false
    }
  }

  const allowNewSubmission = () => {
    localStorage.removeItem(SUBMISSION_KEY)
    setHasSubmitted(false)
    setSubmissionError(null)
    formRef.current?.reset()
    toast({
      title: "Formulario reiniciado",
      description: "Ahora puedes enviar una nueva respuesta.",
      variant: "default",
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault()

  if (isSubmitting || hasSubmitted) {
    toast({
      title: "Envío en curso o ya realizado",
      description: "Por favor, espera a que termine el envío actual o verifica si ya enviaste la encuesta.",
      variant: "warning",
    })
    return
  }

  setIsSubmitting(true)
  setSubmissionError(null)

  const form = event.currentTarget
  const formData = new FormData(form)

  // Mantener toda la validación actual
  const requiredFields = [
    { name: "returnLikelihood", label: "Probabilidad de volver" },
    { name: "venueRating", label: "Calificación del lugar" },
    { name: "foodRating", label: "Calificación de la comida" },
    { name: "mentorExperience", label: "Experiencia con mentores" },
    { name: "miniGamesRating", label: "Calificación de mini games" },
    { name: "taskAndOutputRating", label: "Calificación de consigna/output" },
    { name: "pitchDynamicRating", label: "Calificación de dinámica de pitch" },
    { name: "judgesDecisionRating", label: "Calificación de decisión de jueces" },
  ]

  const missingFields = []
  for (const field of requiredFields) {
    if (!formData.get(field.name)) {
      missingFields.push(field.label)
    }
  }

  if (missingFields.length > 0) {
    toast({
      title: "Campos incompletos",
      description: `Por favor, completa: ${missingFields.join(", ")}`,
      variant: "destructive",
    })
    setIsSubmitting(false)
    return
  }

  const textFields = [
    { name: "whatToKeep", label: "Qué mantener" },
    { name: "whatToChange", label: "Qué cambiar" },
    { name: "whatToAdd", label: "Qué agregar" },
  ]

  const missingTextFields = []
  for (const field of textFields) {
    if (!formData.get(field.name)) {
      missingTextFields.push(field.label)
    }
  }

  if (missingTextFields.length > 0) {
    toast({
      title: "Campos de texto incompletos",
      description: `Por favor, completa: ${missingTextFields.join(", ")}`,
      variant: "destructive",
    })
    setIsSubmitting(false)
    return
  }

  const data: FormData = {
    returnLikelihood: Number.parseInt(formData.get("returnLikelihood") as string),
    venueRating: Number.parseInt(formData.get("venueRating") as string),
    foodRating: Number.parseInt(formData.get("foodRating") as string),
    mentorExperience: Number.parseInt(formData.get("mentorExperience") as string),
    miniGamesRating: Number.parseInt(formData.get("miniGamesRating") as string),
    taskAndOutputRating: Number.parseInt(formData.get("taskAndOutputRating") as string),
    pitchDynamicRating: Number.parseInt(formData.get("pitchDynamicRating") as string),
    judgesDecisionRating: Number.parseInt(formData.get("judgesDecisionRating") as string),
    whatToKeep: formData.get("whatToKeep") as string,
    whatToChange: formData.get("whatToChange") as string,
    whatToAdd: formData.get("whatToAdd") as string,
    submissionId: uuidv4(),
    sessionId: sessionId,
    isWhatsApp: isWhatsApp,
    userAgent: typeof window !== "undefined" ? navigator.userAgent : "",
    timestamp: new Date().toISOString(),
  }

  console.log(`[${data.submissionId}] Iniciando envío de formulario. Datos:`, data)

  // 🚀 NUEVA FUNCIÓN DE RETRY AUTOMÁTICO SILENCIOSO
  const submitWithRetry = async (maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[${data.submissionId}] Intento ${attempt}/${maxRetries}`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
          console.warn(`[${data.submissionId}] Intento ${attempt} - Timeout después de 10s`)
        }, 10000) // Reducido a 10 segundos

        const response = await fetch("https://snowmba.app.n8n.cloud/webhook/picanthon-survey", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)

        console.log(`[${data.submissionId}] Intento ${attempt} - Status: ${response.status}`)

        if (response.ok) {
          const result = await response.json()
          console.log(`[${data.submissionId}] ✅ ÉXITO en intento ${attempt}`)
          return { success: true, result }
        }

        // Si no es ok pero no es el último intento, continúa silenciosamente
        if (attempt === maxRetries) {
          const errorBody = await response.text()
          throw new Error(`Error del servidor (${response.status}): ${errorBody || response.statusText}`)
        }

      } catch (error: any) {
        console.error(`[${data.submissionId}] ❌ Intento ${attempt} falló:`, error.message)
        
        // Si es el último intento, lanzar error
        if (attempt === maxRetries) {
          throw error
        }
        
        // Esperar silenciosamente antes del siguiente intento
        const waitTime = Math.min(1000 * attempt, 3000) // 1s, 2s, 3s máximo
        console.log(`[${data.submissionId}] ⏳ Esperando ${waitTime}ms antes del siguiente intento`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  // Verificar conectividad antes de intentar
  const online = await checkConnectivity()
  setIsOnline(online)
  if (!online) {
    setSubmissionError("No hay conexión a internet. Por favor, revisa tu conexión y vuelve a intentarlo.")
    setIsSubmitting(false)
    toast({
      title: "Error de conexión",
      description: "No se pudo enviar la encuesta. Revisa tu conexión a internet.",
      variant: "destructive",
    })
    console.error(`[${data.submissionId}] Error: Sin conexión a internet.`)
    return
  }

  try {
    // 🎯 EJECUTAR CON REINTENTOS AUTOMÁTICOS SILENCIOSOS
    const { success, result } = await submitWithRetry(3)
    
    if (success) {
      console.log(`[${data.submissionId}] 🎉 Envío completado exitosamente:`, result)
      
      if (typeof window !== "undefined") {
        localStorage.setItem(SUBMISSION_KEY, Date.now().toString())
      }
      setHasSubmitted(true)
      formRef.current?.reset()

      toast({
        title: "¡Encuesta enviada!",
        description: "Gracias por tu feedback. Redirigiendo a los resultados...",
        variant: "success",
      })
      router.push("/resultados")
    }

  } catch (error: any) {
    console.error(`[${data.submissionId}] 💥 Error final después de todos los reintentos:`, error)
    
    let errorMessage = "No se pudo enviar la encuesta después de varios intentos."
    
    if (error.name === "AbortError") {
      errorMessage = "La conexión es muy lenta. Por favor, intenta desde una mejor red."
    } else if (error.message.includes("Failed to fetch")) {
      errorMessage = "Sin conexión a internet. Revisa tu red y vuelve a intentar."
    } else if (error.message.includes("Error del servidor")) {
      errorMessage = "Error del servidor. El equipo técnico ha sido notificado."
    }

    setSubmissionError(errorMessage)
    toast({
      title: "Error de envío",
      description: errorMessage,
      variant: "destructive",
    })
  } finally {
    setIsSubmitting(false)
  }
}

    if (missingFields.length > 0) {
      toast({
        title: "Campos incompletos",
        description: `Por favor, completa: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    // Validar campos de texto
    const textFields = [
      { name: "whatToKeep", label: "Qué mantener" },
      { name: "whatToChange", label: "Qué cambiar" },
      { name: "whatToAdd", label: "Qué agregar" },
    ]

    const missingTextFields = []
    for (const field of textFields) {
      if (!formData.get(field.name)) {
        missingTextFields.push(field.label)
      }
    }

    if (missingTextFields.length > 0) {
      toast({
        title: "Campos de texto incompletos",
        description: `Por favor, completa: ${missingTextFields.join(", ")}`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const data: FormData = {
      returnLikelihood: Number.parseInt(formData.get("returnLikelihood") as string),
      venueRating: Number.parseInt(formData.get("venueRating") as string),
      foodRating: Number.parseInt(formData.get("foodRating") as string),
      mentorExperience: Number.parseInt(formData.get("mentorExperience") as string),
      miniGamesRating: Number.parseInt(formData.get("miniGamesRating") as string),
      taskAndOutputRating: Number.parseInt(formData.get("taskAndOutputRating") as string),
      pitchDynamicRating: Number.parseInt(formData.get("pitchDynamicRating") as string),
      judgesDecisionRating: Number.parseInt(formData.get("judgesDecisionRating") as string),
      whatToKeep: formData.get("whatToKeep") as string,
      whatToChange: formData.get("whatToChange") as string,
      whatToAdd: formData.get("whatToAdd") as string,
      submissionId: uuidv4(),
      sessionId: sessionId,
      isWhatsApp: isWhatsApp,
      userAgent: typeof window !== "undefined" ? navigator.userAgent : "",
      timestamp: new Date().toISOString(),
    }

    console.log(`[${data.submissionId}] Iniciando envío de formulario. Datos:`, data)

    // Perform connectivity check before actual submission
    const online = await checkConnectivity()
    setIsOnline(online)
    if (!online) {
      setSubmissionError("No hay conexión a internet. Por favor, revisa tu conexión y vuelve a intentarlo.")
      setIsSubmitting(false)
      toast({
        title: "Error de conexión",
        description: "No se pudo enviar la encuesta. Revisa tu conexión a internet.",
        variant: "destructive",
      })
      console.error(`[${data.submissionId}] Error: Sin conexión a internet.`)
      return
    }

    const WEBHOOK_URL = "https://snowmba.app.n8n.cloud/webhook/picanthon-survey" // Updated webhook URL

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.warn(`[${data.submissionId}] Solicitud abortada por timeout (5s).`)
      }, 30000) // Increased timeout to 30 seconds for AI processing

      console.log(`[${data.submissionId}] Enviando datos al webhook: ${WEBHOOK_URL}`)
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Access-Control-Allow-Origin": "*", // Explicit CORS header
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      })
      clearTimeout(timeoutId) // Clear timeout if fetch completes

      console.log(`[${data.submissionId}] Respuesta recibida. Status: ${response.status}`)
      console.log(`[${data.submissionId}] Headers de respuesta:`, Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`[${data.submissionId}] Error en la respuesta del servidor:`, errorBody)
        throw new Error(`Error del servidor (${response.status}): ${errorBody || response.statusText}`)
      }

      const result = await response.json()
      console.log(`[${data.submissionId}] Envío exitoso. Respuesta del webhook:`, result)

      if (typeof window !== "undefined") {
        localStorage.setItem(SUBMISSION_KEY, Date.now().toString())
      }
      setHasSubmitted(true) // Mark as submitted
      formRef.current?.reset() // Reset the form fields

      toast({
        title: "¡Encuesta enviada!",
        description: "Gracias por tu feedback. Redirigiendo a los resultados...",
        variant: "success",
      })
      router.push("/resultados")
    } catch (error: any) {
      console.error(`[${data.submissionId}] Error durante el envío:`, error)
      let errorMessage = "Ocurrió un error inesperado al enviar la encuesta."

      if (error.name === "AbortError") {
        errorMessage = "La solicitud tardó demasiado en responder. Por favor, inténtalo de nuevo."
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Error de red: No se pudo conectar con el servidor. Revisa tu conexión a internet."
      } else if (error.message.includes("Error del servidor")) {
        errorMessage = `Error del servidor: ${error.message.split(": ")[1] || "Respuesta inesperada."}`
      } else {
        errorMessage = `Error: ${error.message}`
      }

      setSubmissionError(errorMessage)
      toast({
        title: "Error de envío",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen picante-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white">Encuesta Picanthón</CardTitle>
          <p className="text-gray-300">Tu feedback es muy importante para nosotros.</p>
        </CardHeader>
        <CardContent>
          {!isOnline && (
            <div className="bg-red-900/30 border border-red-600 text-red-400 p-3 rounded-md flex items-center mb-4">
              <WifiOff className="w-5 h-5 mr-2" />
              Estás sin conexión. Por favor, revisa tu conexión a internet.
            </div>
          )}
          {submissionError && (
            <div className="bg-red-900/30 border border-red-600 text-red-400 p-3 rounded-md flex items-center mb-4">
              <AlertCircle className="w-5 h-5 mr-2" />
              {submissionError}
            </div>
          )}
          {hasSubmitted && (
            <div className="bg-green-900/30 border border-green-600 text-green-400 p-3 rounded-md mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  ¡Gracias! Tu encuesta ya ha sido enviada.
                </div>
                <Button
                  onClick={allowNewSubmission}
                  variant="outline"
                  size="sm"
                  className="ml-4 border-green-600 text-green-400 hover:bg-green-900/50 bg-transparent"
                >
                  Nueva respuesta
                </Button>
              </div>
            </div>
          )}
          {isWhatsApp && (
            <div className="bg-blue-900/30 border border-blue-600 text-blue-400 p-3 rounded-md flex items-center mb-4">
              <MessageSquare className="w-5 h-5 mr-2" />
              Accediendo desde WhatsApp - Cache deshabilitado
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
            <div className="space-y-2">
              <Label htmlFor="returnLikelihood" className="text-white text-lg">
                Del 1 al 5 ¿Qué tan probable es que vuelvas a participar en un evento de Picante?
              </Label>
              <RadioGroup name="returnLikelihood" className="flex space-x-4" required>
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(value)} id={`returnLikelihood-${value}`} />
                    <Label htmlFor={`returnLikelihood-${value}`} className="text-gray-300">
                      {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-gray-400">1 = Muy improbable, 5 = Muy probable</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venueRating" className="text-white text-lg">
                Del 1 al 5 que te parecio el lugar
              </Label>
              <RadioGroup name="venueRating" className="flex space-x-4" required>
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(value)} id={`venueRating-${value}`} />
                    <Label htmlFor={`venueRating-${value}`} className="text-gray-300">
                      {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-gray-400">1 = Muy malo, 5 = Excelente</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="foodRating" className="text-white text-lg">
                Del 1 al 5 que te parecio la comida
              </Label>
              <RadioGroup name="foodRating" className="flex space-x-4" required>
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(value)} id={`foodRating-${value}`} />
                    <Label htmlFor={`foodRating-${value}`} className="text-gray-300">
                      {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-gray-400">1 = Muy malo, 5 = Excelente</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentorExperience" className="text-white text-lg">
                Del 1 al 5 como fue la experiencia de tu grupo con los mentores
              </Label>
              <RadioGroup name="mentorExperience" className="flex space-x-4" required>
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(value)} id={`mentorExperience-${value}`} />
                    <Label htmlFor={`mentorExperience-${value}`} className="text-gray-300">
                      {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-gray-400">1 = Muy malo, 5 = Excelente</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="miniGamesRating" className="text-white text-lg">
                Del 1 al 5 que te parecieron los mini games
              </Label>
              <RadioGroup name="miniGamesRating" className="flex space-x-4" required>
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(value)} id={`miniGamesRating-${value}`} />
                    <Label htmlFor={`miniGamesRating-${value}`} className="text-gray-300">
                      {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-gray-400">1 = Muy malo, 5 = Excelente</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskAndOutputRating" className="text-white text-lg">
                Del 1 al 5 que te parecio la consigna y el output esperado
              </Label>
              <RadioGroup name="taskAndOutputRating" className="flex space-x-4" required>
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(value)} id={`taskAndOutputRating-${value}`} />
                    <Label htmlFor={`taskAndOutputRating-${value}`} className="text-gray-300">
                      {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-gray-400">1 = Muy malo, 5 = Excelente</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pitchDynamicRating" className="text-white text-lg">
                Del 1 al 5 qué te pareció la dinámica del pitch ¿Pudieron transmitir lo que habían creado?
              </Label>
              <RadioGroup name="pitchDynamicRating" className="flex space-x-4" required>
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(value)} id={`pitchDynamicRating-${value}`} />
                    <Label htmlFor={`pitchDynamicRating-${value}`} className="text-gray-300">
                      {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-gray-400">1 = Muy malo, 5 = Excelente</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="judgesDecisionRating" className="text-white text-lg">
                Del 1 al 5 qué te pareció la decisión final de los jueces
              </Label>
              <RadioGroup name="judgesDecisionRating" className="flex space-x-4" required>
                {[1, 2, 3, 4, 5].map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={String(value)} id={`judgesDecisionRating-${value}`} />
                    <Label htmlFor={`judgesDecisionRating-${value}`} className="text-gray-300">
                      {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-sm text-gray-400">1 = Muy malo, 5 = Excelente</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatToKeep" className="text-white text-lg">
                Que mantendrias de la hackathon, que fue lo que mas te gusto
              </Label>
              <Textarea
                id="whatToKeep"
                name="whatToKeep"
                placeholder="Ej: La energía de los mentores, la variedad de la comida..."
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatToChange" className="text-white text-lg">
                Que cambiarias de la hackathon, que fue lo que menos te gusto
              </Label>
              <Textarea
                id="whatToChange"
                name="whatToChange"
                placeholder="Ej: Más tiempo para el pitch, mejor señal de Wi-Fi..."
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatToAdd" className="text-white text-lg">
                Que agregarias a la picanthon
              </Label>
              <Textarea
                id="whatToAdd"
                name="whatToAdd"
                placeholder="Ej: Un taller de diseño, más opciones veganas..."
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center"
              disabled={isSubmitting || !isOnline || hasSubmitted}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Feedback"
              )}
            </Button>
            {!isOnline && (
              <p className="text-sm text-red-400 text-center flex items-center justify-center">
                <WifiOff className="w-4 h-4 mr-1" /> Sin conexión
              </p>
            )}
            {isOnline && !isSubmitting && (
              <p className="text-sm text-green-400 text-center flex items-center justify-center">
                <Wifi className="w-4 h-4 mr-1" /> Conectado
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
