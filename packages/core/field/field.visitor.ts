import type { AutoIncrementField } from './auto-increment-field'
import type { BoolField } from './bool-field'
import type { ColorField } from './color-field'
import type { CreatedAtField } from './created-at-field'
import type { DateField } from './date-field'
import type { DateRangeField } from './date-range-field'
import type { EmailField } from './email-field'
import type { IdField } from './id-field'
import type { NumberField } from './number-field'
import type { ParentField } from './parent-field'
import type { ReferenceField } from './reference-field'
import type { SelectField } from './select-field'
import type { StringField } from './string-field'
import type { TreeField } from './tree-field'
import type { UpdatedAtField } from './updated-at-field'

export interface IFieldVisitor {
  id(value: IdField): void
  createdAt(value: CreatedAtField): void
  updatedAt(value: UpdatedAtField): void
  autoIncrement(value: AutoIncrementField): void
  string(value: StringField): void
  email(value: EmailField): void
  color(value: ColorField): void
  number(value: NumberField): void
  bool(value: BoolField): void
  date(value: DateField): void
  dateRange(value: DateRangeField): void
  select(value: SelectField): void
  reference(value: ReferenceField): void
  tree(value: TreeField): void
  parent(value: ParentField): void
}