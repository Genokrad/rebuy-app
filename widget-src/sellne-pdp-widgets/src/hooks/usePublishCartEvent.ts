/**
 * Хук для публикации события обновления корзины
 * Использует publish и EVENTS из @archetype-themes/utils/pubsub
 */
export function usePublishCartEvent() {
  const publishAjaxProductAdded = async (responseJson: unknown) => {
    const addToCartBtn =
      (document.querySelector(
        '[data-sellence-widget-button="add-to-cart"]',
      ) as HTMLElement) || null;

    const eventDetail = {
      product: responseJson,
      addToCartBtn: addToCartBtn,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowAny = window as any;

    // Ждем, чтобы модульный скрипт успел загрузиться (если еще не загружен)
    if (!windowAny?.publish || !windowAny?.EVENTS) {
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (windowAny?.publish && windowAny?.EVENTS) {
          break;
        }
      }
    }

    // Используем publish и EVENTS из глобальной области (экспортируются из Liquid скрипта)
    if (
      typeof windowAny?.publish === "function" &&
      windowAny?.EVENTS?.ajaxProductAdded
    ) {
      windowAny.publish(windowAny.EVENTS.ajaxProductAdded, {
        detail: eventDetail,
      });
    }
  };

  return { publishAjaxProductAdded };
}
