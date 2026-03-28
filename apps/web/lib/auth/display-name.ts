import { z } from "zod";

export const ACCOUNT_DISPLAY_NAME_MAX_LENGTH = 120;

export const displayNameSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "显示名称不能为空。")
    .max(ACCOUNT_DISPLAY_NAME_MAX_LENGTH, `显示名称不能超过 ${ACCOUNT_DISPLAY_NAME_MAX_LENGTH} 个字符。`),
});

export type DisplayNameInput = z.infer<typeof displayNameSchema>;

export function validateDisplayNameInput(input: unknown) {
  return displayNameSchema.safeParse(input);
}
