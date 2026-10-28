import express from "express";
import {
  authentiactionController,
  commentController,
  postController,
  userController,
} from "./modules";
import { globalErrorHandling } from "./middleware";

const app: express.Application = express();

app.use(express.json());

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

app.use(globalErrorHandling);

app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});
