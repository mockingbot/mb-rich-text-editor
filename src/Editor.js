import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

import { configs } from './config'

import { genParasFromHTML } from './utils/parse'
import { getHTML, isPastedDataFromInside } from './utils/style'
import { getIndexAsChild, getSelectionBoundaryPosition, selectionIsCollapsed, getDirectionalSelection, getSelectionForSelectAll } from './utils/selection'
import { cutSelection, parsePastedHTML } from './utils/clipboard'
import { insertHTMLContent, insertTextContent } from './utils/insertion'
import stopReactEventPropagation from 'stop-react-event-propagation'
import { setParasAttr } from './utils/operation'

import { EDITOR_CLASS_NAME } from './constant'


import './index.css'

const HISTORY_CAPACITY = 50


export default class RichTextEditor extends PureComponent {
  constructor(props) {
    super()

    // lastFocusStyle:
    //   in case of unexpected inline style missing(after enter 'Enter' or
    //   emptying content), so we always keep track of last focused span's
    //   style, as fallback style of following input content
    this.lastFocusStyle = null

    // isInputtingComposition:
    //   for Chinese characters, re-render during a charater's spelling will
    //   get it cut off, so we have `isInputtingComposition` as a flag to
    //   indicate whether a composition is complete, then plan our next update
    this.isInputtingComposition = false

    // state we care about in this component:
    // |-- paras: the data structrue of rich text inside, structured as:
    // |     [{   // each object inside represents a paragraph
    // |       paraSpacing: 0,   // spacing between paragraphs
    // |       children: [{  // each object inside represents a span inside the paragraph
    // |         text: 'hello world',
    // |         fontFamily: 'Courier New'
    // |       }]
    // |     }]
    // |-- selection: selection inside the editor, structured as:
    // |     {
    // |       start: [   // selection start point
    // |         0,    // which paragraph it's in
    // |         0,    // which span it's in
    // |         0,    // it's offset in span
    // |       ],
    // |       end: [   // selection end point
    // |         0,
    // |         0,
    // |         0,
    // |       ],
    // |     }
    this.state = {
      past: [],
      present: {
        paras: props.store.paras,
        selection: this.getInitialSelection(props.store)
      },
      future: []
    }
  }

  getInitialSelection = ({ paras, selection }) => (
    selection || getSelectionForSelectAll(paras) // default select all when mount
  )

  getPresentState = () => this.state.present

  pushPresentState = stateToSet => new Promise((resolve, reject) => {
    const { past, present } = this.state
    const newPast = [ ...past, present ]

    if (newPast.length + 1 > HISTORY_CAPACITY) newPast.shift()

    this.setState({
      past: newPast,
      present: stateToSet,
      future: []
    }, resolve)
  })

  componentDidMount() {
    this.buildEditorBridge(this.props.editorBridgeBuilder)

    // after every update we should restore selection or it will get lost
    // press `Enter` key to mount editor incidently get captured by $editor in
    // `input` event, making all selected content to be changed.
    // so let setTimeout handle this order
    setTimeout(() => this.restoreSelection().then(this.popSelectionChange), 0)
  }

  buildEditorBridge = editorBridgeBuilder => editorBridgeBuilder(this.getPresentState, this.handleSetRichAttr)

  componentDidUpdate() {
    // patch: React somehow did not re-render correctly under this circumstance
    if (this.$editor.childNodes.length === 0) this.manuallyUpdate()

    // after every update we should restore selection or it will get lost
    this.restoreSelection().catch(e => {
      // error may occur if update is not as expected, so we fire a manually update
      console.warn(e)
      this.manuallyUpdate()
    }).then(this.popSelectionChange)
  }

  manuallyUpdate = () => this.$editor.innerHTML = getHTML(this.getPresentState().paras)

  restoreSelection = () => new Promise((resolve, reject) => {
    const { selection } = this.getPresentState()

    const { start: [ spi, ssi, soffset ], end: [ epi, esi, eoffset ] } = selection
    const startContainerSpanNode = this.$editor.childNodes[spi].childNodes[ssi]
    const startContainerNode =
      startContainerSpanNode.childNodes[0].nodeName === '#text'
      ? startContainerSpanNode.childNodes[0]
      : startContainerSpanNode
    const endContainerSpanNode = this.$editor.childNodes[epi].childNodes[esi]
    const endContainerNode =
      endContainerSpanNode.childNodes[0].nodeName === '#text'
      ? endContainerSpanNode.childNodes[0]
      : endContainerSpanNode

    const r = document.createRange()
    r.setStart(startContainerNode, soffset)

    const s = window.getSelection()
    s.removeAllRanges()
    s.addRange(r)
    s.extend(endContainerNode, eoffset)

    resolve()
  })

