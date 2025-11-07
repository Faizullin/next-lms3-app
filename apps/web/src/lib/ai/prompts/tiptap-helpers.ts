import { ITextEditorContent } from "@workspace/common-logic/lib/text-editor-content";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import mammoth from "mammoth";

export interface ExtractedImage {
  data: Buffer;
  format: string;
  index: number;
}

export interface ExtractedContent {
  html: string;
  images: ExtractedImage[];
}

type TipTapExtensionDef = {
  name: string;
  description: string;
  json: string;
};

const tiptapExtensionDefs: TipTapExtensionDef[] = [
  { name: "heading", description: "Headings (level 1-4), supports textAlign attr", json: '{"type":"heading","attrs":{"level":1,"textAlign":"left"},"content":[{"type":"text","text":"Heading text"}]}' },
  { name: "paragraph", description: "Regular paragraphs, supports textAlign attr", json: '{"type":"paragraph","attrs":{"textAlign":"left"},"content":[{"type":"text","text":"Paragraph text"}]}' },
  { name: "bulletList", description: "Unordered lists", json: '{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Item"}]}]}]}' },
  { name: "orderedList", description: "Numbered lists", json: '{"type":"orderedList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Item"}]}]}]}' },
  { name: "table", description: "Tables", json: '{"type":"table","content":[{"type":"tableRow","content":[{"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Header"}]}]}]},{"type":"tableRow","content":[{"type":"tableCell","content":[{"type":"paragraph","content":[{"type":"text","text":"Cell"}]}]}]}]}' },
  { name: "blockquote", description: "Quotes/callouts", json: '{"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"Quote"}]}]}' },
  { name: "codeBlock", description: "Code blocks", json: '{"type":"codeBlock","attrs":{"language":"javascript"},"content":[{"type":"text","text":"code"}]}' },
  { name: "horizontalRule", description: "Dividers", json: '{"type":"horizontalRule"}' },
  { name: "hardBreak", description: "Line breaks", json: '{"type":"hardBreak"}' },
  { name: "mediaView", description: "Images, videos, audio, documents (custom extension)", json: '{"type":"mediaView","attrs":{"assetId":"IMAGE_PLACEHOLDER_0","asset":{"url":"","caption":"","media":null},"display":{"width":"100%","height":null,"align":"center","aspectRatio":null}}}' },
  { name: "youtube", description: "YouTube video embeds", json: '{"type":"youtube","attrs":{"src":"https://www.youtube.com/watch?v=VIDEO_ID","width":640,"height":480}}' },
];

const tiptapMarkDefs = [
  { name: "bold", description: "Bold text", json: '{"type":"text","marks":[{"type":"bold"}],"text":"bold text"}' },
  { name: "italic", description: "Italic text", json: '{"type":"text","marks":[{"type":"italic"}],"text":"italic text"}' },
  { name: "underline", description: "Underlined text", json: '{"type":"text","marks":[{"type":"underline"}],"text":"underlined"}' },
  { name: "strike", description: "Strikethrough text", json: '{"type":"text","marks":[{"type":"strike"}],"text":"strikethrough"}' },
  { name: "code", description: "Inline code", json: '{"type":"text","marks":[{"type":"code"}],"text":"code"}' },
  { name: "link", description: "Hyperlinks", json: '{"type":"text","marks":[{"type":"link","attrs":{"href":"url","target":"_blank"}}],"text":"link text"}' },
  { name: "highlight", description: "Highlighted text", json: '{"type":"text","marks":[{"type":"highlight","attrs":{"color":"#ffeb3b"}}],"text":"highlighted"}' },
  { name: "subscript", description: "Subscript", json: '{"type":"text","marks":[{"type":"subscript"}],"text":"sub"}' },
  { name: "superscript", description: "Superscript", json: '{"type":"text","marks":[{"type":"superscript"}],"text":"super"}' },
  { name: "textStyle", description: "Text color/styling", json: '{"type":"text","marks":[{"type":"textStyle","attrs":{"color":"#ff0000"}}],"text":"colored text"}' },
];

