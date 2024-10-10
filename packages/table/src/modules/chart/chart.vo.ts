import { ValueObject } from "@undb/domain"
import { z } from "@undb/zod"
import { fieldId } from "../schema"
import { createConditionGroup } from "../schema/fields/condition/condition.type"

const chartFilterOption = z.undefined()

export const chartFilterGroup = createConditionGroup(chartFilterOption, chartFilterOption)

const countChart = z.object({
  type: z.literal("count"),
  config: z.object({
    condition: chartFilterGroup.optional(),
  }),
})

const pieChart = z.object({
  type: z.literal("pie"),
  config: z.object({
    fieldId: fieldId,
    aggregateFieldId: fieldId.optional(),
    aggregateFunction: z.enum(["count", "sum"]).optional(),
  }),
})

const barChart = z.object({
  type: z.literal("bar"),
  config: z.object({
    xFieldId: fieldId,
    yFieldId: fieldId,
    aggregateFunction: z.enum(["count", "sum", "average"]).optional(),
    groupByFieldId: fieldId.optional(),
    stacked: z.boolean().optional(),
  }),
})

export const chart = z.discriminatedUnion("type", [countChart, pieChart, barChart])

export type IChart = z.infer<typeof chart>

export class ChartVO extends ValueObject<IChart> {}
