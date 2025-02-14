import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import extract from "extract-zip";
import OpenAI from "openai";
import { writeFile } from "fs/promises";
import { join } from "path";

interface ProcessError extends Error {
  message: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to recursively get all files
function getAllFiles(dir: string): string[] {
  try {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    console.log(`Scanning directory: ${dir}`);
    console.log(
      `Found entries:`,
      entries.map((e) => ({ name: e.name, isDirectory: e.isDirectory() }))
    );

    for (const entry of entries) {
      const fullPath = join(dir, entry.name).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        console.log(`Processing directory: ${fullPath}`);
        const subDirFiles = getAllFiles(fullPath);
        console.log(`Files found in directory ${entry.name}:`, subDirFiles);
        files.push(...subDirFiles);
      } else {
        console.log(`Processing file: ${fullPath}`);
        files.push(fullPath);
      }
    }

    return files;
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
    return [];
  }
}

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
          content: `Analyze this text and extract or estimate the carbon footprint value in kg CO2: ${text}`,
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
  } catch (error) {
    console.error("Error analyzing with GPT:", error);
    return 0;
  }
}

async function readFileContent(filePath: string): Promise<string> {
  try {
    // For now, read all files as text to test the functionality
    const content = await fs.promises.readFile(filePath, "utf-8");
    console.log(
      `Successfully read file ${filePath}, content length: ${content.length}`
    );
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
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
    // Create temporary directories
    const uploadDir = join(process.cwd(), "uploads");
    const extractDir = join(process.cwd(), "extracted");

    // Ensure directories exist and are empty
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }

    fs.mkdirSync(uploadDir);
    fs.mkdirSync(extractDir);

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
    console.log("ZIP file saved to:", zipPath);

    try {
      // Extract the ZIP file
      await extract(zipPath, { dir: extractDir });
      console.log("ZIP file extracted to:", extractDir);

      // List directory contents after extraction
      const dirContents = fs.readdirSync(extractDir);
      console.log("Extracted directory contents:", dirContents);

      // Process files recursively
      const allFiles = getAllFiles(extractDir);
      console.log("All files found:", allFiles);

      // Filter for PDF and text files
      const files = allFiles.filter((file) => {
        const lowerFile = file.toLowerCase();
        const isPdfOrTxt =
          lowerFile.endsWith(".pdf") || lowerFile.endsWith(".txt");
        console.log(`File ${file}: isPdfOrTxt = ${isPdfOrTxt}`);
        return isPdfOrTxt;
      });
      console.log("Filtered PDF/TXT files:", files);

      if (files.length === 0) {
        return NextResponse.json(
          {
            error: "No PDF or text files found in ZIP",
            directoryContents: dirContents,
            allFilesFound: allFiles,
          },
          { status: 400 }
        );
      }

      let totalCarbonFootprint = 0;
      let processedFiles = 0;
      const processedResults = [];

      for (const filePath of files) {
        try {
          console.log(`Attempting to read file: ${filePath}`);
          const fileContent = await readFileContent(filePath);

          if (fileContent && fileContent.length > 0) {
            console.log(
              `Successfully read file ${filePath}, content length: ${fileContent.length}`
            );
            const carbonData = await analyzePDFWithGPT(fileContent);
            console.log(`Analyzed carbon data for ${filePath}: ${carbonData}`);
            totalCarbonFootprint += carbonData;
            processedFiles++;
            processedResults.push({
              file: filePath.split("/").pop() || filePath, // Just the filename
              carbonFootprint: carbonData,
            });
          } else {
            console.log(`Empty or invalid content for file: ${filePath}`);
          }
        } catch (error) {
          const processError = error as ProcessError;
          console.error(`Error processing file ${filePath}:`, processError);
        }
      }

      // Cleanup
      fs.rmSync(uploadDir, { recursive: true, force: true });
      fs.rmSync(extractDir, { recursive: true, force: true });

      if (processedFiles === 0) {
        return NextResponse.json(
          {
            error: "Could not process any files in the ZIP",
            details: "Files were found but could not be processed",
            filesAttempted: files.map((f) => f.split("/").pop() || f),
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: "Upload successful",
        totalCarbonFootprint,
        analyzedFiles: processedFiles,
        results: processedResults,
      });
    } catch (error) {
      const processError = error as ProcessError;
      console.error("Error processing ZIP:", processError);
      return NextResponse.json(
        { error: "Failed to process ZIP file", details: processError.message },
        { status: 400 }
      );
    }
  } catch (error) {
    const processError = error as ProcessError;
    console.error("Error processing files:", processError);
    return NextResponse.json(
      { error: "File processing failed", details: processError.message },
      { status: 500 }
    );
  }
}
