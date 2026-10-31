import bcrypt from "bcrypt";

export const hash = async (
  plainText: string,
  rounds: number = 12,
  minor: "a" | "b" | undefined = "b",
) => {
  const salt = await bcrypt.genSalt(rounds, minor);
  return await bcrypt.hash(plainText, salt);
};

export const compare = async (plainText: string, cipherText: string) => {
  return await bcrypt.compare(plainText, cipherText);
};
