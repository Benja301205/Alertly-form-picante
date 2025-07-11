"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Heart, MessageSquare, BarChart3, AlertCircle } from "lucide-react"

interface AnalyticsData {
  total_respuestas?: number
  nps_global?: number
  calificaciones_por_area?: {
    lugar?: number
    comida?: number
    mentores?: number
    games?: number
    consigna?: number
    pitch?: number
    jueces?: number
  }
  testimonios_destacados?: string[]
}

export default function ResultadosPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("https://augustus2425.app.n8n.cloud/webhook/picanthon-metrics")

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Datos recibidos del API:", data) // Para debug

        // Validar que los datos tienen la estructura esperada
        if (!data || typeof data !== "object") {
          throw new Error("Datos inválidos recibidos del servidor")
        }

        setAnalytics(data)
      } catch (error) {
        console.error("Error fetching analytics:", error)
        setError("No se pudieron cargar las métricas. Por favor, inténtalo de nuevo más tarde.")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  // Función para convertir NPS (-100 a 100) a porcentaje (0 a 100) para la barra
  const getNPSPercentage = (nps: number) => {
    const clampedNPS = Math.max(-100, Math.min(100, nps))
    return ((clampedNPS + 100) / 200) * 100
  }

  // Función para obtener el color del NPS
  const getNPSColor = (nps: number) => {
    if (nps >= 50) return "from-green-400 to-emerald-500"
    if (nps >= 0) return "from-yellow-400 to-orange-400"
    return "from-red-400 to-red-500"
  }

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

  if (error) {
    return (
      <div className="min-h-screen picante-gradient flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Error al cargar las métricas</h1>
          <p className="text-gray-200 mb-6">{error}</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen picante-gradient flex items-center justify-center p-4">
        <div className="text-center text-white">
          <p className="text-xl">No hay datos disponibles</p>
        </div>
      </div>
    )
  }

  // Valores por defecto para evitar errores
  const totalRespuestas = analytics.total_respuestas || 0
  const npsGlobal = analytics.nps_global || 0
  const calificaciones = analytics.calificaciones_por_area || {}
  const testimonios = analytics.testimonios_destacados || []

  return (
    <div className="min-h-screen picante-gradient p-4">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="text-center mb-12 pt-8">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-400" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">¡Gracias por tu feedback!</h1>
          <p className="text-gray-200 text-xl mb-8">
            Aquí están los insights de las {totalRespuestas} respuestas procesadas por Alertly
          </p>
        </div>

        {/* Grilla Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tarjeta 1: NPS Global */}
          <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-400" />
                NPS Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">{npsGlobal}</div>
                <p className="text-gray-200 mb-4">Net Promoter Score del evento</p>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`bg-gradient-to-r ${getNPSColor(npsGlobal)} h-3 rounded-full transition-all duration-1000`}
                    style={{ width: `${getNPSPercentage(npsGlobal)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>-100</span>
                  <span>0</span>
                  <span>100</span>
                </div>
                <p className="text-xs text-gray-300 mt-2">
                  Valor actual: {npsGlobal} (
                  {npsGlobal >= 50 ? "Excelente" : npsGlobal >= 0 ? "Bueno" : "Necesita mejora"})
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta 2: Testimonios Destacados */}
          <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                Testimonios Destacados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {testimonios.length > 0 ? (
                  testimonios.map((testimonio, index) => (
                    <blockquote key={index} className="border-l-4 border-orange-400 pl-3 py-2">
                      <p className="text-gray-200 text-sm italic">"{testimonio}"</p>
                    </blockquote>
                  ))
                ) : (
                  <p className="text-gray-400 text-center">No hay testimonios disponibles</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Gráfico de Barras */}
        <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
              Promedios por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(calificaciones).length > 0 ? (
                Object.entries(calificaciones).map(([categoria, valor]) => {
                  // Mapear nombres de categorías a etiquetas más amigables
                  const etiquetas: { [key: string]: string } = {
                    lugar: "Lugar",
                    comida: "Comida",
                    mentores: "Mentores",
                    games: "Mini Games",
                    consigna: "Consigna",
                    pitch: "Dinámica Pitch",
                    jueces: "Decisión Jueces",
                  }

                  const valorSeguro = valor || 0

                  return (
                    <div key={categoria} className="flex items-center justify-between">
                      <span className="text-gray-200 w-32">{etiquetas[categoria] || categoria}</span>
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-full bg-gray-700 rounded-full h-3 mx-4">
                          <div
                            className="bg-gradient-to-r from-green-400 to-blue-400 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${(valorSeguro / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-orange-400 font-bold w-12 text-right">{valorSeguro.toFixed(2)}</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-400 text-center">No hay datos de calificaciones disponibles</p>
              )}
            </div>
            {Object.keys(calificaciones).length > 0 && (
              <div className="flex justify-between text-xs text-gray-400 mt-4">
                <span>1.0 (Muy malo)</span>
                <span>3.0 (Regular)</span>
                <span>5.0 (Excelente)</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie de Página */}
        <div className="text-center space-y-4">
          <p className="text-gray-300 text-lg">¡Gracias por participar en la Picanthón!</p>
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
