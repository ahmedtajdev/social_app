export interface IResponse<T = any, Z = any> {
  message?: boolean;
  status?: number;
  data?: T;
  extra?: Z;
}
