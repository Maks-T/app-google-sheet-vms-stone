/**
 * exporter/SettingsExporter.js — Экспорт конфигурации настроек каналов и сущностей в import_settings.json
 */

function getStandardImportSettingsDefinition() {
  return {
    channels: {
      widget: {
        is_public_default: true
      },
      catalog: {
        is_public_default: true
      }
    },
    setting_schemas: {
      attribute: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_filterable",
          type: "boolean",
          label: { en: "Use as filter", ru: "Использовать как фильтр" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_collapsed",
          type: "boolean",
          label: { en: "Collapsed by default", ru: "Свернуть по умолчанию" },
          width: 1,
          default: false,
          is_system: true
        },
        {
          key: "filter_type",
          type: "select",
          label: { en: "Filter UI type", ru: "Вид фильтра" },
          width: 2,
          default: "checkbox",
          options: {
            color: { en: "Color swatches", ru: "Цветовые кружки" },
            range: { en: "Range slider", ru: "Диапазон (слайдер)" },
            select: { en: "Dropdown select", ru: "Выпадающий список (Select)" },
            checkbox: { en: "Checkboxes", ru: "Список чекбоксов" }
          },
          is_system: true
        }
      ],
      price_group: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        }
      ],
      complex_dictionary: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        }
      ],
      family: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "show_in_menu",
          type: "boolean",
          label: { en: "Show in menu", ru: "Показывать в меню" },
          width: 2,
          default: true,
          is_system: true
        }
      ],
      category: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "show_in_menu",
          type: "boolean",
          label: { en: "Show in menu", ru: "Показывать в меню" },
          width: 1,
          default: true,
          is_system: true
        }
      ],
      product_type: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        }
      ],
      product: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        }
      ],
      product_variant: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        }
      ],
      attribute_option: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        }
      ],
      price_type: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        }
      ],
      currency: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        }
      ],
      warehouse: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: false,
          is_system: true
        }
      ],
      stock: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: false,
          is_system: true
        }
      ],
      pipeline: [
        {
          key: "is_public",
          type: "boolean",
          label: { en: "Published", ru: "Опубликовано" },
          width: 1,
          default: true,
          is_system: true
        },
        {
          key: "is_settings_public",
          type: "boolean",
          label: { en: "Settings are public", ru: "Настройки публичны" },
          width: 1,
          default: true,
          is_system: true
        }
      ]
    }
  };
}

function exportImportSettingsJson() {
  const settingsData = getStandardImportSettingsDefinition();
  const jsonString = JSON.stringify(settingsData, null, 4);

  const htmlOutput = HtmlService.createHtmlOutput(
    `<div style="font-family:sans-serif;padding:5px;">` +
    `<p style="margin:0 0 10px 0;font-size:13px;">` +
    `Сформирован эталонный файл <b>import_settings.json</b> для платформы VMS-NC.<br>` +
    `Каналы: <b>widget, catalog</b> | Схем сущностей: <b>${Object.keys(settingsData.setting_schemas).length}</b>` +
    `</p>` +
    `<textarea style="width:100%;height:380px;font-family:monospace;font-size:11px;padding:8px;" readonly onClick="this.select();">${jsonString}</textarea>` +
    `</div>`
  ).setWidth(780).setHeight(500);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Экспорт import_settings.json (VMS-NC)');
}