import z from "zod";
import { signup } from "./authentication.validation";

export type SignupDto = z.infer<ReturnType<typeof signup>>;
