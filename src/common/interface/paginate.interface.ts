export interface IPaginate<HTRawDocType = any> {
  docsCount: number;
  limit: number;
  totalPages: number;
  currentPage: number;
  docs: HTRawDocType[];
}
