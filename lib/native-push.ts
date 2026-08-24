export async function registerNativePush(): Promise<{ platform: string; token: string } | null> {
  if (typeof window === "undefined") return null;
  const [{ Capacitor }, { PushNotifications }] = await Promise.all([
    import("@capacitor/core"),
    import("@capacitor/push-notifications"),
  ]);
  const platform = Capacitor.getPlatform();
  if (platform === "web") return null;

  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === "prompt") permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") throw new Error("Bildirim izni verilmedi.");

  return new Promise(async (resolve, reject) => {
    const registration = await PushNotifications.addListener("registration", async ({ value }) => {
      await registration.remove();
      await registrationError.remove();
      resolve({ platform, token: value });
    });
    const registrationError = await PushNotifications.addListener("registrationError", async (error) => {
      await registration.remove();
      await registrationError.remove();
      reject(new Error(error.error || "Push kaydı başarısız."));
    });
    await PushNotifications.register();
  });
}
