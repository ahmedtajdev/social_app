import mongoose, {
  AnyKeys,
  CreateOptions,
  DeleteResult,
  FlattenMaps,
  HydratedDocument,
  Model,
  MongooseBaseQueryOptions,
  MongooseUpdateQueryOptions,
  PopulateOptions,
  ProjectionType,
  Query,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateWriteOpResult,
} from "mongoose";
import { IPaginate } from "../interface";

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
    id: mongoose.Types.ObjectId;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: (QueryOptions<TRawDocType> & { lean?: false }) | null | undefined;
  }): Promise<HydratedDocument<TRawDocType> | null | undefined>;

  async findById({
    id,
    projection,
    options,
  }: {
    id: mongoose.Types.ObjectId;
    projection?: ProjectionType<TRawDocType> | null | undefined;
    options?: (QueryOptions<TRawDocType> & { lean?: true }) | null | undefined;
  }): Promise<FlattenMaps<TRawDocType> | null | undefined>;

  async findById({
    id,
    projection = {},
    options,
  }: {
    id: mongoose.Types.ObjectId;
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
    filter = {},
    options = {},
  }: {
    filter?: QueryFilter<TRawDocType>;
    options?: QueryOptions<TRawDocType>;
  }): Promise<HydratedDocument<TRawDocType>[]> {
    const query = this.model.find(filter);

    this.applyQueryOptions(query, options);

    return query.exec();
  }

  async countDocuments({
    filter = {},
  }: {
    filter: QueryFilter<TRawDocType>;
  }): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }

  async paginate({
    filter = {},
    page = 1,
    limit = 5,
    options = {},
  }: {
    filter?: QueryFilter<TRawDocType>;
    page?: number;
    limit?: number;
    options?: QueryOptions<TRawDocType>;
  }): Promise<IPaginate<HydratedDocument<TRawDocType>>> {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.max(5, Number(limit) || 5);

    const [docsCount, docs] = await Promise.all([
      this.countDocuments({
        filter,
      }),
      this.find({
        filter,
        options: {
          ...options,
          skip: (currentPage - 1) * pageLimit,
          pageLimit,
        },
      }),
    ]);

    return {
      docsCount,
      limit: pageLimit,
      totalPages: Math.ceil(docsCount / pageLimit),
      currentPage,
      docs,
    };
  }

  //////////////////////////// Update Methods ////////////////////////////

  async updateOne({
    filter = {},
    update,
    options = {},
  }: {
    filter: QueryFilter<TRawDocType>;
    update: UpdateQuery<TRawDocType> | UpdateWithAggregationPipeline;
    options?: MongooseUpdateQueryOptions<TRawDocType> | null;
  }): Promise<UpdateWriteOpResult> {
    return await this.model.updateOne(filter, update, options);
  }

  async updateMany({
    filter = {},
    update,
    options = {},
  }: {
    filter: QueryFilter<TRawDocType>;
    update: UpdateQuery<TRawDocType> | UpdateWithAggregationPipeline;
    options?: MongooseUpdateQueryOptions<TRawDocType> | null;
  }): Promise<UpdateWriteOpResult> {
    return await this.model.updateMany(filter, update, options);
  }

  async findOneAndUpdate({
    filter = {},
    update,
    options = {},
  }: {
    filter?: QueryFilter<TRawDocType>;
    update?: UpdateQuery<TRawDocType>;
    options?: QueryOptions<TRawDocType> | null;
  }): Promise<HydratedDocument<TRawDocType> | null> {
    return this.model.findOneAndUpdate(filter, update, {
      returnDocument: "after",
      ...options,
    });
  }

  async findByIdAndUpdate({
    id,
    update,
    options = {},
  }: {
    id?: mongoose.Types.ObjectId;
    update?: UpdateQuery<TRawDocType>;
    options?: QueryOptions<TRawDocType> | null;
  }): Promise<HydratedDocument<TRawDocType> | null> {
    return this.model.findByIdAndUpdate(id, update, {
      returnDocument: "after",
      ...options,
    });
  }

  //////////////////////////// Delete Methods ////////////////////////////

  async deleteOne({
    filter = {},
    options = {},
  }: {
    filter?: QueryFilter<TRawDocType>;
    options?: MongooseBaseQueryOptions<TRawDocType> | null;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter, options);
  }

  async deleteMany({
    filter = {},
  }: {
    filter?: QueryFilter<TRawDocType>;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter);
  }

  async findOneAndDelete({
    filter,
  }: {
    filter: QueryFilter<TRawDocType>;
  }): Promise<HydratedDocument<TRawDocType> | null> {
    return this.model.findOneAndDelete(filter);
  }

  async findByIdAndDelete({
    id,
  }: {
    id: mongoose.Types.ObjectId;
  }): Promise<HydratedDocument<TRawDocType> | null> {
    return this.model.findByIdAndDelete(id);
  }
}
