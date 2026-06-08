import type { AppConfig } from "../config/env.js";
import { appConfig } from "../config/env.js";
import { GoogleMapsProvider } from "./GoogleMapsProvider.js";
import { MockProvider } from "./MockProvider.js";
import type { RoutingProvider } from "./RoutingProvider.js";

export type RoutingProviderFactoryConfig = Pick<
  AppConfig,
  "googleDirectionsLanguage" | "googleDirectionsRegion" | "googleMapsServerKey"
>;

export function createRoutingProvider(
  config: RoutingProviderFactoryConfig = appConfig
): RoutingProvider {
  const googleMapsServerKey = config.googleMapsServerKey?.trim();

  if (googleMapsServerKey) {
    return new GoogleMapsProvider({
      apiKey: googleMapsServerKey,
      language: config.googleDirectionsLanguage,
      region: config.googleDirectionsRegion
    });
  }

  return new MockProvider();
}
