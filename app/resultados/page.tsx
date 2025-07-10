"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, TrendingUp, Heart, Lightbulb, MessageSquare, BarChart3 } from "lucide-react"

interface AnalyticsData {
  topThemes: string[]
  returnIntention: number
  commonSuggestions: string[]
  testimonials: string[]
  averageRatings: {
    venue: number
    food: number
    mentors: number
    miniGames: number
    overall: number
  }
}

export default function ResultadosPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching analytics data from N8n/GPT processing
    const fetchAnalytics = async () => {
      try {
        // In a real implementation, this would fetch from your N8n webhook or API
        // For now, we'll simulate the data structure
        await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate loading

        const mockData: AnalyticsData = {
          topThemes: [
            "Excelente ambiente colaborativo",
            "Mentores muy preparados y accesibles",
            "Organización impecable del evento",
          ],
          returnIntention: 87,
          commonSuggestions: [
            "Más tiempo para el desarrollo",
            "Espacios de networking estructurados",
            "Workshops técnicos adicionales",
          ],
          testimonials: [
            "La experiencia superó mis expectativas, el nivel de los mentores fue increíble",
            "Me encantó la dinámica de los mini games, rompió el hielo perfectamente",
            "El lugar fue perfecto y la comida estuvo deliciosa",
          ],
          averageRatings: {
            venue: 4.3,
            food: 4.1,
            mentors: 4.7,
            miniGames: 4.2,
            overall: 4.4,
          },
        }

        setAnalytics(mockData)
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen picante-gradient flex items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-xl">Procesando feedback con IA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen picante-gradient p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">¡Gracias por tu feedback!</h1>
          <p className="text-gray-200 text-xl mb-8">
            Aquí están los insights procesados por IA de todos los participantes
          </p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Themes */}
          <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-orange-400" />🔥 Top 3 Aspectos Destacados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.topThemes.map((theme, index) => (
                  <div key={index} className="flex items-start">
                    <span className="bg-orange-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-gray-200">{theme}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Return Intention */}
          <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-400" />
                ❤️ Intención de Retorno
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">{analytics?.returnIntention}%</div>
                <p className="text-gray-200">de los participantes volverían a la próxima edición</p>
                <div className="w-full bg-gray-700 rounded-full h-3 mt-4">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-400 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${analytics?.returnIntention}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Common Suggestions */}
          <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />💡 Sugerencias Comunes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.commonSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    <p className="text-gray-200 text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Testimonials */}
        <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />📝 Testimonios Destacados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analytics?.testimonials.map((testimonial, index) => (
                <div key={index} className="bg-black/20 p-4 rounded-lg border border-gray-600">
                  <p className="text-gray-200 italic">"{testimonial}"</p>
                  <p className="text-gray-400 text-sm mt-2">- Participante anónimo</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ratings Chart */}
        <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-400" />📊 Promedios por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.averageRatings &&
                Object.entries(analytics.averageRatings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-200 capitalize">
                      {key === "venue"
                        ? "Lugar"
                        : key === "food"
                          ? "Comida"
                          : key === "mentors"
                            ? "Mentores"
                            : key === "miniGames"
                              ? "Mini Games"
                              : "General"}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full"
                          style={{ width: `${(value / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-orange-400 font-bold w-8">{value}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="text-center space-y-4">
          <Link href="/">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-semibold px-8 py-3 rounded-full">
              Volver al inicio
            </Button>
          </Link>
          <p className="text-gray-400">¿Quieres compartir más feedback? Puedes llenar el formulario nuevamente.</p>
        </div>

        <div className="mt-12 text-center text-gray-400">
          <p>
            Una iniciativa de <span className="text-orange-400 font-semibold">Picante Fund</span>
          </p>
        </div>
      </div>
    </div>
  )
}
