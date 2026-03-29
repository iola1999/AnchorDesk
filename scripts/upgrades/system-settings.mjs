import { buildSystemSettingSeedRows } from "../lib/system-settings.mjs";

export const systemSettingsUpgrade = {
  key: "2026-03-system-settings-seed",
  description: "Ensure system_settings contains all defined runtime setting keys.",
  blocking: true,
  safeInDevStartup: true,
  async run(context) {
    const rows = buildSystemSettingSeedRows(context.env);

    for (const row of rows) {
      await context.client.query(
        `
          insert into system_settings (
            setting_key,
            value_text,
            is_secret,
            description,
            created_at,
            updated_at
          ) values ($1, $2, $3, $4, now(), now())
          on conflict (setting_key) do nothing
        `,
        [row.settingKey, row.valueText, row.isSecret, row.description],
      );
    }

    return {
      checkedCount: rows.length,
    };
  },
};
