/**
 * config/ColorOptions.js — Базовый реестр канонических цветов и HEX-кодов
 */

function getDefaultColorOptions() {
  return [
    { external_code: "opt_wenge", slug: "wenge", value: { ru: "Венге", en: "Wenge" }, param: "wenge", meta: { hex: "#3B2219" } },
    { external_code: "opt_oak", slug: "oak", value: { ru: "Дуб", en: "Oak" }, param: "oak", meta: { hex: "#C4A77D" } },
    { external_code: "opt_grey", slug: "grey", value: { ru: "Серый", en: "Grey" }, param: "grey", meta: { hex: "#808080" } },
    { external_code: "opt_graphite", slug: "graphite", value: { ru: "Графит", en: "Graphite" }, param: "graphite", meta: { hex: "#4A5568" } },
    { external_code: "opt_black_wood", slug: "black_wood", value: { ru: "Черное дерево", en: "Black Wood" }, param: "black_wood", meta: { hex: "#1A1A1A" } },
    { external_code: "opt_brown", slug: "brown", value: { ru: "Коричневый", en: "Brown" }, param: "brown", meta: { hex: "#654321" } },
    { external_code: "opt_dark_brown", slug: "dark_brown", value: { ru: "Темно-коричневый", en: "Dark Brown" }, param: "dark_brown", meta: { hex: "#3B2219" } },
    { external_code: "opt_natural", slug: "natural", value: { ru: "Натураль", en: "Natural" }, param: "natural", meta: { hex: "#C4A77D" } },
    { external_code: "opt_silver", slug: "silver", value: { ru: "Серебристый", en: "Silver" }, param: "silver", meta: { hex: "#C0C0C0" } },
    { external_code: "opt_white", slug: "white", value: { ru: "Белый", en: "White" }, param: "white", meta: { hex: "#F0EBE0" } },
    { external_code: "opt_chocolate", slug: "chocolate", value: { ru: "Шоколад", en: "Шоколад" }, param: "chocolate", meta: { hex: "#3B2219" } },
    { external_code: "opt_sand", slug: "sand", value: { ru: "Песочный", en: "Песочный" }, param: "sand", meta: { hex: "#A07855" } },
    { external_code: "opt_bronze", slug: "bronze", value: { ru: "Бронза", en: "Бронза" }, param: "bronze", meta: { hex: "#8B5A2B" } },
    { external_code: "opt_beige", slug: "beige", value: { ru: "Бежевый", en: "Бежевый" }, param: "beige", meta: { hex: "#C4A77D" } },
    { external_code: "opt_anthracite", slug: "anthracite", value: { ru: "Антрацит", en: "Антрацит" }, param: "anthracite", meta: { hex: "#2D3748" } },
    { external_code: "opt_terracotta", slug: "terracotta", value: { ru: "Терракот", en: "Терракот" }, param: "terracotta", meta: { hex: "#8C3B2B" } },
    { external_code: "opt_teak", slug: "teak", value: { ru: "Тик", en: "Тик" }, param: "teak", meta: { hex: "#B57C48" } }
  ];
}