export const formatMessage = (message: string) => {
  let formattedMessage = message;

  // Bold formatting
  formattedMessage = formattedMessage
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/####\s*(.*?)(?:\r?\n|$)/g, "<b>$1</b>\n")
    .replace(/###\s*(.*?)(?:\r?\n|$)/g, "<b>$1</b>\n");

  // Bullet points formatting
  formattedMessage = formattedMessage.replace(/^\*(.*?)$/gm, "• $1");

  return formattedMessage;
};
