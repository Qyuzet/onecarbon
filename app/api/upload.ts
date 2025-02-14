import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import extract from "extract-zip";
import pdfParse from "pdf-parse";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const form = new formidable.IncomingForm();
  form.uploadDir = "./uploads";
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "File upload failed" });

    const zipPath = (files.file as formidable.File).filepath;
    const extractPath = "./extracted";

    await extract(zipPath, { dir: extractPath });

    const pdfFiles = fs
      .readdirSync(extractPath)
      .filter((file) => file.endsWith(".pdf"));

    let totalCarbonFootprint = 0;
    for (const file of pdfFiles) {
      const pdfData = await pdfParse(fs.readFileSync(`${extractPath}/${file}`));
      const carbonData = extractCarbonFootprint(pdfData.text);
      totalCarbonFootprint += carbonData;
    }

    res.status(200).json({ message: "Upload berhasil", totalCarbonFootprint });
  });
}

// Fungsi dummy untuk mengekstrak jejak karbon dari teks PDF
function extractCarbonFootprint(text: string): number {
  const match = text.match(/carbon footprint:\s*([\d.]+)/i);
  return match ? parseFloat(match[1]) : Math.random() * 50;
}
