import measureNormalLineHeight from 'measure-normal-line-height'

import { TRANSFORM } from '../constant'
import { configs } from '../config'

const DEFAULT_STYLE = configs.defaultStyle

export const SPAN_ATTRS = [
  'fontFamily',
  'fontWeight',
  'fontSize',
  'color',
  'fontStyle',
  'textDecoration',
  'letterSpacing',
  'lineHeight',
  'display',
  'transform',
  'transformOrigin',
  'whiteSpace',
  'width'
]

const getParaAttr = (paras, delegatePIndex = [ 0 ], attr) => {
  if (attr === 'paraSpacing') return paras[delegatePIndex[0]].paraSpacing
}

export const getSingleSpanAttr = (s, attr) => {
  if (attr === 'fontFamily') return s.fontFamily || DEFAULT_STYLE.fontFamily
  if (attr === 'fontWeight') return s.fontWeight || DEFAULT_STYLE.fontWeight
  if (attr === 'boldType') return Number(s.boldType) ? 1 : 0
  if (attr === 'fontSize') return s.fontSize || DEFAULT_STYLE.fontSize
  if (attr === 'color') return s.color || DEFAULT_STYLE.color
  if (attr === 'fontStyle') return s.fontStyle || DEFAULT_STYLE.fontStyle
  if (attr === 'textDecoration') return s.textDecoration || DEFAULT_STYLE.textDecoration
  if (attr === 'letterSpacing') return s.letterSpacing || DEFAULT_STYLE.letterSpacing
  if (attr === 'display') return s.display || DEFAULT_STYLE.display
  if (attr === 'whiteSpace') return s.whiteSpace || DEFAULT_STYLE.whiteSpace
  if (attr === 'width') return s.width || DEFAULT_STYLE.width
  if (attr === 'transform') return s.transform || DEFAULT_STYLE.transform
  if (attr === 'transformOrigin') return s.transformOrigin || DEFAULT_STYLE.transformOrigin
  if (attr === 'lineHeight') {
    const spanLineHeight = s.lineHeight
    return (
      (!spanLineHeight || spanLineHeight === 'normal')
      ?
      Math.ceil(measureNormalLineHeight(
        getSingleSpanAttr(s, 'fontFamily'),
        getSingleSpanAttr(s, 'fontSize')
      ))
      : s.fontSize < 12
      ?  Math.floor((12 * TRANSFORM[s.fontSize]) / 0.7)
      : spanLineHeight
    )
  }
}

const getSpanAttr = (paras, delegateSpanIndex = [ 0, 0 ], attr) => {
  const delegatePi = delegateSpanIndex[0]
  const delegateSi = delegateSpanIndex[1]
  const delegateSpan = paras[delegatePi].children[delegateSi]

  return getSingleSpanAttr(delegateSpan, attr)
}

export const getRichTextAttr = (paras, selectionStartIndex, attr) => {
  if (!paras) return null

  const attrs = {
    fontFamily: getSpanAttr(paras, selectionStartIndex, 'fontFamily'),
    fontWeight: getSpanAttr(paras, selectionStartIndex, 'fontWeight'),
    boldType: getSpanAttr(paras, selectionStartIndex, 'boldType'),
    fontSize: getSpanAttr(paras, selectionStartIndex, 'fontSize'),
    color: getSpanAttr(paras, selectionStartIndex, 'color'),
    fontStyle: getSpanAttr(paras, selectionStartIndex, 'fontStyle'),
    textDecoration: getSpanAttr(paras, selectionStartIndex, 'textDecoration'),
    letterSpacing: getSpanAttr(paras, selectionStartIndex, 'letterSpacing'),
    lineHeight: getSpanAttr(paras, selectionStartIndex, 'lineHeight'),
    display: getSpanAttr(paras, selectionStartIndex, 'display'),
    transform: getSpanAttr(paras, selectionStartIndex, 'transform'),
    paraSpacing: getParaAttr(paras, selectionStartIndex, 'paraSpacing'),
    whiteSpace: getParaAttr(paras, selectionStartIndex,'whiteSpace'),
    width: getParaAttr(paras, selectionStartIndex,'width'),
    height: getParaAttr(paras, selectionStartIndex,'height'),
  }

  return attr ? attrs[attr] : attrs
}
