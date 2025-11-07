import {
  extractContentFromDOCX,
  convertToTiptapJSON,
  createTiptapContent,
  type ExtractedContent,
  type ExtractedImage,
} from "@/lib/ai/prompts/tiptap-helpers";
import { type EditorConvertChatMessage } from "@/lib/ai/editor-convert/types";
import { createUIMessageStream, createUIMessageStreamResponse, UIMessageStreamWriter } from "ai";
import { getActionContext } from "@/server/api/core/actions";
import { getStorageProvider } from "@/server/services/storage-provider";
import { MediaAccessTypeEnum } from "@workspace/common-logic/models/media.types";
import { IDomainHydratedDocument } from "@workspace/common-logic/models/organization.model";
import { ITextEditorContent } from "@workspace/common-logic/lib/text-editor-content";
import { textEditorContentValidator } from "@/server/api/core/validators";
import mongoose from "mongoose";
import { z } from "zod";

type UploadedAsset = ITextEditorContent["assets"][number] & {
  index: number;
};

export const maxDuration = 60;
export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = ["docx"] as const;
type AllowedExtension = typeof ALLOWED_EXTENSIONS[number];

function isAllowedExtension(ext: string | undefined): ext is AllowedExtension {
  return ext !== undefined && ALLOWED_EXTENSIONS.includes(ext as AllowedExtension);
}

function replaceImagePlaceholders(tiptapJson: any, uploadedAssets: UploadedAsset[]) {
  if (!tiptapJson?.content) return;

  const assetMap = new Map(uploadedAssets.map(asset => [asset.index, asset]));

  function traverse(node: any) {
    if (!node) return;

    if (node.type === "mediaView" && node.attrs?.assetId) {
      const placeholder = node.attrs.assetId;
      const match = placeholder.match(/IMAGE_PLACEHOLDER_(\d+)/);
      if (match) {
        const index = parseInt(match[1]);
        const uploadedAsset = assetMap.get(index);
        if (uploadedAsset) {
          node.attrs.asset = {
            url: uploadedAsset.url,
            caption: uploadedAsset.caption,
            media: uploadedAsset.media,
          };
          console.log(`[CONVERT] ✓ Replaced ${placeholder} with ${uploadedAsset.url}`);
        }
      }
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(tiptapJson);
}

type DataStream = UIMessageStreamWriter<EditorConvertChatMessage>;

export async function POST(req: Request) {
  const stream = createUIMessageStream<EditorConvertChatMessage>({
    execute: async ({ writer: dataStream }) => {
      try {
        const ctx = await getActionContext();
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
          dataStream.write({
            type: "data-error",
            data: { data: { error: "No file provided" } }
          });
          return;
        }

        const fileName = file.name;
        const extension = fileName.split(".").pop()?.toLowerCase();

        if (!isAllowedExtension(extension)) {
          dataStream.write({
            type: "data-error",
            data: { data: { error: `Only ${ALLOWED_EXTENSIONS.join(", ")} files are supported` } }
          });
          return;
        }

        dataStream.write({
          type: "data-progress",
          data: {
            data: {
              step: "Extracting content...",
              progress: 20,
              label: "Extracting content...",
            }
          }
        });

        const buffer = await file.arrayBuffer();
        const extractedContent = await extractContentFromDOCX(buffer);

        if (!extractedContent.html || extractedContent.html.trim().length === 0) {
          dataStream.write({
            type: "data-error",
            data: { data: { error: "No content found in file" } }
          });
          return;
        }

        const uploadedAssets: UploadedAsset[] = [];
        
        if (extractedContent.images.length > 0) {
          dataStream.write({
            type: "data-progress",
            data: {
              data: {
                step: `Uploading ${extractedContent.images.length} image(s)...`,
                progress: 40,
                label: `Uploading ${extractedContent.images.length} image(s)...`,
              }
            }
          });

          for (const imageData of extractedContent.images) {
            try {
              const storageProvider = getStorageProvider();
              const blob = new Blob([new Uint8Array(imageData.data)], { type: `image/${imageData.format}` });
              const imageFile = new File([blob], `image-${imageData.index}.${imageData.format}`, {
                type: `image/${imageData.format}`,
              });
              
              const attachment = await storageProvider.uploadFile(
                {
                  file: imageFile,
                  userId: ctx.user._id as mongoose.Types.ObjectId,
                  type: "document",
                  caption: `Extracted image ${imageData.index}`,
                  access: MediaAccessTypeEnum.PUBLIC,
                  entityType: "document",
                  entityId: ctx.user._id.toString(),
                },
                ctx.domainData.domainObj as IDomainHydratedDocument,
              );
              
              const attachmentObj = attachment.toObject();
              
              uploadedAssets.push({
                index: imageData.index,
                url: attachmentObj.url,
                caption: attachmentObj.caption,
                media: {
                  mediaId: attachmentObj.mediaId,
                  orgId: attachmentObj.orgId,
                  storageProvider: attachmentObj.storageProvider,
                  url: attachmentObj.url,
                  originalFileName: attachmentObj.originalFileName,
                  mimeType: attachmentObj.mimeType,
                  size: attachmentObj.size,
                  access: attachmentObj.access,
                  thumbnail: attachmentObj.thumbnail || "",
                  caption: attachmentObj.caption,
                  ownerId: attachmentObj.ownerId,
                },
              });
              
              console.log(`[UPLOAD] ✓ Successfully uploaded image ${imageData.index}`);
            } catch (error) {
              console.error(`[UPLOAD ERROR] Failed to upload image ${imageData.index}:`, error);
            }
          }
        }

        dataStream.write({
          type: "data-progress",
          data: {
            data: {
              step: "Converting to TipTap format...",
              progress: 60,
              label: "Converting to TipTap format...",
            }
          }
        });

        const tiptapJson = await convertToTiptapJSON(extractedContent);
        
        // Replace IMAGE_PLACEHOLDER with actual uploaded assets
        if (uploadedAssets.length > 0) {
          console.log(`[CONVERT] Replacing ${uploadedAssets.length} image placeholders`);
          replaceImagePlaceholders(tiptapJson, uploadedAssets);
        }
        
        const tiptapContent = createTiptapContent(tiptapJson, uploadedAssets);

        // Validate final content
        const contentValidator = textEditorContentValidator(z, { requiredEditorType: "tiptap" });
        const validationResult = contentValidator.safeParse(tiptapContent);
        
        if (!validationResult.success) {
          console.error("[VALIDATION ERROR]:", validationResult.error);
          dataStream.write({
            type: "data-error",
            data: {
              data: { error: "Generated content validation failed" }
            }
          });
          return;
        }

        dataStream.write({
          type: "data-complete",
          data: {
            data: {
              content: validationResult.data,
              step: "Conversion complete!",
              progress: 100,
              label: "Conversion complete!",
            }
          }
        });

      } catch (error) {
        console.error("[FILE CONVERT] Error:", error);
        dataStream.write({
          type: "data-error",
          data: {
            data: { error: error instanceof Error ? error.message : "Conversion failed" }
          }
        });
      }
    },
    onError: () => "An error occurred during file conversion",
  });

  return createUIMessageStreamResponse({ stream });
}
