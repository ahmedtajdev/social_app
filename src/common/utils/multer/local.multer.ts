import multer from "multer";
import {
  fileTypeFromBuffer,
  FileTypeResult,
  fileTypeFromFile,
} from "file-type";
import { BadRequestException } from "../../exception";
import { join, resolve } from "node:path";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { cacheService } from "../../services";
import { HUser } from "../../../DB/models";
import { Request } from "express";
import { tmpdir } from "node:os";
import { FileType } from "../../types";

interface IFilesValidationResult {
  file: FileType;
  uniqueFilePath: string;
}

export const localFileUpload = ({
  maxFileSizeMB = 5,
  files = 1,
}: {
  maxFileSizeMB?: number;
  files?: number;
} = {}) => {
  const storage =
    maxFileSizeMB <= 5
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination(req, file, callback) {
            callback(null, tmpdir());
          },
          filename(req, file, callback) {
            callback(null, randomUUID() + file.originalname);
          },
        });

  return multer({
    storage,
    limits: { fileSize: maxFileSizeMB * 1024 * 1024, files },
  });
};

export const fileValidation = {
  image: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
  files: ["application/pdf", "application/json"],
};

const validateFile = async ({
  file,
  validation,
}: {
  file: FileType;
  validation: string[];
}): Promise<FileTypeResult> => {
  const result = file.path
    ? await fileTypeFromFile(file.path)
    : await fileTypeFromBuffer(file.buffer);

  if (!result || !validation.includes(result.mime)) {
    if (file.path) await deleteFile(file.path);
    throw new BadRequestException("Invalid file format");
  }

  return result;
};

const generateUniqueFilePath = async ({
  customPath = "general",
  ext,
}: {
  customPath?: string;
  ext: string;
}): Promise<string> => {
  const relativeDir = join("assets", customPath);
  await mkdir(relativeDir, { recursive: true });
  return join(relativeDir, `${randomUUID()}.${ext}`);
};

const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await unlink(resolve(filePath));
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const deleteFiles = async (files: FileType[]): Promise<void> => {
  for (const file of files) {
    await deleteFile(file.path);
  }
};

const saveFile = async ({
  file,
  uniqueFilePath,
}: {
  file: FileType;
  uniqueFilePath: string;
}): Promise<FileType> => {
  const buffer = file.buffer ? file.buffer : await readFile(file.path);
  await writeFile(resolve(uniqueFilePath), buffer);
  if (file.path) await deleteFile(file.path);
  file.path = uniqueFilePath;
  return file;
};

const uploadProfileImage = async ({
  user,
  file,
  uniqueFilePath,
}: {
  user: HUser;
  file: FileType;
  uniqueFilePath: string;
}): Promise<FileType> => {
  const key = `User::${user._id.toHexString()}::Profile_Image`;

  const oldProfileImage = await cacheService.get({ key });

  if (oldProfileImage) {
    await deleteFile(oldProfileImage);
  }

  const uploadedFile = await saveFile({ file, uniqueFilePath });

  await cacheService.set({
    key,
    value: uploadedFile.path,
  });
  return uploadedFile;
};

const validateFilesArray = async ({
  files,
  validation,
  customPath = "general",
}: {
  files: FileType[];
  validation: string[];
  customPath?: string;
}) => {
  const validatedFilesResult = await Promise.all(
    files.map(async (file) => {
      const result = await validateFile({ file, validation });
      const uniqueFilePath = await generateUniqueFilePath({
        customPath,
        ext: result.ext,
      });
      return { file, uniqueFilePath };
    }),
  );
  return validatedFilesResult;
};

const processFilesArray = async ({
  customPath = "general",
  isFileRequired,
  files,
  validation,
  validatedFiles,
}: {
  customPath?: string;
  isFileRequired: boolean;
  files?: FileType[];
  validation: string[];
  validatedFiles?: IFilesValidationResult[];
}) => {
  console.log({ files });

  if (isFileRequired && !files?.length && !validatedFiles?.length) {
    throw new BadRequestException("No files to process");
  }

  let validatedFilesResult: {
    file: FileType;
    uniqueFilePath: string;
  }[];
  const uploadedFiles: FileType[] = [];

  if (!validatedFiles?.length) {
    validatedFilesResult = await validateFilesArray({
      files: files as FileType[],
      validation,
      customPath,
    });
  } else {
    validatedFilesResult = validatedFiles as IFilesValidationResult[];
  }

  for (const result of validatedFilesResult) {
    const uploadedFile = await saveFile({
      file: result.file,
      uniqueFilePath: result.uniqueFilePath,
    });
    uploadedFiles.push(uploadedFile);
  }

  console.log({ uploadedFiles });

  return uploadedFiles;
};

const uploadCoverImages = async ({
  user,
  isFileRequired,
  files,
  validation,
  customPath,
}: {
  user: HUser;
  isFileRequired: boolean;
  customPath: string;
  files: FileType[];
  validation: string[];
}) => {
  const key = `User::${user._id.toHexString()}::Cover_Images`;

  const oldCoverImages = (await cacheService.get({
    key,
  })) as FileType[];

  if (oldCoverImages.length) {
    await deleteFiles(oldCoverImages);
  }

  const uploadedFiles = await processFilesArray({
    isFileRequired,
    files,
    validation,
    customPath: customPath,
  });

  await cacheService.set({
    key,
    value: JSON.stringify(uploadedFiles),
  });

  return uploadedFiles;
};

const processFields = async ({
  customPath = "general",
  isFileRequired,
  fields,
  validation,
}: {
  customPath?: string;
  isFileRequired: boolean;
  fields: Record<string, FileType[]>;
  validation: string[];
}) => {
  const files = Object.values(fields).flat();

  const validatedFiles = await validateFilesArray({
    files,
    validation,
    customPath,
  });

  return await processFilesArray({
    isFileRequired,
    validatedFiles,
    validation,
    customPath,
  });
};

export const processMulterUpload = async ({
  req,
  isFileRequired,
  customPath = "general",
  validation,
}: {
  req: Request;
  isFileRequired: boolean;
  customPath?: string;
  validation: string[];
}) => {
  if (req.file) {
    const result = await validateFile({ file: req.file, validation });
    // const uniqueFilePath = await generateUniqueFilePath({
    //   customPath,
    //   ext: result.ext,
    // });

    // await saveFile({ file: req.file, uniqueFilePath });
  } else if (Array.isArray(req.files)) {
    if (req.url === "/cover-images" && req.method === "POST") {
      await uploadCoverImages({
        isFileRequired,
        user: req.user,
        files: req.files,
        validation,
        customPath,
      });
    } else {
      await processFilesArray({
        isFileRequired,
        customPath,
        files: req.files,
        validation,
      });
    }
  } else if (typeof req.files === "object" && Object.keys(req.files)?.length) {
    await processFields({
      isFileRequired,
      customPath,
      fields: req.files,
      validation,
    });
  }
};
