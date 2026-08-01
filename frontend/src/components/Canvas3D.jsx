import { useEffect, useRef } from "react"
import * as THREE from "three"

export default function Canvas3D() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 300

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    // Particles system
    const particleCount = 220
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    const colorChoices = [
      new THREE.Color("#7c3aed"), // Purple
      new THREE.Color("#06b6d4"), // Cyan
      new THREE.Color("#ec4899"), // Pink
      new THREE.Color("#00ff88"), // Emerald
    ]

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 800
      positions[i * 3 + 1] = (Math.random() - 0.5) * 800
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400

      const col = colorChoices[Math.floor(Math.random() * colorChoices.length)]
      colors[i * 3] = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    // Particle texture
    const canvas = document.createElement("canvas")
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext("2d")
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, "rgba(255, 255, 255, 1)")
    grad.addColorStop(0.3, "rgba(124, 58, 237, 0.8)")
    grad.addColorStop(1, "rgba(124, 58, 237, 0)")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)

    const texture = new THREE.CanvasTexture(canvas)

    const material = new THREE.PointsMaterial({
      size: 14,
      vertexColors: true,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particleSystem = new THREE.Points(geometry, material)
    scene.add(particleSystem)

    // Lines mesh connecting close particles
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
    })

    const lineGeometry = new THREE.BufferGeometry()
    const linePositions = new Float32Array(particleCount * particleCount * 6)
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3))
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lineMesh)

    // Mouse tracking
    let mouseX = 0
    let mouseY = 0

    const handleMouseMove = (e) => {
      mouseX = (e.clientX - window.innerWidth / 2) * 0.15
      mouseY = (e.clientY - window.innerHeight / 2) * 0.15
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    // Animation Loop
    let animationFrameId
    let clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      particleSystem.rotation.y = elapsedTime * 0.05
      particleSystem.rotation.x = elapsedTime * 0.02

      lineMesh.rotation.y = elapsedTime * 0.05
      lineMesh.rotation.x = elapsedTime * 0.02

      // Smooth camera follow mouse
      camera.position.x += (mouseX - camera.position.x) * 0.03
      camera.position.y += (-mouseY - camera.position.y) * 0.03
      camera.lookAt(scene.position)

      // Update lines between nearby particles
      const pos = particleSystem.geometry.attributes.position.array
      let lineIndex = 0

      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = pos[i * 3] - pos[j * 3]
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (dist < 110) {
            linePositions[lineIndex++] = pos[i * 3]
            linePositions[lineIndex++] = pos[i * 3 + 1]
            linePositions[lineIndex++] = pos[i * 3 + 2]
            linePositions[lineIndex++] = pos[j * 3]
            linePositions[lineIndex++] = pos[j * 3 + 1]
            linePositions[lineIndex++] = pos[j * 3 + 2]
          }
        }
      }

      lineGeometry.setDrawRange(0, lineIndex / 3)
      lineGeometry.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60"
    />
  )
}
