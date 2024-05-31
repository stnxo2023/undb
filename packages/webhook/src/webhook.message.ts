import { z } from "@undb/zod"
import { webhookHeadersSchema } from "./webhook-headers.vo"

export const webhookMessage = z.object({
  headers: webhookHeadersSchema,
  body: z.object({
    id: z.string().uuid(),
    operatorId: z.string(),
    timestamp: z.date(),
    // TODO: type
    event: z.any(),
  }),
})

export type IWebhookMessage = z.infer<typeof webhookMessage>
