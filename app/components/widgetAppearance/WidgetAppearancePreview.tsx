import type { FC } from "react";
import { useState } from "react";

interface WidgetAppearancePreviewProps {
  widgetId?: string;
}

const sliderProducts = [
  {
    id: "slider-1",
    image:
      "/images/widget-appearance/add-a-birthday-card-to-your-gift-5665969.webp",
  },
  {
    id: "slider-2",
    image:
      "/images/widget-appearance/wunderbox-1-3-years-old-developmental-boxing-for-the-little-ones-778431.webp",
  },
  {
    id: "slider-3",
    image:
      "/images/widget-appearance/wunderbox-4-7-years-old-developmental-box-for-kids-611288.webp",
  },
];

const listProducts = [
  {
    id: "list-1",
    title: "WunderBox 4-7 years old – developmental box for kids",
    now: "$38.95",
    was: "$41.00",
  },
  {
    id: "list-2",
    title: "WunderBox 1-3 years old – developmental boxing for toddlers",
    now: "$40.85",
    was: "$43.00",
  },
  {
    id: "list-3",
    title: "Birthday Card!",
    now: "$6.65",
    was: "$7.00",
  },
];

export const WidgetAppearancePreview: FC<WidgetAppearancePreviewProps> = ({
  widgetId,
}) => {
  const [widgetData, setWidgetData] = useState<WidgetData | null>({
    id: widgetId,
    previewTitle: "Buy more at a lower price",
    totalPrice: "Total Price",
    previewButton: "Add all",
    previewSectionLabel: "This item:",
  });

  return (
    <div className="preview-wrapper">
      <style>{`
        .preview-wrapper {
          background-color: #f5f1e9;
          border-radius: 24px;
          padding: 32px;
          border: 1px solid #ede7dc;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: #232323;
        }
        .preview-title {
          font-size: 24px;
          margin: 0 0 20px;
          font-weight: 500;
        }
        .preview-slider {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }
        .preview-slider img {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          background: white;
        }
        .preview-plus {
          font-size: 28px;
          color: #8d8573;
          font-weight: 700;
        }
        .preview-total {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .preview-total span {
          color: #cc1e24;
          margin-left: 6px;
        }
        .preview-button {
          width: 260px;
          height: 48px;
          border: 1px solid #232323;
          border-radius: 6px;
          background: #fbfbf9;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 20px;
        }
        .preview-section-label {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .preview-item {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
          border-bottom: 1px solid #ede7dc;
        }
        .preview-item:last-child {
          border-bottom: none;
        }
        .preview-item-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .preview-checkbox {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: #111;
          color: white;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 4px;
        }
        .preview-link {
          font-size: 15px;
          text-decoration: underline;
          color: #2b2b2b;
        }
        .preview-prices {
          text-align: right;
          font-size: 15px;
          line-height: 1.3;
        }
        .preview-prices .now-label {
          color: #cc1e24;
          font-weight: 600;
        }
        .preview-prices .was-label {
          color: #b5b2ad;
          text-decoration: line-through;
        }
        .preview-meta {
          font-size: 12px;
          color: #9b9588;
          margin-top: 24px;
          text-align: right;
        }
      `}</style>

      <h3 className="preview-title">{widgetData?.previewTitle}</h3>

      <div className="preview-slider">
        {sliderProducts.map((product, idx) => (
          <div
            key={product.id}
            style={{ display: "flex", alignItems: "center" }}
          >
            <img src={product.image} alt="Cross-sell product" />
            {idx !== sliderProducts.length - 1 && (
              <span className="preview-plus">+</span>
            )}
          </div>
        ))}
      </div>

      <p className="preview-total">
        {widgetData?.totalPrice} <span>$86.45</span>
      </p>

      <button className="preview-button">{widgetData?.previewButton}</button>

      <p className="preview-section-label">{widgetData?.previewSectionLabel}</p>

      <div>
        {listProducts.map((product) => (
          <div key={product.id} className="preview-item">
            <div className="preview-item-left">
              <div className="preview-checkbox">✓</div>
              <span className="preview-link">{product.title}</span>
            </div>
            <div className="preview-prices">
              <div className="now-label">Now: {product.now}</div>
              <div className="was-label">Was: {product.was}</div>
            </div>
          </div>
        ))}
      </div>

      {widgetId && <div className="preview-meta">Widget ID: {widgetId}</div>}
    </div>
  );
};
