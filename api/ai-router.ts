import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { settings } from "@db/schema";
import { eq } from "drizzle-orm";
import { getAiConfig, chatWithGemini, buildChatSystem } from "./lib/ai";
import { env } from "./lib/env";

export const aiRouter = createRouter({
  chat: publicQuery
    .input(
      z.object({
        messages: z
          .array(z.object({ role: z.enum(["user", "model"]), content: z.string() }))
          .min(1)
          .max(20),
        locale: z.enum(["fr", "ar"]).default("fr"),
      }),
    )
    .mutation(async ({ input }) => {
      const cfg = await getAiConfig();
      if (!cfg.enabled || !cfg.apiKey) {
        throw new Error("ai_disabled");
      }
      const phoneRow = await getDb()
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, "contactPhone"));
      const phoneVal = phoneRow[0]?.value;
      const contactPhone =
        typeof phoneVal === "string"
          ? phoneVal
          : phoneVal && typeof phoneVal === "object" && "value" in phoneVal
            ? String((phoneVal as { value: unknown }).value)
            : null;

      const system = buildChatSystem({
        storeName: env.appName,
        contactPhone,
        locale: input.locale,
        systemPrompt: cfg.systemPrompt,
      });

      const reply = await chatWithGemini(cfg, input.messages, system);
      return { reply };
    }),
});

export type AiRouter = typeof aiRouter;