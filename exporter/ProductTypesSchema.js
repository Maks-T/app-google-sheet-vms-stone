/**
 * exporter/ProductTypesSchema.js — Стандартные схемы типов товаров платформы VMS-NC
 */

function getStandardProductTypesDefinition() {
  return [
    {
      external_code: "type_terraceBoard",
      family_external_code: "fam_decking_systems",
      code: "terraceBoard",
      name: { ru: "Террасная доска", en: "Terrace Board" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false },
        { code: "height_mm", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "color", is_variant_only: true }
      ]
    },
    {
      external_code: "type_board",
      family_external_code: "fam_decking_systems",
      code: "board",
      name: { ru: "Доска универсальная (зашивка)", en: "Universal Board" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false },
        { code: "height_mm", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "color", is_variant_only: true }
      ]
    },
    {
      external_code: "type_stepBoard",
      family_external_code: "fam_decking_systems",
      code: "stepBoard",
      name: { ru: "Ступень", en: "Step Board" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false },
        { code: "height_mm", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "color", is_variant_only: true }
      ]
    },
    {
      external_code: "type_brackets",
      family_external_code: "fam_hardware_accessories",
      code: "brackets",
      name: { ru: "Кляймеры и кронштейны", en: "Clips and Brackets" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false }
      ]
    },
    {
      external_code: "type_fasteners",
      family_external_code: "fam_hardware_accessories",
      code: "fasteners",
      name: { ru: "Крепеж и саморезы", en: "Fasteners and Screws" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false }
      ]
    },
    {
      external_code: "type_decorProducts",
      family_external_code: "fam_hardware_accessories",
      code: "decorProducts",
      name: { ru: "Декоративные изделия (уголки)", en: "Decorative Corners" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "height_mm", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false }
      ]
    },
    {
      external_code: "type_joist",
      family_external_code: "fam_decking_systems",
      code: "joist",
      name: { ru: "Лага монтажная (подконструкция)", en: "Substructure Joist" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false },
        { code: "height_mm", is_variant_only: false }
      ]
    },
    {
      external_code: "type_adjustable_pedestal",
      family_external_code: "fam_decking_systems",
      code: "adjustable_pedestal",
      name: { ru: "Регулируемые винтовые опоры", en: "Adjustable Pedestals" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "height_min", is_variant_only: false },
        { code: "height_max", is_variant_only: false },
        { code: "max_load_kg", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "color", is_variant_only: true }
      ]
    },
    {
      external_code: "type_foundation_beam",
      family_external_code: "fam_decking_systems",
      code: "foundation_beam",
      name: { ru: "Балка обвязки металлокаркаса", en: "Foundation Beam" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "height_mm", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "profile_width_mm", is_variant_only: false },
        { code: "profile_height_mm", is_variant_only: false },
        { code: "wall_thickness_mm", is_variant_only: false },
        { code: "material", is_variant_only: false },
        { code: "source_url", is_variant_only: false }
      ]
    },
    {
      external_code: "type_rebar",
      family_external_code: "fam_decking_systems",
      code: "rebar",
      name: { ru: "Арматура монтажная", en: "Rebar" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "diameter_mm", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "material", is_variant_only: false }
      ]
    },
    {
      external_code: "type_screw_pile",
      family_external_code: "fam_decking_systems",
      code: "screw_pile",
      name: { ru: "Винтовые сваи", en: "Screw Piles" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "diameter_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "blade_diameter_mm", is_variant_only: false },
        { code: "wall_thickness_mm", is_variant_only: false },
        { code: "has_head", is_variant_only: false },
        { code: "material", is_variant_only: false }
      ]
    },
    {
      external_code: "type_pile_cap",
      family_external_code: "fam_hardware_accessories",
      code: "pile_cap",
      name: { ru: "Оголовки свай", en: "Pile Caps" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false }
      ]
    }
  ];
}