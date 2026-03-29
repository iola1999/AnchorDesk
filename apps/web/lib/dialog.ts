export function normalizeDialogText(value: string) {
  return value.trim();
}

export function canSubmitDialogText({
  value,
  initialValue,
  requireChange = false,
}: {
  value: string;
  initialValue?: string;
  requireChange?: boolean;
}) {
  const normalizedValue = normalizeDialogText(value);
  if (!normalizedValue) {
    return false;
  }

  if (!requireChange) {
    return true;
  }

  return normalizedValue !== normalizeDialogText(initialValue ?? "");
}
