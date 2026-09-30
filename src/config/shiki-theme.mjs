/* ==========================================================================
   Shiki themes — monochrome by design.

   Syntax highlighting here carries NO hue at all: hierarchy between tokens
   is expressed through three gray steps and one italic, nothing else.
   Anything more would break the Black / White / Gray system.

   Shiki's theme format uses top-level `bg` / `fg` (not the VS Code
   `colors.editor.*` shape) plus a TextMate `settings` array.

   Light: #171717 (primary) · #5c5c5c (secondary) · #a3a3a3 (tertiary)
   Dark:  #ededed (primary) · #a1a1a6 (secondary) · #6e6e73 (tertiary)

   Backgrounds match --c-surface so a code block reads as part of the page
   rather than as an inserted box.
   ========================================================================== */

/** Everything not matched below stays at the darkest gray (the foreground). */
const base = {
  settings: { foreground: '#171717' },
}

export const grayLight = {
  name: 'liivon-gray-light',
  type: 'light',
  bg: '#fafafa',
  fg: '#171717',
  settings: [
    base,

    // Comments step back to the quietest gray, italic to read as annotation.
    {
      scope: ['comment', 'comment.line', 'comment.block', 'punctuation.definition.comment'],
      settings: { foreground: '#a3a3a3', fontStyle: 'italic' },
    },

    // Literals and structure sit one step below the foreground so keywords
    // stay the darkest thing on screen without ever becoming "bold".
    {
      scope: [
        'string',
        'string.quoted',
        'string.template',
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.regexp',
        'punctuation',
        'punctuation.separator',
        'punctuation.terminator',
        'meta.brace',
        'keyword.operator',
        'keyword.operator.assignment',
        'variable',
      ],
      settings: { foreground: '#5c5c5c' },
    },

    // Declarations, types and keywords keep full contrast.
    {
      scope: [
        'keyword',
        'keyword.control',
        'storage',
        'storage.type',
        'storage.modifier',
        'entity.name.type',
        'entity.name.class',
        'entity.name.tag',
        'support.type',
        'support.class',
        'entity.name.function',
        'support.function',
        'variable.other.member',
        'meta.preprocessor',
      ],
      settings: { foreground: '#171717' },
    },
  ],
}

const darkBase = {
  settings: { foreground: '#ededed' },
}

export const grayDark = {
  name: 'liivon-gray-dark',
  type: 'dark',
  bg: '#141416',
  fg: '#ededed',
  settings: [
    darkBase,

    {
      scope: ['comment', 'comment.line', 'comment.block', 'punctuation.definition.comment'],
      settings: { foreground: '#6e6e73', fontStyle: 'italic' },
    },

    {
      scope: [
        'string',
        'string.quoted',
        'string.template',
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.regexp',
        'punctuation',
        'punctuation.separator',
        'punctuation.terminator',
        'meta.brace',
        'keyword.operator',
        'keyword.operator.assignment',
        'variable',
      ],
      settings: { foreground: '#a1a1a6' },
    },

    {
      scope: [
        'keyword',
        'keyword.control',
        'storage',
        'storage.type',
        'storage.modifier',
        'entity.name.type',
        'entity.name.class',
        'entity.name.tag',
        'support.type',
        'support.class',
        'entity.name.function',
        'support.function',
        'variable.other.member',
        'meta.preprocessor',
      ],
      settings: { foreground: '#ededed' },
    },
  ],
}
