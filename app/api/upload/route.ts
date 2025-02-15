import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import extract from "extract-zip";
import OpenAI from "openai";
import { writeFile } from "fs/promises";
import { join } from "path";
import pdf from "pdf-parse";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to recursively get all files in a directory
function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

// Function to analyze text with GPT
async function analyzePDFWithGPT(text: string): Promise<number> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a carbon footprint analysis expert. Extract or estimate the carbon footprint value from the given text. Return only the numeric value in kg CO2.",
        },
        {
          role: "user",
          content: `Analyze this text and extract or estimate the carbon footprint value in kg CO2 *IMPORTANT: return only 1 value, which is the total number of overall analysis: ${text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const result = completion.choices[0]?.message?.content;
    console.log(`raw result: ${result}`); // Debug log
    if (!result) return 0;

    // Extract numeric value from the response
    const match = result.match(/\d+(\.\d+)?/);
    console.log(`extracted value: ${match}`); // Debug log
    return match ? parseFloat(match[0]) : 0;
  } catch (error) {
    console.error("Error analyzing with GPT:", error);
    return 0;
  }
}

// Function to read PDF content
async function readPDFContent(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`🚨 File not found: ${filePath}`);
      return "";
    }

    // Manually set PDF worker path to avoid issues
    process.env.PDFJS_WORKER = join(
      process.cwd(),
      "node_modules/pdfjs-dist/build/pdf.worker.js"
    );

    // Read file as a buffer and parse the PDF
    const buffer = await fs.promises.readFile(filePath);
    const pdfData = await pdf(buffer);
    return pdfData.text;
  } catch (error) {
    console.error(`❌ Error reading PDF file ${filePath}:`, error);
    return "";
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    // ✅ Use `/tmp/` for storage in Vercel, `uploads/` for local
    const uploadDir =
      process.env.NODE_ENV === "production"
        ? "/tmp/uploads"
        : join(process.cwd(), "uploads");
    const extractDir =
      process.env.NODE_ENV === "production"
        ? "/tmp/extracted"
        : join(process.cwd(), "extracted");

    // Ensure directories exist and are empty
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }

    fs.mkdirSync(uploadDir, { recursive: true });
    fs.mkdirSync(extractDir, { recursive: true });

    // Get the form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "Please upload a ZIP file" },
        { status: 400 }
      );
    }

    // Save the uploaded file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const zipPath = join(uploadDir, "upload.zip");

    await writeFile(zipPath, buffer);

    try {
      // Extract the ZIP file
      await extract(zipPath, { dir: extractDir });

      // Process files recursively
      const allFiles = getAllFiles(extractDir);
      console.log("📂 Found files:", allFiles); // Debug log

      const files = allFiles.filter((file) => {
        const lowerFile = file.toLowerCase();
        return lowerFile.endsWith(".pdf") || lowerFile.endsWith(".txt");
      });

      console.log("📄 Filtered files to process:", files); // Debug log

      if (files.length === 0) {
        return NextResponse.json(
          { error: "No PDF or text files found in ZIP" },
          { status: 400 }
        );
      }

      let totalCarbonFootprint = 0;
      for (const filePath of files) {
        const isPDF = filePath.toLowerCase().endsWith(".pdf");
        const fileContent = isPDF
          ? await readPDFContent(filePath)
          : await fs.promises.readFile(filePath, "utf-8");

        if (fileContent) {
          const carbonData = await analyzePDFWithGPT(fileContent);
          totalCarbonFootprint += carbonData;
        }
      }

      return NextResponse.json({
        message: "Upload successful",
        totalCarbonFootprint,
        analyzedFiles: files.length,
      });
    } catch (error) {
      console.error("❌ Error processing ZIP:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        {
          error: "Failed to process ZIP file",
          details: errorMessage,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Error processing files:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "File processing failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
