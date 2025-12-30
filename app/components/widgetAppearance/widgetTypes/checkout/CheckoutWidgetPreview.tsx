import type { FC } from "react";
import { Text } from "@shopify/polaris";
import type { CheckoutTexts } from "../types";
import { mockProducts } from "../mockData";

type PreviewProps = {
  texts: CheckoutTexts;
};

/**
 * Превью компонент для checkout виджета
 * Визуально повторяет структуру из Checkout.jsx
 */
export const CheckoutWidgetPreview: FC<PreviewProps> = ({ texts }) => {
  const heading = texts.heading || "Complete your purchase";
  const buttonText = texts.buttonText || "Add";
  const buttonVariant = texts.buttonVariant || "primary";

  // Стили для кнопки в зависимости от варианта
  const getButtonStyles = () => {
    const baseStyles: React.CSSProperties = {
      padding: "8px 16px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 500,
      border: "none",
      minWidth: 60,
    };

    switch (buttonVariant) {
      case "primary":
        return {
          ...baseStyles,
          background: "#005bd1", // Shopify primary blue
          color: "#fff",
        };
      case "secondary":
        return {
          ...baseStyles,
          border: "1px solid #005bd1",
          background: "transparent",
          color: "#005bd1",
        };
      case "plain":
        return {
          ...baseStyles,
          border: "1px solid #d0d0d0",
          background: "transparent",
          color: "#333",
        };
      default:
        return {
          ...baseStyles,
          background: "#005bd1",
          color: "#fff",
        };
    }
  };

  return (
    <div style={styles.container}>
      <Text
        as="h2"
        variant="headingMd"
        fontWeight="semibold"
        style={styles.heading}
      >
        {heading}
      </Text>

      <div style={styles.productsList}>
        {mockProducts.slice(0, 3).map((product) => (
          <div key={product.id} style={styles.productCard}>
            <div style={styles.productImage}>
              <img
                src={product.image}
                alt={product.title}
                style={styles.image}
              />
            </div>
            <div style={styles.productInfo}>
              <Text as="p" variant="bodyMd" style={styles.productTitle}>
                {product.title}
              </Text>
              <Text
                as="p"
                variant="bodyMd"
                fontWeight="semibold"
                style={styles.productPrice}
              >
                {product.price}
              </Text>
            </div>
            <div style={styles.buttonContainer}>
              <button style={getButtonStyles()}>{buttonText}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    backgroundColor: "#faf9f6",
  },
  heading: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: 600,
    color: "#202223",
  },
  productsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  productCard: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: 12,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f5f5f5",
    border: "1px solid #e0e0e0",
    borderRadius: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  productInfo: {
    minWidth: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  productTitle: {
    fontSize: 14,
    lineHeight: 1.4,
    color: "#202223",
    margin: 0,
  },
  productPrice: {
    fontSize: 14,
    color: "#202223",
    margin: 0,
  },
  buttonContainer: {
    flexShrink: 0,
  },
};
