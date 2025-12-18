import styles from "../ProductCard.module.css";

const AddButton = ({
  isAdded,
  handleAddToggle,
  addText,
  addedText,
}: {
  isAdded: boolean;
  handleAddToggle: () => void;
  addText?: string;
  addedText?: string;
}) => {
  return (
    <label className={styles.itemLabel}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={isAdded}
        onChange={handleAddToggle}
      />
      <div className={styles.labelTextAdd}>
        <span>{addText || "Add"}</span>
      </div>
      <div className={styles.labelTextAdded}>
        <span>{addedText || "Added"}</span>
      </div>
    </label>
  );
};

export default AddButton;
