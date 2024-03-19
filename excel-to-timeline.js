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
// Date: 13th March 2024
// Licence: MIT


const fs = require('fs');
const XLSX = require('xlsx');
const SOURCE_FOLDER = './'

// Props
let buildFolder = 'timelines/'
let fileName = 'timelines.xlsm'
let test = false
let cssUrl = "/"
let imagesUrl = "/"

// It is important that the rawHTML shortcodes appear at the start of the line.
// Also, to get code highlighting in VSCode for HTML need the timeline to start 
// at the beginning of a line.
// function prettyPrint(html) {
//   while (html.includes('  ')) {
//     html = html.replace(/  /g, ' ')
//   }
//   html = html.replace(/\n /g, '')
//   html = html.replace(/<h3/g, '  <h3')
//   html = html.replace(/<h4/g, '  <h4')
//   html = html.replace(/<dl/g, '  <dl')
//   html = html.replace(/<dt/g, '    <dt')
//   html = html.replace(/<\/dl/g, '  </dl')
//   html = html.replace(/<div/g, '  <div')
//   html = html.replace(/<\/div/g, '</div')
//   html = html.replace(/<cite/g, '  <cite')
//   return html
// }

let col_event = -1
let col_start = -1
let col_end = -1
let col_category = -1
let col_content = -1
let col_citations = -1
let col_linked = -1
let col_image = -1
let errors = []


function getColours(colours, categories) {
  let categoryCol = ''
  colours.forEach((colour, index) => {
    if (index === 0) return
    if (categoryCol !== '') {
      categoryCol += ','
    }
    categoryCol += categories[index] + ':' + colour
  })
  return categoryCol
}


function generateEventHtml(workbook, sheetName, json) {

  let nRows = 0;
  let categories = []
  let timeline = ''
  let html = ''
  let image = ''
  let description = ''
  let tags = ''
  let colours = ''
  let gotProps = false
  let foundTitles = false

  json.forEach((row, index) => {

    if (!gotProps) {

      const label = row[0].trim().toLowerCase()
      const value = row[1] ? row[1].trim() : ''

      switch (label) {
        case 'timeline':
          timeline = value
          break
        case 'tags':
          tags = value
          break
        case 'image':
          image = value
          break
        case 'description':
          description = value
          break
        case 'colours':
          colours = getColours(row, json[index - 1])
          break
        case 'event':
          gotProps = true
          foundTitles = true
          break
      }
      if (!gotProps) return
    }

    if (foundTitles) {
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
      col_category = getTitle('category')
      col_content = getTitle('content')
      col_citations = getTitle('citations')
      col_linked = getTitle('linked')
      col_image = getTitle('image')

      if (errors.length > 0) console.error(`\nERROR: Sheet "${sheetName}" is missing the following columns: [${errors.join(', ')}]`)

      return
    }

    if (errors.length > 0) return ''

    nRows++

    const category = row[col_category].trim()
    if (!categories.includes(category)) categories.push(category)

    // Check if the linked sheet exists
    const linked = row[col_linked] ? row[col_linked].trim().toLowerCase() : ''
    if (linked !== "") {
      const sheet = workbook.SheetNames.find(name => name.trim().toLowerCase() === linked)
      if (!sheet) {
        console.error(`\nERROR: processing timeline ${timeline} - found missing linked timeline: ${linked}\n`)
      }
    }

    html += /* html */`
      <tr>
        <td>${row[col_event].trim()}</td>
        <td>${row[col_start].trim()}</td>
        <td>${row[col_end] ? row[col_end].trim() : ''}</td>
        <td>${row[col_category].trim()}</td>
        <td>${row[col_content].trim()}</td>
        <td>${row[col_citations] ? row[col_citations].trim() : ''}</td>
        <td>${linked}</td>
        <td>${row[col_image] ? row[col_image].trim() : ''}</td>
      </tr>`
  })

  console.log(`Found ${nRows} rows in the worksheet "${sheetName}"`)

  // need to use this
  const date = (new Date()).toISOString()

  html = /* html */`
  <figure is="table-timeline" 
          data-view="chart"
          data-css-url="${cssUrl}" 
          data-images-url="${imagesUrl}" 
          data-tags="${tags}"
          data-category-colours="${colours}"
          data-created="${date}"
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

  return {html,image,description}
}


function generateTestFile(title, html) {

  return /* HTML */ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="stylesheet" href="/test.css">
      <script src="/table-timeline.js" defer></script>
    </head>
    <body class="home">
      <h1>${title}</h1>
      ${html}
    </body>
  </html>`
}


