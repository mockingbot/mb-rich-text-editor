import { configs } from '../config'
import { EDITOR_INLINE_SPAN_CLASS_NAME, REFERENCE_EDITOR_SPAN, TRANSFORM, SPAN_REFER } from '../constant'

import { getSingleSpanAttr } from './attr'
import { getEscapedText } from './text'
import { getFontWeightNumDepandOnBoldType } from './font'


const { getStyleStr: customizeStyleConfigs } = configs

const getFontPreloadAnchor = () => {
  let $anchor = document.getElementById(SPAN_REFER)
  if (!$anchor) {
    $anchor = document.createElement('span')
    $anchor.id = SPAN_REFER
    $anchor.style.opacity = 0
    const body = document.body
    body.appendChild($anchor)
  }
  return $anchor
}

const body = document.body
const $elRefer = document.createElement('span')
body.appendChild($elRefer)

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

const getFontFamily = fontFamily => (
  customizeStyleConfigs.fontFamily ?
    customizeStyleConfigs.fontFamily(fontFamily)
    : fontFamily
)

// 小尺寸font-size的计算
const getLittleFontStyle = (s) => {
  let transform, width = undefined, height = undefined, lineHeight = undefined
  const $ele = getFontPreloadAnchor()

  if (s.fontSize < 12) {
    transform = `scale(${TRANSFORM[s.fontSize]}, ${TRANSFORM[s.fontSize]})`
  } else {
    transform = 'scale(1, 1)'
  }

  $ele.innerHTML = `${s.text}`

  Object.assign($ele.style, {
    ...genSpanStyle({ ...s, fontSize: 12 }),
    display: 'inline-block',
    transform: transform,
    position: 'fixed',
    top: '-99999px',
    left: '-99999px',
  })

  width = Math.floor($ele.getBoundingClientRect().width)
  lineHeight = Math.floor((12 * TRANSFORM[s.fontSize]) / 0.7)
  height = s.lineHeight && s.lineHeight !== 17 ? s.lineHeight : Math.floor(s.fontSize / 0.7)

  return {
    display: 'inline-block',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    transformOrigin: 'left center',
    width: s.transform !== 'scale(1, 1)' && s.width ? s.width : width + 'px',
    transform: transform,
    height: s.transform !== 'scale(1, 1)' && s.height ? s.height : height + 'px',
    lineHeight: s.transform !== 'scale(1, 1)' && s.lineHeight && s.lineHeight !== 17 ? s.lineHeight + 'px' : lineHeight + 'px',
  }
}


// 检测是否需要计算小尺寸的font-size（中文版本的google不支持）
const isGetMinieFont = (s) => {
  $elRefer.style.fontSize = s.fontSize + 'px'
  $elRefer.id = `${REFERENCE_EDITOR_SPAN}`
  const elFontSize = window.getComputedStyle($elRefer).fontSize
  const elRealFontSize = $elRefer.style.fontSize
  const elFontSizeNum = +elFontSize.replace('px', '')
  const elRealFontSizeNum = +elRealFontSize.replace('px', '')
  return elFontSizeNum !== elRealFontSizeNum
}

export const genSpanStyle = (s) => {
  const fontFamily = getSingleSpanAttr(s, 'fontFamily')
  const fontWeight = getSingleSpanAttr(s, 'fontWeight')
  const boldType = getSingleSpanAttr(s, 'boldType')
  let littleFontStyle, isFlag
  isFlag = isGetMinieFont(s)

  if (s.fontSize <= 12) {
    littleFontStyle = isFlag ? getLittleFontStyle(s) : null
  } else {
    littleFontStyle = {
      width: undefined,
      transform: 'scale(1, 1)',
      height: undefined,
    }
  }

  return {
    fontFamily: getFontFamily(fontFamily),
    fontWeight: getFontWeightNumDepandOnBoldType(fontWeight, boldType),
    fontSize: getSingleSpanAttr(s, 'fontSize') + 'px',
    color: getSingleSpanAttr(s, 'color'),
    fontStyle: getSingleSpanAttr(s, 'fontStyle'),
    letterSpacing: getSingleSpanAttr(s, 'letterSpacing') + 'px',
    lineHeight: getSingleSpanAttr(s, 'lineHeight') + 'px',
    textDecoration: getSingleSpanAttr(s, 'textDecoration'),
    width: getSingleSpanAttr(s, 'width'),
    height: getSingleSpanAttr(s, 'height'),
    transform: getSingleSpanAttr(s, 'transform'),
    transformOrigin: getSingleSpanAttr(s, 'transformOrigin'),
    display: getSingleSpanAttr(s, 'display'),
    whiteSpace: getSingleSpanAttr(s, 'whiteSpace'),
    ...littleFontStyle
  }
}

export const getHTML = (paras, selection, getPlainTextAlso) => {
  let plainText = ''

  const defaultSelection = { start: [ 0, 0, 0 ], end: [] }
  const { start: [ spi, ssi, soffset ], end: [ epi, esi, eoffset ] } = selection || defaultSelection
  const parasHTMLArr = []
  const reg = /(\d*.\d*)(?=,)/g
  const $ele = document.getElementById(SPAN_REFER)

  for (let pi = spi; ; pi++) {
    const p = paras[pi]
    const spansHTMLArr = []

    const isStartP = pi === spi
    const isEndP = pi === epi

    let transform, elFontSizeNum, scale

    for (let si = pi === spi ? ssi : 0; ; si++) {
      const isStartS = isStartP && si === ssi
      const isEndS = isEndP && si === esi

      const s = p.children[si]
      const text = s.text.slice(
        isStartS ? soffset : 0
        , isEndS ? eoffset : s.text.length
      )
      let ACTIVE_EDIT_TEXT = '--mb--rich--text'
      if (s.display === 'inline-block') {
        ACTIVE_EDIT_TEXT = '--mb--rich--edit--text'
      }

      if (isGetMinieFont(s)) {
        const fontSize = s.fontSize
        let width
        if (s.display === 'inline-block') {
          transform = s.transform
          scale = !transform ? '1' : transform.match(reg)
          elFontSizeNum = Math.round(scale * parseInt(fontSize))
        }
        if (elFontSizeNum < 12) {
          $ele.innerHTML = `${s.text}`
          Object.assign($ele.style, {
            ...s,
            width: null,
            fontSize: elFontSizeNum
          })
          width = $ele.getBoundingClientRect().width + 'px'
          s.width = width
        }
      }

      const escapedText = getEscapedText(text)
      spansHTMLArr.push(
        `<span id="${ACTIVE_EDIT_TEXT}" class="${EDITOR_INLINE_SPAN_CLASS_NAME}" data-boldtype="${getSingleSpanAttr(s, 'boldType')}" style="${genInlineStyle(genSpanStyle(s))}">${s.text === '' ? '<br>' : escapedText}</span>`
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
