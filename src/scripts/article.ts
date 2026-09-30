/* ==========================================================================
   Article page interactions.

   Three jobs, each as lightweight as the design allows:

   1. Copy buttons on code blocks — text only, no icon, no color.
   2. Mermaid diagrams — dynamically imported ONLY when a diagram exists, so
      plain-text posts pay nothing. Re-renders when the theme flips so the
      diagram stays inside the black / white / gray system.
   3. Table-of-contents active section — a thin IntersectionObserver band,
      no scroll hijacking, no dependencies.

   Everything here is client-side progressive enhancement: the article is
   fully readable without any of it.
   ========================================================================== */

const FONT_STACK =
  "'Inter Variable', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, " +
  "'PingFang SC', 'Microsoft YaHei', sans-serif"

/* ---------- 1. Copy buttons ---------- */

function installCopyButtons(): void {
  document.querySelectorAll<HTMLPreElement>('pre.astro-code').forEach((pre) => {
    const code = pre.querySelector('code')
    const wrap = pre.parentElement
    if (!code || !wrap) return
    // Mermaid blocks are turned into diagrams; they get no copy button.
    if (code.dataset.language === 'mermaid') return

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'copy-btn'
    btn.textContent = 'Copy'
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent ?? '')
        btn.textContent = 'Copied'
      } catch {
        btn.textContent = 'Failed'
      }
      window.setTimeout(() => {
        btn.textContent = 'Copy'
      }, 1500)
    })
    // Append to the wrapper, not the scrolling <pre>, so it stays in the
    // corner while long lines scroll underneath.
    wrap.appendChild(btn)
  })
}

/* ---------- 2. Mermaid ---------- */

type ThemeVars = Record<string, string>

function lightVars(): ThemeVars {
  return {
    primaryColor: '#ffffff',
    primaryTextColor: '#171717',
    primaryBorderColor: '#e8e8e8',
    lineColor: '#5c5c5c',
    secondaryColor: '#fafafa',
    tertiaryColor: '#fafafa',
    noteTextColor: '#171717',
    textColor: '#171717',
    nodeBorder: '#e8e8e8',
    clusterBkg: '#fafafa',
    clusterBorder: '#e8e8e8',
    fontFamily: FONT_STACK,
  }
}

function darkVars(): ThemeVars {
  return {
    primaryColor: '#141416',
    primaryTextColor: '#ededed',
    primaryBorderColor: '#252525',
    lineColor: '#a1a1a6',
    secondaryColor: '#0b0b0c',
    tertiaryColor: '#0b0b0c',
    noteTextColor: '#ededed',
    textColor: '#ededed',
    nodeBorder: '#252525',
    clusterBkg: '#141416',
    clusterBorder: '#252525',
    fontFamily: FONT_STACK,
  }
}

function resolvedTheme(): 'light' | 'dark' {
  const attr = document.documentElement.getAttribute('data-theme') || 'system'
  if (attr === 'dark') return 'dark'
  if (attr === 'light') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

async function installMermaid(): Promise<void> {
  const sources = document.querySelectorAll<HTMLElement>('code[data-language="mermaid"]')
  if (sources.length === 0) return

  const mermaid = (await import('mermaid')).default

  const diagrams: { container: HTMLElement; source: string }[] = []

  for (const code of sources) {
    const pre = code.parentElement as HTMLPreElement | null
    const wrap = pre?.parentElement as HTMLElement | null
    if (!pre || !wrap) continue
    const source = code.textContent ?? ''
    const container = document.createElement('div')
    container.className = 'mermaid-container'
    try {
      const id = 'mmd-' + Math.random().toString(36).slice(2, 9)
      const { svg } = await mermaid.render(id, source)
      container.innerHTML = svg
    } catch {
      // Never leave a broken block — show the source as plain text.
      container.textContent = source
    }
    pre.replaceWith(container)
    diagrams.push({ container, source })
  }

  const renderAll = async (): Promise<void> => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'strict',
      themeVariables: resolvedTheme() === 'dark' ? darkVars() : lightVars(),
    })
    for (const d of diagrams) {
      try {
        const id = 'mmd-' + Math.random().toString(36).slice(2, 9)
        const { svg } = await mermaid.render(id, d.source)
        d.container.innerHTML = svg
      } catch {
        d.container.textContent = d.source
      }
    }
  }

  await renderAll()

  // Follow theme switches (the toggle writes data-theme on <html>).
  const observer = new MutationObserver(() => {
    void renderAll()
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
}

/* ---------- 3. Table of contents active section ---------- */

function installToc(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.toc-link'))
  if (links.length === 0) return

  const map = new Map<string, HTMLAnchorElement>()
  for (const a of links) {
    const href = a.getAttribute('href') || ''
    if (href.startsWith('#')) map.set(href.slice(1), a)
  }

  const heads = Array.from(
    document.querySelectorAll<HTMLElement>('.prose h2[id], .prose h3[id]'),
  )
  if (heads.length === 0) return

  const visible = new Set<string>()

  const setActive = (): void => {
    let activeId: string | null = null
    // A heading currently inside the reading band wins.
    for (const h of heads) {
      if (visible.has(h.id)) {
        activeId = h.id
        break
      }
    }
    // Otherwise the last heading scrolled above the band.
    if (!activeId) {
      for (const h of heads) {
        if (h.getBoundingClientRect().top < 100) activeId = h.id
      }
    }
    for (const a of links) a.removeAttribute('data-active')
    if (activeId && map.has(activeId)) map.get(activeId)!.setAttribute('data-active', '')
  }

  const obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const id = (e.target as HTMLElement).id
        if (e.isIntersecting) visible.add(id)
        else visible.delete(id)
      }
      setActive()
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
  )

  for (const h of heads) obs.observe(h)
  setActive()
}

/* ---------- 4. Contents reveal / auto-hide ----------
   antfu-style: the left rail is collapsed until the pointer is over it, then
   it stays open while hovered and fades out a few seconds after leaving.
   A click pins/unpins it for touch or when you want it to stick around. */

function installTocReveal(): void {
  const aside = document.querySelector<HTMLElement>('.article-aside')
  if (!aside) return
  const anchor = aside.querySelector<HTMLButtonElement>('.toc-anchor')
  const HIDE_DELAY = 2500
  let timer: number | undefined

  const open = (): void => {
    if (timer !== undefined) window.clearTimeout(timer)
    aside.setAttribute('data-open', '')
    anchor?.setAttribute('aria-expanded', 'true')
  }

  const scheduleClose = (): void => {
    if (timer !== undefined) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      aside.removeAttribute('data-open')
      anchor?.setAttribute('aria-expanded', 'false')
    }, HIDE_DELAY)
  }

  aside.addEventListener('mouseenter', open)
  aside.addEventListener('mouseleave', scheduleClose)

  anchor?.addEventListener('click', (e) => {
    e.preventDefault()
    if (aside.hasAttribute('data-pinned')) {
      aside.removeAttribute('data-pinned')
      aside.removeAttribute('data-open')
      anchor.setAttribute('aria-expanded', 'false')
    } else {
      aside.setAttribute('data-pinned', '')
      if (timer !== undefined) window.clearTimeout(timer)
      aside.setAttribute('data-open', '')
      anchor.setAttribute('aria-expanded', 'true')
    }
  })
}

/* ---------- boot ---------- */

installCopyButtons()
void installMermaid()
installToc()
installTocReveal()
