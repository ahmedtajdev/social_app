export interface IPaginate<HTRawDocType> {
  docsCount: number;
  limit: number;
  totalPages: number;
  currentPage: number;
  docs: HTRawDocType[];
}
