import styles from "../ProductCard.module.css";

const ProductImage = ({
  productImage,
  productTitle,
}: {
  productImage: string;
  productTitle: string;
}) => {
  return (
    <div className={styles.itemImage}>
      {productImage && (
        <img
          src={productImage}
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
