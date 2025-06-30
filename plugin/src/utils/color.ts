import { config } from "../config";
import { logToUI } from "./log";

export function parseColor(value: string): RGBA {
  if (value.startsWith("#")) {
    const hex = value.replace("#", "");
    const len = hex.length;
    if (len !== 6 && len !== 8) {
      logToUI(`Invalid color format '${value}', using default black`);
      return { r: 0, g: 0, b: 0, a: 1 };
    }
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
      a: len === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
    };
  }
  logToUI(`Invalid color format '${value}', using default black`);
  return { r: 0, g: 0, b: 0, a: 1 };
}

export function toHexColor(value: VariableValue): VariableValue {
  if (typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS") {
    return { type: "VARIABLE_ALIAS", id: value.id };
  }

  if (typeof value === "object" && "r" in value) {
    const { r, g, b, a } = value as RGBA;
    const toHex = (n: number) => {
      const val = Math.round(n * 255 * 100) / 100; // Làm tròn đến 2 chữ số thập phân
      return Math.round(val).toString(16).padStart(2, "0").toUpperCase();
    };
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    return a < 1 ? `${hex}${toHex(a)}` : hex;
  }

  return value;
}

export function areRGBAsEqual(a: RGBA, b: RGBA, epsilon: number = config.COLOR_EPSILON): boolean {
  return (
    Math.abs(a.r - b.r) < epsilon &&
    Math.abs(a.g - b.g) < epsilon &&
    Math.abs(a.b - b.b) < epsilon &&
    Math.abs(a.a - b.a) < epsilon
  );
}