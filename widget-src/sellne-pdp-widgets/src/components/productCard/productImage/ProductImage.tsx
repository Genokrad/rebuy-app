import styles from "../ProductCard.module.css";
import { optimizeShopifyImageUrl } from "../../../utils/imageOptimizer";

const ProductImage = ({
  productImage,
  productTitle,
}: {
  productImage: string;
  productTitle: string;
}) => {
  // Оптимизируем URL изображения для получения миниатюры 100x100
  const optimizedImageUrl = productImage
    ? optimizeShopifyImageUrl(productImage, 100, 100)
    : "";

  return (
    <div className={styles.itemImage}>
      {optimizedImageUrl && (
        <img
          src={optimizedImageUrl}
          alt={productTitle}
          width="100"
          height="100"
          className={styles.itemImageImg}
        />
      )}
    </div>
  );
};

export default ProductImage;
