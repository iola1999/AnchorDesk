import {
  systemSettingsDefaultValuesUpgrade,
  systemSettingsMetadataUpgrade,
  systemSettingsUpgrade,
} from "./system-settings.mjs";
import { workspaceDirectoriesUpgrade } from "./workspace-directories.mjs";

export const appUpgrades = [
  systemSettingsUpgrade,
  systemSettingsMetadataUpgrade,
  systemSettingsDefaultValuesUpgrade,
  workspaceDirectoriesUpgrade,
];
