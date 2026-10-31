export interface IResponse<T = any, Z = any> {
  message?: boolean | string;
  status?: number;
  data?: T;
  extra?: Z;
}
