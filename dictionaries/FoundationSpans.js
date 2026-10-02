/**
 * dictionaries/FoundationSpans.js — Матрица допустимых пролетов подсистемы основания (foundation_spans)
 */

function getFoundationSpansDictionary() {
  const spans = [
    { slug: "tube_80_80_3", name: "Труба профильная 80х80х3", profile_type: "beam", max_span_mm: 2500, max_overhang_mm: 400, step_mm: 1500 },
    { slug: "tube_60_40_2", name: "Труба профильная 60х40х2", profile_type: "beam", max_span_mm: 1800, max_overhang_mm: 300, step_mm: 1200 },
    { slug: "tube_40_40_2", name: "Труба профильная 40х40х2", profile_type: "beam", max_span_mm: 1500, max_overhang_mm: 250, step_mm: 1000 },
    { slug: "tube_40_20_2", name: "Труба профильная 40х20х2", profile_type: "beam", max_span_mm: 1000, max_overhang_mm: 200, step_mm: 800 },
    { slug: "joist_alu_nesushchaya", name: "Лага алюминиевая несущая", profile_type: "joist", max_span_mm: 1000, max_overhang_mm: 150, step_mm: 400 },
    { slug: "joist_dpk_standart", name: "Лага ДПК стандартная", profile_type: "joist", max_span_mm: 400, max_overhang_mm: 50, step_mm: 350 }
  ];

  return {
    external_code: "dict_foundation_spans",
    code: "foundation_spans",
    name: {
      ru: "Калькулятор: Матрица пролетов основания",
      en: "Calculator: Foundation Spans Matrix"
    },
    meta_schema: [
      { key: "profile_type", type: "text", label: { ru: "Тип профиля (beam/joist)", en: "Profile Type (beam/joist)" } },
      { key: "max_span_mm", type: "number", label: { ru: "Макс. пролет опор, мм", en: "Max Support Span, mm" } },
      { key: "max_overhang_mm", type: "number", label: { ru: "Макс. консольный свес, мм", en: "Max Overhang, mm" } },
      { key: "step_mm", type: "number", label: { ru: "Рекомендуемый шаг укладки, мм", en: "Recommended Step, mm" } }
    ],
    is_active: true,
    records: spans.map((item, idx) => ({
      external_code: `rec_span_${item.slug}`,
      slug: item.slug,
      name: { ru: item.name, en: item.name },
      meta: {
        profile_type: item.profile_type,
        max_span_mm: item.max_span_mm,
        max_overhang_mm: item.max_overhang_mm,
        step_mm: item.step_mm
      },
      sort_order: (idx + 1) * 10,
      is_active: true
    }))
  };
}