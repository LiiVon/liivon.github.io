import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { grayDark, grayLight } from './src/config/shiki-theme.mjs'

/**
 * Markdown images get lazy loading without pulling in a plugin dependency —
 * the transform is three levels below that trade-off.
 */
function lazyImages() {
  const walk = (node) => {
    if (node.type === 'element' && node.tagName === 'img') {
      node.properties = node.properties ?? {}
      node.properties.loading = node.properties.loading ?? 'lazy'
      node.properties.decoding = node.properties.decoding ?? 'async'
    }
    if (Array.isArray(node.children)) node.children.forEach(walk)
  }
  return () => (tree) => walk(tree)
}

/**
 * Wrap every fenced code block in a positioning context so the Copy button can
 * sit in the corner and stay put while long lines scroll underneath. No extra
 * dependency — just a small tree transform, like lazyImages above.
 */
function wrapCodeBlocks() {
  const wrap = (node) => {
    if (node.type === 'element' && node.tagName === 'pre') {
      return {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block'] },
        children: [node],
      }
    }
    if (Array.isArray(node.children)) node.children = node.children.map(wrap)
    return node
  }
  return () => (tree) => {
    tree.children = tree.children.map(wrap)
  }
}

// https://liivon.github.io  —  published by GitHub Pages from the repository root,
// so every route is a real file (no SPA fallback needed).
export default defineConfig({
  site: 'https://liivon.github.io',
  base: '/',
  integrations: [sitemap(), mdx()],
  build: {
    // sitemap needs clean directory URLs; keep the default `directory`
    format: 'directory',
  },
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig: {
      // Monochrome themes — see src/config/shiki-theme.mjs
      themes: { light: grayLight, dark: grayDark },
      wrap: false,
      // `mermaid` blocks are rendered by the client script, but Shiki still
      // needs to recognise the language name to emit them.
      langs: ['cpp', 'c', 'bash', 'shell', 'python', 'javascript', 'typescript', 'json', 'yaml', 'cmake', 'mermaid'],
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, lazyImages(), wrapCodeBlocks()],
  },
})
