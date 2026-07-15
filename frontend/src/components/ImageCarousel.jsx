import { useEffect, useState } from 'react'

const images = Object.values(
  import.meta.glob('../assets/carousel/*.webp', { eager: true, import: 'default' }),
)

const INTERVAL_MS = 5000

export default function ImageCarousel({ className = '', offsetY = 0 }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % images.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  if (images.length === 0) {
    return <div className={`${className} bg-gradient-to-br from-amber-300 via-orange-400 to-emerald-900`} />
  }

  const objectPosition = offsetY ? `center calc(100% - ${offsetY}px)` : undefined

  return (
    <div className={`${className} relative overflow-hidden`}>
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          style={{ objectPosition }}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  )
}