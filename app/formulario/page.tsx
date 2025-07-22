"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Wifi, WifiOff, CheckCircle, AlertCircle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

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
}

const SUBMISSION_KEY = "lastSubmissionTime"
const SUBMISSION_COOLDOWN_MS = 300000 // 5 minutes cooldown

export default function FormularioPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false) // New state to track if form has been submitted
  const formRef = useRef<HTMLFormElement>(null)

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
    if (typeof window !== "undefined") {
      const lastSubmissionTime = localStorage.getItem(SUBMISSION_KEY)
      if (lastSubmissionTime) {
        const timeDiff = Date.now() - Number.parseInt(lastSubmissionTime, 10)
        // Consider a submission recent if it was within the last 5 minutes (300,000 ms)
        if (timeDiff < SUBMISSION_COOLDOWN_MS) {
          setHasSubmitted(true)
          toast({
            title: "Encuesta ya enviada",
            description:
              "Parece que ya enviaste una encuesta recientemente. Si crees que es un error, puedes intentarlo de nuevo.",
            variant: "warning",
          })
        }
      }
    }
  }, [toast])

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

    // Validar que todos los campos requeridos estén completos
    const requiredFields = [
      "returnLikelihood",
      "venueRating",
      "foodRating",
      "mentorExperience",
      "miniGamesRating",
      "taskAndOutputRating",
      "pitchDynamicRating",
      "judgesDecisionRating",
    ]

    for (const field of requiredFields) {
      if (!formData.get(field)) {
        toast({
          title: "Campos incompletos",
          description: "Por favor, completa todos los campos antes de enviar.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
    }

    // Validar campos de texto
    if (!formData.get("whatToKeep") || !formData.get("whatToChange") || !formData.get("whatToAdd")) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, completa todas las preguntas de texto.",
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
      submissionId: uuidv4(), // Generate a unique ID for this submission
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
            <div className="bg-green-900/30 border border-green-600 text-green-400 p-3 rounded-md flex items-center mb-4">
              <CheckCircle className="w-5 h-5 mr-2" />
              ¡Gracias! Tu encuesta ya ha sido enviada.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
            <div className="space-y-2">
              <Label htmlFor="returnLikelihood" className="text-white text-lg">
                ¿Qué tan probable es que vuelvas a participar en un evento de Picante?
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
                Del 1 al 5 qué te pareció la dinámica del pitch  ¿Pudieron transmitir lo que habían creado?
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
