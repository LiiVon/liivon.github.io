/**
 * Minimal ambient types for `mermaid`.
 *
 * Mermaid ships without its own type declarations; rather than pull in a
 * `@types/*` package we only describe the three methods this project uses so
 * `astro check` stays green without an extra dependency.
 */
declare module 'mermaid' {
  export interface MermaidConfig {
    startOnLoad?: boolean
    theme?: string
    securityLevel?: string
    themeVariables?: Record<string, string>
    fontFamily?: string
  }

  export interface RenderResult {
    svg: string
    bindFunctions?: (element: Element) => void
  }

  const mermaid: {
    initialize: (config: MermaidConfig) => void
    render: (id: string, text: string) => Promise<RenderResult>
  }

  export default mermaid
}
