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
//
// export const newParasAfterBoundaryAttrSet = ({ boundary, paras, attr, value }) => {
//   return paras.map((p, pi) => {
//     const spans = p.children.map((s, si) => {
//       if (isSpanInsideBoundary(pi, si, boundary)) {
//         return {
//           ...s,
//           [attr]: value,
//         }
//       } else {
//         return { ...s }
//       }
//     })
//     return {
//       paraSpacing: p.paraSpacing,
//       children: spans
//     }
//   })
// }
//
const attrsThatAffectLineHeight = ['fontFamily', 'fontSize']
const checkIfLineHeightIsNormal = (fontFamily, fontSize, lineHeight) => {
  const normalLineHeight = measureNormalLineHeight(fontFamily, fontSize)
  return normalLineHeight === lineHeight
}

const attrsThatBehaveToggle = ['fontStyle', 'textDecoration']
const getToggleTypeAttrDefaultValue = attr => {
  if (attr === 'fontStyle') return 'normal'
  if (attr === 'textDecoration') return 'none'
}

const setSpanAttr = ({ span, attr, value }) => {
  const newSpan = { ...span }

  if (attrsThatAffectLineHeight.includes(attr) && checkIfLineHeightIsNormal(newSpan.fontFamily, newSpan.fontSize, newSpan.lineHeight)) {
    newSpan[attr] = value
    newSpan.lineHeight = measureNormalLineHeight(newSpan.fontFamily, newSpan.fontSize)
  } else if (attrsThatBehaveToggle.includes(attr)) {
    newSpan[attr] =
      value === span[attr] ?
      getToggleTypeAttrDefaultValue(attr)
      : value
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
//
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
//
// export const shouldSetThroughText = attr => [ 'text', ...INLINE_ATTRS, LINE_HEIGHT_ATTR, PARA_SPACING_ATTR ].includes(attr)

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

// const attrsThatNotAffectSize = ['color']

// export const undoableSetRichText = (items, attr, value, historyManageType = 'add') => {
//   const newItems = []
//
//   items.forEach(item => {
//     let newItem
//
//     if (item.name !== 'rich_text') {
//       newItem = setAttrForOtherComponent({ attr, value, item })
//       if (newItem) {
//         newItem.lsave()
//         newItems.push(newItem)
//       }
//     } else {
//       newItem = item.dup()
//
//       if (attr === 'text') {
//         newItem.text = value
//       } else {
//         const paras = JSON.parse(newItem.text)
//         const { paras: newParas } = setParasAttr({ paras, attr, value })
//         newItem.text = JSON.stringify(newParas)
//       }
//
//       if (newItem.text === item.text) return
//
//       if (!attrsThatNotAffectSize.includes(attr)) {
//         if (item.size_type === 0) {
//           const autoSize = getAutoSize(newItem)
//           const dx = adjustLeftForAlignment(item.width, autoSize.width, item.ha)
//           newItem.left += dx
//           newItem.width = autoSize.width
//           newItem.height = autoSize.height
//         } else if (item.size_type === 2) {
//           const autoHeight = getAutoHeight(newItem)
//           newItem.height = autoHeight
//         }
//       }
//
//       newItem.lsave()
//       newItems.push(newItem)
//     }
//   })
//
//   if (historyManageType === 'add' && newItems.length > 0) {
//     const cachedItems = items.map(item => item.dup())
//     $('body').trigger('undoStack:add', [ cachedItems, newItems ])
//   } else if (historyManageType === 'replaceLast') {
//     $('body').trigger('undoStack:add:continous', [ newItems ])
//   }
//
//   return newItems
// }
//
// const adjustLeftForAlignment = (prevW, newW, alignment) => {
//   switch (alignment) {
//     case 'center':
//       return Math.round((prevW - newW) / 2)
//     case 'right':
//       return Math.round(prevW - newW)
//     default:
//       return 0
//   }
// }
//
// const setAttrForOtherComponent = ({ attr, value, item }) => {
//   const attrName = ATTR_NAME_FOR_OTHER_COMPONENT[attr] || attr
//   return setAttr(attrName, value, [ item ])[0]
// }
//
// const ATTR_NAME_FOR_OTHER_COMPONENT = {
//   'fontSize': 'fs',
//   'color': 'tc',
//   'textDecoration': 'td',
//   'lineHeight': 'lh'
// }
//
const INLINE_ATTRS = ['fontFamily', 'fontWeight', 'boldType', 'fontSize', 'color', 'fontStyle', 'textDecoration', 'letterSpacing']
const LINE_HEIGHT_ATTR = 'lineHeight'
const PARA_SPACING_ATTR = 'paraSpacing'
//
// const setSizeType = (value, items) => {
//   const newItems = []
//
//   items.forEach(item => {
//     if (!item.inspectables().includes('size_type')) return
//
//     const newItem = item.dup()
//
//     if (value === 0 && item.size_type !== 0) { // width fixed -> auto
//       newItem.size_type = 0
//
//       const { width, height } = getAutoSize(item)
//       newItem.width = width
//       newItem.height = height
//
//       newItem.lsave()
//       newItems.push(newItem)
//     } else if (value !== 0 && item.size_type === 0) { // auto -> width fixed
//       newItem.size_type = 2
//
//       newItem.lsave()
//       newItems.push(newItem)
//     }
//   })
//
//   return newItems
// }
//
// export const undoableSetSizeType = createUndoableOperation(setSizeType)
