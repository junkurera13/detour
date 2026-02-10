export const DEMO_EMAIL = "parkjundk@gmail.com";

export function isDemoUser(email: string | undefined | null): boolean {
  return email === DEMO_EMAIL;
}
