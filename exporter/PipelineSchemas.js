/**
 * exporter/PipelineSchemas.js — Определение схем пайплайнов pl_terrace и pl_joist
 */

function getTerracePipelineDefinition() {
  return {
    external_code: "pl_terrace",
    code: "pl_terrace",
    slug: "terrace",
    name: {
      ru: "Конфигуратор террасного настила (ДПК) — OliverDeck",
      en: "Terrace Decking Configurator — OliverDeck"
    },
    is_active: true,
    sort_order: 10,
    ui_state: [],
    schema: {
      terraceBoard: {
        startClip: {
          label_key: { ru: "Стартовый кляймер", en: "Start Clip" },
          target_type: "product_type",
          target_code: "brackets",
          is_required: true,
          is_multiple: false
        },
        baseClip: {
          label_key: { ru: "Рядовой кляймер", en: "Base Clip" },
          target_type: "product_type",
          target_code: "brackets",
          is_required: true,
          is_multiple: false
        },
        corner: {
          label_key: { ru: "Уголок декоративный (периметр)", en: "Decorative Corner" },
          target_type: "product_type",
          target_code: "decorProducts",
          is_required: false,
          is_multiple: false
        },
        universalBoards: {
          label_key: { ru: "Универсальная доска (зашивка)", en: "Universal Board" },
          target_type: "product_type",
          target_code: "board",
          is_required: false,
          is_multiple: false
        },
        stepBoards: {
          label_key: { ru: "Ступени (периметр)", en: "Step Boards" },
          target_type: "product_type",
          target_code: "stepBoard",
          is_required: false,
          is_multiple: true
        }
      },
      board: {
        fixing: {
          label_key: { ru: "Крепление доски (саморез)", en: "Board Fastener" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: true,
          is_multiple: false
        }
      },
      stepBoard: {
        noseSize: {
          label_key: { ru: "Размер носика", en: "Nose Size" },
          target_type: "scalar",
          target_code: null,
          is_required: true,
          is_multiple: false
        }
      },
      brackets: {
        holes: {
          label_key: { ru: "Количество отверстий", en: "Holes" },
          target_type: "scalar",
          target_code: null,
          is_required: true,
          is_multiple: false
        }
      }
    }
  };
}

function getJoistPipelineDefinition() {
  return {
    external_code: "pl_joist",
    code: "pl_joist",
    slug: "joist",
    name: {
      ru: "Конфигуратор подсистемы и лаг (ДПК / Алюминий)",
      en: "Substructure and Joist Configurator"
    },
    is_active: true,
    sort_order: 30,
    ui_state: [],
    schema: {
      joist: {
        fixing: {
          label_key: { ru: "Крепление лаги (саморез)", en: "Joist Screw" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: true,
          is_multiple: false
        }
      }
    }
  };
}