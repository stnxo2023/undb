import type { TableDo } from "@undb/table"

export class UnderlyingTable {
  constructor(public readonly table: TableDo) {}

  public get name() {
    return this.table.id.value
  }
}
