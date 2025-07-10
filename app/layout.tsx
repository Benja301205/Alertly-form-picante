import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Picanthón Feedback - Picante Fund",
  description:
    "Comparte tu experiencia de la Picanthón y ayúdanos a mejorar para la próxima edición. Análisis impulsado por IA.",
  keywords: "Picanthón, feedback, hackathon, Picante Fund, análisis IA",
  openGraph: {
    title: "Picanthón Feedback",
    description: "Tu opinión importa - Ayúdanos a mejorar la Picanthón",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
