import { settings } from "./context";

/**
 * Convert 0.0-1.0 to voicemeeter gain of -60 to 12
 */
export function convertVolumeToGain(level: number): number {
  return level * (settings.maxdb - settings.mindb) + settings.mindb;
  // Default values:
  // return (level * 72) - 60;
  // 72 = total range from max to minimum values
  // -60 = minimum value
}

/**
 * Convert -60-12 voicemeeter gain to 0.0-1.0
 */
export function convertGainToVolume(level: number): number {
  return (level - settings.mindb) / (settings.maxdb - settings.mindb);
  // Default values:
  // return (level + 60) / 72;
}

/**
 * Clamp between 0 and 1 for midi mixer volume/peak levels
 * @param value
 */
export function clampBar(value: number): number {
  return Math.min(Math.max(0, value), 1);
}

/**
 * convert 0-1 to -12 to 12
 * @param value
 */
export function convertGainToPad(level: number): number {
  return level * 24 - 12
}

/**
 * convert -12 to 12 to 0-1
 * @param value
 */
export function convertPadToGain(level: number): number {
  return (level + 12) / 24
}