export function buildConversionInstructions(): string {
  const nodeInstructions = tiptapExtensionDefs.map(e => `- ${e.name}: ${e.description}\n  Example: ${e.json}`).join('\n');
  const markInstructions = tiptapMarkDefs.map(m => `- ${m.name}: ${m.description}\n  Example: ${m.json}`).join('\n');
  
  return `TipTap JSON Structure:
Document: {"type":"doc","content":[...nodes...]}

Available Nodes:
${nodeInstructions}

Available Marks (text formatting):
${markInstructions}

Rules:
- Always wrap in {"type":"doc","content":[...]}
- Text must be in "text" nodes with "text" property
- Marks are applied as array in "marks" property
- Preserve HTML structure (headings, lists, tables, etc.)
- For images: Convert IMAGE_PLACEHOLDER_0, IMAGE_PLACEHOLDER_1, etc. to mediaView nodes with assetId matching the placeholder
- MediaView attrs: assetId (string), asset (object with url, caption, media), display (object with width, height, align, aspectRatio)
- Heading and paragraph support textAlign attr: "left", "center", "right", "justify"
- Links should have target="_blank" for external URLs
- Highlight marks can have color attr for different highlight colors`;
}

export async function extractContentFromDOCX(buffer: ArrayBuffer): Promise<ExtractedContent> {
  const nodeBuffer = Buffer.from(buffer);
  const images: ExtractedImage[] = [];
  let imageIndex = 0;

  const result = await mammoth.convertToHtml(
    { buffer: nodeBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const imageBuffer = await image.read();
        images.push({
          data: imageBuffer,
          format: image.contentType.split("/")[1] || "png",
          index: imageIndex++,
        });
        return { src: `IMAGE_PLACEHOLDER_${imageIndex - 1}` };
      }),
    }
  );

  return { html: result.value, images };
}

export async function convertToTiptapJSON(extractedContent: ExtractedContent): Promise<any> {
  // Model options:
  // - "gpt-4o" (recommended): Most reliable for structured JSON, better at following complex instructions
  // - "gpt-4o-mini": Cheaper/faster but less reliable for complex JSON generation
  // - "gpt-4-turbo": Good balance between cost and reliability
  
  const imageCount = extractedContent.images.length;
  const systemMessage = `You are a document converter. Convert HTML to TipTap JSON format exactly as specified.`;

  const imageInfo = imageCount > 0 
    ? `\n\nIMPORTANT: ${imageCount} image(s) with placeholders IMAGE_PLACEHOLDER_0, IMAGE_PLACEHOLDER_1, etc. Keep as text nodes.` 
    : "";

  const userMessage = `Convert this HTML to TipTap JSON:

${extractedContent.html.substring(0, 15000)}${extractedContent.html.length > 15000 ? "\n...(truncated)" : ""}${imageInfo}

${buildConversionInstructions()}

Return ONLY valid JSON in TipTap format.`;

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateText({
        model: openai("gpt-4o"),
        system: systemMessage,
        prompt: userMessage,
        temperature: 0.1,
      });

      // Strip markdown code fences if present
      let jsonText = result.text.trim();
      
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\s*\n/, "").replace(/\n```\s*$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\s*\n/, "").replace(/\n```\s*$/, "");
      }

      const parsed = JSON.parse(jsonText);
      console.log(`[CONVERT] ✓ Successfully converted on attempt ${attempt}`);
      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[CONVERT] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to convert after ${maxRetries} attempts: ${lastError.message}`);
      }
    }
  }

  throw lastError || new Error("Conversion failed");
}

export function createTiptapContent(
  tiptapJson: any,
  uploadedAssets?: ITextEditorContent["assets"]
): ITextEditorContent {
  return {
    type: "doc",
    content: JSON.stringify(tiptapJson),
    assets: uploadedAssets || [],
    widgets: [],
    config: { 
      editorType: "tiptap",
      contentType: "json",
    },
  };
}






