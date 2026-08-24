export const HEALTH_SCOPES = ["steps", "heart_rate", "weight", "sleep"] as const;
export type HealthScope = (typeof HEALTH_SCOPES)[number];
export type HealthProvider = "apple_health" | "health_connect";

const mapScope = (scope: HealthScope) =>
  scope === "heart_rate" ? "heartRate" : scope;

export async function connectNativeHealth(provider: HealthProvider, scopes: HealthScope[]) {
  if (typeof window === "undefined") return { ok: false, demo: true as const };

  const [{ Capacitor }, { Health }] = await Promise.all([
    import("@capacitor/core"),
    import("@capgo/capacitor-health"),
  ]);
  const platform = Capacitor.getPlatform();

  if (platform === "web") return { ok: false, demo: true as const };
  if (provider === "apple_health" && platform !== "ios") {
    return { ok: false, reason: "Apple Health yalnızca iOS cihazlarda kullanılabilir." };
  }
  if (provider === "health_connect" && platform !== "android") {
    return { ok: false, reason: "Health Connect yalnızca Android cihazlarda kullanılabilir." };
  }

  const availability = await Health.isAvailable();
  if (!availability.available) {
    return { ok: false, reason: availability.reason || "Cihaz sağlık servisi kullanılamıyor." };
  }

  const read = scopes.map(mapScope) as any[];
  const authorization = await Health.requestAuthorization({ read, write: [] });
  const denied = authorization.readDenied ?? [];
  const authorized = authorization.readAuthorized ?? [];

  return {
    ok: authorized.length > 0 || read.length === 0,
    authorized,
    denied,
    platform,
  };
}

export async function syncNativeHealth(scopes: HealthScope[]) {
  if (typeof window === "undefined") return { samples: [], demo: true as const };
  const [{ Capacitor }, { Health }] = await Promise.all([
    import("@capacitor/core"),
    import("@capgo/capacitor-health"),
  ]);
  if (Capacitor.getPlatform() === "web") return { samples: [], demo: true as const };

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const samples: Array<{ type: string; value: number; unit: string; measuredAt: string; startedAt?: string; endedAt?: string; sourceRef?: string }> = [];

  for (const scope of scopes) {
    const result = await Health.readSamples({
      dataType: mapScope(scope) as any,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 250,
    });
    for (const sample of result.samples ?? []) {
      samples.push({
        type: scope,
        value: Number(sample.value),
        unit: sample.unit ?? "",
        measuredAt: sample.startDate ?? sample.endDate ?? new Date().toISOString(),
        startedAt: scope === "sleep" ? sample.startDate : undefined,
        endedAt: scope === "sleep" ? sample.endDate : undefined,
        sourceRef: sample.platformId ? `${Capacitor.getPlatform()}:${scope}:${sample.platformId}` : undefined,
      });
    }
  }

  return { samples };
}
