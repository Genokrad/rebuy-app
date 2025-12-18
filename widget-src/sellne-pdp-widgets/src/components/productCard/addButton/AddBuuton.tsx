import styles from "../ProductCard.module.css";

const AddButton = ({
  isAdded,
  handleAddToggle,
  addText,
  addedText,
  buttonBackgroundColor,
  addedButtonBackgroundColor,
}: {
  isAdded: boolean;
  handleAddToggle: () => void;
  addText?: string;
  addedText?: string;
  buttonBackgroundColor?: string;
  addedButtonBackgroundColor?: string;
}) => {
  return (
    <label className={styles.itemLabel}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={isAdded}
        onChange={handleAddToggle}
      />
      <div
        className={styles.labelTextAdd}
        style={
          buttonBackgroundColor
            ? { borderColor: buttonBackgroundColor }
            : undefined
        }
      >
        <span>{addText || "Add"}</span>
      </div>
      <div
        className={styles.labelTextAdded}
        style={
          addedButtonBackgroundColor
            ? { backgroundColor: addedButtonBackgroundColor }
            : undefined
        }
      >
        <span>{addedText || "Added"}</span>
      </div>
    </label>
  );
};

export default AddButton;
