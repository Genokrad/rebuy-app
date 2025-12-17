/**
 * Нормализует имена опций варианта (например, Color / Farbe / Couleur / Colore / Kleur)
 * к единым внутренним ключам: "Color", "Cushion" и т.д.
 *
 * Это позволяет в компоненте работать с опциями независимо от языка магазина.
 */

// Карта локализованных имён опций → каноническое имя
const optionNameTranslations: Record<string, string> = {
  // Цвет (Color)
  color: "Color",
  colour: "Color", // en-GB
  farbe: "Color", // de-DE, de-AT, de-CH, de-BE, de-LI, de-LU, de-NL
  couleur: "Color", // fr-FR, fr-CA, fr-BE, fr-LU, fr-CH
  colore: "Color", // it-IT
  coloris: "Color", // FR вариант
  kleur: "Color", // nl-NL, nl-BE
  kolor: "Color", // pl-PL
  barva: "Color", // cs-CZ, sk-SK, sl-SI
  farba: "Color", // sk-SK variant
  Farbe: "Color", // safety if Shopify sends with capital (we still lowercase)

  // Подушка / наполнитель (Cushion)
  cushion: "Cushion",
  pillow: "Cushion",
  kissen: "Cushion", // de-*
  coussin: "Cushion", // fr-*
  cuscino: "Cushion", // it-IT
  cojín: "Cushion", // es-ES
  cojines: "Cushion",
  poduszka: "Cushion", // pl-PL
  poduška: "Cushion", // cs/sk variants
  подушка: "Cushion", // uk-UA / ru-RU
};

/**
 * Приводит имя опции к каноническому виду (например, "Farbe" → "Color").
 *
 * @param name Имя опции из Shopify (любой язык)
 * @returns "Color", "Cushion" или исходное имя, если маппинга нет
 */
export function normalizeOptionName(name: string): string {
  if (!name) return name;

  const lower = name.toLowerCase().trim();

  // Сначала пробуем по lowercase
  if (optionNameTranslations[lower]) {
    return optionNameTranslations[lower];
  }

  // Если нет в словаре — возвращаем исходное имя как есть
  return name;
}
