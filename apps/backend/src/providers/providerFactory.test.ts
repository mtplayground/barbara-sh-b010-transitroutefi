import { describe, expect, it } from "vitest";
import { GoogleMapsProvider } from "./GoogleMapsProvider.js";
import { MockProvider } from "./MockProvider.js";
import { createRoutingProvider } from "./providerFactory.js";

const baseConfig = {
  googleDirectionsLanguage: "en",
  googleDirectionsRegion: "ca"
};

describe("createRoutingProvider", () => {
  it("returns MockProvider when no Google Maps server key is configured", () => {
    const provider = createRoutingProvider(baseConfig);

    expect(provider).toBeInstanceOf(MockProvider);
    expect(provider.name).toBe("mock");
  });

  it("returns MockProvider when the configured Google Maps server key is blank", () => {
    const provider = createRoutingProvider({
      ...baseConfig,
      googleMapsServerKey: "   "
    });

    expect(provider).toBeInstanceOf(MockProvider);
    expect(provider.name).toBe("mock");
  });

  it("returns GoogleMapsProvider when a Google Maps server key is configured", () => {
    const provider = createRoutingProvider({
      ...baseConfig,
      googleMapsServerKey: "server-key"
    });

    expect(provider).toBeInstanceOf(GoogleMapsProvider);
    expect(provider.name).toBe("google");
  });
});
