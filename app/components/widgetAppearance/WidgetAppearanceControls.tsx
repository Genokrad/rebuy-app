import { useState, type FC } from "react";
import type { PreviewTexts } from "./widgetTypes/types";
import { TextSettings } from "./TextSettings";
import { ColorSettings } from "./ColorSettings";

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
  const [isTextSettingsExpanded, setIsTextSettingsExpanded] = useState(false);
  const [isColorSettingsExpanded, setIsColorSettingsExpanded] = useState(false);

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

      {/* Текстовые настройки */}
      <div style={styles.collapsibleSection}>
        <button
          type="button"
          style={styles.collapsibleHeader}
          onClick={() => setIsTextSettingsExpanded(!isTextSettingsExpanded)}
        >
          <span style={styles.collapsibleTitle}>Text Settings</span>
          <span style={styles.collapsibleIcon}>
            {isTextSettingsExpanded ? "▼" : "▶"}
          </span>
        </button>
        {isTextSettingsExpanded && (
          <div style={styles.collapsibleContent}>
            <TextSettings texts={texts} onChange={onChange} />
          </div>
        )}
      </div>

      {/* Настройки цветов */}
      <div style={styles.collapsibleSection}>
        <button
          type="button"
          style={styles.collapsibleHeader}
          onClick={() => setIsColorSettingsExpanded(!isColorSettingsExpanded)}
        >
          <span style={styles.collapsibleTitle}>Color Settings</span>
          <span style={styles.collapsibleIcon}>
            {isColorSettingsExpanded ? "▼" : "▶"}
          </span>
        </button>
        {isColorSettingsExpanded && (
          <div style={styles.collapsibleContent}>
            <ColorSettings texts={texts} onChange={onChange} />
          </div>
        )}
      </div>

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
  controlsFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 4,
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
  collapsibleSection: {
    border: "1px solid #e5e5e5",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  collapsibleHeader: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
    textAlign: "left",
  },
  collapsibleTitle: {
    flex: 1,
  },
  collapsibleIcon: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  collapsibleContent: {
    padding: "12px 16px",
    background: "#faf9f6",
    borderTop: "1px solid #e5e5e5",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
};
