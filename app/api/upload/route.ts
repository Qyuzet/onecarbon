import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import extract from "extract-zip";
import OpenAI from "openai";
import { join } from "path";
import { existsSync } from "fs";
import os from "os";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get all files dynamically - made async
async function getAllFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const fsPromises = await import("fs/promises");
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

// Analyze text content with GPT
async function analyzePDFWithGPT(text: string): Promise<number> {
  try {
    if (!text || text.trim() === "") {
      console.log("Empty text provided to GPT analysis");
      return 0;
    }

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
          content: `Analyze this text and extract or estimate the carbon footprint value in kg CO2. *IMPORTANT: return only 1 value, which is the total number of overall analysis: ${text.substring(
            0,
            10000
          )}`, // Limiting text length
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
    // Use os.tmpdir() for platform-independent temporary directory
    const baseTempDir = os.tmpdir();
    const sessionId = Date.now().toString();
    const uploadDir = join(baseTempDir, `upload_${sessionId}`);
    const extractDir = join(baseTempDir, `extract_${sessionId}`);

    // Create directories using async methods
    await mkdir(uploadDir, { recursive: true });
    await mkdir(extractDir, { recursive: true });

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
    console.log(`ZIP saved to: ${zipPath}`);

    try {
      // Extract the ZIP file
      await extract(zipPath, { dir: extractDir });
      console.log(`Files extracted to: ${extractDir}`);

      // Process files dynamically
      const allFiles = await getAllFiles(extractDir);
      console.log(`Found ${allFiles.length} files in extracted directory`);

      const files = allFiles.filter(
        (file) =>
          file.toLowerCase().endsWith(".pdf") ||
          file.toLowerCase().endsWith(".txt")
      );
      console.log(`Filtered ${files.length} PDF/TXT files to process`);

      if (files.length === 0) {
        return NextResponse.json(
          { error: "No PDF or text files found in ZIP" },
          { status: 400 }
        );
      }

      // Process files immediately after extraction
      let totalCarbonFootprint = 0;
      const processedFiles = [];

      for (const filePath of files) {
        if (!existsSync(filePath)) {
          console.error(`File doesn't exist: ${filePath}`);
          continue;
        }

        try {
          const fileBuffer = await readFile(filePath);
          let fileContent: string;

          if (filePath.toLowerCase().endsWith(".pdf")) {
            fileContent = await readPDFContent(fileBuffer);
          } else {
            fileContent = fileBuffer.toString("utf-8");
          }

          if (fileContent && fileContent.trim() !== "") {
            const carbonFootprint = await analyzePDFWithGPT(fileContent);
            totalCarbonFootprint += carbonFootprint;
            processedFiles.push({
              path: filePath,
              size: fileBuffer.length,
              footprint: carbonFootprint,
            });
            console.log(`Processed ${filePath}: ${carbonFootprint} kg CO2`);
          } else {
            console.log(`Empty content in file: ${filePath}`);
          }
        } catch (fileError: unknown) {
          console.error(`Error processing file ${filePath}:`, fileError);
        }
      }

      return NextResponse.json({
        message: "Upload successful",
        totalCarbonFootprint,
        analyzedFiles: processedFiles.length,
        processedFiles,
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
