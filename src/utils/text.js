const ESCAPE_LIST = [
  ['&', '&amp;'], // important: first to escape, but last to unescape
  ['<', '&lt;'],
  ['>', '&gt;'],
]
const UNESCAPE_LIST = [ ...ESCAPE_LIST ].reverse()

export const getEscapedText = text => {
  let escapedText = text
  ESCAPE_LIST.forEach(
    ([k, v]) => escapedText = escapedText.replace(new RegExp(k, 'g'), v)
  )
  return escapedText
}

export const getUnescapedText = text => {
  let unescapedText = text
  UNESCAPE_LIST.forEach(
    ([k, v]) => unescapedText = unescapedText.replace(new RegExp(v, 'g'), k)
  )
  return unescapedText
}
