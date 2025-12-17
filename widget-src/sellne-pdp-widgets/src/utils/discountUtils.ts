/**
 * Определяет финальную скидку на основе количества выбранных товаров
 * @param productSelectedCount - количество выбранных товаров
 * @param sortedDiscounts - отсортированный массив скидок вида [{1: 0}, {2: 0}, {3: 5}]
 * @returns финальная скидка в процентах
 */
export function getFinalDiscount(
  productSelectedCount: number,
  sortedDiscounts: Array<Record<string, number>>,
): number {
  let finalDiscount = 0;

  // console.log("getFinalDiscount called:", {
  //   productSelectedCount,
  //   sortedDiscounts,
  // });

  sortedDiscounts.forEach((discount) => {
    const [count, discountValue] = Object.entries(discount)[0];
    const countNum = Number(count);
    const discountNum = Number(discountValue);
    // console.log(
    //   `Checking: productSelectedCount (${productSelectedCount}) >= count (${countNum})? ${productSelectedCount >= countNum}`,
    // );
    if (productSelectedCount >= countNum) {
      finalDiscount = discountNum;
    }
  });

  // console.log("Final discount result:", finalDiscount);
  return finalDiscount;
}
