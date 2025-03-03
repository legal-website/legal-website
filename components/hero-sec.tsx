import Image from "next/image"

interface HeroProps {
  title: string
  subtitle: string
  backgroundImage: string
}

export default function Hero({ title, subtitle, backgroundImage }: HeroProps) {
  return (
    <div className="relative bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={backgroundImage || "/placeholder.svg"}
          alt="Hero background"
          fill
          style={{ objectFit: "cover" }}
          className="opacity-50"
        />
      </div>
      <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8 z-10">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl font-montserrat mb-6">{title}</h1>
        <p className="mt-6 max-w-3xl text-xl sm:text-2xl">{subtitle}</p>
      </div>
    </div>
  )
}

