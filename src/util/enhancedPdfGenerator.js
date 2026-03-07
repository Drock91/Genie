/**
 * Enhanced PDF Generator
 * 
 * Creates professional PDFs from markdown, JSON, or structured data.
 * Used by GENIE to automatically generate PDF outputs when requested.
 */

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

// Color scheme
const COLORS = {
  navy: "#001f3f",
  gold: "#d4af37",
  darkBlue: "#003366",
  lightBlue: "#4a90d9",
  black: "#000000",
  gray: "#666666",
  lightGray: "#cccccc",
  white: "#ffffff",
  success: "#28a745",
  warning: "#ffc107",
  danger: "#dc3545"
};

/**
 * Generate a professional PDF from structured content
 * @param {Object} options - PDF generation options
 * @returns {Promise<string>} Path to generated PDF
 */
export async function generatePdf({
  outputPath,
  title,
  subtitle,
  content,
  sections,
  metadata = {},
  style = "professional"
}) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 50, bottom: 50, left: 55, right: 55 },
    bufferPages: true
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Title page
  if (title) {
    await renderTitle(doc, title, subtitle, metadata, style);
  }

  // Content sections
  if (sections && sections.length > 0) {
    for (const section of sections) {
      await renderSection(doc, section, style);
    }
  } else if (content) {
    // Render raw content
    await renderContent(doc, content, style);
  }

  // Add page numbers
  addPageNumbers(doc);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}

/**
 * Render title page
 */
async function renderTitle(doc, title, subtitle, metadata, style) {
  doc.moveDown(3);
  
  // Title
  doc.font("Helvetica-Bold")
     .fontSize(28)
     .fillColor(COLORS.navy)
     .text(title, { align: "center" });
  
  doc.moveDown(0.5);
  
  // Gold underline
  const titleWidth = doc.widthOfString(title);
  const pageWidth = doc.page.width - 110;
  const lineX = (pageWidth - Math.min(titleWidth, pageWidth * 0.8)) / 2 + 55;
  doc.strokeColor(COLORS.gold)
     .lineWidth(3)
     .moveTo(lineX, doc.y)
     .lineTo(doc.page.width - lineX, doc.y)
     .stroke();
  
  doc.moveDown(0.8);
  
  // Subtitle
  if (subtitle) {
    doc.font("Helvetica")
       .fontSize(14)
       .fillColor(COLORS.gray)
       .text(subtitle, { align: "center" });
    doc.moveDown(0.5);
  }
  
  // Metadata
  doc.moveDown(2);
  if (metadata.author) {
    doc.font("Helvetica")
       .fontSize(11)
       .fillColor(COLORS.gray)
       .text(`Prepared by: ${metadata.author}`, { align: "center" });
  }
  if (metadata.date) {
    doc.text(`Date: ${metadata.date}`, { align: "center" });
  }
  if (metadata.version) {
    doc.text(`Version: ${metadata.version}`, { align: "center" });
  }
  
  doc.addPage();
}

/**
 * Render a content section
 */
async function renderSection(doc, section, style) {
  // Check if we need a new page
  if (doc.y > doc.page.height - 150) {
    doc.addPage();
  }
  
  // Section header
  if (section.title) {
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold")
       .fontSize(16)
       .fillColor(COLORS.darkBlue)
       .text(section.title);
    doc.moveDown(0.3);
  }
  
  // Section content based on type
  switch (section.type) {
    case "text":
      renderTextContent(doc, section.content, style);
      break;
    case "bullets":
      renderBullets(doc, section.items, style);
      break;
    case "checklist":
      renderChecklist(doc, section.items, style);
      break;
    case "table":
      renderTable(doc, section.headers, section.rows, style);
      break;
    case "keyvalue":
      renderKeyValue(doc, section.pairs, style);
      break;
    case "numbered":
      renderNumbered(doc, section.items, style);
      break;
    case "subsections":
      for (const sub of section.subsections || []) {
        await renderSubsection(doc, sub, style);
      }
      break;
    default:
      renderTextContent(doc, section.content || "", style);
  }
  
  doc.moveDown(0.5);
}

