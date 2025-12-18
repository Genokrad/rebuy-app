import type { FC, ChangeEvent } from "react";
import type { PreviewTexts } from "./WidgetAppearancePreviewLite";

type Props = {
  texts: PreviewTexts;
  onChange: (key: keyof PreviewTexts, value: string) => void;
  currentLocale: string;
  availableLocales: string[];
  onLocaleChange: (locale: string) => void;
  onSave?: (locale: string, texts: PreviewTexts) => void;
  isSaving?: boolean;
};

export const WidgetAppearanceControls: FC<Props> = ({
  texts,
  onChange,
  currentLocale,
  availableLocales,
  onLocaleChange,
  onSave,
  isSaving = false,
}) => {
  const handleInput =
    (key: keyof PreviewTexts) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(key, e.target.value);

  const exampleVars = {
    remaining: 2,
    productWord: "products",
    nextDiscount: 5,
    maxDiscount: 10,
  };

  const formatExample = (
    template: string,
    vars: Record<string, string | number>,
  ) =>
    template.replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] !== undefined ? String(vars[k]) : "",
    );

  return (
    <div style={styles.controls}>
      <label style={styles.controlLabel}>
        Language:
        <select
          style={styles.controlInput}
          value={currentLocale}
          onChange={(e) => onLocaleChange(e.target.value)}
        >
          {availableLocales.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </label>
      <label style={styles.controlLabel}>
        Title:
        <input
          style={styles.controlInput}
          value={texts.title ?? ""}
          onChange={handleInput("title")}
          placeholder="Buy more at a lower price"
        />
      </label>
      <label style={styles.controlLabel}>
        Added text:
        <input
          style={styles.controlInput}
          value={texts.addedText ?? ""}
          onChange={handleInput("addedText")}
          placeholder="Added"
        />
      </label>
      <label style={styles.controlLabel}>
        Add text:
        <input
          style={styles.controlInput}
          value={texts.addText ?? ""}
          onChange={handleInput("addText")}
          placeholder="Add"
        />
      </label>
      <label style={styles.controlLabel}>
        Total price label:
        <input
          style={styles.controlInput}
          value={texts.totalPriceLabel ?? ""}
          onChange={handleInput("totalPriceLabel")}
          placeholder="Total Price:"
        />
      </label>
      <label style={styles.controlLabel}>
        Max discount text:
        <small style={styles.hint}>
          Обязательно используйте плейсхолдеры: <code>${"{maxDiscount}"}</code>
        </small>
        <textarea
          style={styles.controlInput}
          value={texts.maxDiscountText ?? ""}
          onChange={handleInput("maxDiscountText")}
          placeholder={
            "You are already using the maximum discount of {maxDiscount}% 🎉"
          }
        />
        <div style={styles.hintPreview}>
          Пример:{" "}
          {formatExample(
            texts.maxDiscountText ||
              "You are already using the maximum discount of {maxDiscount}% 🎉",
            exampleVars,
          )}
        </div>
      </label>

      <label style={styles.controlLabel}>
        Next discount text:
        <small style={styles.hint}>
          Обязательно используйте плейсхолдеры: <code>${"{remaining}"}</code>,{" "}
          <code>${"{nextDiscount}"}</code>
        </small>
        <textarea
          style={styles.controlTextarea}
          value={texts.nextDiscountText ?? ""}
          onChange={handleInput("nextDiscountText")}
          placeholder={
            "Add {remaining} more {productWord} to your cart and unlock a {nextDiscount}% discount!"
          }
        />
        <div style={styles.hintPreview}>
          Пример:{" "}
          {formatExample(
            texts.nextDiscountText ||
              "Add {remaining} more {productWord} to your cart and unlock a {nextDiscount}% discount!",
            exampleVars,
          )}
        </div>
      </label>

      <label style={styles.controlLabel}>
        Add to cart text:
        <input
          style={styles.controlInput}
          value={texts.addToCartText ?? ""}
          onChange={handleInput("addToCartText")}
          placeholder="Add to cart"
        />
      </label>

      <div style={styles.controlsFooter}>
        <button
          style={styles.saveButton}
          type="button"
          onClick={() => onSave?.(currentLocale, texts)}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
    width: "100%",
    background: "#faf9f6",
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: 16,
  },
  controlLabel: {
    display: "flex",
    flexDirection: "column",
    fontSize: 13,
    color: "#333",
    gap: 6,
    fontWeight: 500,
  },
  controlInput: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d0d0",
    fontSize: 14,
    background: "#fff",
    height: 40,
  },
  controlTextarea: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d0d0",
    fontSize: 14,
    minHeight: 88,
    resize: "vertical",
    background: "#fff",
  },
  hint: {
    display: "block",
    marginTop: 2,
    fontSize: 12,
    color: "#7a7a7a",
    fontWeight: 400,
  },
  controlsFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  hintPreview: {
    marginTop: 6,
    fontSize: 12,
    color: "#555",
    background: "#f3f2ef",
    padding: "8px 10px",
    borderRadius: 8,
  },
  saveButton: {
    padding: "10px 18px",
    borderRadius: 8,
    border: "1px solid #4B3E34",
    background: "#4B3E34",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
};
