import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generate PDF with logo, centered title, and leaderboard table
 * @param {Array} schachten - Array of schacht objects with {name, points}
 * @param {string} logoBase64 - Base64 string of the logo image
 */
export const generatePDF = (schachten, logoBase64) => {
  const doc = new jsPDF("p", "pt", "a4"); // portrait, points, A4 size
  const pageWidth = doc.internal.pageSize.getWidth();

  // Add logo at (40, 30) width 50px, height 50px
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", 40, 30, 50, 50);
  }

  // Title
  const title = "Schachten Punten";
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const textWidth = doc.getTextWidth(title);
  const x = (pageWidth - textWidth) / 2;
  doc.text(title, x, 60);

  // Table below title (startY = 100)
  const rows = schachten.map((s, idx) => [idx + 1, s.name, s.points]);

  autoTable(doc, {
    head: [["#", "Name", "Points"]],
    body: rows,
    startY: 100,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: "#0401b1", textColor: "#ffffff", fontStyle: "bold" }, // Blue header
  });

  doc.save("leaderboard.pdf");
};
