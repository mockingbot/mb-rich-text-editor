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

// const isWidgetRichText = w => w.name === 'rich_text'
//
// export const compressRichText = w => {
//   if (!isWidgetRichText(w)) return w
//
//   const compressedRichText = { ...w, text: compress(w.text) }
//
//   try {
//     JSON.parse(decompressRichText(compressedRichText).text)
//   } catch (error) {
//     REPORT_ERROR(
//       error,
//       w.cid,
//       w.text,
//       compressedRichText.text,
//       decompressRichText(compressedRichText).text
//     )
//   }
//
//   return compressedRichText
// }
//
// export const decompressRichText = w => {
//   return isWidgetRichText(w) ? { ...w, text: decompress(w.text) } : w
// }
