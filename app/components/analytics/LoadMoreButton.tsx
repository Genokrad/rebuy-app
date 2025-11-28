import { Button } from "@shopify/polaris";

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export function LoadMoreButton({
  onLoadMore,
  isLoading,
  hasMore,
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <Button onClick={onLoadMore} loading={isLoading}>
        Load More Orders
      </Button>
    </div>
  );
}
