const Button = ({
  onClick,
  text,
  classProp,
  dataAttribute,
  isLoading = false,
  disabled = false,
  backgroundColor,
}: {
  onClick: () => void;
  text: string;
  classProp: string;
  dataAttribute?: string;
  isLoading?: boolean;
  disabled?: boolean;
  backgroundColor?: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={classProp}
      data-sellence-widget-button={dataAttribute}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      style={
        backgroundColor
          ? {
              backgroundColor,
              borderColor: backgroundColor,
            }
          : undefined
      }
    >
      {isLoading ? "Adding..." : text}
    </button>
  );
};

export default Button;