  handleSetRichAttr = (attr, value, manageHistoryInUndo = 'add') => {
    const { past, present } = this.state
    const { paras: prevParas, selection: prevSelection } = present

    const forwardsBoundary = getDirectionalSelection(prevSelection, 'forwards')
    const newParasAndBoundary = setParasAttr({ attr, value, paras: prevParas, boundary: forwardsBoundary })

    if (!newParasAndBoundary) return

    let newPast
    if (manageHistoryInUndo === 'add') {
      newPast = [ ...past, present ]
      if (newPast.length + 1 > HISTORY_CAPACITY) newPast.shift()
    } else if (manageHistoryInUndo === 'replaceLast') {
      newPast = past
    }

    const originalDirBoundary = getDirectionalSelection(newParasAndBoundary.boundary, prevSelection)

    this.setState({
      past: newPast,
      present: {
        paras: newParasAndBoundary.paras,
        selection: originalDirBoundary
      },
      future: []
    })
  }

  // ---------selection----------
  // selectionchange gets fired when inputing, selecting and manually setting `Selection`
  handleSelectionChange = e => {
    if (!this.isInputtingComposition) {
      const selection = this.getSelection()
      this.setSelection(selection)
      this.recordlastFocusStyle()
    }
  }

  getSelection = () => {
    const anchorPosition = getSelectionBoundaryPosition('anchor')
    const focusPosition = getSelectionBoundaryPosition('focus')

    return {
      start: anchorPosition,
      end: focusPosition
    }
  }

  setSelection = selection => {
    this.setState({
      ...this.state,
      present: {
        ...this.state.present,
        selection: selection
      }
    })
  }

  recordlastFocusStyle = () => {
    const s = window.getSelection()
    let focusSpan

    if (s.focusNode.nodeName === 'SPAN') {
      focusSpan = s.focusNode
    } else if (s.focusNode.nodeName === '#text') {
      focusSpan = s.focusNode.parentNode
    } else if (s.focusNode.nodeName === 'P') { // empty last p, select all in safari
      focusSpan = s.focusNode.childNodes[0]
    } else {
      return this.lastFocusStyle = {
        paraSpacing: 0,
        child: {}
      }
    }

    const focusP = focusSpan.parentNode
    const focusPi = getIndexAsChild(focusP)
    const focusSi = getIndexAsChild(focusSpan)
    const { paras } = this.getPresentState()
    this.lastFocusStyle = {
      paraSpacing: paras[focusPi].paraSpacing,
      child: {
        ...paras[focusPi].children[focusSi],
        text: undefined,
      }
    }
  }

  popSelectionChange = () => {
    this.props.onSelectionChange && this.props.onSelectionChange(this.getPresentState())
  }

  // ------------input-------------
  handleInput = e => {
    if (!this.isInputtingComposition) {
      const content = genParasFromHTML(e.target, this.lastFocusStyle)
      const selection = this.getSelection()
      this.setParasAndSelection(content, selection)
    }
  }

  handleCompositionStart = e => {
    this.toggleCompositionFlag()
  }

  handleCompositionEnd = e => {
    this.toggleCompositionFlag()

    const content = genParasFromHTML(e.target, this.lastFocusStyle)
    const selection = this.getSelection()
    this.setParasAndSelection(content, selection)
  }

  toggleCompositionFlag = () => this.isInputtingComposition = !this.isInputtingComposition // for Chinese characters

  setParasAndSelection = (paras, selection) => {
    this.pushPresentState({ paras, selection }).then(this.popContentChange)
  }

  popContentChange = () => {
    this.props.onContentChange && this.props.onContentChange(this.getPresentState())
  }

