export const shouldActivateKeyboardCard = (
  event: Pick<KeyboardEvent, "key" | "target" | "currentTarget">,
) =>
  event.target === event.currentTarget &&
  (event.key === "Enter" || event.key === " ");
