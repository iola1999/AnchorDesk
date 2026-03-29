import {
  systemSettingsDefaultValuesUpgrade,
  systemSettingsMetadataUpgrade,
  systemSettingsUpgrade,
} from "./system-settings.mjs";

export const appUpgrades = [
  systemSettingsUpgrade,
  systemSettingsMetadataUpgrade,
  systemSettingsDefaultValuesUpgrade,
];
