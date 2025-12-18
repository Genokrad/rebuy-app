import { useState, useMemo, useCallback } from "react";
import type { ProductCardProps, VariantOption } from "../../types";
import styles from "./ProductCard.module.css";
import AddButton from "./addButton/AddBuuton";
import ProductImage from "./productImage/ProductImage";
import VariantSelector from "./variantSelector/VariantSelector";
import { ProductPrice } from "./ProductPrice";
import { normalizeColorForAsset } from "../../utils/colorNormalizer";
import { normalizeOptionName } from "../../utils/optionNormalizer";

export function ProductCard({
  product,
  currentMarketplace,
  shopId,
  discount = 0,
  productIndex,
  onToggle,
  onSelectNewVariant,
  onChangingTheOption,
  addText,
  addedText,
  buttonBackgroundColor,
  addedButtonBackgroundColor,
}: ProductCardProps) {
  // console.log(productIndex, productIndex, "<<<<<====== productIndex");
  // Все товары изначально должны быть added
  const [isAdded, setIsAdded] = useState(true);

  // Строим ссылку на продукт по handle (без лишнего setState)
  const redirectUrl = useMemo(() => {
    const handle = product.variants[0]?.variantDetails?.product?.handle;
    if (!handle) return "";
    try {
      const current = window.location.href;
      const url = new URL(current);
      const base = `${url.origin}${url.pathname.replace(/\/[^/]*$/, "/")}`;
      // pathname уже заканчивается на '/', поэтому не добавляем двойной слэш
      return `${base}${handle}`;
    } catch {
      return "";
    }
  }, [product.variants]);

  // console.log("redirectUrl ===>>>>>", redirectUrl);

  // console.log("hasColorOption ===>>>>>", hasColorOption);
  // console.log(
  //   "product ===>>>>>",
  //   product.variants[0]?.variantDetails?.product?.handle,
  // );

  // const current = window.location.href;

  // const url = new URL(current);
  // const base = `${url.origin}${url.pathname.replace(/\/[^/]*$/, "/")}`;

  // console.log("Base URL ===>>>>>", base);

  // Вспомогательные функции для проверки опций
  // Используем normalizeOptionName, чтобы поддерживать любые языки (Farbe, Couleur, Colore и т.д.)
  const isColorOption = (optName: string) =>
    normalizeOptionName(optName) === "Color";
  const isCushionOption = (optName: string) =>
    normalizeOptionName(optName) === "Cushion";

  // Определяем, какие опции доступны (Color/Farbe и/или Cushion/Kissen)
  const hasColorOption = product.variants.some((v) =>
    v.selectedOptions?.some((opt: { name: string; value: string }) =>
      isColorOption(opt.name),
    ),
  );
  const hasCushionOption = product.variants.some((v) =>
    v.selectedOptions?.some((opt: { name: string; value: string }) =>
      isCushionOption(opt.name),
    ),
  );

  // Вычисляем начальные значения из первого варианта
  const initialColor = useMemo(() => {
    if (!hasColorOption || !product.variants[0]?.selectedOptions) return null;
    const colorOpt = product.variants[0].selectedOptions.find(
      (opt: { name: string; value: string }) => isColorOption(opt.name),
    );
    return colorOpt?.value || null;
  }, [product.variants, hasColorOption]);

  const initialCushion = useMemo(() => {
    if (!hasCushionOption || !product.variants[0]?.selectedOptions) return null;
    const cushionOpt = product.variants[0].selectedOptions.find(
      (opt: { name: string; value: string }) => isCushionOption(opt.name),
    );
    return cushionOpt?.value || null;
  }, [product.variants, hasCushionOption]);

  // Состояния для выбранных значений опций (используем вычисленные начальные значения)
  const [selectedColor, setSelectedColor] = useState<string | null>(
    initialColor,
  );
  const [selectedCushion, setSelectedCushion] = useState<string | null>(
    initialCushion,
  );

  // Находим вариант, который соответствует выбранным опциям
  const findVariantByOptions = useCallback(
    (color: string | null, cushion: string | null) => {
      return product.variants.find((variant) => {
        if (!variant.selectedOptions) return false;

        const colorMatch =
          !hasColorOption || !color
            ? true
            : variant.selectedOptions.some(
                (opt: { name: string; value: string }) =>
                  isColorOption(opt.name) && opt.value === color,
              );

        const cushionMatch =
          !hasCushionOption || !cushion
            ? true
            : variant.selectedOptions.some(
                (opt: { name: string; value: string }) =>
                  isCushionOption(opt.name) && opt.value === cushion,
              );

        return colorMatch && cushionMatch;
      });
    },
    [product.variants, hasColorOption, hasCushionOption],
  );

  // Вычисляем выбранный вариант на основе выбранных опций
  const selectedVariant = useMemo(() => {
    // Если не нашли вариант по опциям (например, нет selectedOptions), возвращаем первый вариант
    return (
      findVariantByOptions(selectedColor, selectedCushion) ||
      product.variants[0] ||
      null
    );
  }, [findVariantByOptions, selectedColor, selectedCushion, product.variants]);

  // console.log(selectedVariant, productIndex, "<<<<<====== selectedVariant");

  // Получаем изображение продукта (из выбранного варианта или из первого)
  const productImage = useMemo(() => {
    return (
      selectedVariant?.variantDetails?.image?.url ||
      selectedVariant?.variantDetails?.product?.featuredImage?.url ||
      product.variants[0]?.variantDetails?.image?.url ||
      product.variants[0]?.variantDetails?.product?.featuredImage?.url ||
      ""
    );
  }, [selectedVariant, product.variants]);

  // Получаем окончательную цену для выбранного варианта
  // Всегда используем окончательную цену из marketsPrice для текущего маркетплейса
  const { price, compareAtPrice, currencyCode } = useMemo(() => {
    console.log("selectedVariant ===>>>>>", selectedVariant);
    if (!selectedVariant?.variantDetails) {
      return { price: "", compareAtPrice: "", currencyCode: "" };
    }

    // Ищем цену в marketsPrice для текущего маркетплейса
    let price = selectedVariant.variantDetails.price || "";
    let compareAtPrice = selectedVariant.variantDetails.compareAtPrice || null;
    let currencyCode = selectedVariant.variantDetails.currencyCode || "";

    console.log(
      "selectedVariant.variantDetails.marketsPrice ===>>>>>",
      selectedVariant.variantDetails.marketsPrice,
    );

    console.log("currentMarketplace ===>>>>>", currentMarketplace);

    if (currentMarketplace && selectedVariant.variantDetails.marketsPrice) {
      const marketPrice = selectedVariant.variantDetails.marketsPrice.find(
        (mp: {
          countryCode: string;
          price?: string;
          compareAtPrice?: string | null;
          currencyCode?: string;
        }) => mp.countryCode === currentMarketplace,
      );
      if (marketPrice) {
        // Всегда используем окончательную цену из marketsPrice
        price = marketPrice.price || price;
        compareAtPrice = marketPrice.compareAtPrice || compareAtPrice;
        currencyCode = marketPrice.currencyCode || currencyCode;
      }
    }

    return {
      price: price || "",
      compareAtPrice: compareAtPrice || "",
      currencyCode: currencyCode || "",
    };
  }, [selectedVariant, currentMarketplace]);

  // Получаем shop ID из URL изображения продукта (если не передан)
  const getShopId = useMemo(() => {
    if (shopId) return shopId;

    // Пытаемся извлечь shop ID из URL изображения первого варианта
    const firstVariantImageUrl =
      product.variants[0]?.variantDetails?.image?.url ||
      product.variants[0]?.variantDetails?.product?.featuredImage?.url ||
      "";

    if (firstVariantImageUrl) {
      // Формат URL: https://cdn.shopify.com/s/files/1/0701/7398/2813/files/...
      // Или: https://cdn.shopify.com/files/1/0701/7398/2813/files/...
      const shopIdMatch = firstVariantImageUrl.match(
        /(?:cdn\.shopify\.com\/s\/files\/1\/|cdn\.shopify\.com\/files\/1\/)(\d+\/\d+\/\d+)\//,
      );
      if (shopIdMatch && shopIdMatch[1]) {
        return shopIdMatch[1];
      }
    }

    return null;
  }, [shopId, product.variants]);

  // Получаем уникальные значения для Color опции
  const getColorOptions = () => {
    if (!hasColorOption) return [];

    const colorMap = new Map<string, VariantOption>();

    product.variants.forEach((variant) => {
      // console.log(variant, productIndex, "<<<<<====== variant getColorOptions");
      const colorOpt = variant.selectedOptions?.find(
        (opt: { name: string; value: string }) => isColorOption(opt.name),
      );
      if (colorOpt && !colorMap.has(colorOpt.value)) {
        // Формируем URL для asset файла (например, beige.svg -> beige.svg)
        const normalizedValue = normalizeColorForAsset(colorOpt.value);
        const assetFileName = `${normalizedValue}.svg`;

        // Формируем правильный URL для Shopify asset файла
        // Формат: https://cdn.shopify.com/s/files/1/{shopId}/files/{filename}
        const assetUrl = getShopId
          ? `https://cdn.shopify.com/s/files/1/${getShopId}/files/${assetFileName.toLowerCase()}`
          : "";

        const imageUrl =
          assetUrl ||
          variant.variantDetails?.image?.url ||
          variant.variantDetails?.product?.featuredImage?.url ||
          `https://via.placeholder.com/20?text=${encodeURIComponent(
            colorOpt.value.substring(0, 1),
          )}` ||
          "";

        colorMap.set(colorOpt.value, {
          value: colorOpt.value,
          variant,
          imageUrl: imageUrl || "",
        });
      }
    });

    return Array.from(colorMap.values());
  };

  // Получаем уникальные значения для Cushion опции (фильтруем по выбранному Color)
  const getCushionOptions = () => {
    if (!hasCushionOption) return [];

    const cushionMap = new Map<string, VariantOption>();

    // Фильтруем варианты по выбранному Color, если он выбран
    const filteredVariants = selectedColor
      ? product.variants.filter((variant) => {
          return variant.selectedOptions?.some(
            (opt: { name: string; value: string }) =>
              isColorOption(opt.name) && opt.value === selectedColor,
          );
        })
      : product.variants;

    filteredVariants.forEach((variant) => {
      // console.log(
      //   variant,
      //   productIndex,
      //   "<<<<<====== variant getCushionOptions",
      // );
      const cushionOpt = variant.selectedOptions?.find(
        (opt: { name: string; value: string }) => isCushionOption(opt.name),
      );

      if (cushionOpt && !cushionMap.has(cushionOpt.value)) {
        // Формируем URL для asset файла с нормализацией
        const normalizedValue = normalizeColorForAsset(cushionOpt.value);
        const assetFileName = `${normalizedValue}.svg`;

        // Формируем правильный URL для Shopify asset файла
        // Формат: https://cdn.shopify.com/s/files/1/{shopId}/files/{filename}
        const assetUrl = getShopId
          ? `https://cdn.shopify.com/s/files/1/${getShopId}/files/${assetFileName.toLowerCase()}`
          : "";

        const imageUrl =
          assetUrl ||
          variant.variantDetails?.image?.url ||
          variant.variantDetails?.product?.featuredImage?.url ||
          `https://via.placeholder.com/20?text=${encodeURIComponent(
            cushionOpt.value.substring(0, 1),
          )}` ||
          "";

        cushionMap.set(cushionOpt.value, {
          value: cushionOpt.value,
          variant,
          imageUrl: imageUrl || "",
        });
      }
    });

    return Array.from(cushionMap.values());
  };

  const colorOptions = getColorOptions();
  const cushionOptions = getCushionOptions();

  const handleColorChange = (value: string) => {
    // Вычисляем новый вариант с новым цветом и текущей подушкой
    const newVariant = findVariantByOptions(value, selectedCushion);
    setSelectedColor(value);
    // Обновляем родительский компонент с полным объектом варианта
    if (onSelectNewVariant) {
      onSelectNewVariant(newVariant || null, productIndex);
    }
  };

  const handleCushionChange = (value: string) => {
    // Вычисляем новый вариант с текущим цветом и новой подушкой
    const newVariant = findVariantByOptions(selectedColor, value);
    setSelectedCushion(value);
    // Обновляем родительский компонент с полным объектом варианта
    if (onSelectNewVariant) {
      onSelectNewVariant(newVariant || null, productIndex);
    }
  };

  const handleAddToggle = () => {
    const newIsAdded = !isAdded;
    if (onChangingTheOption) {
      onChangingTheOption(selectedVariant || null, productIndex, newIsAdded);
    }
    setIsAdded(newIsAdded);
    // Уведомляем родительский компонент об изменении состояния
    if (onToggle) {
      onToggle(newIsAdded);
    }
  };

  return (
    <li className={styles.item}>
      <a href={redirectUrl} target="_blank">
        <ProductImage
          productImage={productImage}
          productTitle={product.productTitle}
        />
      </a>
      <div className={styles.itemContent}>
        <a href={redirectUrl} target="_blank" className={styles.itemName}>
          {product.productTitle}
        </a>

        {/* Список вариантов (swatches) */}
        {hasColorOption && (
          <VariantSelector
            optionName="Color"
            optionValues={colorOptions}
            selectedValue={selectedColor}
            onSelect={handleColorChange}
            productId={product.productId}
          />
        )}
        {hasCushionOption && (
          <VariantSelector
            optionName="Cushion"
            optionValues={cushionOptions}
            selectedValue={selectedCushion}
            onSelect={handleCushionChange}
            productId={product.productId}
          />
        )}

        {/* Нижняя часть с ценой и кнопкой */}
        <div className={styles.itemBottomContent}>
          <ProductPrice
            price={price}
            compareAtPrice={compareAtPrice}
            currencyCode={currencyCode}
            discount={discount}
          />
          <AddButton
            isAdded={isAdded}
            handleAddToggle={handleAddToggle}
            addText={addText}
            addedText={addedText}
            buttonBackgroundColor={buttonBackgroundColor}
            addedButtonBackgroundColor={addedButtonBackgroundColor}
          />
        </div>
      </div>
    </li>
  );
}
