/**
 * Formats tool invocation names into user-friendly messages
 * Extracts file names and action types to create clear, descriptive text
 */
export function getToolMessage(
  toolName: string,
  toolArgs?: Record<string, any>
): string {
  if (toolName === "str_replace_editor") {
    if (!toolArgs) return "Editing file...";

    const action = toolArgs.command;
    const path = toolArgs.path || toolArgs.file_path;
    const fileName = path ? path.split("/").pop() : "file";

    if (action === "create") {
      return `Creating ${fileName}`;
    } else if (action === "str_replace") {
      return `Editing ${fileName}`;
    } else if (action === "delete") {
      return `Deleting ${fileName}`;
    }
    return `Modifying ${fileName}`;
  } else if (toolName === "file_manager") {
    if (!toolArgs) return "Managing files...";

    const action = toolArgs.action;
    const path = toolArgs.path || toolArgs.file_path;
    const fileName = path ? path.split("/").pop() : "file";

    switch (action) {
      case "list":
        return `Listing files in ${fileName}`;
      case "create":
        return `Creating ${fileName}`;
      case "delete":
        return `Deleting ${fileName}`;
      default:
        return `Managing ${fileName}`;
    }
  }

  return toolName;
}
