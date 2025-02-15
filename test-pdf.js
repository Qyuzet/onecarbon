import pdfParse from "pdf-parse";
import fs from "fs";

const filePath =
  "C:\\Users\\Riki A\\OneDrive\\Desktop\\UNIVERSITY\\PERSONAL\\PORTOFOLIO\\HACKATON\\onecarbon-hackaton\\extracted\\dotaempTrans.pdf"; // Set correct file path

if (!fs.existsSync(filePath)) {
  console.error("🚨 File does not exist:", filePath);
} else {
  const buffer = fs.readFileSync(filePath);
  pdfParse(buffer, { version: "default" })
    .then((data) => console.log(data.text))
    .catch((err) => console.error("❌ Error parsing PDF:", err));
}
