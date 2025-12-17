const Button = ({
  onClick,
  text,
  classProp,
  dataAttribute,
  isLoading = false,
  disabled = false,
}: {
  onClick: () => void;
  text: string;
  classProp: string;
  dataAttribute?: string;
  isLoading?: boolean;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      className={classProp}
      data-sellence-widget-button={dataAttribute}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? "Adding..." : text}
    </button>
  );
};

export default Button;
