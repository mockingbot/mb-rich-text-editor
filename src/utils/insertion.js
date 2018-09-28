export const insertHTMLContent = (paras, content, { start, end }) => {
  const spi = start[0]
  const [ epi, esi ] = end

  const newParas = []
  const newCaret = []

  paras.forEach((p, pi, paras) => {

    if (pi < spi || pi > epi) newParas.push({ ...p })
    else if (pi === spi) {
      if (content.length === 0) {
        const { before: beforeStart } = seperatePara(paras[spi], start)
        const { after: afterEnd } = seperatePara(paras[epi], end)
        newParas.push({
          paraSpacing: p.paraSpacing,
          children: (beforeStart.length + afterEnd.length === 0) ?
          [{ ... paras[epi].children[esi], text: '' }]
          : [ ...beforeStart, ...afterEnd ]
        })
        newCaret[0] = spi
        newCaret[1] = beforeStart.length ? beforeStart.length - 1 : 0
        newCaret[2] = beforeStart.length ? beforeStart[beforeStart.length-1].text.length : 0
      } else {
        content.forEach((cp, cpi) => {
          const contentPara = {
            paraSpacing: cp.paraSpacing !== undefined ? cp.paraSpacing : p.paraSpacing,
            children: []
          }

          if (cpi === 0) {
            const { before: beforeStart } = seperatePara(paras[spi], start)
            if (beforeStart.length > 0) contentPara.children.push(...beforeStart)
          }

          contentPara.children.push(...cp.children)

          if (cpi === content.length - 1) {
            newCaret[0] = spi + content.length - 1
            newCaret[1] = contentPara.children.length - 1
            newCaret[2] = cp.children[cp.children.length - 1].text.length

            const { after: afterEnd } = seperatePara(paras[epi], end)
            if (afterEnd.length > 0) contentPara.children.push(...afterEnd)
          }
          newParas.push(contentPara)
        })
      }

    }
  })

  return {
    paras: newParas,
    selection: {
      start: newCaret,
      end: newCaret
    }
  }
}

const seperatePara = (p, [ _, si, offset ]) => {
  const beforePartial = []
  const afterPartial = []

  p.children.forEach((_s, _si) => {
    if (_si < si) beforePartial.push({ ..._s })
    if (_si > si) afterPartial.push({ ..._s })

    if (_si === si && offset !== 0) {
      beforePartial.push({
        ..._s,
        text: _s.text.slice(0, offset)
      })
    }

    if (_si === si && offset !== _s.text.length) {
      afterPartial.push({
        ..._s,
        text: _s.text.slice(offset)
      })
    }
  })

  return {
    before: beforePartial,
    after: afterPartial,
  }
}

export const insertTextContent = (paras, text, { start, end }) => {
  const textGrp = text.replace(/[\r\n\t\v\f]+/g, '\n').split(/\n/)
  const noText = textGrp.length === 1 && textGrp[0] === ''

  const [ spi, ssi ] = start
  const [ epi, esi ] = end

  const newParas = []
  const newCaret = []

  paras.forEach((p, pi, paras) => {

    if (pi < spi || pi > epi) newParas.push({ ...p })
    else if (pi === spi) {
      if (noText) {
        const { before: beforeStart } = seperatePara(paras[spi], start)
        const { after: afterEnd } = seperatePara(paras[epi], end)
        newParas.push({
          paraSpacing: p.paraSpacing,
          children: (beforeStart.length + afterEnd.length === 0) ?
          [{ ... paras[epi].children[esi], text: '' }]
          : [ ...beforeStart, ...afterEnd ]
        })
        newCaret[0] = spi
        newCaret[1] = beforeStart.length ? beforeStart.length - 1 : 0
        newCaret[2] = beforeStart.length ? beforeStart[beforeStart.length-1].text.length : 0
      } else {
        const startSpanStyle = paras[spi].children[ssi]

        textGrp.forEach((tp, tpi) => {
          const textSpan = { ...startSpanStyle, text: tp }
          const textPara = {
            paraSpacing: p.paraSpacing,
            children: []
          }

          if (tpi === 0) {
            const { before: beforeStart } = seperatePara(paras[spi], start)
            if (beforeStart.length > 0) {
              beforeStart[beforeStart.length - 1].text += tp
              textPara.children.push(...beforeStart)
            } else {
              textPara.children.push(textSpan)
            }
          }

          if (tpi > 0) {
            textPara.children.push(textSpan)
          }

          if (tpi === textGrp.length - 1) {
            newCaret[0] = spi + textGrp.length - 1
            newCaret[1] = textPara.children.length - 1
            newCaret[2] = textPara.children[textPara.children.length - 1].text.length

            const { after: afterEnd } = seperatePara(paras[epi], end)
            if (afterEnd.length > 0) textPara.children.push(...afterEnd)
          }

          newParas.push(textPara)
        })
      }

    }
  })

  return {
    paras: newParas,
    selection: {
      start: newCaret,
      end: newCaret
    }
  }
}
