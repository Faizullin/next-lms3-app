import { del, put } from "@vercel/blob";
import {
  AttachmentModel,
  IAttachmentHydratedDocument,
} from "@workspace/common-logic/models/media.model";
import {
  IAttachmentMedia,
  MediaAccessTypeEnum,
} from "@workspace/common-logic/models/media.types";
import { IDomainHydratedDocument } from "@workspace/common-logic/models/organization.model";
import mongoose from "mongoose";

export interface VercelBlobUploadOptions {
  file: File | Buffer;
  userId: mongoose.Types.ObjectId;
  type: string;
  caption?: string;
  access?: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId | string;
  adapter?: string;
}

class DefaultAdapterClass {
  title = "Default Adapter";
  allowedMimeTypes: string[] = ["*"];
  maxSize = 104857600;

  validate(file: File | Buffer, mimeType: string): void {
    const fileSize = file instanceof Buffer ? file.length : (file as File).size;
    if (fileSize > this.maxSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${this.maxSize / 1024 / 1024}MB`
      );
    }
    if (
      this.allowedMimeTypes[0] !== "*" &&
      !this.allowedMimeTypes.includes(mimeType)
    ) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }
  }
}

export class VercelBlobService {
  private static readonly adapters: Record<string, DefaultAdapterClass> = {
    default: new DefaultAdapterClass(),
  };

  private static getConnectionCredentials() {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN is not set");
    }
    return {
      token,
    };
  }

  static async uploadFile(
    options: VercelBlobUploadOptions,
    domain: IDomainHydratedDocument
  ): Promise<IAttachmentHydratedDocument> {
    const {
      file,
      userId,
      type,
      caption,
      access,
      entityType,
      entityId,
      adapter = "default",
    } = options;

    if (!file) {
      throw new Error("No file provided");
    }

    const selectedAdapter = this.adapters[adapter] || this.adapters.default!;
    const mimeType =
      file instanceof File ? file.type : "application/octet-stream";

    selectedAdapter.validate(file, mimeType);

    try {
      const credentials = this.getConnectionCredentials();
      const folderPrefix = process.env.UPLOAD_FOLDER_PREFIX;
      if (!folderPrefix) {
        throw new Error("UPLOAD_FOLDER_PREFIX is not set");
      }

      const originalFileName =
        file instanceof File ? file.name : "uploaded_file";
      const folderPath = `${folderPrefix}/${domain.name}-${domain._id}/${type}/${originalFileName}`;

      let blob: Blob;
      let fileSize: number;

      if (file instanceof Buffer) {
        const uint8Array = new Uint8Array(file);
        blob = new Blob([uint8Array.buffer], { type: mimeType });
        fileSize = file.length;
      } else {
        const bytes = await (file as File).arrayBuffer();
        blob = new Blob([bytes], { type: mimeType });
        fileSize = (file as File).size;
      }

      const uploadResult = await put(folderPath, blob, {
        access: access === MediaAccessTypeEnum.PUBLIC ? "public" : "public",
        token: credentials.token,
      });

      const attachment = new AttachmentModel({
        orgId: domain.orgId,
        ownerId: userId,
        url: uploadResult.url,
        originalFileName,
        mimeType,
        size: fileSize,
        access: (access as any) || MediaAccessTypeEnum.PUBLIC,
        thumbnail: mimeType.startsWith("image/")
          ? uploadResult.url
          : uploadResult.url,
        caption: caption || "",
        storageProvider: "vercel",
        metadata: {
          pathname: uploadResult.pathname,
          contentType: uploadResult.contentType,
        },
        entity: {
          entityType,
          entityIdStr:
            typeof entityId === "string" ? entityId : entityId.toString(),
          entityId:
            typeof entityId === "string"
              ? new mongoose.Types.ObjectId(entityId)
              : entityId,
        },
      });

      attachment.mediaId = attachment._id.toString();
      await attachment.save();

      return attachment;
    } catch (error: any) {
      console.error("Vercel Blob upload error:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  static async deleteFile(item: IAttachmentMedia): Promise<boolean> {
    if (!item.url) {
      throw new Error("File URL not found for media");
    }
    try {
      const credentials = this.getConnectionCredentials();
      await del(item.url, {
        token: credentials.token,
      });

      await AttachmentModel.deleteOne({ mediaId: item.mediaId });

      return true;
    } catch (error: any) {
      console.error("Vercel Blob delete error:", error);
      throw new Error(
        `Delete failed for mediaId: ${item.mediaId}: ${error.message}`
      );
    }
  }
}
