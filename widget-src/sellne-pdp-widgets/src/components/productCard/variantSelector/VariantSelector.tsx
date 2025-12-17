import styles from "../ProductCard.module.css";
import type { VariantSelectorProps } from "../../../types";

const VariantSelector = ({
  optionName,
  optionValues,
  selectedValue,
  onSelect,
  productId,
}: VariantSelectorProps) => {
  if (optionValues.length === 0) return null;

  return (
    <div className={styles.variantsList}>
      {optionValues.map(({ value, imageUrl }) => {
        const isSelected = selectedValue === value;

        return (
          <label key={value} className={styles.variantsListItem}>
            <input
              type="radio"
              name={`sellence-${optionName.toLowerCase()}-${productId}`}
              value={value}
              checked={isSelected}
              onChange={() => onSelect(value)}
              className={styles.variantsListInput}
            />
            <span className={styles.variantsListSwatch}>
              <img src={imageUrl} alt={value} width="20" height="20" />
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default VariantSelector;
