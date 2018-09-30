import React from 'react'

import Editor from './Editor'
import { editorBridgeBuilder } from './bridge'


export default class RichTextEditor extends React.Component {
  render() {
    return <Editor {...this.props} editorBridgeBuilder={editorBridgeBuilder} />
  }
}


export { getRichTextAttr } from './utils/attr'
export { getHTML } from './utils/style'
export { 
  setParasAttr as setAttrForParas,
  checkIsAttrManagedInsideEditor
} from './utils/operation'

export { configureEditor } from './config'

export { editorBridge } from './bridge'
