// Convert an excel spreadsheet containing timeline data sheets into 
// corresponding HTML files ready to display as graphical timelines
// Useage:
// npm install xlsx
// node excelToHtml yourExcelFile.xlsx
// Author: Stephen John Davison
// Date: 1/12/23
// Licence: MIT


const fs = require('fs');
const XLSX = require('xlsx');

// Function to convert Excel sheet to HTML
function excelToHtml(sheetName, sheet) {

  // Convert sheet to JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Generate HTML table
  let nRows = 0
  const html =
    `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="style.css">
        <title>Document</title>
    </head>
    <body><p><a href='/'>Home</a></p>` +
    `<table class="timeline-table" title="${sheetName}">` +
    jsonData.map((row, index) => {
      //console.log('index',index)
      nRows++
      if (index == 0) {
        return '<tr>' + row.map(cell => `<th>${cell}</th>`).join('') + '</tr>'
      } else {
        return '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
      }
    }).join('') +
    '</table>' +
    `</body>
    <script src="table-timeline.js"></script>
  </html>`;
  console.log(`Found ${nRows} rows in the worksheet "${sheetName}"`)
  return html;
}

// Example usage: node excelToHtml.js yourExcelFile.xlsx
const filePath = process.argv[2];
if (filePath) {

  // Read the Excel file
  const workbook = XLSX.readFile(filePath);

  // Export all the sheets
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const html = excelToHtml(sheetName, sheet);
    // console.log(html);
    sheetName = sheetName.toLowerCase().replace(/( )/g, '-')
    fs.writeFile(sheetName + '.html', html, err => {
      if (err) {
        console.error(err);
      }
    })
  })

} else {
  console.warning('Please provide the path to the Excel file.');
}
