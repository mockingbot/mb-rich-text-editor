import { configs } from '../config'
import { EDITOR_INLINE_SPAN_CLASS_NAME } from '../constant'

import { getSingleSpanAttr } from './attr'
import { getEscapedText } from './text'
import { getFontWeightNumDepandOnBoldType } from './font'


const { getStyleStr: customizeStyleConfigs } = configs

const getHyphenStyleName = camelCaseStyleName => camelCaseStyleName.replace(/[A-Z]/g, capital => `-${capital.toLowerCase()}`)

const genInlineStyle = styleObj => {
  const inlineStyleArr = Object.entries(styleObj).map(
    ([attr, val]) => `${getHyphenStyleName(attr)}:${val};`
  )

  return inlineStyleArr.join(' ')
}

export const genParaStyle = p => {
  const spacingFromTheLatterPara = p.paraSpacing
  return {
    lineHeight: 0,
    marginBottom: spacingFromTheLatterPara + 'px'
  }
}

const getFontFamily = (fontFamily, fontWeight) => (
  customizeStyleConfigs.fontFamily ?
    customizeStyleConfigs.fontFamily(fontFamily, fontWeight)
    : fontFamily
)

export const genSpanStyle = (s) => {
  const fontFamily = getSingleSpanAttr(s, 'fontFamily')
  const fontWeight = getSingleSpanAttr(s, 'fontWeight')
  const boldType = getSingleSpanAttr(s, 'boldType')

  return {
    fontFamily: getFontFamily(fontFamily, fontWeight),
    fontWeight: getFontWeightNumDepandOnBoldType(fontWeight, boldType),
    fontSize: getSingleSpanAttr(s, 'fontSize') + 'px',
    color: getSingleSpanAttr(s, 'color'),
    fontStyle: getSingleSpanAttr(s, 'fontStyle'),
    letterSpacing: getSingleSpanAttr(s, 'letterSpacing') + 'px',
    lineHeight: getSingleSpanAttr(s, 'lineHeight') + 'px',
    textDecoration: getSingleSpanAttr(s, 'textDecoration')
  }
}

export const getHTML = (paras, selection, getPlainTextAlso) => {
  let plainText = ''

  const defaultSelection = { start: [ 0, 0, 0 ], end: [] }
  const { start: [ spi, ssi, soffset ], end: [ epi, esi, eoffset ] } = selection || defaultSelection
  const parasHTMLArr = []

  for (let pi = spi; ; pi++) {
    const p = paras[pi]
    const spansHTMLArr = []

    const isStartP = pi === spi
    const isEndP = pi === epi

    for (let si = pi === spi ? ssi : 0; ; si++) {
      const isStartS = isStartP && si === ssi
      const isEndS = isEndP && si === esi

      const s = p.children[si]
      const text = s.text.slice(
        isStartS ? soffset : 0
        , isEndS ? eoffset : s.text.length
      )

      const escapedText = getEscapedText(text)
      spansHTMLArr.push(
        `<span class="${EDITOR_INLINE_SPAN_CLASS_NAME}" data-boldtype="${getSingleSpanAttr(s, 'boldType')}" style="${genInlineStyle(genSpanStyle(s))}">${s.text === '' ? '<br>' : escapedText}</span>`
      )
      if (getPlainTextAlso) plainText += text // plain text does not have to escape

      if (si === (isEndS ? esi : p.children.length - 1)) break
    }

    const joinedSpanHTML = spansHTMLArr.join('')
    parasHTMLArr.push(
      `<p style="${genInlineStyle(genParaStyle(p))}">${joinedSpanHTML}</p>`
    )
    if (getPlainTextAlso && pi !== epi) plainText += '\n'

    if (pi === (isEndP ? epi : paras.length - 1)) break
  }

  const joinedParaHTML = parasHTMLArr.join('')
  return getPlainTextAlso ?
    {
      text: plainText,
      HTML: joinedParaHTML
    }
    : joinedParaHTML
}

export const isPastedDataFromInside = data => {
  const MB_SYMBOL_PATTERN = new RegExp(EDITOR_INLINE_SPAN_CLASS_NAME)
  return MB_SYMBOL_PATTERN.test(data)
}
