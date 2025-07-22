import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen picante-gradient flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center text-white">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
          Contanos cómo viviste la <span className="text-orange-400 block mt-2">Picanthón</span>
        </h1>

        <p className="text-lg md:text-xl lg:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed text-gray-200">
          Queremos entender qué funcionó y qué mejorar para la próxima edición. Tu feedback es fundamental para hacer de
          la Picanthón una experiencia aún mejor.
        </p>

        <Link href="/formulario">
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-4 rounded-full font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
          >
            Compartir mi experiencia →
          </Button>
        </Link>

        <div className="mt-16 text-gray-400">
          <p>
            Una iniciativa de <span className="text-orange-400 font-semibold">Picante</span>
          </p>
        </div>
      </div>
    </div>
  )
}
