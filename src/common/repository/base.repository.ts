import {
  AnyKeys,
  CreateOptions,
  FlattenMaps,
  HydratedDocument,
  Model,
  PopulateOptions,
  ProjectionType,
  Query,
  QueryFilter,
  QueryOptions,
} from "mongoose";

export abstract class DatabaseRepository<TRawDocType> {
  applyQueryOptions(
    query: Query<any, any>,
    options?: QueryOptions<TRawDocType> | null | undefined,
  ) {
    const { select, populate, sort, skip, limit, lean, session } =
      options ?? {};

    if (select) query.select(select);

    if (populate) {
      query.populate(populate as PopulateOptions[]);
    }

    if (sort) query.sort(sort);

    if (skip !== undefined) query.skip(skip);

    if (limit !== undefined) query.limit(limit);

    if (lean) query.lean();

    if (session) query.session(session);

    return query;
  }
  constructor(protected model: Model<TRawDocType>) {}

  //////////////////////////// Create Methods ////////////////////////////

  async create({
    data,
  }: {
    data: AnyKeys<TRawDocType>;
  }): Promise<HydratedDocument<TRawDocType>>;

  async create({
    data,
  }: {
    data: Array<AnyKeys<TRawDocType>>;
  }): Promise<HydratedDocument<TRawDocType>[]>;

  async create({
    data,
    options,
  }: {
    data: Array<AnyKeys<TRawDocType>>;
    options?: CreateOptions;
  }): Promise<HydratedDocument<HydratedDocument<TRawDocType>[]>>;

  async create({
    data,
    options = {},
  }: {
    data: any;
    options?: CreateOptions;
  }): Promise<any> {
    return await this.model.create(data, options);
  }

  async createOne({
    data,
    options = {},
  }: {
    data: AnyKeys<TRawDocType>;
    options?: CreateOptions;
  }): Promise<HydratedDocument<TRawDocType>> {
    const [doc] = await this.create({ data: [data], options });
    return doc as HydratedDocument<TRawDocType>;
  }

  /////////////////////////// Find Methods ////////////////////////////

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: (QueryOptions<TRawDocType> & { lean?: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDocType> | null | undefined>;

  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: (QueryOptions<TRawDocType> & { lean?: true }) | null | undefined;
  }): Promise<FlattenMaps<TRawDocType> | null | undefined>;

  async findOne({
    filter = {},
    projection = {},
    options,
  }: {
    filter: QueryFilter<TRawDocType>;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: QueryOptions<TRawDocType> | null | undefined;
  }): Promise<
    HydratedDocument<TRawDocType> | FlattenMaps<TRawDocType> | null | undefined
  > {
    const query = this.model.findOne(filter, projection);
    this.applyQueryOptions(query, options);
    return await query.exec();
  }

  async findById({
    id,
    projection,
    options,
  }: {
    id: string;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: (QueryOptions<TRawDocType> & { lean?: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDocType> | null | undefined>;

  async findById({
    id,
    projection,
    options,
  }: {
    id: string;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: (QueryOptions<TRawDocType> & { lean?: true }) | null | undefined;
  }): Promise<FlattenMaps<TRawDocType> | null | undefined>;

  async findById({
    id,
    projection = {},
    options,
  }: {
    id: string;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: QueryOptions<TRawDocType> | null | undefined;
  }): Promise<
    HydratedDocument<TRawDocType> | FlattenMaps<TRawDocType> | null | undefined
  > {
    const query = this.model.findById(id, projection);
    this.applyQueryOptions(query, options);
    return await query.exec();
  }

  async find({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDocType> | undefined;
    projection?: ProjectionType<TRawDocType> | undefined | null;
    options?: QueryOptions<TRawDocType>;
  }) {
    return await this.model.find(filter, projection, options);
  }

  //////////////////////////// Update Methods ////////////////////////////

  //////////////////////////// Delete Methods ////////////////////////////
}
