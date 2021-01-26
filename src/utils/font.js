const FONT_WEIGHT_VALUE_MAP = { thin: 100, extraLight: 200, light: 300, regular: 400, medium: 500, semiBold: 600, bold: 700, extraBold: 800, black: 900 }

export const getFontWeightNumDepandOnBoldType = (weightStr, boldType) => {
  const weightNum = FONT_WEIGHT_VALUE_MAP[ weightStr ]
  return Number(boldType) ? 700 : weightNum
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
