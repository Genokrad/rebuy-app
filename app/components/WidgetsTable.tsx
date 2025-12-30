import {
  Card,
  BlockStack,
  Text,
  DataTable,
  Badge,
  InlineStack,
  ButtonGroup,
  Button,
  Select,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, DuplicateIcon } from "@shopify/polaris-icons";
import { formatDate } from "../services/utils";
import type { Widget } from "./types";

interface WidgetsTableProps {
  widgets: Widget[];
  deleteWidget: (widgetId: string) => void;
  handleEditeWidgets: (widgets: string, name: string, type: string) => void;
  onCloneWidget: (widgetId: string) => void;
  onUpdateWidgetType: (widgetId: string, newType: string) => void;
}

export function WidgetsTable({
  widgets,
  deleteWidget,
  handleEditeWidgets,
  onCloneWidget,
  onUpdateWidgetType,
}: WidgetsTableProps) {
  const widgetTypeOptions = [
    { label: "Products page", value: "products-page" },
    { label: "Cart", value: "cart" },
    { label: "Checkout page", value: "checkout" },
  ];

  const tableRows = widgets.map((widget) => [
    <InlineStack key={`${widget.id}-name`} gap="200" align="start">
      <input type="checkbox" />
      <Text as="span" variant="bodyMd">
        {widget.name}
      </Text>
    </InlineStack>,
    <Select
      key={`${widget.id}-widget`}
      label=""
      labelHidden
      options={widgetTypeOptions}
      value={widget.type}
      onChange={(value) => onUpdateWidgetType(widget.id, value)}
    />,
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
        icon={DuplicateIcon}
        accessibilityLabel="Clone widget"
        onClick={() => onCloneWidget(widget.id)}
      />
      <Button
        icon={DeleteIcon}
        accessibilityLabel="Delete widget"
        onClick={() => deleteWidget(widget.id)}
      />
    </ButtonGroup>,
  ]);

  console.log("widgets =====>>>>>", widgets);

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
