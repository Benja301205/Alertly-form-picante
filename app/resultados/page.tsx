"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, TrendingUp, Heart, Lightbulb, MessageSquare, BarChart3, AlertCircle } from "lucide-react"

interface ExecutiveSummary {
  key_message: string
}

interface KeyInsight {
  insight: string
}

interface NegativePattern {
  pattern: string
  recommendation: string
}

interface PatternAnalysis {
  negative_patterns: NegativePattern[]
}

interface AnalisisEjecutivo {
  executive_summary: ExecutiveSummary
  key_insights: KeyInsight[]
  pattern_analysis: PatternAnalysis
}

interface AnalyticsData {
  probabilidadVolver: number
  calificacionLugar: number
  calificacionComida: number
  experienciaMentores: number
  calificacionMiniGames: number
  calificacionConsigna: number
  dinamicaPitch: number
  decisionJueces: number
  nps_global: number
  total_respuestas: number
  analisis_ejecutivo: AnalisisEjecutivo
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

        const data: AnalyticsData = await response.json()
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
          <Link href="/">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-semibold px-8 py-3 rounded-full">
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return null
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
            Aquí están los insights procesados por IA de las {analytics.total_respuestas} respuestas
          </p>
        </div>

        {/* Executive Summary */}
        <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />📋 Resumen Ejecutivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-200 text-lg leading-relaxed">
              {analytics.analisis_ejecutivo.executive_summary.key_message}
            </p>
          </CardContent>
        </Card>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Key Insights */}
          <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-orange-400" />🔥 Puntos Clave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.analisis_ejecutivo.key_insights.map((insight, index) => (
                  <div key={index} className="flex items-start">
                    <span className="bg-orange-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-gray-200">{insight.insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* NPS Global */}
          <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-400" />
                ❤️ NPS Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">{analytics.nps_global}%</div>
                <p className="text-gray-200">Net Promoter Score del evento</p>
                <div className="w-full bg-gray-700 rounded-full h-3 mt-4">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-red-400 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(0, Math.min(100, analytics.nps_global))}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Areas de Mejora */}
          <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />💡 Áreas de Mejora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.analisis_ejecutivo.pattern_analysis.negative_patterns.map((pattern, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-yellow-400 mr-2">•</span>
                    <p className="text-gray-200 text-sm">{pattern.recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ratings Chart */}
        <Card className="bg-black/30 border-gray-600 backdrop-blur-sm shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-400" />📊 Promedios por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { key: "calificacionLugar", label: "Lugar", value: analytics.calificacionLugar },
                { key: "calificacionComida", label: "Comida", value: analytics.calificacionComida },
                { key: "experienciaMentores", label: "Mentores", value: analytics.experienciaMentores },
                { key: "calificacionMiniGames", label: "Mini Games", value: analytics.calificacionMiniGames },
                { key: "calificacionConsigna", label: "Consigna", value: analytics.calificacionConsigna },
                { key: "dinamicaPitch", label: "Dinámica Pitch", value: analytics.dinamicaPitch },
                { key: "decisionJueces", label: "Decisión Jueces", value: analytics.decisionJueces },
                { key: "probabilidadVolver", label: "Probabilidad de Volver", value: analytics.probabilidadVolver },
              ].map(({ key, label, value }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-200">{label}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full"
                        style={{ width: `${(value / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-orange-400 font-bold w-8">{value.toFixed(1)}</span>
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
