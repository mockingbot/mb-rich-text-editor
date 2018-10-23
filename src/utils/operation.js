import measureNormalLineHeight from 'measure-normal-line-height'


const getNewParaAfterSpanSeperate = (para, si, soffset) => {
  const newSpans = para.children.reduce((spans, s, i) => {
    if (i !== si) {
      spans.push({ ...s })
    } else {
      spans.push(...[
        {
          ...s,
          text: s.text.slice(0, soffset)
        },
        {
          ...s,
          text: s.text.slice(soffset)
        }
      ])
    }
    return spans
  }, [])

  return {
    paraSpacing: para.paraSpacing,
    children: newSpans
  }
}

const checkWillBoundarySeperateSpan = ([ bpi, bsi, boffset ], paras) => {
  const spanText = paras[bpi].children[bsi].text
  if (spanText === '<br>') return false

  return boffset > 0 && boffset < spanText.length
}

export const restructureParasThroughSelection = (start, end, paras) => {
  const newParas = [ ...paras ]
  let newStart = [ ...start ]
  let newEnd = [ ...end ]

  const willStartBoundarySeperateSpan = checkWillBoundarySeperateSpan(newStart, newParas)
  if (willStartBoundarySeperateSpan) {
    const [ spi, ssi, soffset ] = newStart
    const newStartContainerP = getNewParaAfterSpanSeperate(newParas[spi], ssi, soffset)
    newParas[spi] = newStartContainerP
    newStart = [ spi, ssi + 1, 0 ]
  }

  if (willStartBoundarySeperateSpan) {
    if (start[0] === end[0]) newEnd[1] += 1
    if (start[0] === end[0] && start[1] === end[1]) newEnd[2] -= start[2]
  }

  const willEndBoundarySeperateSpan = checkWillBoundarySeperateSpan(newEnd, newParas)
  if (willEndBoundarySeperateSpan) {
    const [ epi, esi, eoffset ] = newEnd
    const newEndContainerP = getNewParaAfterSpanSeperate(newParas[epi], esi, eoffset)
    newParas[epi] = newEndContainerP
  }

  return {
    boundary: {
      start: newStart,
      end: newEnd
    },
    paras: newParas
  }
}

const isSpanInsideBoundary = (pi, si, { start: [ spi, ssi ], end: [ epi, esi ] }) => {
  const m = Math.max(si, ssi, esi) + 1
  return pi*m + si >= spi*m + ssi && pi*m + si <= epi*m + esi
}

const attrsThatAffectLineHeight = ['fontFamily', 'fontSize']
const checkIfLineHeightIsNormal = (fontFamily, fontSize, lineHeight) => {
  const normalLineHeight = Math.ceil(measureNormalLineHeight(fontFamily, fontSize))
  return normalLineHeight === lineHeight
}

const setSpanAttr = ({ span, attr, value }) => {
  const newSpan = { ...span }

  if (attrsThatAffectLineHeight.includes(attr) && checkIfLineHeightIsNormal(newSpan.fontFamily, newSpan.fontSize, newSpan.lineHeight)) {
    newSpan[attr] = value
    newSpan.lineHeight = Math.ceil(measureNormalLineHeight(newSpan.fontFamily, newSpan.fontSize))
  } else {
    newSpan[attr] = value
  }

  if (attr == 'fontFamily') newSpan.fontWeight = 'regular'

  return newSpan
}

const boundaryIsCollapsed = ({ start, end }) => start.every((spi, i) => spi === end[i])

const setInlineAttr = ({ paras, boundary, attr, value }) => {
  let newBoundary, restructuredParas

  if (boundary) {
    const { start, end } = boundary
    const restructuredBoundaryAndParas = restructureParasThroughSelection(start, end, paras)
    newBoundary = restructuredBoundaryAndParas.boundary
    restructuredParas = restructuredBoundaryAndParas.paras
  }

  const newParas = (restructuredParas || paras).map((p, pi) => {
    const newSpans = p.children.map((s, si) => {
      if (!boundary || isSpanInsideBoundary(pi, si, newBoundary)) {
        return setSpanAttr({ span: s, attr, value })
      } else {
        return { ...s }
      }
    })
    return {
      paraSpacing: p.paraSpacing,
      children: newSpans
    }
  })

  return {
    paras: newParas,
    boundary: newBoundary
  }
}

const ifBoudaryOverlapP = (pi, { start: [ spi ], end: [ epi ] }) => {
  return pi >= spi && pi <= epi
}

const setLineHeight = ({ paras, boundary, value }) => {
  return paras.map((p, pi) => {
    const newSpans = p.children.map((s, si) => {
      if (!boundary || ifBoudaryOverlapP(pi, boundary)) {
        return setSpanAttr({ span: s, attr: 'lineHeight', value })
      } else {
        return { ...s }
      }
    })
    return {
      paraSpacing: p.paraSpacing,
      children: newSpans
    }
  })
}

const setParaSpacing = ({ paras, boundary, value }) => {
  return paras.map((p, pi) => {
    const paraSpacing =
      (!boundary || ifBoudaryOverlapP(pi, boundary))
      ? value : p.paraSpacing
    return {
      paraSpacing: paraSpacing,
      children: p.children
    }
  })
}

export const setParasAttr = ({ paras, boundary, attr, value }) => {
  let newParas, newBoundary

  if (INLINE_ATTRS.includes(attr)) {
    if (boundary && boundaryIsCollapsed(boundary)) return

    const newParasAndBoundary = setInlineAttr({ paras, boundary, attr, value })
    newParas = newParasAndBoundary.paras
    newBoundary = newParasAndBoundary.boundary
  } else if (attr === LINE_HEIGHT_ATTR) {
    newParas = setLineHeight({ paras, boundary, value })
  } else if (attr === PARA_SPACING_ATTR) {
    newParas = setParaSpacing({ paras, boundary, value })
  }

  return {
    paras: newParas,
    boundary: newBoundary || boundary
  }
}

const INLINE_ATTRS = ['fontFamily', 'fontWeight', 'boldType', 'fontSize', 'color', 'fontStyle', 'textDecoration', 'letterSpacing']
const LINE_HEIGHT_ATTR = 'lineHeight'
const PARA_SPACING_ATTR = 'paraSpacing'

export const checkIsAttrManagedInsideEditor = attr => (
  [ 'text', ...INLINE_ATTRS, LINE_HEIGHT_ATTR, PARA_SPACING_ATTR ].includes(attr)
)
