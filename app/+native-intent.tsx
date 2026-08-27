export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    if (path.includes("dataUrl=")) {
      console.log("[NativeIntent] Intercepted dataUrl path:", path);
      return "/";
    }

    return path;
  } catch (error) {
    console.error("[NativeIntent] Failed to process path:", error);
    return "/";
  }
}