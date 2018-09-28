import { getFontWeightStr } from './font'
import { getUnescapedText } from './text'
import { insertTextContent } from './insertion'

import { configs } from '../config'
const DEFAULT_STYLE = configs.defaultStyle


const DEFAULT_MONO_FONT_FOR_PASTE = 'Courier New'

const formatPastedHTML = pasted => {
  const formatters = []

  const uncomment = t => t.replace(/<!--.*?-->/g, '')
  const extractFromBody = t => /<body>([^]*?)<\/body>/.test(t) ?
    t.match(/<body>([^]*?)<\/body>/)[1]
    : t
  const trimSpace = t => t.trim()
  const symbolizeNewLine = t => t.replace(/[\r\n\t\v\f]/g, NEW_LINE_SYMBOL)

  formatters.push(...[
    uncomment,
    extractFromBody,
    trimSpace,
    symbolizeNewLine
  ])

  return formatters.reduce((t, formatter) => formatter(t), pasted)
}

export const parsePastedHTML = pasted => {
  const formattedHTML = formatPastedHTML(pasted)

  let pointer = 0
  let stackStyles = []

  const paraData = []

  let currentPara = 0

  while (pointer !== formattedHTML.length) {
    const [ , openningTag, text, secondHalfTag, closingSlash ] = MATCH_FRAGMENT(formattedHTML, pointer)

    if (openningTag) {
      const openningTagName = MATCH_TAG(openningTag)

      if (SELF_CLOSING_IGNORED_ELS.includes(openningTagName)) {
        pointer += openningTag.length
        continue
      }

      if (BLOCK_ELS.includes(openningTagName) && !paraData[currentPara]) {
        const paraSpacing = getMarginBottom(openningTag)
        paraData[currentPara] = {
          paraSpacing,
          children: []
        }
      }

      const style = extractStyle(openningTag, stackStyles)
      stackStyles.push(style)
    }

    if (text) {
      const mergedStyle = mergeStackStyle(stackStyles)

      const textLines = text.split(NEW_LINE_SYMBOL)

      textLines.forEach((t, ti) => {
        const unescapedText = getUnescapedText(t) // we store unescaped text
        const child = { text: unescapedText, ...mergedStyle }

        if (!paraData[currentPara]) {
          paraData[currentPara] = {
            paraSpacing: 0,
            children: []
          }
        }
        paraData[currentPara].children.push(child)

        if (ti < textLines.length - 1) currentPara += 1
      })
    } else if (openningTag && MATCH_TAG(openningTag) === BREAK_EL && closingSlash) {
      const mergedStyle = mergeStackStyle(stackStyles)
      const child = { text: '', ...mergedStyle }

      if (!paraData[currentPara]) {
        paraData[currentPara] = {
          paraSpacing: 0,
          children: []
        }
      }
      paraData[currentPara].children.push(child)
    }

    if (closingSlash) {
      const closingTagName = MATCH_TAG(secondHalfTag)

      BLOCK_ELS.includes(closingTagName) ? stackStyles.length = 0 : stackStyles.pop()

      if (
        BLOCK_ELS.includes(closingTagName)
        && paraData[currentPara]
        && paraData[currentPara].children.length
      ) currentPara += 1
    }

    if (
      !openningTag
      && secondHalfTag
      && SELF_CLOSING_IGNORED_ELS.includes(MATCH_TAG(secondHalfTag))
    ) {
      pointer += secondHalfTag.length // <br> matches, but it's in secondHalfTag
      continue
    }

    const fragmentLength =
    (openningTag ? openningTag.length : 0)
    + (text ? text.length : 0)
    + (closingSlash ? secondHalfTag.length : 0)

    if (fragmentLength === 0) {
      console.warn('RichTextEditor: manually break infinite loop while parsing pasted HTML')
      break
    }

    pointer += fragmentLength
  }

  if (
    paraData[paraData.length - 1]
    && !paraData[paraData.length - 1].children.length
  ) paraData.pop()

  return paraData
}

const MATCH_TAG = (str, startIndex = 0) => str.match(/<\/??([^/]*?(?=\s|>))/)[1]

const FRAGMENT_PATTERN = new RegExp(/(<(?!\/).*?>)?(.*?)(<(\/?).*?>)/)

const MATCH_FRAGMENT = (str, startIndex) => str.slice(startIndex).match(FRAGMENT_PATTERN)

const getMarginBottom = str => {
  const elName = MATCH_TAG(str)

  const match = str.match(new RegExp('margin' + INLINE_STYLE_PATTERN.source))
    || str.match(new RegExp('margin-bottom' + INLINE_STYLE_PATTERN.source))

  if (match) {
    const margins = match[1].split(' ')
    const bottomIndex = margins.length < 3 ? 0 : 2

    return Number(margins[bottomIndex].replace(/px$/, ''))
  } else if (!match && /^h\d$/.test(elName)) {
    return getHeaderMarginBottom(elName)
  } else {
    return 0
  }
}

const getFontSizeFromNumeric = size => {
  if (size == 1) return 10
  if (size == 2) return 13
  if (size == 3) return 16
  if (size == 4) return 18
  if (size == 5) return 24
  if (size == 6) return 32
  if (size == 7) return 48
}


const extractStyle = (tag, stackStyles) => {
  const fontSize = extractFontSize(tag, stackStyles)

  return {
    fontFamily: extractFontFamily(tag),
    fontWeight: extractFontWeight(tag),
    fontSize,
    textDecoration: extractTextDecoration(tag),
    color: extractColor(tag),
    lineHeight: extractLineHeight(tag, fontSize),
    letterSpacing: extractLetterSpacing(tag),
  }
}

