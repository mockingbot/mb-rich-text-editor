export const editorBridge = {
  getStore: () => {},
  setAttr: () => {}
}

const getStore = storeGetter => () => storeGetter()
const setAttr = attrSetter => (attr, value) => attrSetter(attr, value)

export const editorBridgeBuilder = (storeGetter, attrSetter) => {
  editorBridge.getStore = getStore(storeGetter)
  editorBridge.setRich = setAttr(attrSetter)
}
