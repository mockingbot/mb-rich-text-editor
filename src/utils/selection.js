import { EDITOR_CLASS_NAME } from '../constant'


export const getIndexAsChild = $el => {
  const $elContainer = $el.parentNode
  return Array.from($elContainer.childNodes).indexOf($el)
}

export const getSelectionBoundaryPosition = boundaryType => {
  let boundaryPosition = []

  const s = window.getSelection()
  let containerNode, boundaryOffset

  if (boundaryType === 'focus') {
    containerNode = s.focusNode
    boundaryOffset = s.focusOffset
  } else if (boundaryType === 'anchor') {
    containerNode = s.anchorNode
    boundaryOffset = s.anchorOffset
  }

  const containerElement = containerNode.nodeName === '#text' ? containerNode.parentNode : containerNode

  const insideSpan = containerElement.closest(`.${EDITOR_CLASS_NAME} span`)
  const insideP = containerElement.closest(`.${EDITOR_CLASS_NAME} p`)

  if (!insideP) {
    boundaryPosition = [0, 0, boundaryOffset]
  } else if (!insideSpan && insideP) {
    boundaryPosition = [getIndexAsChild(insideP), 0, boundaryOffset]
  } else if (insideSpan && insideP) {
    let directChildOfPContainer = containerElement
    while (directChildOfPContainer.parentNode.nodeName !== 'P') {
      directChildOfPContainer = directChildOfPContainer.parentNode
    }
    boundaryPosition = [
      getIndexAsChild(insideP),
      getIndexAsChild(directChildOfPContainer),
      boundaryOffset
    ]
  }

  return boundaryPosition
}

export const selectionIsCollapsed = ({ start, end }) => start.every((spi, i) => spi === end[i])

const getSelectionDirection = ({ start, end }) => {
  const FORWARDS = 'forwards'
  const BACKWARDS = 'backwards'
  for (let i = 0; i < start.length; i++) {
    if (start[i] > end[i]) {
      return BACKWARDS
    } else if (start[i] < end[i]) {
      return FORWARDS
    }
  }
  return FORWARDS
}

export const getDirectionalSelection = (selection, ref) => {
  const originalDir = getSelectionDirection(selection)

  const refDir = typeof ref === 'object' ? getSelectionDirection(ref) : ref

  return refDir && refDir !== originalDir ?
    { start: selection.end, end: selection.start }
    : { ...selection }
}

export const getSelectionForSelectAll = paras => ({
  start: [0, 0, 0],
  end: [
    paras.length - 1,
    paras[paras.length - 1].children.length - 1,
    paras[paras.length - 1].children[paras[paras.length - 1].children.length - 1].text.length
  ]
})
