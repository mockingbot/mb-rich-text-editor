import React from 'react'

import Editor from './Editor'
import { editorBridgeBuilder } from './bridge'


export default class RichTextEditor extends React.Component {
  render() {
    return <Editor {...this.props} editorBridgeBuilder={editorBridgeBuilder} />
  }
}


export { getHTML } from './utils/style'

export { configureEditor } from './config'

export { editorBridge } from './bridge'
