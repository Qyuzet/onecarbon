import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Files } from "formidable";
import fs from "fs";
import extract from "extract-zip";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

export const config = {
  api: { bodyParser: false },
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    console.error("Error analyzing PDF with GPT:", error);
    return 0;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  // Ensure upload directories exist
  const uploadDir = "./uploads";
  const extractDir = "./extracted";
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir);

  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
  });

  try {
    const files = await new Promise<Files>((resolve, reject) => {
      form.parse(req, (err, _, files) => {
        if (err) reject(err);
        resolve(files);
      });
    });

    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!uploadedFile) {
      throw new Error("No file uploaded");
    }

    const zipPath = uploadedFile.filepath;
    await extract(zipPath, { dir: extractDir });

    const pdfFiles = fs
      .readdirSync(extractDir)
      .filter((file) => file.endsWith(".pdf"));

    let totalCarbonFootprint = 0;
    for (const file of pdfFiles) {
      const pdfData = await pdfParse(fs.readFileSync(`${extractDir}/${file}`));
      const carbonData = await analyzePDFWithGPT(pdfData.text);
      totalCarbonFootprint += carbonData;
    }

    // Cleanup
    fs.rmSync(zipPath, { force: true });
    fs.rmSync(extractDir, { recursive: true, force: true });

    res.status(200).json({
      message: "Upload successful",
      totalCarbonFootprint,
      analyzedFiles: pdfFiles.length,
    });
  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).json({ error: "File processing failed" });
  }
}
