import { Request } from "express";

export const getIssuer = (req: Request): string => {
  return `${req.protocol}://${req.host}`;
};
