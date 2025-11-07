import { CloudinaryService } from "./cloudinary";
import { LocalStorageService } from "./local-storage";
import { VercelBlobService } from "./vercel-blob";
import { IAttachmentHydratedDocument } from "@workspace/common-logic/models/media.model";
import { IAttachmentMedia } from "@workspace/common-logic/models/media.types";
import { IDomainHydratedDocument } from "@workspace/common-logic/models/organization.model";
import mongoose from "mongoose";

interface StorageUploadOptions {
  file: File | Buffer;
  userId: mongoose.Types.ObjectId;
  type: string;
  caption?: string;
  access?: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId | string;
  adapter?: string;
}

/**
 * Storage provider interface that all providers must implement
 */
interface IStorageProvider {
  uploadFile(
    options: StorageUploadOptions,
    domain: IDomainHydratedDocument
  ): Promise<IAttachmentHydratedDocument>;
  deleteFile(item: IAttachmentMedia): Promise<boolean>;
}

export type StorageProviderType = "cloudinary" | "local" | "vercel" | "custom";

export function getStorageProvider(providerName?: StorageProviderType): IStorageProvider {
  const provider = (providerName || process.env.NEXT_PUBLIC_DEFAULT_STORAGE_PROVIDER || "local") as StorageProviderType;

  if (provider === "cloudinary") {
    return CloudinaryService;
  } else if (provider === "local") {
    return LocalStorageService;
  } else if (provider === "vercel") {
    return VercelBlobService;
  } else if (provider === "custom") {
    throw new Error("Custom storage provider is not implemented");
  } else {
    throw new Error(`Unknown storage provider: ${provider}`);
  }
}
