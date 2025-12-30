import type { FC, ChangeEvent } from "react";
import type { PreviewTexts } from "./widgetTypes/types";

interface ColorSettingsProps {
  texts: PreviewTexts;
  onChange: (key: keyof PreviewTexts, value: string) => void;
}

export const ColorSettings: FC<ColorSettingsProps> = ({ texts, onChange }) => {
  const handleInput =
    (key: keyof PreviewTexts) => (e: ChangeEvent<HTMLInputElement>) =>
      onChange(key, e.target.value);

  return (
    <div style={styles.content}>
      <label style={styles.controlLabel}>
        Widget background color:
        <small style={styles.hint}>
          Цвет фона виджета (HEX формат, например: #f5f5ee)
        </small>
        <div style={styles.colorInputWrapper}>
          <input
            type="color"
            style={styles.colorPicker}
            value={texts.widgetBackgroundColor || "#f5f5ee"}
            onChange={handleInput("widgetBackgroundColor")}
          />
          <input
            type="text"
            style={styles.colorTextInput}
            value={texts.widgetBackgroundColor || "#f5f5ee"}
            onChange={handleInput("widgetBackgroundColor")}
            placeholder="#f5f5ee"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
      </label>

      <label style={styles.controlLabel}>
        Button background color:
        <small style={styles.hint}>
          Цвет фона кнопок "Add" и "Add to cart" (HEX формат, например: #4B3E34)
        </small>
        <div style={styles.colorInputWrapper}>
          <input
            type="color"
            style={styles.colorPicker}
            value={texts.buttonBackgroundColor || "#4B3E34"}
            onChange={handleInput("buttonBackgroundColor")}
          />
          <input
            type="text"
            style={styles.colorTextInput}
            value={texts.buttonBackgroundColor || "#4B3E34"}
            onChange={handleInput("buttonBackgroundColor")}
            placeholder="#4B3E34"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
      </label>

      <label style={styles.controlLabel}>
        Added button background color:
        <small style={styles.hint}>
          Цвет фона кнопки "Added" (HEX формат, например: #000)
        </small>
        <div style={styles.colorInputWrapper}>
          <input
            type="color"
            style={styles.colorPicker}
            value={texts.addedButtonBackgroundColor || "#000"}
            onChange={handleInput("addedButtonBackgroundColor")}
          />
          <input
            type="text"
            style={styles.colorTextInput}
            value={texts.addedButtonBackgroundColor || "#000"}
            onChange={handleInput("addedButtonBackgroundColor")}
            placeholder="#000"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
      </label>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  content: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  controlLabel: {
    display: "flex",
    flexDirection: "column",
    fontSize: 13,
    color: "#333",
    gap: 6,
    fontWeight: 500,
  },
  hint: {
    display: "block",
    marginTop: 2,
    fontSize: 12,
    color: "#7a7a7a",
    fontWeight: 400,
  },
  colorInputWrapper: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  colorPicker: {
    width: 60,
    height: 40,
    borderRadius: 8,
    border: "1px solid #d0d0d0",
    cursor: "pointer",
    padding: 0,
  },
  colorTextInput: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d0d0d0",
    fontSize: 14,
    background: "#fff",
    height: 40,
    fontFamily: "monospace",
  },
};
