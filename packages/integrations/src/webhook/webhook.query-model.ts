import type { Option } from 'oxide.ts'
import type { WebhookSpecification } from './specifications'
import type { IQueryWebhook } from './webhook.type'

export interface IUserQueryModel {
  findOneById: (id: string) => Promise<Option<IQueryWebhook>>
  findOne: (spec: WebhookSpecification) => Promise<Option<IQueryWebhook>>
  find: () => Promise<IQueryWebhook[]>
}
