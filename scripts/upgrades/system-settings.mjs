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
            summary,
            description,
            created_at,
            updated_at
          ) values ($1, $2, $3, $4, $5, now(), now())
          on conflict (setting_key) do nothing
        `,
        [row.settingKey, row.valueText, row.isSecret, row.summary, row.description],
      );
    }

    return {
      checkedCount: rows.length,
    };
  },
};

export const systemSettingsMetadataUpgrade = {
  key: "2026-03-system-settings-metadata",
  description: "Refresh system_settings metadata fields without touching stored values.",
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
            summary,
            description,
            created_at,
            updated_at
          ) values ($1, $2, $3, $4, $5, now(), now())
          on conflict (setting_key) do update set
            is_secret = excluded.is_secret,
            summary = excluded.summary,
            description = excluded.description,
            updated_at = now()
        `,
        [row.settingKey, row.valueText, row.isSecret, row.summary, row.description],
      );
    }

    return {
      checkedCount: rows.length,
    };
  },
};

export const systemSettingsDefaultValuesUpgrade = {
  key: "2026-03-system-settings-default-values",
  description: "Backfill default values for system_settings rows that are still empty.",
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
            summary,
            description,
            created_at,
            updated_at
          ) values ($1, $2, $3, $4, $5, now(), now())
          on conflict (setting_key) do update set
            value_text = case
              when btrim(coalesce(system_settings.value_text, '')) = '' then excluded.value_text
              else system_settings.value_text
            end,
            updated_at = case
              when btrim(coalesce(system_settings.value_text, '')) = '' then now()
              else system_settings.updated_at
            end
        `,
        [row.settingKey, row.valueText, row.isSecret, row.summary, row.description],
      );
    }

    return {
      checkedCount: rows.length,
    };
  },
};
