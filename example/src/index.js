import React from 'react'
import ReactDOM from 'react-dom'

import { configureEditor } from 'mb-rich-text-editor'

import './index.css'
import App from './App'
import { DEFAULT_STYLE } from './constant'

configureEditor({
  defaultStyle: DEFAULT_STYLE,
  clipboard: {
    stripOutsidePastedStyle: false
  },
})

ReactDOM.render(<App />, document.getElementById('root'))
