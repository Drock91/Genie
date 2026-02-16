import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

function normalizeText(text) {
  if (!text) return "";
  return text.replace(/\r\n/g, "\n");
}

export function writePdf({ outputPath, title, text }) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const doc = new PDFDocument({ size: "LETTER", margin: 54 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  if (title) {
    doc.fontSize(18).text(title, { align: "left" });
    doc.moveDown(1);
  }

  doc.fontSize(11).text(normalizeText(text), { align: "left" });
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}
