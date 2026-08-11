import { ChatbotProps } from "../types.ts";
import {
  ChatbotRoot,
  ChatbotTrigger,
  ChatbotWindow,
  ChatbotHeader,
  ChatbotMessages,
  ChatbotInput,
} from "./ChatbotComponents.tsx";

export function Chatbot({
  title,
  subtitle,
  triggerText,
  triggerIcon,
  sendIcon,
  closeIcon,
  position,
  starterPrompts,
  emptyStateText,
  placeholder,
  starterPromptsLabel,
  apiEndpoint,
  initialOpen,
  themeMode,
  classNames,
  theme,
  onError,
}: ChatbotProps) {
  return (
    <ChatbotRoot
      apiEndpoint={apiEndpoint}
      initialOpen={initialOpen}
      position={position}
      themeMode={themeMode}
      theme={theme}
      onError={onError}
      className={classNames?.wrapper}
    >
      <ChatbotTrigger
        icon={triggerIcon}
        text={triggerText}
        className={classNames?.trigger}
      />
      <ChatbotWindow className={classNames?.window}>
        <ChatbotHeader
          title={title}
          subtitle={subtitle}
          closeIcon={closeIcon}
          className={classNames?.header}
        />
        <ChatbotMessages
          emptyStateText={emptyStateText}
          starterPrompts={starterPrompts}
          starterPromptsLabel={starterPromptsLabel}
        />
        <ChatbotInput placeholder={placeholder} sendIcon={sendIcon} />
      </ChatbotWindow>
    </ChatbotRoot>
  );
}
