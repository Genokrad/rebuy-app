import {
  Card,
  BlockStack,
  Text,
  DataTable,
  Badge,
  InlineStack,
  ButtonGroup,
  Button,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { formatDate } from "../services/utils";
import type { Widget } from "./types";

interface WidgetsTableProps {
  widgets: Widget[];
  deleteWidget: (widgetId: string) => void;
  handleEditeWidgets: (widgets: string, name: string, type: string) => void;
}

export function WidgetsTable({
  widgets,
  deleteWidget,
  handleEditeWidgets,
}: WidgetsTableProps) {
  const tableRows = widgets.map((widget) => [
    <InlineStack key={`${widget.id}-name`} gap="200" align="start">
      <input type="checkbox" />
      <Text as="span" variant="bodyMd">
        {widget.name}
      </Text>
    </InlineStack>,
    <Text key={`${widget.id}-widget`} as="span" variant="bodyMd">
      {widget.type === "products-page"
        ? "Products page"
        : widget.type === "cart"
          ? "Cart"
          : "Checkout page"}
    </Text>,
    <Text key={`${widget.id}-id`} as="span" variant="bodyMd">
      {widget.id}
    </Text>,
    <Badge key={`${widget.id}-status`} tone="success">
      Active
    </Badge>,
    <Text key={`${widget.id}-created`} as="span" variant="bodyMd">
      {formatDate(widget.createdAt)}
    </Text>,
    <ButtonGroup key={`${widget.id}-actions`} variant="segmented">
      <Button
        icon={EditIcon}
        accessibilityLabel="Edit widget"
        onClick={() => handleEditeWidgets(widget.id, widget.name, widget.type)}
      />
      <Button
        icon={DeleteIcon}
        accessibilityLabel="Delete widget"
        onClick={() => deleteWidget(widget.id)}
      />
    </ButtonGroup>,
  ]);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Created Widgets
        </Text>
        <DataTable
          columnContentTypes={["text", "text", "text", "text", "text", "text"]}
          headings={["Name", "Widget", "ID", "Status", "Created", "Action"]}
          rows={tableRows}
        />
      </BlockStack>
    </Card>
  );
}
