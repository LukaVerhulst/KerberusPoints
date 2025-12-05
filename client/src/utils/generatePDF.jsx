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

  // Group schachten by points, then create rows
  const rows = [];
  const groupFill = [];
  const palette = [
    [247, 249, 255], // light blue
    [233, 238, 252], // deeper blue
  ];

  let currentRank = 1;
  let groupIndex = 0;
  let idx = 0;

  while (idx < schachten.length) {
    const currentPoints = schachten[idx].points;
    const namesGroup = [];

    // Collect all names with same points
    while (idx < schachten.length && schachten[idx].points === currentPoints) {
      namesGroup.push(schachten[idx].name);
      idx++;
    }

    // Create single row with all names joined
    rows.push([currentRank, namesGroup.join(", "), currentPoints]);
    groupFill.push(palette[groupIndex]);

    // Alternate color for next group
    groupIndex = 1 - groupIndex;
    currentRank = idx + 1; // Next rank = position after this group
  }

  autoTable(doc, {
    head: [["#", "Name", "Points"]],
    body: rows,
    startY: 100,
    theme: "grid",
    styles: { fontSize: 10, valign: "middle" },
    headStyles: { fillColor: "#0401b1", textColor: "#ffffff", fontStyle: "bold" },
    columnStyles: { 0: { halign: "center" } },
    didParseCell: (data) => {
      if (data.section === "body") {
        data.cell.styles.fillColor = groupFill[data.row.index];
      }
    },
  });

  doc.save("leaderboard.pdf");
};