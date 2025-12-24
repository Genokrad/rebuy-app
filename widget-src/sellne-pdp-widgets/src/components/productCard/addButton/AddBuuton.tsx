import styles from "../ProductCard.module.css";

const AddButton = ({
  isAdded,
  handleAddToggle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addText: _addText,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addedText: _addedText,
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
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 3.33333V12.6667M3.33333 8H12.6667"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div
        className={styles.labelTextAdded}
        style={
          addedButtonBackgroundColor
            ? { backgroundColor: addedButtonBackgroundColor }
            : undefined
        }
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.3333 4L6 11.3333L2.66667 8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </label>
  );
};

export default AddButton;
