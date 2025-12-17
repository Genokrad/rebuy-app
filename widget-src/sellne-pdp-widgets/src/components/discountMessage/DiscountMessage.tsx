const DiscountMessage = ({
  text,
  classProp,
}: {
  text: string;
  classProp: string;
}) => {
  return <div className={classProp}>{text}</div>;
};

export default DiscountMessage;
