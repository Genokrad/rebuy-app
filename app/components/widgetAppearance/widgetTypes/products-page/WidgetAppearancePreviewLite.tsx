import type { FC } from "react";
import type { PreviewTexts } from "../types";
import { mockProducts } from "../mockData";

type PreviewTextKey = keyof PreviewTexts;

type PreviewProps = {
  texts: PreviewTexts;
  onChange: (key: PreviewTextKey, value: string) => void;
};

/**
 * Лёгкий превью-компонент без бизнес-логики — только внешка.
 * Все тексты приходят извне через props, чтобы логика была выше.
 */
const sampleVars = {
  remaining: 2,
  productWord: "products",
  nextDiscount: 5,
  maxDiscount: 10,
};

const formatTemplate = (
  template: string,
  vars: Record<string, string | number>,
) =>
  template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : "",
  );

export const WidgetAppearancePreviewLite: FC<PreviewProps> = ({
  texts,
  onChange,
}) => {
  const products = mockProducts;

  const widgetBackgroundColor = texts.widgetBackgroundColor || "#f5f5ee";
  const buttonBackgroundColor = texts.buttonBackgroundColor || "#4B3E34";
  const addedButtonBackgroundColor = texts.addedButtonBackgroundColor || "#000";

  return (
    <div style={{ ...styles.wrapper, backgroundColor: widgetBackgroundColor }}>
      <h2 style={styles.title}>{texts.title ?? "Buy more at a lower price"}</h2>

      <ul style={styles.list} aria-label="Preview products list">
        {products.map((product) => (
          <li key={product.id} style={styles.item}>
            <div style={styles.itemImage}>
              <img
                src={product.image}
                alt={product.title}
                width={100}
                height={100}
                style={styles.itemImageImg}
              />
            </div>
            <div style={styles.itemContent}>
              <span style={styles.itemName}>{product.title}</span>
              <div style={styles.itemBottomContent}>
                <div style={styles.itemPrice}>
                  <p style={styles.priceNew}>
                    <span>{product.price}</span>
                  </p>
                  {product.compareAtPrice && (
                    <p style={styles.priceOld}>
                      <span>{product.compareAtPrice}</span>
                    </p>
                  )}
                </div>
                <div style={styles.itemLabel}>
                  <div
                    style={{
                      ...styles.labelTextAdd,
                      borderColor: buttonBackgroundColor,
                    }}
                  >
                    <span>{texts.addText}</span>
                  </div>
                  <div
                    style={{
                      ...styles.labelTextAdded,
                      backgroundColor: addedButtonBackgroundColor,
                    }}
                  >
                    <span>{texts.addedText}</span>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div style={styles.totalPrice}>
        <p style={styles.totalPriceNew}>
          <span>{texts.totalPriceLabel ?? "Total Price:"}</span>{" "}
          <span style={styles.totalPriceValue}>$86.45</span>
        </p>
      </div>

      <button
        style={{
          ...styles.addToCart,
          backgroundColor: buttonBackgroundColor,
          borderColor: buttonBackgroundColor,
        }}
      >
        {texts.addToCartText ?? "Add to cart"}
      </button>

      <div style={styles.discountMessageGroup}>
        <div style={styles.discountMessage}>
          {formatTemplate(
            texts.nextDiscountText ||
              "Add {remaining} more {productWord} to your cart and unlock a {nextDiscount}% discount!",
            sampleVars,
          )}
        </div>
        <div style={styles.discountMessage}>
          {formatTemplate(
            texts.maxDiscountText ||
              "You are already using the maximum discount of {maxDiscount}% 🎉",
            sampleVars,
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    padding: 36,
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    color: "#232323",
    width: "100%",
    maxWidth: "100%",
    gap: 12,
  },
  title: {
    fontSize: 27,
    fontWeight: 500,
    margin: 0,
    color: "#232323",
    lineHeight: 1,
    marginBottom: 16,
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    border: "1px solid #E0E0E0",
    margin: 0,
  },
  itemImage: {
    minWidth: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
  },
  itemImageImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  itemContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 90,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 14,
    fontWeight: 400,
    margin: 0,
    color: "#232323",
    lineHeight: 1.4,
    textDecoration: "none",
  },
  itemBottomContent: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  itemPrice: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  priceNew: {
    fontSize: 14,
    fontWeight: 600,
    color: "#e74c3c",
    margin: 0,
  },
  priceOld: {
    fontSize: 14,
    color: "#999",
    textDecoration: "line-through",
    margin: 0,
    display: "flex",
    gap: 2,
  },
  itemLabel: {
    position: "relative",
    margin: 0,
  },
  labelTextAdded: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#000",
    color: "#fff",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: 0.105,
    padding: "6px 28px",
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: 600,
    marginTop: 16,
    marginBottom: 12,
  },
  totalPriceNew: {
    fontWeight: 400,
    color: "#000",
    margin: 0,
  },
  totalPriceValue: {
    color: "red",
  },
  addToCart: {
    padding: "10px 15px",
    width: "100%",
    height: "auto",
    textAlign: "center",
    fontSize: 16,
    borderStyle: "solid",
    borderWidth: 1,
    color: "white",
    fontWeight: 500,
    cursor: "pointer",
    marginBottom: 12,
    borderRadius: 8,
  },
  discountMessageGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 8,
  },
  discountMessage: {
    fontSize: 12,
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: 0.75,
    textAlign: "center",
  },
  labelTextAdd: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    border: "1px solid #000",
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: 0.105,
    padding: "6px 24px",
    marginBottom: 6,
  },
};
