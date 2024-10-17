import { dashboardIdSchema } from "@undb/dashboard"
import { Query, type QueryProps } from "@undb/domain"
import { z } from "@undb/zod"

export const getDashboardByIdQuery = z.object({
  id: dashboardIdSchema,
})

export type IGetDashboardByIdQuery = z.infer<typeof getDashboardByIdQuery>

export class GetDashboardByIdQuery extends Query implements IGetDashboardByIdQuery {
  public readonly id: string

  constructor(query: QueryProps<IGetDashboardByIdQuery>) {
    super()
    this.id = query.id
  }
}