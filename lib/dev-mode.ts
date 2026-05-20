/** True in local development — use to show demo credentials, debug hints, etc. */
export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}
