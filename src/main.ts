import express from "express";
import {
  authentiactionController,
  commentController,
  postController,
  userController,
} from "./modules";
import { globalErrorHandling } from "./middleware";
import { LIMIT, PORT } from "./config";
import { bootstrapDB } from "./DB/connection.db";
import { generateLimiter } from "./common/utils";
import helmet from "helmet";
import cors from "cors";

const app: express.Application = express();

bootstrapDB(app, PORT);

const limiter = generateLimiter({
  limit: LIMIT,
});

app.set("trust proxy", true);
app.use(helmet(), cors(), limiter, express.json());

app.all(
  "/",
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<express.Response> => {
    return res.status(200).json({ message: "Done" });
  },
);

app.use("/auth", authentiactionController);
app.use("/comment", commentController);
app.use("/post", postController);
app.use("/user", userController);

app.all("{/*dummy}", (req, res) =>
  res.status(404).json({ message: "Invalid application routing" }),
);

app.use(globalErrorHandling);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
