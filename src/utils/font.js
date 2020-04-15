import { configs } from '../config'

const FONT_WEIGHT_VALUE_MAP = { regular: 400, light: 300, bold: 700 }

export const getFontWeightNumDepandOnBoldType = (weightStr, boldType, fontFamily) => {
  if (configs.getStyleStr.fontWeightNumber) {
    return configs.getStyleStr.fontWeightNumber(weightStr, boldType, fontFamily)
  } else {
    const weightNum = FONT_WEIGHT_VALUE_MAP[ weightStr ]
    return Number(boldType) ? 700 : weightNum
  }
}

export const getFontWeightStrDepandOnBoldType = (styleWeightNum, lastWeightStr, boldType) => {
  const styleWeightStr = getFontWeightStr(styleWeightNum)
  return Number(boldType) ? lastWeightStr : styleWeightStr
}

export const getFontWeightStr = weight => {
  if (FONT_WEIGHT_VALUE_MAP[ weight ]) return weight

  return Object.keys(FONT_WEIGHT_VALUE_MAP).find(
    weightStr => String(FONT_WEIGHT_VALUE_MAP[ weightStr ]) === String(weight)
  ) || 'regular'
}
