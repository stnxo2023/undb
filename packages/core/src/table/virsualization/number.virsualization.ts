import { z } from 'zod'
import { FieldId, fieldIdSchema } from '../field/index.js'
import {
  baseCreateVirsualizationSchema,
  baseUpdateVirsualizationSchema,
  baseVirsualizationSchema,
} from './virsualization.schema.js'
import type { IVirsualization } from './virsualization.type.js'
import { type IVirsualizationTypeSchema } from './virsualization.type.js'
import type { IVirsualizationVisitor } from './virsualization.visitor.js'
import { VirsualizationVO } from './virsualization.vo.js'

const numberAggregateFunction = z.enum(['sum', 'average', 'min', 'max', 'count'])

export type INumberAggregateFunction = z.infer<typeof numberAggregateFunction>

export const numberAggregateFunctions: INumberAggregateFunction[] = ['sum', 'average', 'max', 'min', 'count']

export const createNumberVirsualizationSchema = z
  .object({
    type: z.literal('number'),
    fieldId: fieldIdSchema.optional(),
    numberAggregateFunction: numberAggregateFunction.optional(),
  })
  .merge(baseCreateVirsualizationSchema)

export const updateNumberVirsualizationSchema = z
  .object({
    type: z.literal('number'),
    fieldId: fieldIdSchema.optional(),
    numberAggregateFunction: numberAggregateFunction.optional(),
  })
  .merge(baseUpdateVirsualizationSchema)

export const numberVirsualization = z
  .object({
    fieldId: fieldIdSchema.optional(),
    numberAggregateFunction: numberAggregateFunction.optional(),
    type: z.literal('number'),
  })
  .merge(baseVirsualizationSchema)

export type INumberVirsualizationSchema = z.infer<typeof numberVirsualization>

export type INumberVirsualization = IVirsualization & {
  fieldId?: FieldId
  numberAggregateFunction?: INumberAggregateFunction
}

export class NumberVirsualization extends VirsualizationVO<INumberVirsualization> {
  type: IVirsualizationTypeSchema = 'number'

  public get fieldId() {
    return this.props.fieldId
  }

  public get numberAggregateFunction() {
    return this.props.numberAggregateFunction
  }

  static create(input: z.infer<typeof createNumberVirsualizationSchema>) {
    return new NumberVirsualization({
      ...super.create(input),
      type: 'number',
      fieldId: input.fieldId ? FieldId.fromString(input.fieldId) : undefined,
      numberAggregateFunction: input.numberAggregateFunction,
    })
  }

  accept(v: IVirsualizationVisitor): void {
    v.number(this)
  }
}
