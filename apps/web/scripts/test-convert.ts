import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import {
  extractContentFromDOCX,
  convertToTiptapJSON,
  createTiptapContent,
} from "@/lib/ai/prompts/tiptap-helpers"; 
import { ITextEditorContent } from "@workspace/common-logic/lib/text-editor-content";
import { IAttachmentMedia, MediaAccessTypeEnum } from "@workspace/common-logic/models/media.types";
import mongoose from "mongoose";

dotenv.config();

const TEST_FILE = path.join(process.cwd(), "docs", "test-convert.docx");

type UploadedAsset = ITextEditorContent["assets"][number] & {
  index: number;
};

function mockUploadImages(images: any[]): UploadedAsset[] {
  console.log(`\n2️⃣ Mock uploading ${images.length} image(s)...`);
  const uploadedAssets: UploadedAsset[] = [];
  
  for (const imageData of images) {
    console.log(`   [MOCK UPLOAD] Image ${imageData.index}:`, {
      format: imageData.format,
      size: imageData.data.length,
    }); 
    
    // Create mock attachment object similar to real storage provider response
    const mockAttachment: IAttachmentMedia & { _id: mongoose.Types.ObjectId } = {
      _id: new mongoose.Types.ObjectId(),
      mediaId: `media_${Date.now()}_${imageData.index}`,
      orgId: new mongoose.Types.ObjectId(),
      originalFileName: `image-${imageData.index}.${imageData.format}`,
      mimeType: `image/${imageData.format}`,
      size: imageData.data.length,
      access: MediaAccessTypeEnum.PUBLIC,
      url: `https://via.placeholder.com/800x600?text=Image+${imageData.index}`,
      thumbnail: `https://via.placeholder.com/150x150?text=Thumb+${imageData.index}`,
      caption: `Extracted image ${imageData.index}`,
      storageProvider: "local",
      ownerId: new mongoose.Types.ObjectId(),
    };
    
    uploadedAssets.push({
      index: imageData.index,
      url: mockAttachment.url,
      caption: mockAttachment.caption,
      media: mockAttachment,
    });
    
    console.log(`   ✓ Mock "uploaded" image ${imageData.index} (${mockAttachment.mimeType}, ${mockAttachment.size} bytes)`);
  }
  
  return uploadedAssets;
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
          console.log(`   ✓ Replaced ${placeholder} with ${uploadedAsset.url}`);
        }
      }
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(tiptapJson);
}

async function main() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("📄 DOCX to TipTap Conversion Test (Mock Upload)");
    console.log("=".repeat(60));

    const fileBuffer = await fs.readFile(TEST_FILE);
    const buffer = fileBuffer.buffer;

    console.log("\n1️⃣ Extracting content from DOCX...");
    const content = await extractContentFromDOCX(buffer);
    console.log(`   ✓ HTML length: ${content.html.length} chars`);
    console.log(`   ✓ Images found: ${content.images.length}`);

    const uploadedAssets = content.images.length > 0 
      ? mockUploadImages(content.images) 
      : [];

    console.log("\n3️⃣ Converting to TipTap JSON...");
    const tiptapJson = await convertToTiptapJSON(content);
    console.log("   ✓ TipTap JSON structure created");

    if (uploadedAssets.length > 0) {
      console.log("\n4️⃣ Replacing image placeholders...");
      replaceImagePlaceholders(tiptapJson, uploadedAssets);
    }

    console.log("\n5️⃣ Creating TipTap content...");
    const assets: ITextEditorContent["assets"] = uploadedAssets.map(({ url, caption, media }) => ({
      url,
      caption,
      media,
    }));
    const tiptapContent = createTiptapContent(tiptapJson, assets);
    console.log("   ✓ Final content:", JSON.stringify(tiptapContent, null, 2));
    console.log(`   ✓ Assets included: ${tiptapContent.assets.length}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Conversion completed successfully!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();

