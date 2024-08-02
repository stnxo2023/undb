import { None, Option, Some } from "@undb/domain"
import { z } from "@undb/zod"
import type { TableComositeSpecification } from "../../../../../specifications"
import { tableId } from "../../../../../table-id.vo"
import type { TableDo } from "../../../../../table.do"
import type { RecordComositeSpecification } from "../../../../records/record/record.composite-specification"
import { viewFilterGroup, type IViewFilterGroup } from "../../../../views/view/view-filter/view-filter.vo"
import { fieldId, FieldIdVo } from "../../field-id.vo"
import type { Field } from "../../field.type"
import type { IFieldVisitor } from "../../field.visitor"
import { AbstractField, baseFieldDTO, createBaseFieldDTO } from "../abstract-field.vo"
import { createAbstractNumberFieldMather } from "../abstractions"
import type { INumberFieldCondition } from "../number-field"
import type { RollupField } from "../rollup-field/rollup-field.vo"
import { ReferenceFieldConstraint, referenceFieldConstraint } from "./reference-field-constraint.vo"
import { ReferenceEqual } from "./reference-field-value.specification"
import { ReferenceFieldValue } from "./reference-field-value.vo"
import { referenceFieldAggregate } from "./reference-field.aggregate"
import { createReferenceFieldCondition, type IReferenceFieldConditionSchema } from "./reference-field.condition"

export const REFERENCE_TYPE = "reference" as const

const referenceFieldOption = z.object({
  isOwner: z.boolean(),
  foreignTableId: tableId,
  symmetricFieldId: fieldId.optional(),
  condition: viewFilterGroup.optional(),
})

export type IReferenceFieldOption = z.infer<typeof referenceFieldOption>

export const createReferenceFieldDTO = createBaseFieldDTO
  .extend({
    type: z.literal(REFERENCE_TYPE),
    option: z.object({
      foreignTableId: tableId,
      createSymmetricField: z.boolean(),
      condition: viewFilterGroup.optional(),
    }),
    constraint: referenceFieldConstraint.optional(),
  })
  .omit({ display: true })

export type ICreateReferenceFieldDTO = z.infer<typeof createReferenceFieldDTO>
export const updateReferenceFieldDTO = createReferenceFieldDTO
  .setKey("id", fieldId)
  .omit({ option: true })
  .merge(
    z.object({
      option: referenceFieldOption,
    }),
  )
export type IUpdateReferenceFieldDTO = z.infer<typeof updateReferenceFieldDTO>

export const referenceFieldDTO = baseFieldDTO.extend({
  type: z.literal(REFERENCE_TYPE),
  option: referenceFieldOption,
  constraint: referenceFieldConstraint.optional(),
})

export type IReferenceFieldDTO = z.infer<typeof referenceFieldDTO>

export class ReferenceField extends AbstractField<
  ReferenceFieldValue,
  ReferenceFieldConstraint,
  IReferenceFieldOption
> {
  public readonly option: Option<IReferenceFieldOption>

  constructor(dto: IReferenceFieldDTO) {
    super(dto)

    const { isOwner, foreignTableId, symmetricFieldId, condition } = dto.option

    this.option = Some({
      isOwner,
      foreignTableId,
      symmetricFieldId,
      condition,
    })
    if (dto.constraint) {
      this.constraint = Some(new ReferenceFieldConstraint(dto.constraint))
    }

    this.display = false
  }

  static create(dto: ICreateReferenceFieldDTO) {
    const { foreignTableId, condition } = dto.option
    return new ReferenceField({
      type: "reference",
      name: dto.name,
      option: { foreignTableId, condition, isOwner: true },
      id: FieldIdVo.fromStringOrCreate(dto.id).value,
    })
  }

  static createSymmetricField(foreignTable: TableDo, table: TableDo, field: ReferenceField) {
    const symmetricField = new ReferenceField({
      type: "reference",
      name: table.schema.getNextFieldName(foreignTable.name.value),
      option: { isOwner: false, foreignTableId: foreignTable.id.value, symmetricFieldId: field.id.value },
      id: FieldIdVo.create().value,
    })

    symmetricField.connect(field)

    return symmetricField
  }

  connect(symmetricField: ReferenceField) {
    this.option.expect("no reference field option").symmetricFieldId = symmetricField.id.value
    symmetricField.option.expect("no reference field option").symmetricFieldId = this.id.value
  }

  override type = REFERENCE_TYPE

  get #constraint(): ReferenceFieldConstraint {
    return this.constraint.unwrapOrElse(() => new ReferenceFieldConstraint({}))
  }

  override get valueSchema() {
    return this.#constraint.schema
  }

  override get mutateSchema() {
    return this.#constraint.mutateSchema
  }

  override accept(visitor: IFieldVisitor): void {
    visitor.reference(this)
  }

  override getSpec(condition: INumberFieldCondition) {
    const spec = createAbstractNumberFieldMather(condition, this.id).exhaustive()

    return Option(spec)
  }

  protected override getConditionSchema(optionType: z.ZodTypeAny): IReferenceFieldConditionSchema {
    return createReferenceFieldCondition(optionType)
  }

  override get aggregate() {
    return referenceFieldAggregate
  }

  override getMutationSpec(value: ReferenceFieldValue): Option<RecordComositeSpecification> {
    return Some(new ReferenceEqual(value, this.id))
  }

  public get isOwner() {
    return this.option.unwrap().isOwner
  }

  public get foreignTableId(): string {
    return this.option.unwrap().foreignTableId
  }

  public get condition(): IViewFilterGroup | undefined {
    return this.option.unwrap().condition
  }

  public get symmetricFieldId() {
    return this.option.unwrap().symmetricFieldId
  }

  public override duplicate(name: string) {
    return new ReferenceField({
      type: "reference",
      name,
      option: {
        isOwner: true,
        foreignTableId: this.foreignTableId,
        symmetricFieldId: undefined,
        condition: this.condition,
      },
      id: FieldIdVo.create().value,
    })
  }

  public override update(dto: IUpdateReferenceFieldDTO): ReferenceField {
    return new ReferenceField({
      type: "reference",
      name: dto.name,
      option: {
        isOwner: this.isOwner,
        foreignTableId: this.foreignTableId,
        symmetricFieldId: this.symmetricFieldId,
        condition: dto.option.condition,
      },
      constraint: dto.constraint,
      id: this.id.value,
    })
  }

  getRollupFields(fields: Field[]): RollupField[] {
    return fields.filter((f) => f.type === "rollup" && f.referenceFieldId === this.id.value) as RollupField[]
  }

  getSymmetricField(foreignTable: TableDo): Option<ReferenceField> {
    if (!this.symmetricFieldId) {
      return None
    }
    return foreignTable.schema.getFieldById(new FieldIdVo(this.symmetricFieldId)) as Option<ReferenceField>
  }

  $deleteSymmetricField(foreignTable: TableDo) {
    if (!this.symmetricFieldId) {
      return [null, None] as [null, Option<TableComositeSpecification>]
    }
    return foreignTable.$deleteField({ id: this.symmetricFieldId })
  }
}