export function isFileRenamedEvent(
  value: unknown,
): value is { type: "file.renamed"; payload: { id: string; name: string; previous_name: string } } {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    value.type !== "file.renamed" ||
    !("payload" in value) ||
    typeof value.payload !== "object" ||
    value.payload === null
  ) {
    return false;
  }

  return (
    "id" in value.payload &&
    typeof value.payload.id === "string" &&
    "name" in value.payload &&
    typeof value.payload.name === "string"
  );
}
