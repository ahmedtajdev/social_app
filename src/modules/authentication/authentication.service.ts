import { SignupDto } from "./authentication.dto";

export class AuthenticationService {
  constructor() {}

  signup = async ({
    username,
    email,
    phone,
    password,
    confirmPassword,
  }: SignupDto["body"]): Promise<number> => {
    console.log({
      username,
      email,
      phone,
      password,
      confirmPassword,
    });

    return 201;
  };
}

export default new AuthenticationService();
