import { ISignupDto } from "./authentication.dto";

export class AuthenticationService {
  constructor() {}

  signup = async (data: ISignupDto): Promise<number> => {
    console.log({ data });
    return 201;
  };
}

export default new AuthenticationService();
