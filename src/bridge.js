export const editorBridge = {
  getStore: () => {},
  setAttr: () => {}
}

const getStore = storeGetter => () => storeGetter()
const setAttr = attrSetter => (attr, value, manageHistoryInUndo) => attrSetter(attr, value, manageHistoryInUndo)

export const editorBridgeBuilder = (storeGetter, attrSetter) => {
  editorBridge.getStore = getStore(storeGetter)
  editorBridge.setRich = setAttr(attrSetter)
}
