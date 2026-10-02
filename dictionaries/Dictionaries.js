/**
 * dictionaries/Dictionaries.js — Агрегатор сложных многомерных справочников VMS-NC
 */

function getComplexDictionariesDefinition() {
  return [
    getCalculatorLayoutsDictionary(),
    getCalculatorSettingsDictionary(),
    getFoundationSpansDictionary()
  ];
}