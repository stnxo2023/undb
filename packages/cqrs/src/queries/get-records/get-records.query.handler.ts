import { convertFilterSpec, IRecordQueryModel, ITableRepository, ViewId, WithRecordTableId } from '@egodb/core'
import type { IQueryHandler } from '@egodb/domain'
import type { IGetRecordsOutput } from './get-records.query.interface.js'
import type { GetRecordsQuery } from './get-records.query.js'

export class GetRecordsQueryHandler implements IQueryHandler<GetRecordsQuery, IGetRecordsOutput> {
  constructor(protected readonly tableRepo: ITableRepository, protected readonly rm: IRecordQueryModel) {}

  async execute(query: GetRecordsQuery) {
    const table = (await this.tableRepo.findOneById(query.tableId)).unwrap()
    console.log(table.schema.fields.map((f) => f.id.value + ':' + f.name.value))
    const filter = table.getSpec(query.viewId)

    let spec = WithRecordTableId.fromString(query.tableId)
      .map((s) => (filter.isNone() ? s : s.and(filter.unwrap())))
      .unwrap()

    if (query.filter) {
      const querySpec = convertFilterSpec(query.filter)
      spec = spec.and(querySpec.unwrap())
    }

    const viewId = query.viewId ? ViewId.fromString(query.viewId) : undefined
    const { records, total } = await this.rm.findAndCount(table.id.value, viewId, spec)

    return { records, total }
  }
}
