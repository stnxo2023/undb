import { None, Some, applyRules } from "@undb/domain"
import type { ISpaceId } from "@undb/space"
import { createTableDTO, type ICreateTableDTO, type ITableDTO } from "./dto"
import { TableCreatedEvent } from "./events"
import { ReferenceField, TableRLSGroup, type ICreateFormDTO, type IFormsDTO, type IRLSGroupDTO } from "./modules"
import { FormsVO } from "./modules/forms/forms.vo"
import type { ICreateSchemaDTO } from "./modules/schema/dto/create-schema.dto"
import type { ISchemaDTO } from "./modules/schema/dto/schema.dto"
import { FieldNameShouldBeUnique } from "./modules/schema/rules"
import { Schema } from "./modules/schema/schema.vo"
import type { ICreateViewDTO, IViewsDTO } from "./modules/views/dto"
import { Views } from "./modules/views/views.vo"
import { TableBaseIdSpecification, TableViewsSpecification } from "./specifications"
import { TableFormsSpecification } from "./specifications/table-forms.specification"
import { TableIdSpecification } from "./specifications/table-id.specification"
import { TableNameSpecification } from "./specifications/table-name.specification"
import { WithTableRLS } from "./specifications/table-rls.specification"
import { TableSchemaSpecification } from "./specifications/table-schema.specification"
import { TableSpaceIdSpecification } from "./specifications/table-space-id.specification"
import { TableIdVo } from "./table-id.vo"
import { TableNameVo } from "./table-name.vo"
import { TableDo } from "./table.do"

export interface ITableBuilder {
  reset(): void
  setId(id?: string): ITableBuilder
  setBaseId(id: string): ITableBuilder
  setSpaceId(spaceId: ISpaceId): ITableBuilder
  setName(name: string): ITableBuilder
  createSchema(dto: ICreateSchemaDTO): ITableBuilder
  setSchema(dto: ISchemaDTO): ITableBuilder
  createViews(dto?: ICreateViewDTO[]): ITableBuilder
  createForms(dto?: ICreateFormDTO[]): ITableBuilder
  setViews(dto: IViewsDTO): ITableBuilder
  setForms(dto?: IFormsDTO): ITableBuilder
  setRLS(dto?: IRLSGroupDTO): ITableBuilder
  build(): TableDo
}

export class TableBuilder implements ITableBuilder {
  private table!: TableDo

  constructor() {
    this.reset()
  }

  reset(): void {
    this.table = new TableDo()
  }

  setId(id?: string): ITableBuilder {
    new TableIdSpecification(TableIdVo.fromStringOrCreate(id)).mutate(this.table)
    return this
  }

  setBaseId(id: string): ITableBuilder {
    new TableBaseIdSpecification(id).mutate(this.table)
    return this
  }

  setSpaceId(spaceId: ISpaceId): ITableBuilder {
    new TableSpaceIdSpecification(spaceId).mutate(this.table)
    return this
  }

  setName(name: string): ITableBuilder {
    new TableNameSpecification(new TableNameVo(name)).mutate(this.table)
    return this
  }

  createSchema(dto: ICreateSchemaDTO): ITableBuilder {
    new TableSchemaSpecification(Schema.create(dto)).mutate(this.table)
    return this
  }

  setSchema(dto: ISchemaDTO): ITableBuilder {
    new TableSchemaSpecification(Schema.fromJSON(dto)).mutate(this.table)
    return this
  }

  createViews(dto?: ICreateViewDTO[]): ITableBuilder {
    new TableViewsSpecification(Views.create(dto)).mutate(this.table)
    return this
  }

  setViews(dto: IViewsDTO): ITableBuilder {
    new TableViewsSpecification(Views.fromJSON(dto)).mutate(this.table)
    return this
  }

  createForms(dto: ICreateFormDTO[]): ITableBuilder {
    new TableFormsSpecification(FormsVO.create(this.table, dto)).mutate(this.table)
    return this
  }

  setForms(dto: IFormsDTO = []): ITableBuilder {
    new TableFormsSpecification(FormsVO.fromJSON(dto)).mutate(this.table)
    return this
  }

  setRLS(dto?: IRLSGroupDTO): ITableBuilder {
    new WithTableRLS(None, dto ? Some(TableRLSGroup.fromJSON(dto)) : None).mutate(this.table)
    return this
  }

  build() {
    return this.table
  }
}

export class TableFactory {
  private static get builder() {
    return new TableBuilder()
  }

  static create(dto: ICreateTableDTO): TableDo {
    dto = createTableDTO.parse(dto)
    const table = this.builder
      .setId(dto.id)
      .setBaseId(dto.baseId)
      .setSpaceId(dto.spaceId)
      .setName(dto.name)
      .createSchema(dto.schema)
      .createViews(dto.views)
      .createForms(dto.forms)
      .build()

    applyRules(new FieldNameShouldBeUnique(table.schema))

    // @ts-ignore - TODO: fix this
    table.addDomainEvent(new TableCreatedEvent({ table: table.toJSON() }))
    return table
  }

  static createMany(dtos: ICreateTableDTO[]): TableDo[] {
    const tables = dtos.map((dto) => this.create(dto))

    const ts = tables.map((table) => ({ table, referenceFields: table.schema.getReferenceFields() }))

    for (const { table, referenceFields } of ts) {
      for (const referenceField of referenceFields) {
        const foreignTable = tables.find((table) => table.id.value === referenceField.foreignTableId)
        if (!foreignTable) {
          throw new Error("Foreign table not found")
        }
        const symmetricField = ReferenceField.createSymmetricField(table, foreignTable, referenceField)
        foreignTable.$createFieldSpec(symmetricField)
      }
    }

    return tables
  }

  static fromJSON(dto: ITableDTO): TableDo {
    return this.builder
      .setId(dto.id)
      .setBaseId(dto.baseId)
      .setName(dto.name)
      .setSchema(dto.schema)
      .setSpaceId(dto.spaceId)
      .setViews(dto.views)
      .setForms(dto.forms)
      .setRLS(dto.rls)
      .build()
  }
}
