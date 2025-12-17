/**
 * Нормализует название цвета для поиска SVG-иконки
 * Переводит названия цветов из разных языков на английский
 *
 * Поддерживаемые цвета: beige-1, gray, graphite, ivory, beige, pink, blue, green
 */

// Маппинг переводов цветов на английский
const colorTranslations: Record<string, string> = {
  // Blue / Blau / Bleu / Azzurro / Azul / etc.
  blue: "blue",
  blau: "blue", // немецкий
  bleu: "blue", // французский
  azzurro: "blue", // итальянский
  azul: "blue", // испанский
  blå: "blue", // шведский, норвежский, датский
  blauw: "blue", // голландский
  sininen: "blue", // финский
  kék: "blue", // венгерский
  modrý: "blue", // чешский, словацкий
  niebieski: "blue", // польский
  синий: "blue", // русский, украинский
  синьо: "blue", // болгарский
  plavo: "blue", // хорватский, сербский
  modra: "blue", // словенский
  μπλε: "blue", // греческий
  כחול: "blue", // иврит
  青: "blue", // японский

  // Green / Grün / Vert / Verde / etc.
  green: "green",
  grün: "green", // немецкий
  grun: "green", // немецкий (без умляут)
  vert: "green", // французский
  verde: "green", // итальянский, испанский, португальский
  grøn: "green", // датский, норвежский
  grön: "green", // шведский
  groen: "green", // голландский
  vihreä: "green", // финский
  zöld: "green", // венгерский
  zelený: "green", // чешский, словацкий
  zielony: "green", // польский
  зелёный: "green", // русский
  зелений: "green", // украинский
  зелен: "green", // болгарский
  zeleno: "green", // хорватский, сербский
  zelena: "green", // словенский
  πράσινο: "green", // греческий
  ירוק: "green", // иврит
  緑: "green", // японский

  // Gray / Grau / Gris / Grigio / etc.
  gray: "gray",
  grey: "gray", // британский вариант
  grau: "gray", // немецкий
  gris: "gray", // французский, испанский
  grigio: "gray", // итальянский
  cinza: "gray", // португальский
  grå: "gray", // шведский, норвежский, датский
  grijs: "gray", // голландский
  harmaa: "gray", // финский
  szürke: "gray", // венгерский
  šedý: "gray", // чешский, словацкий
  szary: "gray", // польский
  серый: "gray", // русский
  сірий: "gray", // украинский
  сив: "gray", // болгарский
  sivo: "gray", // хорватский, сербский
  siva: "gray", // словенский
  γκρι: "gray", // греческий
  אפור: "gray", // иврит
  グレー: "gray", // японский

  // Pink / Rosa / Rose / Rosa / etc.
  pink: "pink",
  rosa: "pink", // немецкий, итальянский, испанский, португальский, шведский, норвежский, датский
  rose: "pink", // французский
  roze: "pink", // голландский
  vaaleanpunainen: "pink", // финский
  rózsaszín: "pink", // венгерский
  růžová: "pink", // чешский, словацкий
  różowy: "pink", // польский
  розовый: "pink", // русский
  рожевий: "pink", // украинский
  розово: "pink", // болгарский
  ružičasto: "pink", // хорватский, сербский
  roza: "pink", // словенский
  ροζ: "pink", // греческий
  ורוד: "pink", // иврит
  ピンク: "pink", // японский

  // Beige / Beige / Beige / etc.
  beige: "beige",
  biege: "beige", // опечатка
  беж: "beige", // русский, сербский, хорватский, словенский
  бежевий: "beige", // украинский
  бежов: "beige", // болгарский
  ベージュ: "beige", // японский

  beige1: "beige-1",
  biege1: "beige-1", // опечатка
  беж1: "beige-1", // русский, сербский, хорватский, словенский
  бежевий1: "beige-1", // украинский
  бежов1: "beige-1", // болгарский
  ベージュ1: "beige-1", // японский

  // Ivory / Elfenbein / Ivoire / Avorio / etc.
  ivory: "ivory",
  elfenbein: "ivory", // немецкий
  ivoire: "ivory", // французский
  avorio: "ivory", // итальянский
  marfil: "ivory", // испанский
  elfenben: "ivory", // датский, норвежский, шведский
  ivoor: "ivory", // голландский
  norsunluu: "ivory", // финский
  elefántcsont: "ivory", // венгерский
  slonovina: "ivory", // чешский, словацкий, словенский
  kość: "ivory", // польский
  слоновая: "ivory", // русский
  слонова: "ivory", // украинский, болгарский
  slonovača: "ivory", // хорватский, сербский
  ελεφαντόδοντο: "ivory", // греческий
  שנהב: "ivory", // иврит
  アイボリー: "ivory", // японский

  // Graphite / Graphit / Graphite / etc.
  graphite: "graphite",
  graphit: "graphite", // немецкий
  grafit: "graphite", // чешский, словацкий, польский, венгерский, шведский, норвежский, датский, хорватский, сербский, словенский
  grafiet: "graphite", // голландский
  grafiitti: "graphite", // финский
  графит: "graphite", // русский, украинский, болгарский
  γραφίτης: "graphite", // греческий
  גרפיט: "graphite", // иврит
  グラファイト: "graphite", // японский
};

/**
 * Нормализует название цвета для поиска SVG-иконки
 * Переводит названия цветов из разных языков на английский
 *
 * @param value - Название цвета на любом языке
 * @returns Нормализованное название цвета на английском (для поиска SVG файла)
 *
 * @example
 * normalizeColorForAsset("Grün") // returns "green"
 * normalizeColorForAsset("blau") // returns "blue"
 * normalizeColorForAsset("rosa") // returns "pink"
 */
export function normalizeColorForAsset(value: string): string {
  if (!value) return value;

  const lower = value.toLowerCase().trim();

  // Проверяем точное совпадение в маппинге
  if (colorTranslations[lower]) {
    return colorTranslations[lower];
  }

  // Если не найдено в маппинге, возвращаем исходное значение в нижнем регистре
  // (на случай, если цвет уже на английском или это нестандартное название)
  return lower;
}
