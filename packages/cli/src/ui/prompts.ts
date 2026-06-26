import { isCancel, cancel, password, text } from "@clack/prompts";

/** Prompts for a secret value (masked input); exits cleanly if the user cancels. */
export async function promptSecret(message: string): Promise<string> {
  const value = await password({ message });
  if (isCancel(value)) {
    cancel("Aborted.");
    process.exit(0);
  }
  return value;
}

/** Prompts for a plain text value; exits cleanly if the user cancels. */
export async function promptText(message: string): Promise<string> {
  const value = await text({ message });
  if (isCancel(value)) {
    cancel("Aborted.");
    process.exit(0);
  }
  return value;
}
