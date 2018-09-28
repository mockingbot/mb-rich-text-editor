import { DEFAULT_STYLE } from './constant'


export const configs = {
  defaultStyle: DEFAULT_STYLE,
  getStyleStr: {},
  clipboard: {
    stripOutsidePastedStyle: true
  },
}

export const configureEditor = customConfigs => {
  Object.entries(customConfigs).forEach(([ field, fieldConfigs ]) => {
    configs[field] = { ...configs[field], ...fieldConfigs }
  })
}