// Function to convert Excel sheet to HTML
function excelToHtml(workbook, sheetName, sheet) {

  // Convert sheet to JSON
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (json[0][0].toLowerCase() !== "timeline") return ""

  // Generate HTML
  const results = generateEventHtml(workbook, sheetName, json)

  // console.log('pre pretty printed html', html)
  // html = prettyPrint(html)

  return results
}



// Example usage: node excelToHtml.js yourExcelFile.xlsx
// print process.argv

process.argv.forEach(val => {
  const parts = val.split('=')
  if (parts.length === 2) {
    const param = parts[0].trim()
    const value = parts[1].trim()
    switch (param) {
      case 'test': 
        test = value.toLowerCase() === 'true'
        break
      case 'input': 
        fileName = value
        break
      case 'output': 
        if ( !value.endsWith('/') ) {
          value += '/'
        }
        buildFolder = value
        break
      case 'css-url': 
        cssUrl = value
        break
      case 'images-url': 
        imagesUrl = value
        break
    }
  }
});

if (!fileName) {
  console.error(`\nERROR: Please provide the name of the Excel file. The generated HTML files will be places in your ${output_folder} folder.\n`)
  return
}

// Read the Excel file
const workbook = XLSX.readFile(SOURCE_FOLDER + fileName);
const paths = []

// Prepare dest folder
// const timelinesFolder = test ? 'timelines/' : ''
// const folder = destFolder + timelinesFolder
if ( fs.existsSync(buildFolder) ){
  try {
    fs.rmSync(buildFolder) 
  } catch {
    console.error(`ERROR: There was an error attempting to delete previous dest folder "${buildFolder}"`)
  }
} else {
  try {
    fs.mkdirSync(buildFolder)
  } catch {
    console.error(`ERROR: There was an error attempting to create dest folder "${buildFolder}"`)
  }
}

// Export all the sheets
workbook.SheetNames.forEach(sheetName => {

  const sheet = workbook.Sheets[sheetName];
  const fileName = sheetName.toLowerCase().replace(/( )/g, '-')
  const results = excelToHtml(workbook, sheetName, sheet);
  let html = results.html
  if (html === "") {
    console.error('ERROR: cannot find a timeline in the worksheet', sheetName)
    return
  }

  if (test) {
    let imageHtml = ''
    let descriptionHtml = ''
    if ( results.image ){
      imageHtml = `<img class="header-image" src="/${results.image}"/>`
    }
    if ( results.description ){
      descriptionHtml = `<div class="description">${results.description}</div>`
    }
    html = `<p><a href="/${buildFolder}">Home</a></p>${imageHtml}${descriptionHtml}${html}`
    html = generateTestFile(sheetName, html )
    paths.push(`<li><a href="/${buildFolder}${fileName}.html">${sheetName}</a></li>`)
  }

  // Output the timelines
  let path = buildFolder + fileName + '.html'
  try {
    fs.writeFileSync(path, html)
  } catch {
    console.error(`ERROR: There was an error attempting to write the file to "${path}"`)
    return
  }
})

// Outout the index file
if (test && paths.length > 0) {
  const indexHtml = '<ul>\n\t\t\t\t' + paths.join('\n\t\t\t\t') + '\n\t\t\t</ul>'
  const html = generateTestFile('Index of test files', indexHtml)
  try {
    let path = buildFolder + 'index.html'
    fs.writeFileSync(path, html)
  } catch {
    console.error(`ERROR: There was an error attempting to write the file to "${path}"`)
  }
}
