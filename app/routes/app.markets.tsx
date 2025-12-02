import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Card,
  DataTable,
  ChoiceList,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getAllMarkets, getAllLocations } from "../graphql/marketsService";
import type { Market } from "../graphql/getMarkets";
import type { Location } from "../graphql/getLocations";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Получаем все маркеты (регионы) магазина
  let markets: any[] = [];
  try {
    markets = await getAllMarkets(request);
  } catch (error) {
    console.error("Ошибка при получении маркетов:", error);
  }

  // Получаем все склады магазина
  let locations: any[] = [];
  try {
    locations = await getAllLocations(request);
  } catch (error) {
    console.error("Ошибка при получении складов:", error);
  }

  return {
    markets,
    locations,
  };
};

export default function Markets() {
  const { markets, locations } = useLoaderData<typeof loader>();

  // Состояние для хранения выбранных складов для каждого маркета
  // Ключ - ID маркета, значение - массив ID выбранных складов
  const [selectedLocations, setSelectedLocations] = useState<
    Record<string, string[]>
  >({});

  // Обработчик изменения выбора складов для маркета
  const handleLocationChange = (marketId: string, selected: string[]) => {
    setSelectedLocations((prev) => ({
      ...prev,
      [marketId]: selected,
    }));
  };

  // Формируем список опций для ChoiceList
  const locationChoices = locations.map((location: Location) => {
    const addressParts = location.address?.formatted || [];
    const addressStr =
      addressParts.length > 0
        ? ` (${addressParts.join(", ")})`
        : location.address?.country
          ? ` (${location.address.country})`
          : "";
    return {
      label: `${location.name}${addressStr}`,
      value: location.id,
    };
  });

  return (
    <Page>
      <TitleBar title="Markets - Sellence App" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Text as="h1" variant="headingLg">
              Все доступные регионы (Markets)
            </Text>

            {markets && markets.length > 0 ? (
              <BlockStack gap="400">
                <Text as="p" variant="bodyMd" tone="subdued">
                  Найдено маркетов: {markets.length}
                </Text>

                <Card>
                  <DataTable
                    columnContentTypes={["text", "text", "text", "text"]}
                    headings={["Название", "ID", "Primary", "Enabled"]}
                    rows={markets.map((market: any) => [
                      market.name,
                      market.id,
                      market.primary ? "Да" : "Нет",
                      market.enabled ? "Да" : "Нет",
                    ])}
                  />
                </Card>

                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Детальная информация:
                  </Text>
                  {markets.map(
                    (
                      market: Market & { conditions?: unknown },
                      index: number,
                    ) => {
                      const selectedForMarket =
                        selectedLocations[market.id] || [];

                      return (
                        <Card key={market.id}>
                          <BlockStack gap="200">
                            <Text as="p" variant="bodyMd">
                              <strong>
                                {index + 1}. {market.name}
                              </strong>
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              ID: {market.id}
                            </Text>
                            <Text as="p" variant="bodySm">
                              Primary: {market.primary ? "Да" : "Нет"} |
                              Enabled: {market.enabled ? "Да" : "Нет"}
                            </Text>

                            {locations && locations.length > 0 && (
                              <BlockStack gap="100">
                                <Text
                                  as="p"
                                  variant="bodySm"
                                  fontWeight="medium"
                                >
                                  Доступные склады:
                                </Text>
                                <ChoiceList
                                  title=""
                                  choices={locationChoices}
                                  selected={selectedForMarket}
                                  onChange={(selected) =>
                                    handleLocationChange(market.id, selected)
                                  }
                                  allowMultiple
                                />
                                {selectedForMarket.length > 0 && (
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    Выбрано складов: {selectedForMarket.length}
                                  </Text>
                                )}
                                <Button
                                  variant="primary"
                                  disabled={selectedForMarket.length === 0}
                                  onClick={() => {
                                    const selectedLocationIds = locations
                                      .filter((loc: Location) =>
                                        selectedForMarket.includes(loc.id),
                                      )
                                      .map((loc) => ({ id: loc.id }));

                                    // Пока просто выводим в консоль выбранные склады для этого маркета
                                    // eslint-disable-next-line no-console
                                    console.log(
                                      "Selected warehouses for market",
                                      {
                                        marketId: market.id,
                                        marketName: market.name,
                                        locations: selectedLocationIds,
                                      },
                                    );
                                  }}
                                >
                                  Сохранить для маркета (log)
                                </Button>
                              </BlockStack>
                            )}

                            {Boolean(market.conditions) && (
                              <Text as="p" variant="bodySm" tone="subdued">
                                <details>
                                  <summary>
                                    Conditions (нажмите для просмотра)
                                  </summary>
                                  <pre
                                    style={{
                                      fontSize: "12px",
                                      overflow: "auto",
                                      maxHeight: "200px",
                                    }}
                                  >
                                    {JSON.stringify(
                                      market.conditions as unknown as Record<
                                        string,
                                        unknown
                                      >,
                                      null,
                                      2,
                                    )}
                                  </pre>
                                </details>
                              </Text>
                            )}
                          </BlockStack>
                        </Card>
                      );
                    },
                  )}
                </BlockStack>
              </BlockStack>
            ) : (
              <Card>
                <Text as="p" variant="bodyMd">
                  Маркеты не найдены или произошла ошибка при загрузке.
                </Text>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
