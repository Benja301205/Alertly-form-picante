"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, AlertCircle, CheckCircle, Wifi, WifiOff } from "lucide-react"
import { useRouter } from "next/navigation"

export default function FormularioPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    returnLikelihood: "",
    venueRating: "",
    foodRating: "",
    mentorExperience: "",
    miniGamesRating: "",
    taskAndOutputRating: "",
    pitchDynamicRating: "",
    judgesDecisionRating: "",
    whatToKeep: "",
    whatToChange: "",
    whatToAdd: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "online" | "offline">("online")

  // Función para verificar conectividad
  const checkConnectivity = async (): Promise<boolean> => {
    try {
      setConnectionStatus("checking")
      // Intentar hacer una request simple para verificar conectividad
      const response = await fetch("https://httpbin.org/get", {
        method: "GET",
        mode: "cors",
        signal: AbortSignal.timeout(5000),
      })
      const isOnline = response.ok
      setConnectionStatus(isOnline ? "online" : "offline")
      return isOnline
    } catch (error) {
      console.log("Connectivity check failed:", error)
      setConnectionStatus("offline")
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    // Verificar conectividad primero
    console.log("Verificando conectividad...")
    const isConnected = await checkConnectivity()

    if (!isConnected) {
      setSubmitError("No se pudo establecer conexión a internet. Por favor, verifica tu conexión y vuelve a intentar.")
      setIsSubmitting(false)
      return
    }

    // Preparar los datos en un formato más estructurado
    const submissionData = {
      // Datos de calificación (convertir a números)
      ratings: {
        returnLikelihood: Number.parseInt(formData.returnLikelihood) || 0,
        venueRating: Number.parseInt(formData.venueRating) || 0,
        foodRating: Number.parseInt(formData.foodRating) || 0,
        mentorExperience: Number.parseInt(formData.mentorExperience) || 0,
        miniGamesRating: Number.parseInt(formData.miniGamesRating) || 0,
        taskAndOutputRating: Number.parseInt(formData.taskAndOutputRating) || 0,
        pitchDynamicRating: Number.parseInt(formData.pitchDynamicRating) || 0,
        judgesDecisionRating: Number.parseInt(formData.judgesDecisionRating) || 0,
      },
      // Comentarios de texto
      feedback: {
        whatToKeep: formData.whatToKeep.trim(),
        whatToChange: formData.whatToChange.trim(),
        whatToAdd: formData.whatToAdd.trim(),
      },
      // Metadatos
      metadata: {
        timestamp: new Date().toISOString(),
        source: "picanthon-feedback-form",
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "",
        submissionId: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
    }

    const webhookUrl = "https://augustus2425.app.n8n.cloud/webhook/picanthon-survey"
    let retryCount = 0
    const maxRetries = 3 // Aumentado a 3 intentos

    while (retryCount < maxRetries) {
      let controller: AbortController | null = null
      let timeoutId: NodeJS.Timeout | null = null

      try {
        console.log(`🚀 Intento ${retryCount + 1} de ${maxRetries}`)
        console.log(`📡 URL: ${webhookUrl}`)
        console.log(`📊 Datos:`, submissionData)

        controller = new AbortController()

        // Configurar timeout más largo
        timeoutId = setTimeout(() => {
          console.log(`⏰ Timeout alcanzado en intento ${retryCount + 1}`)
          if (controller) {
            controller.abort()
          }
        }, 20000) // 20 segundos

        console.log(`⏳ Enviando request (timeout: 20s)...`)

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            // Agregar headers adicionales para CORS
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
          },
          body: JSON.stringify(submissionData),
          signal: controller.signal,
          mode: "cors", // Especificar modo CORS explícitamente
        })

        // Limpiar timeout si la request es exitosa
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }

        console.log(`✅ Respuesta recibida (intento ${retryCount + 1}):`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries()),
        })

        if (response.ok) {
          // Éxito
          console.log(`🎉 Envío exitoso en intento ${retryCount + 1}`)
          setSubmitSuccess(true)
          setTimeout(() => {
            router.push("/resultados")
          }, 1500)
          return
        } else {
          // Error del servidor
          let errorText = "Error desconocido"
          try {
            errorText = await response.text()
          } catch (e) {
            console.log("No se pudo leer el texto del error:", e)
          }

          console.error(`❌ Error del servidor (intento ${retryCount + 1}):`, {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          })

          if (response.status >= 500) {
            // Error del servidor - reintentar
            if (retryCount < maxRetries - 1) {
              retryCount++
              console.log(`🔄 Reintentando en 3 segundos... (intento ${retryCount + 1}/${maxRetries})`)
              await new Promise((resolve) => setTimeout(resolve, 3000))
              continue
            } else {
              setSubmitError(
                `Error del servidor (${response.status}). El sistema está experimentando problemas técnicos. Por favor, inténtalo de nuevo en unos minutos.`,
              )
            }
          } else if (response.status >= 400 && response.status < 500) {
            // Error del cliente - no reintentar
            setSubmitError(
              `Error en la solicitud (${response.status}). Hay un problema con los datos enviados. Por favor, recarga la página e inténtalo de nuevo.`,
            )
          }
          break
        }
      } catch (error) {
        // Limpiar timeout en caso de error
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }

        console.error(`💥 Error en intento ${retryCount + 1}:`, {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })

        if (error instanceof DOMException && error.name === "AbortError") {
          console.log(`⏰ Request cancelada por timeout en intento ${retryCount + 1}`)
          if (retryCount < maxRetries - 1) {
            retryCount++
            console.log(`🔄 Reintentando por timeout... (intento ${retryCount + 1}/${maxRetries})`)
            await new Promise((resolve) => setTimeout(resolve, 3000))
            continue
          } else {
            setSubmitError(
              "La conexión está tardando demasiado tiempo. Esto puede deberse a problemas de red o que el servidor esté ocupado. Por favor, inténtalo de nuevo.",
            )
          }
        } else if (
          error instanceof TypeError &&
          (error.message.includes("fetch") || error.message.includes("Failed to fetch"))
        ) {
          // Error de red específico
          console.log(`🌐 Error de red detectado en intento ${retryCount + 1}`)

          if (retryCount < maxRetries - 1) {
            retryCount++
            console.log(`🔄 Reintentando por error de red... (intento ${retryCount + 1}/${maxRetries})`)

            // Verificar conectividad antes del siguiente intento
            const stillConnected = await checkConnectivity()
            if (!stillConnected) {
              setSubmitError("Se perdió la conexión a internet. Por favor, verifica tu conexión y vuelve a intentar.")
              break
            }

            await new Promise((resolve) => setTimeout(resolve, 3000))
            continue
          } else {
            setSubmitError(
              "Error de conexión persistente. Esto puede deberse a:\n• Problemas de conectividad a internet\n• El servidor no está disponible temporalmente\n• Restricciones de red o firewall\n\nPor favor, verifica tu conexión e inténtalo de nuevo.",
            )
          }
        } else {
          // Otros errores
          console.log(`🔥 Error desconocido en intento ${retryCount + 1}`)
          setSubmitError(
            `Error inesperado: ${error instanceof Error ? error.message : String(error)}. Por favor, recarga la página e inténtalo de nuevo.`,
          )
        }
        break
      }
    }

    setIsSubmitting(false)
  }

  const handleRatingChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpiar errores cuando el usuario hace cambios
    if (submitError) setSubmitError(null)
  }

  const handleTextChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpiar errores cuando el usuario hace cambios
    if (submitError) setSubmitError(null)
  }

  const RatingQuestion = ({
    question,
    field,
    value,
  }: {
    question: string
    field: string
    value: string
  }) => (
    <div className="space-y-4">
      <p className="text-white font-medium text-lg">{question}</p>
      <RadioGroup value={value} onValueChange={(val) => handleRatingChange(field, val)} className="flex space-x-6">
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} className="flex items-center space-x-2">
            <RadioGroupItem
              value={num.toString()}
              id={`${field}-${num}`}
              className="border-white text-orange-400 focus:ring-orange-400"
            />
            <Label htmlFor={`${field}-${num}`} className="text-white cursor-pointer text-lg font-medium">
              {num}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )

  const isFormValid = () => {
    const requiredRatings = [
      "returnLikelihood",
      "venueRating",
      "foodRating",
      "mentorExperience",
      "miniGamesRating",
      "taskAndOutputRating",
      "pitchDynamicRating",
      "judgesDecisionRating",
    ]
    return requiredRatings.every((field) => formData[field as keyof typeof formData] !== "")
  }

  return (
    <div className="min-h-screen picante-gradient p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 pt-8">
          <Link href="/" className="inline-flex items-center text-white hover:text-orange-400 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Formulario de Feedback</h1>
          <p className="text-gray-200 text-xl">Tu opinión nos ayuda a mejorar la experiencia para todos.</p>

          {/* Indicador de conectividad */}
          <div className="flex items-center justify-center mt-4">
            {connectionStatus === "checking" && (
              <div className="flex items-center text-yellow-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
                <span className="text-sm">Verificando conexión...</span>
              </div>
            )}
            {connectionStatus === "online" && (
              <div className="flex items-center text-green-400">
                <Wifi className="w-4 h-4 mr-2" />
                <span className="text-sm">Conectado</span>
              </div>
            )}
            {connectionStatus === "offline" && (
              <div className="flex items-center text-red-400">
                <WifiOff className="w-4 h-4 mr-2" />
                <span className="text-sm">Sin conexión</span>
              </div>
            )}
          </div>
        </div>

        {/* Mensaje de éxito */}
        {submitSuccess && (
          <Card className="bg-green-900/30 border-green-600 backdrop-blur-sm shadow-xl mb-8">
            <CardContent className="p-6">
              <div className="flex items-center text-green-400">
                <CheckCircle className="w-6 h-6 mr-3" />
                <div>
                  <p className="font-semibold text-lg">¡Feedback enviado exitosamente!</p>
                  <p className="text-green-300">Redirigiendo a los resultados...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensaje de error */}
        {submitError && (
          <Card className="bg-red-900/30 border-red-600 backdrop-blur-sm shadow-xl mb-8">
            <CardContent className="p-6">
              <div className="flex items-start text-red-400">
                <AlertCircle className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-lg">Error al enviar el feedback</p>
                  <pre className="text-red-300 mt-1 text-sm whitespace-pre-wrap">{submitError}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Califica tu experiencia</CardTitle>
            <p className="text-gray-300 text-lg">Del 1 al 5 (siendo 5 excelente)</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Rating Questions */}
              <RatingQuestion
                question="¿Del 1 al 5 cuán probable es que vuelvas a anotarte a la segunda edición de la Picanthón?"
                field="returnLikelihood"
                value={formData.returnLikelihood}
              />

              <RatingQuestion
                question="¿Del 1 al 5 qué te pareció el lugar?"
                field="venueRating"
                value={formData.venueRating}
              />

              <RatingQuestion
                question="¿Del 1 al 5 qué te pareció la comida?"
                field="foodRating"
                value={formData.foodRating}
              />

              <RatingQuestion
                question="¿Del 1 al 5 cómo fue la experiencia de tu grupo con los mentores?"
                field="mentorExperience"
                value={formData.mentorExperience}
              />

              <RatingQuestion
                question="¿Del 1 al 5 qué te parecieron los mini games?"
                field="miniGamesRating"
                value={formData.miniGamesRating}
              />

              <RatingQuestion
                question="¿Del 1 al 5 qué te pareció la consigna y el output esperado?"
                field="taskAndOutputRating"
                value={formData.taskAndOutputRating}
              />

              <RatingQuestion
                question="¿Del 1 al 5 qué te pareció la dinámica del pitch/pregunta de mentores? (¿Pudieron transmitir lo que habían creado?)"
                field="pitchDynamicRating"
                value={formData.pitchDynamicRating}
              />

              <RatingQuestion
                question="¿Del 1 al 5 qué te pareció la decisión final de los jueces?"
                field="judgesDecisionRating"
                value={formData.judgesDecisionRating}
              />

              {/* Open-ended Questions */}
              <div className="space-y-4">
                <Label htmlFor="whatToKeep" className="text-white font-medium text-lg">
                  ¿Qué mantendrías de la hackathon? ¿Qué fue lo que más te gustó?
                </Label>
                <Textarea
                  id="whatToKeep"
                  value={formData.whatToKeep}
                  onChange={(e) => handleTextChange("whatToKeep", e.target.value)}
                  className="bg-black/20 border-gray-500 text-white placeholder:text-gray-400 min-h-[100px] text-lg"
                  placeholder="Comparte lo que más disfrutaste y te gustaría que se mantenga..."
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="whatToChange" className="text-white font-medium text-lg">
                  ¿Qué cambiarías de la hackathon? ¿Qué fue lo que menos te gustó?
                </Label>
                <Textarea
                  id="whatToChange"
                  value={formData.whatToChange}
                  onChange={(e) => handleTextChange("whatToChange", e.target.value)}
                  className="bg-black/20 border-gray-500 text-white placeholder:text-gray-400 min-h-[100px] text-lg"
                  placeholder="Cuéntanos qué aspectos crees que podrían mejorarse..."
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="whatToAdd" className="text-white font-medium text-lg">
                  ¿Qué agregarías a la Picanthón?
                </Label>
                <Textarea
                  id="whatToAdd"
                  value={formData.whatToAdd}
                  onChange={(e) => handleTextChange("whatToAdd", e.target.value)}
                  className="bg-black/20 border-gray-500 text-white placeholder:text-gray-400 min-h-[100px] text-lg"
                  placeholder="¿Qué nuevas actividades, recursos o elementos sumarías?"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !isFormValid() || submitSuccess || connectionStatus === "offline"}
                className="w-full bg-white text-black hover:bg-gray-200 font-semibold py-4 text-xl rounded-full transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    Enviando feedback...
                  </div>
                ) : submitSuccess ? (
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    ¡Enviado exitosamente!
                  </div>
                ) : connectionStatus === "offline" ? (
                  <div className="flex items-center justify-center">
                    <WifiOff className="w-5 h-5 mr-2" />
                    Sin conexión
                  </div>
                ) : (
                  "Enviar Feedback"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-gray-400">
          <p>
            Una iniciativa de <span className="text-orange-400 font-semibold">Picante Fund</span>
          </p>
        </div>
      </div>
    </div>
  )
}
