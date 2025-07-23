"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Loader2, AlertCircle, Heart, MessageSquare, BarChart3 } from "lucide-react"

// ACTUALIZADO: Interfaz para que coincida con los datos del webhook (objeto directo)
interface AnalyticsData {
  total_respuestas: number
  nps_global: number
  calificaciones_por_area: {
    lugar: number
    comida: number
    mentores: number
    games: number
    consigna: number
    pitch: number
    jueces: number
  }
  testimonios_destacados: string[]
}

export default function ResultadosPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("https://snowmba.app.n8n.cloud/webhook/picanthon-metrics", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Error al cargar métricas: ${response.status} ${response.statusText} - ${errorText}`)
        }

        // ACTUALIZADO: Esperamos un objeto directo, no un array
        const data: AnalyticsData = await response.json()

        // Validar que los datos tienen la estructura esperada
        if (!data || typeof data !== "object" || !data.calificaciones_por_area) {
          throw new Error("Datos inválidos recibidos del servidor: estructura inesperada.")
        }

        setAnalytics(data)
      } catch (err) {
        console.error("Error fetching analytics:", err)
        setError(
          `No se pudieron cargar los resultados. Por favor, inténtalo de nuevo más tarde. Detalle: ${err instanceof Error ? err.message : String(err)}`,
        )
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

  // Valores por defecto para evitar errores si analytics es null temporalmente
  const totalRespuestas = analytics?.total_respuestas || 0
  const npsGlobal = analytics?.nps_global || 0
  const calificaciones = analytics?.calificaciones_por_area || {}
  const testimonios = analytics?.testimonios_destacados || []

  // Definir ratingData aquí, después de que analytics pueda tener un valor
  const ratingData = Object.entries(calificaciones).map(([key, value]) => {
    const etiquetas: { [k: string]: string } = {
      lugar: "Lugar",
      comida: "Comida",
      mentores: "Mentores",
      games: "Mini Games",
      consigna: "Consigna/Output",
      pitch: "Dinámica Pitch",
      jueces: "Decisión Jueces",
    }
    return {
      name: etiquetas[key] || key,
      value: value,
    }
  })

  return (
    <div className="min-h-screen picante-gradient p-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 pt-8">
          <Link href="/" className="inline-flex items-center text-white hover:text-orange-400 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Resultados de Feedback</h1>
          <p className="text-gray-200 text-xl">Análisis de las encuestas de la Picanthón.</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center h-[400px] text-white">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-lg">Cargando resultados...</p>
          </div>
        )}

        {error && (
          <Card className="bg-red-900/30 border-red-600 backdrop-blur-sm shadow-xl mb-8">
            <CardContent className="p-6">
              <div className="flex items-start text-red-400">
                <AlertCircle className="w-6 h-6 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-lg">Error al cargar los resultados</p>
                  <pre className="text-red-300 mt-1 text-sm whitespace-pre-wrap">{error}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {analytics && !loading && !error && (
          <div className="grid gap-8">
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

            {/* Sección de Gráfico de Barras con CSS */}
            <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
                  Promedios por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ratingData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-200 font-medium">{item.name}</span>
                        <span className="text-orange-400 font-bold">{item.value.toFixed(1)}/5</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-orange-500 h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${(item.value / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-6">
                  <span>1.0 (Muy malo)</span>
                  <span>3.0 (Regular)</span>
                  <span>5.0 (Excelente)</span>
                </div>
              </CardContent>
            </Card>

            {/* Tarjeta adicional: Total de respuestas */}
            <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                  Estadísticas Generales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">{totalRespuestas}</div>
                  <p className="text-gray-200">Total de respuestas recibidas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8 text-center text-gray-400">
          <p>
            Powered by  <span className="text-orange-400 font-semibold">PicanteAlertly
          </p>
        </div>
      </div>
    </div>
  )
}
