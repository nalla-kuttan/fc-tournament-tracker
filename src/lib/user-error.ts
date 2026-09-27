// Turns anything a failed request can throw into one sentence a player can
// act on. `action` completes "… could not be <action>", e.g. "saved".
export function userFacingError(error: unknown, subject: string, action: string) {
  const fallback = `${subject} could not be ${action}. Try again.`;
  // fetch() rejects with a TypeError when the network is down or the request never arrives.
  if (error instanceof TypeError) return `${subject} could not be ${action}. Check your connection and try again.`;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
