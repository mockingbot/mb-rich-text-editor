# mb-rich-text-editor

>

[![NPM](https://img.shields.io/npm/v/mb-rich-text-editor.svg)](https://www.npmjs.com/package/mb-rich-text-editor) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Why build this editor?
There are so many rich text editor for js, like [Quill](https://quilljs.com/), [Draft.js](https://draftjs.org/), which have already been widely used, so why do we need another?

If you have used Sketch, you can see the text editing inside it cares a little *different* from the editors we mentioned before. In Sketch, text is more like **a layer** but not **an article**, each text has its **accurate** value for font size, font weight, typeface, and spacings for character, line, paragraph. Sketch styles text as designers would do it, but not common users who only need 'h1' as a set of rules to style a header, and do not care much about what exactly the rules are, like the font size, font family, typeface, and so on. So if your app faces designers who treat text more precisely, and want more control over the style of it, you will find it is rough for the editors to handle that, you can't even specify a font size. That is why this editor is created.

## What are the differences?
As I mentioned in previous paragraph, this editor aims at people who need a similar text editor in Sketch  but not in blog or comment system, so it focus different aspects. You can check the following list to see if you should choose this editor over others:

- [x] prefers to specify exact values for styling text (no h1s, h2s here to style headers for you)
- [x] treats text like layers but not articles (focus on what text itself looks like, no concepts like 'ordered list' here)
- [x] text is text, no links or images can be inserted (if you consider text as layers, this one is not hard to follow)

or you can [try it here online]() to check all features. You should feel comfortable playing it if you have experience with Sketch. Also it's not hard to notice that you can input value for attributes when you want to style a selected area, for selection is safe inside the editor, it won't get lost when you focus on other inputs ;)

## Install

```bash
yarn install --save mb-rich-text-editor
```

## Usage

#### 1. the editor component

This package will export a default React component, which you can simply import where you expect it.

``` jsx
import React, { Component } from 'react'

import Editor from 'mb-rich-text-editor'

class Example extends Component {
  render () {
    return (
      <Editor
        store={{ paras }}
        onSelectionChange={this.handleSelectionChange}
        onContentChange={this.handleContentChange}
      />
    )
  }
}
```

Actually, it has only one required prop: `store`. `store` is an object that represents the state of the editor, you need to pass an initial state here, but editor will take care of that once it mount. It's structured as:
``` javascript
{
  paras: [
  // the style and content of the text inside
  // each object inside represents a paragraph
    {   
      paraSpacing: 0,   // spacing between paragraphs
      children: [
        // each object inside represents a span inside the paragraph
        {  
          text: 'hello world',
          fontFamily: 'Courier New',
          fontWeight: 'regular',
          fontSize: 14,
          color: '#333333',
          letterSpacing: 0,
          textDecoration: 'line-through',
          fontStyle: 'italic',
        }
      ]
    }
  ],
  selection: {
  // selection inside the editor,
  // if omitted, default to selecting the whole content
    start: [   // selection start point
      0,    // which paragraph it's in
      0,    // which span it's in
      0,    // it's offset in span
    ],
    end: [   // selection end point
      0,
      0,
      0,
    ],
  }
}
```

some of the styles in `paras` can be omitted if a default style is specified(see how to [specify your default style](#3-configure-the-editor)).

When the content inside the editor changes, `onContentChange` gets called with the `store` object mentioned before.

When user manually select text or the content inside the editor changes, `onSelectionChange` gets called with the `store` object.

#### 2. rich editing

You may have many buttons, selectors, inputs to manage style, just import `editorBridge` to do that. Don't worry about the selected area that you want to apply your style, editor will remember that for you.

``` javascript
import { editorBridge } from 'mb-rich-text-editor'

editorBridge.setAttr(attr, value)
```

for example, if you want to set a selected area's font size to 53px, just type:
``` javascript
editorBridge.setAttr('fontSize', 53)
```

#### 3. configure the editor
Generally an app has only one editor get focus at a time, and all editors behaves similar in one app. So you can configure how editors act like in your entry point.

``` javascript
// your entry point
import { configureEditor } from 'mb-rich-text-editor'

const DEFAULT_STYLE = {
  fontFamily: 'Arial',
  fontWeight: 'regular',
  fontSize: 14,
  color: '#101010',
  fontStyle: 'normal',
  textDecoration: 'none',
  letterSpacing: 0
}

configureEditor({
  defaultStyle: DEFAULT_STYLE,
  // default style for non-styled text
  clipboard: {
    stripOutsidePastedStyle: false
    // defaults to be true, means style of pasted content from outside will be stripped
  },
})
```

#### 4. util functions
The package will also export some util functions:
* `editorBridge`
  it contains 2 method to interact with the state of the editor:
  * `editorBridge.getStore`: get current state of the editor
  * `editorBridge.setAttr`: for rich editing
* `getHTML`: get HTML code as string for giving paras and selections
* `getRichTextAttr`: get style for giving paras and selections
* `setAttrForParas`: get new paras for setting attr entirely, often useful for set attrs of the content outside editing

## Bugs and issues

Reporting bugs and starting issues will always be appreciated.


## License

MIT © [Xdudu](https://github.com/Xdudu)
