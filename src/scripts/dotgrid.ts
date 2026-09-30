/* Reactive dot grid — paints a faint grid of dots on a fixed canvas and
   brightens / grows the dots near the pointer into a soft halo.
   Pure gray, no accent, no gradient, no shadow. Desktop + fine pointer
   only performs the interaction; on touch / reduced-motion it simply draws
   the resting grid. */

const canvas = document.createElement('canvas')
canvas.className = 'bg-dots'
canvas.setAttribute('aria-hidden', 'true')
document.body.appendChild(canvas)

const ctx = canvas.getContext('2d')

if (ctx) {
  const finePointer = window.matchMedia('(pointer: fine)').matches
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  const interactive = finePointer && !reducedMotion

  let dpr = 1
  let w = 0
  let h = 0
  let gap = 34
  let base: [number, number, number] = [228, 228, 228]
  let hi: [number, number, number] = [174, 174, 174]
  let mouseX = -99999
  let mouseY = -99999
  const radius = 150
  let frame = 0

  const toRgb = (hex: string): [number, number, number] => {
    const m = hex.trim().replace('#', '')
    const full =
      m.length === 3
        ? m
            .split('')
            .map((c) => c + c)
            .join('')
        : m
    const int = parseInt(full, 16)
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
  }

  const readTokens = () => {
    const cs = getComputedStyle(document.documentElement)
    gap = parseFloat(cs.getPropertyValue('--dot-gap')) || 34
    base = toRgb(cs.getPropertyValue('--dot-base') || '#e4e4e4')
    hi = toRgb(cs.getPropertyValue('--dot-hi') || '#aeaeae')
  }

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = window.innerWidth
    h = window.innerHeight
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw()
  }

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  const draw = () => {
    frame = 0
    ctx.clearRect(0, 0, w, h)
    const offset = gap / 2
    const baseR = 1.1
    const hiR = 2.3
    const r2 = radius * radius
    for (let y = offset; y < h + gap; y += gap) {
      for (let x = offset; x < w + gap; x += gap) {
        let t = 0
        if (interactive) {
          const dx = x - mouseX
          const dy = y - mouseY
          const d2 = dx * dx + dy * dy
          if (d2 < r2) {
            const k = 1 - Math.sqrt(d2) / radius
            t = k * k // smooth falloff toward the edges
          }
        }
        const r = baseR + (hiR - baseR) * t
        const cr = Math.round(lerp(base[0], hi[0], t))
        const cg = Math.round(lerp(base[1], hi[1], t))
        const cb = Math.round(lerp(base[2], hi[2], t))
        ctx.beginPath()
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const queue = () => {
    if (!frame) frame = requestAnimationFrame(draw)
  }

  readTokens()
  resize()

  if (interactive) {
    window.addEventListener(
      'mousemove',
      (e) => {
        mouseX = e.clientX
        mouseY = e.clientY
        queue()
      },
      { passive: true },
    )
    document.addEventListener('mouseleave', () => {
      mouseX = -99999
      mouseY = -99999
      queue()
    })
  }

  let resizeTimer = 0
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(resize, 120)
  })

  // Re-read dot colors whenever the theme flips.
  const onThemeChange = () => {
    readTokens()
    draw()
  }
  const mo = new MutationObserver(onThemeChange)
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  if (mq.addEventListener) mq.addEventListener('change', onThemeChange)
  else if (mq.addListener) mq.addListener(onThemeChange)
}
