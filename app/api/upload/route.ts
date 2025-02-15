import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import extract from "extract-zip";
import OpenAI from "openai";
import { writeFile } from "fs/promises";
import { join } from "path";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get all files dynamically
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

// Analyze text content with GPT
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
          content: `Analyze this text and extract or estimate the carbon footprint value in kg CO2. *IMPORTANT: return only 1 value, which is the total number of overall analysis: ${text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) return 0;

    // Extract numeric value from the response
    const match = result.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  } catch (error: unknown) {
    console.error("Error analyzing with GPT:", error);
    return 0;
  }
}

// Read and extract text from PDFs
async function readPDFContent(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(buffer);
    return pdfData.text;
  } catch (pdfError: unknown) {
    console.error("Error parsing PDF:", pdfError);
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
    // ✅ Use alternative temp storage to avoid Vercel auto-clearing `/tmp`
    const baseTempDir = "/var/task/tmp"; // Alternative storage
    const uploadDir = join(baseTempDir, "uploads");
    const extractDir = join(baseTempDir, "extracted");

    // Ensure directories exist and are empty
    if (fs.existsSync(uploadDir))
      fs.rmSync(uploadDir, { recursive: true, force: true });
    if (fs.existsSync(extractDir))
      fs.rmSync(extractDir, { recursive: true, force: true });

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

      // ✅ Debugging: Ensure files were extracted
      console.log(
        "Extracted files in /var/task/tmp/extracted:",
        fs.readdirSync(extractDir)
      );

      // Process files dynamically
      const allFiles = getAllFiles(extractDir);
      console.log("Found files:", allFiles); // Debug log

      const files = allFiles.filter(
        (file) =>
          file.toLowerCase().endsWith(".pdf") ||
          file.toLowerCase().endsWith(".txt")
      );
      console.log("Filtered files to process:", files); // Debug log

      if (files.length === 0) {
        return NextResponse.json(
          { error: "No PDF or text files found in ZIP" },
          { status: 400 }
        );
      }

      // ✅ Process files immediately after extraction to avoid deletion
      let totalCarbonFootprint = 0;
      const filesContent: { [key: string]: string } = {}; // Store file data

      for (const filePath of files) {
        console.log("Processing file:", filePath); // Debugging log

        if (!fs.existsSync(filePath)) {
          console.error(`Skipping missing file: ${filePath}`);
          continue;
        }

        const isPDF = filePath.toLowerCase().endsWith(".pdf");

        if (isPDF) {
          const fileBuffer = await fs.promises.readFile(filePath);
          const fileContent = await readPDFContent(fileBuffer);
          if (fileContent) {
            filesContent[filePath] = fileContent; // Store content in memory
          }
        } else {
          const fileContent = await fs.promises.readFile(filePath, "utf-8");
          if (fileContent) {
            filesContent[filePath] = fileContent; // Store content in memory
          }
        }
      }

      // ✅ Now process files from memory instead of re-reading
      for (const filePath in filesContent) {
        totalCarbonFootprint += await analyzePDFWithGPT(filesContent[filePath]);
      }

      return NextResponse.json({
        message: "Upload successful",
        totalCarbonFootprint,
        analyzedFiles: files.length,
      });
    } catch (error: unknown) {
      console.error("Error processing ZIP:", error);
      return NextResponse.json(
        {
          error: "Failed to process ZIP file",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Error processing files:", error);
    return NextResponse.json(
      {
        error: "File processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
