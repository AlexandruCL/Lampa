import { AgentLang } from "@lampa/shared";

/** The agent's language from `navigator.language`: its first two letters if the agent speaks them, else English. */
export function visitorLang(navigatorLanguage: string | undefined): AgentLang {
  const parsed = AgentLang.safeParse((navigatorLanguage ?? "").slice(0, 2).toLowerCase());
  return parsed.success ? parsed.data : "en";
}
