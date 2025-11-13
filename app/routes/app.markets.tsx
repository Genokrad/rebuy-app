import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Card,
  DataTable,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getAllMarkets } from "../graphql/marketsService";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Получаем все маркеты (регионы) магазина
  let markets: any[] = [];
  try {
    markets = await getAllMarkets(request);
  } catch (error) {
    console.error("Ошибка при получении маркетов:", error);
  }

  return {
    markets,
  };
};

export default function Markets() {
  const { markets } = useLoaderData<typeof loader>();

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
                  {markets.map((market: any, index: number) => (
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
                          Primary: {market.primary ? "Да" : "Нет"} | Enabled:{" "}
                          {market.enabled ? "Да" : "Нет"}
                        </Text>
                        {market.conditions && (
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
                                {JSON.stringify(market.conditions, null, 2)}
                              </pre>
                            </details>
                          </Text>
                        )}
                      </BlockStack>
                    </Card>
                  ))}
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