const INLINE_STYLE_PATTERN = /:\s?(.*?);/
const ATTR_STYLE_PATTERN = /="(.*?)"/

const extractFontFamily = tag => {
  const tagName = MATCH_TAG(tag)

  let match
  if (tagName === 'font') {
    match = tag.replace(/&quot;/g, '').match(new RegExp('family' + ATTR_STYLE_PATTERN.source))
  } else {
    match = tag.replace(/&quot;/g, '').match(new RegExp('font-family' + INLINE_STYLE_PATTERN.source))
  }

  if (!match && tagName === 'pre') return DEFAULT_MONO_FONT_FOR_PASTE

  return match ? match[1].split(',')[0].trim() : undefined // get 1st font-family
}

const extractFontWeight = tag => {
  const tagName = MATCH_TAG(tag)
  if (tagName === 'b' || tagName === 'strong') return 'bold'

  const match = tag.match(new RegExp('font-weight' + INLINE_STYLE_PATTERN.source))

  if (!match) return  /^h\d$/.test(tagName) ? 'bold' : undefined

  return getFontWeightStr(match[1])
}

const extractFontSize = (tag, stackStyles) => {
  const parentSize = stackStyles.length > 0
    ? stackStyles[stackStyles.length - 1].fontSize
    : DEFAULT_STYLE.fontSize
  const tagName = MATCH_TAG(tag)

  let match
  if (tagName === 'font') {
    match = tag.match(new RegExp('size' + ATTR_STYLE_PATTERN.source))
  } else {
    match = tag.match(new RegExp('font-size' + INLINE_STYLE_PATTERN.source))
  }

  if (!match) return /^h\d$/.test(tagName) ? getHeaderFontSize(tagName) : parentSize

  if (/px$/.test(match[1])) {
    return parseInt(match[1].replace(/px$/, ''))
  } else if (!isNaN(match[1])) {
    return getFontSizeFromNumeric(match[1])
  } else if (/rem$/.test(match[1])) {
    const baseSize = DEFAULT_STYLE.fontSize
    return Math.round(baseSize * match[1].replace(/rem$/, ''))
  } else if (/em$/.test(match[1])) {
    return Math.round(parentSize * match[1].replace(/em$/, ''))
  } else {
    return parentSize
  }
}

const extractTextDecoration = tag => {
  const tagName = MATCH_TAG(tag)
  if (tagName === 'u') {
    return 'underline'
  } else if (tagName === 's') {
    return 'line-through'
  }

  const match = tag.match(new RegExp('text-decoration' + INLINE_STYLE_PATTERN.source))
  || tag.match(new RegExp('text-decoration-line' + INLINE_STYLE_PATTERN.source))

  if (!match) return 'none'

  if (/underline/.test(match[1])) {
    return 'underline'
  } else if (/line-through/.test(match[1])) {
    return 'line-through'
  } else {
    return 'none'
  }
}

const extractColor = tag => {
  const match = tag.match(/((?!-).{1}|^)color:\s?(.*?);/) // to exclude pattern like `background-color`

  return match ? match[2] : undefined
}

const extractLineHeight = (tag, lineFontSize) => {
  const match = tag.match(new RegExp('line-height' + INLINE_STYLE_PATTERN.source))
  if (!match) return undefined

  if (/px$/.test(match[1])) {
    return Number(match[1].replace(/px$/, ''))
  } else if (!isNaN(match[1])) {
    const baseFontSize = lineFontSize
    return Math.round(baseFontSize * match[1])
  } else {
    return undefined
  }
}

const extractLetterSpacing = tag => {
  const match = tag.match(new RegExp('letter-spacing' + INLINE_STYLE_PATTERN.source))
  if (!match) return undefined

  if (/px$/.test(match[1])) {
    return Number(match[1].replace(/px$/, ''))
  } else if (match[1] === 'normal') {
    return 0
  } else {
    return undefined
  }
}

const getHeaderFontSize = elName => {
  const baseFontSize = DEFAULT_STYLE.fontSize
  if (elName === 'h1') return parseInt(baseFontSize * 2)
  if (elName === 'h2') return parseInt(baseFontSize * 1.5)
  if (elName === 'h3') return parseInt(baseFontSize * 1.17)
  if (elName === 'h4') return parseInt(baseFontSize * 1)
  if (elName === 'h5') return parseInt(baseFontSize * 0.83)
  if (elName === 'h6') return parseInt(baseFontSize * 0.67)
}

const getHeaderMarginBottom = elName => {
  const baseFontSize = DEFAULT_STYLE.fontSize
  if (elName === 'h1') return parseInt(baseFontSize * 0.67)
  if (elName === 'h2') return parseInt(baseFontSize * 0.83)
  if (elName === 'h3') return parseInt(baseFontSize * 1)
  if (elName === 'h4') return parseInt(baseFontSize * 1.33)
  if (elName === 'h5') return parseInt(baseFontSize * 1.67)
  if (elName === 'h6') return parseInt(baseFontSize * 2.33)
}

const mergeStackStyle = stackStyles => {
  return stackStyles.reduce((styles, s) => {
    Object.entries(s).forEach(([k, v]) => {
      if (v !== undefined) styles[k] = v
    })
    return styles
  }, {})
}

const BLOCK_ELS = [
  'div', 'ul', 'li', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'address', 'article', 'aside', 'blockquote', 'dd', 'dl', 'dt', 'table', 'tfoot',
  'footer', 'header', 'hgroup', 'hr', 'main', 'nav', 'pre', 'section',
]

const SELF_CLOSING_IGNORED_ELS = [ 'img', 'input' ]
const BREAK_EL = 'br'

const NEW_LINE_SYMBOL = '__MB__NL__2349639398'

export const cutSelection = (paras, selection) => insertTextContent(paras, '', selection)
