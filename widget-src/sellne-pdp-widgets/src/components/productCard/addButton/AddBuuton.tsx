import styles from "../ProductCard.module.css";

const AddButton = ({
  isAdded,
  handleAddToggle,
}: {
  isAdded: boolean;
  handleAddToggle: () => void;
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
        <span>Add</span>
      </div>
      <div className={styles.labelTextAdded}>
        <span>Added</span>
      </div>
    </label>
  );
};

export default AddButton;