/**
 * Render text content
 */
function renderTextContent(doc, content, style) {
  if (!content) return;
  
  doc.font("Helvetica")
     .fontSize(10)
     .fillColor(COLORS.black)
     .text(content, { align: "left", lineGap: 2 });
}

/**
 * Render bullet points
 */
function renderBullets(doc, items, style) {
  if (!items || !Array.isArray(items)) return;
  
  for (const item of items) {
    doc.font("Helvetica")
       .fontSize(10)
       .fillColor(COLORS.black)
       .text(`•  ${item}`, { indent: 15 });
  }
}

/**
 * Render checklist
 */
function renderChecklist(doc, items, style) {
  if (!items || !Array.isArray(items)) return;
  
  for (const item of items) {
    const checked = item.checked || item.done || false;
    const symbol = checked ? "☑" : "☐";
    const text = typeof item === "string" ? item : item.text || item.title;
    
    doc.font("Helvetica")
       .fontSize(10)
       .fillColor(checked ? COLORS.success : COLORS.black)
       .text(`${symbol}  ${text}`, { indent: 10 });
  }
}

/**
 * Render table
 */
function renderTable(doc, headers, rows, style) {
  if (!headers || !rows) return;
  
  const colCount = headers.length;
  const tableWidth = doc.page.width - 110;
  const colWidth = tableWidth / colCount;
  const startX = 55;
  let y = doc.y;
  
  // Header row
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.navy);
  headers.forEach((header, i) => {
    doc.text(header, startX + (i * colWidth), y, { width: colWidth - 5, align: "left" });
  });
  y = doc.y + 5;
  
  // Header line
  doc.strokeColor(COLORS.gold).lineWidth(1);
  doc.moveTo(startX, y).lineTo(startX + tableWidth, y).stroke();
  y += 8;
  
  // Data rows
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.black);
  for (const row of rows) {
    const rowData = Array.isArray(row) ? row : Object.values(row);
    const maxY = y;
    
    rowData.forEach((cell, i) => {
      doc.text(String(cell || ""), startX + (i * colWidth), y, { width: colWidth - 5, align: "left" });
    });
    
    y = doc.y + 3;
    
    // Check for page break
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }
  }
  
  doc.y = y + 5;
}

/**
 * Render key-value pairs
 */
function renderKeyValue(doc, pairs, style) {
  if (!pairs) return;
  
  const pairArray = Array.isArray(pairs) ? pairs : Object.entries(pairs).map(([k, v]) => ({ key: k, value: v }));
  
  for (const pair of pairArray) {
    const key = pair.key || pair.label || pair.name;
    const value = pair.value || pair.data;
    
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.darkBlue)
       .text(`${key}: `, { continued: true })
       .font("Helvetica").fillColor(COLORS.black)
       .text(String(value));
  }
}

/**
 * Render numbered list
 */
function renderNumbered(doc, items, style) {
  if (!items || !Array.isArray(items)) return;
  
  items.forEach((item, i) => {
    const text = typeof item === "string" ? item : item.text || item.title;
    doc.font("Helvetica")
       .fontSize(10)
       .fillColor(COLORS.black)
       .text(`${i + 1}.  ${text}`, { indent: 15 });
  });
}

/**
 * Render subsection
 */
async function renderSubsection(doc, sub, style) {
  // Subsection title
  if (sub.title) {
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold")
       .fontSize(12)
       .fillColor(COLORS.navy)
       .text(sub.title);
    doc.moveDown(0.2);
  }
  
  // Subsection content
  if (sub.content) {
    renderTextContent(doc, sub.content, style);
  }
  if (sub.items) {
    renderBullets(doc, sub.items, style);
  }
}

/**
 * Render raw content (markdown-like)
 */