  // ---------key handler----------
  handleKeyDown = e => {
    if (e.key === ' ') stopReactEventPropagation(e)

    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      // cmd/ctrl + a broke in firefox, so we handle select-all manually
      e.preventDefault()
      this.setSelection(getSelectionForSelectAll(this.getPresentState().paras))
    }

    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      return this.handleUndo()
    }
    if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      return this.handleRedo()
    }
  }

  // ---------history management-----------
  handleUndo = () => {
    const { past, present, future } = this.state
    if (past.length === 0) return

    const previous = past[past.length - 1]
    const newPast = past.slice(0, past.length - 1)
    const newFuture = [ present, ...future ]

    if (1 + newPast.length + newFuture.length > HISTORY_CAPACITY) newFuture.pop()
    this.setState({
      past: newPast,
      present: previous,
      future: newFuture
    })
  }

  handleRedo = () => {
    const { past, present, future } = this.state
    if (future.length === 0) return

    const next = future[0]
    const newFuture = future.slice(1)
    const newPast = [ ...past, present ]

    if (1 + newPast.length + newFuture.length > HISTORY_CAPACITY) newPast.shift()
    this.setState({
      past: newPast,
      present: next,
      future: newFuture
    })
  }

  // ----------clipboard handler-----------
  handleCopy = e => {
    const { paras, selection } = this.getPresentState()
    if (selectionIsCollapsed(selection)) return

    const forwardSelection = getDirectionalSelection(selection, 'forwards')

    const { HTML: copiedHTML, text: copiedText } = getHTML(paras, forwardSelection, true)
    e.clipboardData.setData('text/html', copiedHTML)
    e.clipboardData.setData('text/plain', copiedText)
    e.preventDefault()
  }

  handleCut = e => {
    const { paras, selection } = this.getPresentState()
    if (selectionIsCollapsed(selection)) return

    const forwardSelection = getDirectionalSelection(selection, 'forwards')

    const cutHTML = getHTML(paras, forwardSelection)
    e.clipboardData.setData('text/html', cutHTML)

    const { paras: newContent, selection: newSelection } = cutSelection(paras, forwardSelection)

    this.setParasAndSelection(newContent, newSelection)
    e.preventDefault()
  }

  handlePaste = e => {
    e.preventDefault()

    const { clipboard: { stripOutsidePastedStyle } } = configs

    const pastedHTMLData = e.clipboardData.getData('text/html').replace(/^<meta.*?>/, '')
    const pastedDataIsFromInside = isPastedDataFromInside(pastedHTMLData)

    stripOutsidePastedStyle && !pastedDataIsFromInside ?
      this.insertPastedAsPlainText(e)
      : this.insertPastedAsHTML(e)
  }

  insertPastedAsHTML = e => {
    const { paras, selection } = this.getPresentState()
    const forwardSelection = getDirectionalSelection(selection, 'forwards')

    const pastedHTMLData = e.clipboardData.getData('text/html').replace(/^<meta.*?>/, '')
    if (!pastedHTMLData) return

    const pastedHTML = parsePastedHTML(pastedHTMLData)
    const { paras: newContent, selection: newSelection } = insertHTMLContent(
      paras,
      pastedHTML,
      forwardSelection
    )

    this.setParasAndSelection(newContent, newSelection)
  }

  insertPastedAsPlainText = e => {
    const { paras, selection } = this.getPresentState()
    const forwardSelection = getDirectionalSelection(selection, 'forwards')

    const pastedText = e.clipboardData.getData('text/plain')
    const { paras: newContent, selection: newSelection } = insertTextContent(
      paras,
      pastedText,
      forwardSelection
    )

    this.setParasAndSelection(newContent, newSelection)
  }


  render() {
    const { paras } = this.getPresentState()

    return (
      <div
        contentEditable
        dangerouslySetInnerHTML={{ __html: getHTML(paras) }}
        ref={editor => this.$editor = editor}
        className={EDITOR_CLASS_NAME}
        style={this.props.style}
        onKeyDown={this.handleKeyDown}
        onCompositionStart={this.handleCompositionStart}
        onCompositionEnd={this.handleCompositionEnd}
        onInput={this.handleInput}
        onSelect={this.handleSelectionChange}
        onCopy={this.handleCopy}
        onCut={this.handleCut}
        onPaste={this.handlePaste}
      />
    )
  }
}

RichTextEditor.propTypes = {
  style: PropTypes.object,
  store: PropTypes.object,
  onSelectionChange: PropTypes.func,
  onContentChange: PropTypes.func,
  editorBridgeBuilder: PropTypes.func,
}
