import { useEffect, useRef, useState } from 'react'
import { BarcodeDetector } from 'barcode-detector/ponyfill'

interface Props {
  onDetect: (ean: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetect, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stopped = false
    let stream: MediaStream | undefined
    let timer: number | undefined

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("La caméra n'est pas disponible (HTTPS requis).")
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
      } catch (e) {
        const denied = e instanceof DOMException && e.name === 'NotAllowedError'
        setError(denied ? "Accès à la caméra refusé." : "Impossible d'accéder à la caméra.")
        return
      }
      const video = videoRef.current
      if (stopped || !video) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      video.srcObject = stream
      await video.play().catch(() => undefined)

      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
      const tick = async () => {
        if (stopped) return
        try {
          const codes = await detector.detect(video)
          if (codes.length > 0 && !stopped) {
            stopped = true
            onDetect(codes[0].rawValue)
            return
          }
        } catch {
          // Frame non exploitable : on réessaie au prochain tour.
        }
        timer = window.setTimeout(tick, 250)
      }
      tick()
    }

    start()
    return () => {
      stopped = true
      window.clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- démarrage unique
  }, [])

  return (
    <div className="scanner" role="dialog" aria-label="Scanner un code-barres">
      {error ? (
        <p role="alert" className="error">{error}</p>
      ) : (
        <video ref={videoRef} playsInline muted />
      )}
      <button type="button" onClick={onClose}>Annuler</button>
    </div>
  )
}