async function renderContent(doc, content, style) {
  const lines = content.split("\n");
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) {
      doc.moveDown(0.3);
      continue;
    }
    
    // Headers
    if (line.startsWith("# ")) {
      doc.font("Helvetica-Bold").fontSize(18).fillColor(COLORS.navy)
         .text(line.substring(2));
      doc.moveDown(0.3);
    } else if (line.startsWith("## ")) {
      doc.font("Helvetica-Bold").fontSize(14).fillColor(COLORS.darkBlue)
         .text(line.substring(3));
      doc.moveDown(0.2);
    } else if (line.startsWith("### ")) {
      doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.navy)
         .text(line.substring(4));
      doc.moveDown(0.2);
    }
    // Bullets
    else if (line.match(/^[-*]\s/)) {
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.black)
         .text(`•  ${line.substring(2)}`, { indent: 15 });
    }
    // Checkboxes
    else if (line.match(/^- \[[x ]\]/i)) {
      const checked = line.match(/\[x\]/i);
      const text = line.replace(/^- \[[x ]\]\s*/i, "");
      doc.font("Helvetica").fontSize(10)
         .fillColor(checked ? COLORS.success : COLORS.black)
         .text(`${checked ? "☑" : "☐"}  ${text}`, { indent: 10 });
    }
    // Numbered items
    else if (line.match(/^\d+\.\s/)) {
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.black)
         .text(line, { indent: 15 });
    }
    // Bold text
    else if (line.startsWith("**") && line.endsWith("**")) {
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.black)
         .text(line.replace(/\*\*/g, ""));
    }
    // Regular text
    else {
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.black)
         .text(line);
    }
    
    // Check for page break
    if (doc.y > doc.page.height - 80) {
      doc.addPage();
    }
  }
}

/**
 * Add page numbers to all pages
 */
function addPageNumbers(doc) {
  const range = doc.bufferedPageRange();
  
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    
    // Footer line
    doc.strokeColor(COLORS.lightGray).lineWidth(0.5);
    doc.moveTo(55, doc.page.height - 40)
       .lineTo(doc.page.width - 55, doc.page.height - 40)
       .stroke();
    
    // Page number
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.gray)
       .text(
         `Page ${i + 1} of ${range.count}`,
         55,
         doc.page.height - 35,
         { align: "center", width: doc.page.width - 110 }
       );
  }
}

/**
 * Convert markdown content to PDF
 */
export async function markdownToPdf({ markdownContent, outputPath, metadata = {} }) {
  return generatePdf({
    outputPath,
    title: metadata.title,
    subtitle: metadata.subtitle,
    content: markdownContent,
    metadata,
    style: "professional"
  });
}

/**
 * Convert JSON report to PDF
 */
export async function jsonToPdf({ jsonData, outputPath, title, metadata = {} }) {
  const sections = [];
  
  // Convert JSON structure to sections
  if (typeof jsonData === "object") {
    for (const [key, value] of Object.entries(jsonData)) {
      const section = {
        title: formatKey(key),
        type: determineSectionType(value),
        ...extractSectionData(value)
      };
      sections.push(section);
    }
  }
  
  return generatePdf({
    outputPath,
    title: title || "Report",
    sections,
    metadata,
    style: "professional"
  });
}

/**
 * Format a key for display
 */
function formatKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

/**
 * Determine section type from value
 */
function determineSectionType(value) {
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === "object") {
      return "table";
    }
    return "bullets";
  }
  if (typeof value === "object") {
    return "keyvalue";
  }
  return "text";
}

/**
 * Extract section data based on type
 */
function extractSectionData(value) {
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === "object") {
      return {
        headers: Object.keys(value[0]),
        rows: value
      };
    }
    return { items: value };
  }
  if (typeof value === "object") {
    return { pairs: value };
  }
  return { content: String(value) };
}

export default { generatePdf, markdownToPdf, jsonToPdf };
