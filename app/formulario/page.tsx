"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("https://augustus2425.app.n8n.cloud/webhook/picanthon-survey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          source: "picanthon-feedback-form",
        }),
      })

      if (response.ok) {
        // Éxito - redirigir a resultados
        router.push("/resultados")
      } else {
        // Error del servidor
        const errorText = await response.text().catch(() => "Error desconocido")
        console.error("Server error:", response.status, errorText)
        alert("Error del servidor. Por favor, verifica tu conexión e inténtalo de nuevo.")
      }
    } catch (error) {
      // Error de red o conexión
      console.error("Network error:", error)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        alert("Error de conexión. Por favor, verifica tu conexión a internet e inténtalo de nuevo.")
      } else {
        alert("Hubo un error inesperado. Por favor, inténtalo de nuevo.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRatingChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTextChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
        </div>

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
                disabled={isSubmitting || !isFormValid()}
                className="w-full bg-white text-black hover:bg-gray-200 font-semibold py-4 text-xl rounded-full transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                    Enviando feedback...
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
