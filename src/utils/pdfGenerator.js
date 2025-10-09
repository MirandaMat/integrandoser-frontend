const formatCurrency = (value) => {
    if (isNaN(parseFloat(value))) return 'R$ 0,00';
    return parseFloat(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const drawTable = (doc, table, x, y, colWidths = [120, 150, 100, 100]) => {
    let startX = x;
    let startY = y;
    const rowHeight = 25;
    const cellPadding = 5;

    doc.font('Helvetica-Bold').fontSize(10);
    table.headers.forEach((header, i) => {
        doc.text(header, startX, startY + cellPadding, { width: colWidths[i] });
        startX += colWidths[i];
    });
    doc.moveTo(x, startY + rowHeight).lineTo(x + colWidths.reduce((a, b) => a + b, 0), startY + rowHeight).stroke();
    
    startY += rowHeight;
    doc.font('Helvetica').fontSize(10);

    table.rows.forEach(row => {
        startX = x;
        row.forEach((cell, i) => {
            doc.text(cell, startX, startY + cellPadding, { width: colWidths[i] });
            startX += colWidths[i];
        });
        startY += rowHeight;
    });
};

module.exports = {
    formatCurrency,
    drawTable
};