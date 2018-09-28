import { SPAN_ATTRS } from './attr'
import { getFontWeightStrDepandOnBoldType } from './font'


const trimStyleValue = (_attr, _val) => {
  const attr = formatAttr(_attr)

  let val = _val.replace(/'|"/g, '')

  const attrsWithUnitPx = ['fontSize', 'lineHeight', 'letterSpacing', 'paraSpacing']
  if (attrsWithUnitPx.includes(attr) && val.slice(-2) === 'px') val = Number(val.slice(0, -2))

  return val
}

const formatAttr = attr => {
  if (attr === 'marginTop') return 'paraSpacing'

  return attr
}

const genSpanStyleObj = (style, fallbackStyle, boldType) => {
  let styleObj = {}
  SPAN_ATTRS.forEach(attr => {
    const val = trimStyleValue(attr, style[attr]) || fallbackStyle[attr]
    styleObj[attr] = val
  })
  styleObj.fontFamily = (styleObj.fontFamily || '').split(',')[ 0 ].trim() // TODO: HACK: NOTE: to filter the fallback font set from `getFontFamily()`(fe/src/utils/rich-text/style.js)
  styleObj.fontWeight = getFontWeightStrDepandOnBoldType(styleObj.fontWeight, fallbackStyle.fontWeight, boldType)
  return styleObj
}

const getParaSpacingFromHTML = (i, $paras) => {
  const getSpacingFromIndex = i === ($paras.length - 1) && $paras.length > 1 ? i - 1 : i
  return Number($paras[getSpacingFromIndex].style.marginBottom.replace('px', ''))
}

export const genParasFromHTML = ($text, lastFocusStyle) => {
  const $paras = Array.from($text.getElementsByTagName('p'))
  let paras

  if ($paras.length === 0) {
    paras = [{
      paraSpacing: lastFocusStyle.paraSpacing,
      children: [ { ...lastFocusStyle.child, text: '' } ]
    }]
  } else {
    paras = $paras.map(($p, i, $paras) => {
      let spans
      const $spans = Array.from($p.getElementsByTagName('span'))
      if ($spans.length === 0) {
        spans = [ { ...lastFocusStyle.child, text: '' } ]
      } else {
        spans = $spans.map($s => {
          return {
            text: $s.innerText.replace(/(\r\n|\n|\r)/gm, ''), 
            // innerText but not innerHTML: because there may be other elements inside span, such as <u>
            // clear any return character
            boldType: Number($s.dataset.boldtype) ? 1 : 0,
            ...genSpanStyleObj($s.style, lastFocusStyle.child, Number($s.dataset.boldtype))
          }
        })
      }
      return {
        paraSpacing: getParaSpacingFromHTML(i, $paras),
        children: spans
      }
    })
  }

  return paras
}
