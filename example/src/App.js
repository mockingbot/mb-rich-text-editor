import React, { Component } from 'react'

import Editor, { editorBridge } from 'mb-rich-text-editor'

const initialText = 'Tell us a fairy tale ;>'
const text = {
  paras: [{
    paraSpacing: 5,
    children: [{
      text: initialText,
      fontSize: 20,
      fontFamily: 'Courier New',
      color: '#333'
    }]
  }],
  selection: {
    start: [0,0,0],
    end: [0,0,0],
  }
}

export default class App extends Component {
  render() {
    return (
      <div className="">
        <Editor
          store={text}
        />
        <button onClick={() => editorBridge.setAttr('color', '#999')}></button>
        <button onClick={() => console.log(editorBridge.getStore())}></button>
      </div>
    )
  }
}
