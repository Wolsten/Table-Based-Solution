// Convert an excel spreadsheet containing timeline data into an HTML 
// file ready to display as a graphical timeline
// Useage:
// npm install xlsx
// node excelToHtml yourExcelFile.xlsx


const fs = require('fs');
const XLSX = require('xlsx');
let sheetName = ''

// Function to convert Excel to HTML
function excelToHtml(filePath) {
  // Read the Excel file
  const workbook = XLSX.readFile(filePath);
  
  // Assume the first sheet in the workbook
  sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert sheet to JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Generate HTML table
  let nRows = 0
  const htmlTable = 
  `<!DOCTYPE html>
  <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="style.css">
        <title>Document</title>
    </head>
    <body><p><a href='/'>Home</a></p>` +
        `<table class="event-table" id="${sheetName}">` +
            jsonData.map( (row,index) => {
                //console.log('index',index)
                nRows++
                if ( index==0 ) {
                    return '<!-- <tr>' +
                                row.map(cell => `<td>${cell}</td>`).join('') +
                            '</tr> -->';
                } else {
                    return '<tr>' +
                    row.map(cell => `<td>${cell}</td>`).join('') +
                '</tr>';
                }
            }).join('') +
            '</table>' +
    `</body>
    <script src="table-timeline.js"></script>
</html>`;
  console.log(`Found ${nRows} rows in the table`)
  return htmlTable;
}

// Example usage: node excelToHtml.js yourExcelFile.xlsx
const filePath = process.argv[2];
if (filePath) {
  const html = excelToHtml(filePath);
  // console.log(html);
  sheetName = sheetName.toLowerCase().replace(' ','-')
  fs.writeFile(sheetName+'.html', html, err => {
    if (err) {
      console.error(err);
    }
  })

} else {
  console.warning('Please provide the path to the Excel file.');
}
