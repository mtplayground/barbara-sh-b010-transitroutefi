import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotEnv } from "dotenv";

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 8080;
const DEFAULT_NODE_ENV = "development";
const DEFAULT_GOOGLE_DIRECTIONS_LANGUAGE = "en";
const DEFAULT_GOOGLE_DIRECTIONS_REGION = "ca";

type NodeEnv = "development" | "test" | "production";

export interface AppConfig {
  nodeEnv: NodeEnv;
  host: string;
  port: number;
  googleMapsServerKey?: string;
  googleMapsBrowserKey?: string;
  googleDirectionsLanguage: string;
  googleDirectionsRegion: string;
  isGoogleMapsConfigured: boolean;
}

function loadEnvironmentFile(): void {
  const explicitEnvFile = process.env.ENV_FILE;
  const candidatePaths = [
    explicitEnvFile,
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../.env"),
    resolve(process.cwd(), "../../.env")
  ].filter((path): path is string => Boolean(path));

  const envFile = candidatePaths.find((path) => existsSync(path));

  if (envFile) {
    loadDotEnv({ path: envFile, quiet: true });
    return;
  }

  loadDotEnv({ quiet: true });
}

function getOptionalString(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getString(name: string, defaultValue: string): string {
  return getOptionalString(name) ?? defaultValue;
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

function parseNodeEnv(value: string | undefined): NodeEnv {
  const nodeEnv = value ?? DEFAULT_NODE_ENV;
  if (nodeEnv === "development" || nodeEnv === "test" || nodeEnv === "production") {
    return nodeEnv;
  }

  throw new Error(
    `Invalid NODE_ENV value: ${nodeEnv}. Expected development, test, or production.`
  );
}

loadEnvironmentFile();

const googleMapsServerKey = getOptionalString("GOOGLE_MAPS_SERVER_KEY");

export const appConfig: AppConfig = {
  nodeEnv: parseNodeEnv(process.env.NODE_ENV),
  host: getString("HOST", DEFAULT_HOST),
  port: parsePort(process.env.PORT),
  googleMapsServerKey,
  googleMapsBrowserKey: getOptionalString("VITE_GOOGLE_MAPS_BROWSER_KEY"),
  googleDirectionsLanguage: getString(
    "GOOGLE_DIRECTIONS_LANGUAGE",
    DEFAULT_GOOGLE_DIRECTIONS_LANGUAGE
  ),
  googleDirectionsRegion: getString(
    "GOOGLE_DIRECTIONS_REGION",
    DEFAULT_GOOGLE_DIRECTIONS_REGION
  ),
  isGoogleMapsConfigured: Boolean(googleMapsServerKey)
};
