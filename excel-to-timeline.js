"use strict"

// *** DO NOT USE ***
// Convert an excel spreadsheet containing timeline data sheets into 
// corresponding HTML files ready to display as graphical timelines
// This file is now out of date with respect to the VBA code module in
// the timelines.xlsm workbook and is left here for future reference only
// Useage:
// npm install xlsx
// node excelToHtml yourExcelFile.xlsx
// Author: Steve Davison
// Date: 1st March 2024
// Licence: MIT


const fs = require('fs');
const XLSX = require('xlsx');
const SOURCE_FOLDER = './'

// Props
let output_folder = './exported/'
let fileName = 'timelines.xlsx'
let test = false
let cssUrl = "/"
let imagesUrl = "/"

// It is important that the rawHTML shortcodes appear at the start of the line.
// Also, to get code highlighting in VSCode for HTML need the timeline to start 
// at the beginning of a line.
function prettyPrint(html) {
  while (html.includes('  ')) {
    html = html.replace(/  /g, ' ')
  }
  html = html.replace(/\n /g, '')
  html = html.replace(/<h3/g, '  <h3')
  html = html.replace(/<h4/g, '  <h4')
  html = html.replace(/<dl/g, '  <dl')
  html = html.replace(/<dt/g, '    <dt')
  html = html.replace(/<\/dl/g, '  </dl')
  html = html.replace(/<div/g, '  <div')
  html = html.replace(/<\/div/g, '</div')
  html = html.replace(/<cite/g, '  <cite')
  return html
}

let col_event = -1
let col_start = -1
let col_end = -1
let col_tag = -1
let col_content = -1
let col_citations = -1
let col_linked = -1
let col_image = -1
let errors = []


function generateEventHtml(workbook, sheetName, json) {

  let nRows = 0;
  let categories = '';
  let timeline = '';
  let html = '';
  let tags = []
  let gotProps = false
  let foundTitles = false

  json.forEach(row => {

    if (!gotProps) {

      const label = row[0].trim().toLowerCase()
      const value = row[1] ? row[1].trim() : ''

      switch (label) {
        case 'timeline':
          timeline = value
          break
        case 'categories':
          categories = value
          break
        case 'event':
          gotProps = true
          foundTitles = true
          break
      }
      if (!gotProps) return
    }

    if (foundTitles) {
      // console.log('Getting titles')
      foundTitles = false

      const getTitle = function (title) {
        const col = row.findIndex(col => col.trim().toLowerCase() === title)
        if (col === -1) {
          errors.push(title)
        }
        return col
      }

      col_event = getTitle('event')
      col_start = getTitle('start')
      col_end = getTitle('end')
      col_tag = getTitle('tag')
      col_content = getTitle('content')
      col_citations = getTitle('citations')
      col_linked = getTitle('linked')
      col_image = getTitle('image')

      if (errors.length > 0) console.error(`ERROR: Sheet "${sheetName}" is missing the following columns: [${errors.join(', ')}]`)

      return
    }

    if (errors.length > 0) return ''

    nRows++

    const tag = row[col_tag].trim()
    if (!tags.includes(tag)) tags.push(tag)

    // Check if the linked sheet exists
    const linked = row[col_linked] ? row[col_linked].trim().toLowerCase() : ''
    if ( linked !== ""){
      const sheet = workbook.SheetNames.find( name => name.trim().toLowerCase()===linked)
      if ( !sheet ){
        console.error(`\nERROR: processing timeline ${timeline} - found missing linked timeline: ${linked}\n`)
      }
    }

    html += /* html */`
      <tr>
        <td>${row[col_event].trim()}</td>
        <td>${row[col_start].trim()}</td>
        <td>${row[col_end] ? row[col_end].trim() : ''}</td>
        <td>${row[col_tag].trim()}</td>
        <td>${row[col_content].trim()}</td>
        <td>${row[col_citations] ? row[col_citations].trim() : ''}</td>
        <td>${linked}</td>
        <td>${row[col_image] ? row[col_image].trim() : ''}</td>
      </tr>`
  })

  console.log(`Found ${nRows} rows in the worksheet "${sheetName}"`)

  html = /* html */`
  <figure is="table-timeline" 
          data-view="chart" 
          data-css-url="${cssUrl}" 
          data-images-url="${imagesUrl}" 
          data-categories="${categories}"
          data-tag-colours=""
          data-controls="view:true,tags:true,search:true,sorting:true">
    <table>
    <thead>
      <tr>
        <th>event</th>
        <th>start</th>
        <th>end</th>
        <th>tag</th>
        <th>content</th>
        <th>citations</th>
        <th>linked</th>
        <th>image</th>
      </tr>
    </thead>
    <tbody>
      ${html}
    </tbody>
    </table>
    <figcaption>${timeline}</figcaption>
  </figure>`

  // console.log('RETURNING html', html)

  return html
}


function generateTestFile(html){
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Timeline Test Page</title>
      <link rel="stylesheet" href="/test.css">
      <script src="/table-timeline.js" defer></script>
    </head>
    <body class="home">
      <h1>Timeline Test Page</h1>
      ${html}
    </body>
  </html>`
}


// Function to convert Excel sheet to HTML
function excelToHtml(workbook, sheetName, sheet) {

  // @todo need to use this
  const date = (new Date()).toISOString()

  // Convert sheet to JSON

  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // console.log('json', json)

  if (json[0][0] !== "timeline") return ""

  // Generate HTML
  let html = generateEventHtml(workbook, sheetName, json)

  // console.log('pre pretty printed html', html)
  // html = prettyPrint(html)

  return html
}

// Example usage: node excelToHtml.js yourExcelFile.xlsx
// print process.argv

process.argv.forEach(val => {
  const parts = val.split('=')
  if (parts.length === 2) {
    const param = parts[0].trim()
    const value = parts[1].trim()
    switch (param) {
      case 'test': test = value.toLowerCase()==='true'; break
      case 'input': filename = value; break
      case 'dest': output_folder = value; break
      case 'css-url': cssUrl = value; break
      case 'images-url': imagesUrl = value; break
    }
  }
});

if ( test ){
  cssUrl = "/exported"
  imagesUrl = "/exported"
}

if (fileName) {

  // Read the Excel file
  const workbook = XLSX.readFile(SOURCE_FOLDER + fileName);

  // Export all the sheets
  workbook.SheetNames.forEach(sheetName => {

    const sheet = workbook.Sheets[sheetName];
    let html = excelToHtml(workbook, sheetName, sheet);

    // console.log('sheet', sheetName, ': generated html[', html, ']')

    if (html !== "") {

      if ( test ){
        html = generateTestFile(html)
      }

      sheetName = sheetName.toLowerCase().replace(/( )/g, '-')
      console.log('writing file to folder', output_folder)
      fs.writeFile(output_folder + sheetName + '.html', html, err => {
        if (err) {
          console.error(err);
        }
      })
    }
  })

  if ( test ){
    // Copy files to output folder
    fs.copyFileSync('table-timeline.js', output_folder + 'table-timeline.js');
    fs.copyFileSync('table-timeline.css', output_folder + 'table-timeline.css');
  }

} else {
  console.warn(`\nPlease provide the name of the Excel file. The generated HTML files will be places in your ${output_folder} folder.\n`);
}
