/**
 * dictionaries/CalculatorSettings.js — Умный справочник общих настроек калькулятора (calculator_settings)
 */

function getCalculatorSettingsDictionary() {
  const settingsList = [
    { slug: "minSizeTerrace", value: 200, sort: 1 },
    { slug: "maxSizeTerrace", value: 100000, sort: 2 },
    { slug: "minHeightTerrace", value: 100, sort: 3 },
    { slug: "maxHeightTerrace", value: 2000, sort: 4 },
    { slug: "minTurnHeightTerrace", value: 0, sort: 5 },
    { slug: "minTurnWidthTerrace", value: 0, sort: 6 },
    { slug: "minTrapezeTopBaseTerrace", value: 50, sort: 7 },
    { slug: "joistMinRemain", value: 200, sort: 8 },
    { slug: "joistStep", value: 300, sort: 9 },
    { slug: "joistOverhang", value: 50, sort: 10 },
    { slug: "joistOverhangStepBoard", value: 25, sort: 11 },
    { slug: "cornerMinRemain", value: 200, sort: 12 },
    { slug: "joistStepSewing", value: 600, sort: 13 },
    { slug: "fenceMinHeight", value: 500, sort: 14 },
    { slug: "fenceMaxHeight", value: 1500, sort: 15 },
    { slug: "fenceMinGridSize", value: 50, sort: 16 },
    { slug: "fenceMaxGridSize", value: 200, sort: 17 },
    { slug: "targetDeviation", value: 0.002, sort: 18 },
    { slug: "pedestalMaxStep", value: 500, sort: 19 },
    { slug: "pedestalEdgeOffset", value: 80, sort: 20 },
    { slug: "rebarMaxStep", value: 800, sort: 21 },
    { slug: "rebarEdgeOffset", value: 80, sort: 22 },
    { slug: "rebarEmbedDepth", value: 150, sort: 23 },
    { slug: "rebarCutMargin", value: 100, sort: 24 },
    { slug: "pileEdgeOffset", value: 200, sort: 25 },
    { slug: "minTerraceHeightPile", value: 250, sort: 26 }
  ];

  return {
    external_code: "dict_calculator_settings",
    code: "calculator_settings",
    name: {
      ru: "Калькулятор: Общие настройки",
      en: "Calculator: Global Settings"
    },
    meta_schema: [
      { key: "value", type: "number", label: { ru: "Значение", en: "Value" } }
    ],
    is_active: true,
    records: settingsList.map(item => ({
      external_code: `rec_calc_setting_${item.slug}`,
      slug: item.slug,
      name: { ru: item.slug, en: item.slug },
      meta: { value: item.value },
      sort_order: item.sort,
      is_active: true
    }))
  };
}