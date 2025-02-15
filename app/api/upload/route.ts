import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import JSZip from "jszip";
import { createCanvas } from "canvas";
import pdf from "pdf-parse/lib/pdf-parse.js";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
          )}`,
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

// Read and extract text from PDFs using pdf-parse with canvas
async function readPDFContent(buffer: Buffer): Promise<string> {
  try {
    // Create a mock canvas for pdf-parse
    global.document = {
      createElementNS: () => createCanvas(1, 1),
    } as any;

    const data = await pdf(buffer);
    return data.text || "";
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

    // Get file as ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use JSZip for in-memory extraction
    const zip = new JSZip();
    const contents = await zip.loadAsync(buffer);

    console.log(
      "ZIP contents:",
      Object.keys(contents.files).length,
      "files found"
    );

    // Filter for PDF and TXT files
    const files = Object.keys(contents.files).filter(
      (filename) =>
        !contents.files[filename].dir &&
        (filename.toLowerCase().endsWith(".pdf") ||
          filename.toLowerCase().endsWith(".txt"))
    );

    console.log("Filtered files:", files);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No PDF or text files found in ZIP" },
        { status: 400 }
      );
    }

    // Process files in memory
    let totalCarbonFootprint = 0;
    const processedFiles = [];

    for (const filename of files) {
      console.log(`Processing file: ${filename}`);
      try {
        // Get file content as array buffer
        const fileData = await contents.files[filename].async("nodebuffer");

        if (!fileData || fileData.length === 0) {
          console.log(`Empty file: ${filename}`);
          continue;
        }

        let fileContent: string;
        if (filename.toLowerCase().endsWith(".pdf")) {
          fileContent = await readPDFContent(fileData);
        } else {
          fileContent = fileData.toString("utf-8");
        }

        if (fileContent && fileContent.trim() !== "") {
          console.log(
            `Extracted content from ${filename} (${fileContent.length} chars)`
          );
          const carbonFootprint = await analyzePDFWithGPT(fileContent);
          totalCarbonFootprint += carbonFootprint;
          processedFiles.push({
            name: filename,
            size: fileData.length,
            contentLength: fileContent.length,
            footprint: carbonFootprint,
          });
          console.log(`Analyzed ${filename}: ${carbonFootprint} kg CO2`);
        } else {
          console.log(`Empty content extracted from file: ${filename}`);
        }
      } catch (fileError: unknown) {
        console.error(`Error processing file ${filename}:`, fileError);
      }
    }

    return NextResponse.json({
      message: "Upload successful",
      totalCarbonFootprint,
      analyzedFiles: processedFiles.length,
      processedFiles,
    });
  } catch (error: unknown) {
    console.error("Error processing files:", error);
    return NextResponse.json(
      {
        error: "File processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
