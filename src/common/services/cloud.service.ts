import {
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  APPLICATION_NAME,
  AWS_ACCESS_KEY_ID,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
} from "../../config";
import { randomUUID } from "node:crypto";
import { BadRequestException } from "../exception";
import { FileType } from "../types";

export class CloudService {
  private cloudClient: S3Client;
  constructor() {
    this.cloudClient = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadAsset({
    Bucket = AWS_BUCKET_NAME,
    ACL = ObjectCannedACL.private,
    file,
    customPath = "general",
  }: {
    Bucket?: string;
    ACL?: ObjectCannedACL;
    file: FileType;
    customPath?: string;
  }): Promise<string> {
    const Key = `${APPLICATION_NAME}/${customPath}/${randomUUID()}_${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket,
      Key,
      ACL,
      Body: file.buffer,
    });

    await this.cloudClient.send(command);
    if (!command.input.Key) {
      throw new BadRequestException("Fail to upload this asset");
    }
    return command.input.Key;
  }
}

export default new CloudService();
