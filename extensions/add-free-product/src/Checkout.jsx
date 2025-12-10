import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useEffect, useState, useRef } from "preact/hooks";
import { useCartLines } from "@shopify/ui-extensions/checkout/preact";

// 1. Export the extension
export default async () => {
  render(<Extension />, document.body);
};

function Extension() {
  const cartLines = useCartLines();
  const [freeProductVariantId, setFreeProductVariantId] = useState(null);
  const hasAddedProductRef = useRef(false);

  // Fetch free product variant ID on component mount
  useEffect(() => {
    async function fetchFreeProductVariantId() {
      try {
        const query = `
          query GetFreeProductVariantId {
            shop {
              metafield(namespace: "custom", key: "free_product_id") {
                id
                reference {
                  ... on Product {
                    id
                    variants(first: 1) {
                      edges {
                        node {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const result = await shopify.query(query);
        console.log("Free product variant ID query result:", result);

        // Extract variant ID from the result
        const resultData =
          result && typeof result === "object" && "data" in result
            ? result.data
            : null;
        const variantId =
          // @ts-ignore - shopify.query result type is not fully typed
          resultData?.shop?.metafield?.reference?.variants?.edges?.[0]?.node
            ?.id;
        if (variantId) {
          console.log("Free product variant ID:", variantId);
          setFreeProductVariantId(variantId);
        } else {
          console.log("No variant ID found in the result");
        }
      } catch (error) {
        console.error("Error fetching free product variant ID:", error);
      }
    }

    fetchFreeProductVariantId();
  }, []);

  // Проверяем корзину и добавляем бесплатный товар, если его нет
  useEffect(() => {
    async function checkAndAddFreeProduct() {
      // Если variantId еще не получен или уже добавлен, выходим
      if (!freeProductVariantId || hasAddedProductRef.current) {
        return;
      }

      console.log("cartLines ====>>>>>>", cartLines);

      // Проверяем, есть ли товар с этим variantId в корзине
      // Товар может быть:
      // 1. Отдельной линией: line.merchandise.id === freeProductVariantId
      // 2. Компонентом bundle (после merge): line.lineComponents[].merchandise.id === freeProductVariantId
      const isInCart = cartLines.some((line) => {
        // Проверяем основную линию
        if (line.merchandise?.id === freeProductVariantId) {
          return true;
        }
        // Проверяем компоненты bundle, если они есть
        if (line.lineComponents && Array.isArray(line.lineComponents)) {
          return line.lineComponents.some(
            (component) => component.merchandise?.id === freeProductVariantId,
          );
        }
        return false;
      });

      if (!isInCart) {
        console.log(
          "Free product not in cart, adding automatically...",
          freeProductVariantId,
        );
        hasAddedProductRef.current = true;

        try {
          const result = await shopify.applyCartLinesChange({
            type: "addCartLine",
            merchandiseId: freeProductVariantId,
            quantity: 1,
            attributes: [
              {
                key: "_free_product",
                value: "true",
              },
            ],
          });

          if (result.type === "error") {
            console.error("Error adding free product to cart:", result.message);
            hasAddedProductRef.current = false; // Разрешаем повторную попытку
          } else {
            console.log("Free product added to cart successfully");
          }
        } catch (error) {
          console.error("Error adding free product to cart:", error);
          hasAddedProductRef.current = false; // Разрешаем повторную попытку
        }
      } else {
        console.log("Free product already in cart");
      }
    }

    checkAndAddFreeProduct();
  }, [cartLines, freeProductVariantId]);

  // 2. Check instructions for feature availability, see https://shopify.dev/docs/api/checkout-ui-extensions/apis/cart-instructions for details
  if (!shopify.instructions.value.attributes.canUpdateAttributes) {
    // For checkouts such as draft order invoices, cart attributes may not be allowed
    // Consider rendering a fallback UI or nothing at all, if the feature is unavailable
    return (
      <s-banner heading="add-free-product" tone="warning">
        {shopify.i18n.translate("attributeChangesAreNotSupported")}
      </s-banner>
    );
  }

  // 3. Render a UI
  return null;

  // async function handleClick() {
  //   // 4. Call the API to modify checkout
  //   const result = await shopify.applyAttributeChange({
  //     key: "requestedFreeGift",
  //     type: "updateAttribute",
  //     value: "yes",
  //   });
  //   console.log("applyAttributeChange result", result);
  // }
}
