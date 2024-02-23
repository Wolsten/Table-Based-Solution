"use strict"

// Convert an excel spreadsheet containing timeline data sheets into 
// corresponding HTML files ready to display as graphical timelines
// Useage:
// npm install xlsx
// node excelToHtml yourExcelFile.xlsx
// Author: Stephen John Davison
// Date:14th Feb 2024
// Licence: MIT


const fs = require('fs');
const XLSX = require('xlsx');
const SOURCE_FOLDER = './'
let output_folder = './'


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

let col_title = -1
let col_start = -1
let col_end = -1
let col_tag = -1
let col_content = -1
let col_citations = -1
let col_link = -1
let errors = []


function generateEventHtml(sheetName, json) {
  let nRows = 0
  let category = ''
  let timelineName = ''
  let summary = ''
  let image = ''
  let html = ''
  const tags = []
  errors = []
  let gotProps = false
  let foundTitles = false

  json.forEach(row => {

    if (!gotProps) {

      const label = row[0].trim().toLowerCase()
      console.log('Getting prop', label)
      const value = row[1] ? row[1].trim() : ''
      switch (label) {
        case 'name': timelineName = value; break
        case 'category': category = value; break
        case 'summary': summary = value; break
        case 'image': image = value; break
        case 'title':
          gotProps = true
          foundTitles = true
          break
      }
      if (!gotProps) return
    }

    if (foundTitles) {
      console.log('Getting titles')
      foundTitles = false

      col_title = row.findIndex(col => col.trim().toLowerCase() === 'title')
      if (col_title === -1) errors.push('title')

      col_start = row.findIndex(col => col.trim().toLowerCase() === 'start')
      if (col_start === -1) errors.push('start')

      col_end = row.findIndex(col => col.trim().toLowerCase() === 'end')
      if (col_end === -1) errors.push('end')

      col_tag = row.findIndex(col => col.trim().toLowerCase() === 'tag')
      if (col_tag === -1) errors.push('tag')

      col_content = row.findIndex(col => col.trim().toLowerCase() === 'content')
      if (col_content === -1) errors.push('content')

      col_citations = row.findIndex(col => col.trim().toLowerCase() === 'citations')
      if (col_citations === -1) errors.push('citation')

      col_link = row.findIndex(col => col.trim().toLowerCase() === 'link')

      if (errors.length > 0) console.error(`Sheet "${sheetName}" is missing the following columns: [${errors.join(', ')}]`)

      return
    }

    if (errors.length > 0) return

    nRows++

    // console.log('col_title', col_title)

    const title = row[col_title].trim()
    const start = row[col_start].trim()
    const end = row[col_end] ? row[col_end].trim() : ''
    const tag = row[col_tag].trim()
    const content = row[col_content].trim()
    const citations = row[col_citations] ? row[col_citations].trim() : ''
    const link = row[col_link] ? row[col_link].trim() : ''

    if (!tags.includes(tag)) tags.push(tag)

    html += /* html */`\n
          <tr>
          <td>${title}</td>
          <td>${start}</td>
          <td>${end}</td>
          <td>${tag}</td>
          <td>${content}</td>
          <td>${citations}</td>
          <td>${link}</td>
          </tr>`
  })

  console.log(`Found ${nRows} rows in the worksheet "${sheetName}"`)

  // console.log('CONSTRUCTED html BEFORE TABLE', html)


  html = /* html */`
    <table>
    <thead>
      <tr>
        <th>title</th>
        <th>start</th>
        <th>end</th>
        <th>tag</th>
        <th>content</th>
        <th>citations</th>
        <th>link</th>
      </tr>
    </thead>
    <tbody>
      ${html}
    </tbody>
    </table>
  `

  // console.log('RETURNING html', html)

  return { html, tags, title: timelineName, category, summary, image }
}


// Function to convert Excel sheet to HTML
function excelToHtml(sheetName, sheet) {

  const date = (new Date()).toISOString()

  // Convert sheet to JSON

  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  // console.log('json', json)

  // Generate HTML
  let { html, tags, title, category, summary, image } = generateEventHtml(sheetName, json)

  html = /* html */`<figure is="my-timeline" data-view="text">\n${html}\n<figcaption>${title}</figcaption>\n</figure>`



  if (format === 'hugo') {
    const tagsString = tags ? tags.join(',') : ''
    const summaryParam = summary ? `\nsummary: ${summary}` : ''
    const imageParam = image ? `\nimage: ${image}` : ''
    html =
      `---
      \ntitle: ${title}
      \ndate: ${date}
      \ndraft: false
      \ntags: [${tagsString}]
      \ncategories: [${category}]
      ${summaryParam}
      ${imageParam}
      \n---
      \n
      \n{{< rawhtml >}}
      \n
      \n${html}\n
      \n
      \n{{< /rawhtml >}}
      \n\n`
  }
  // console.log('pre pretty printed html', html)
  html = prettyPrint(html)
  return html
}

// Example usage: node excelToHtml.js yourExcelFile.xlsx
// print process.argv
let fileName = ''
let format = 'html'
process.argv.forEach(val => {
  // console.log(index + ': ' + val);
  if (val.includes('format=')) {
    const parts = val.split('=')
    if (parts.length === 2) {
      format = parts[1].trim()
    }
  } else if (val.includes('input=')) {
    const parts = val.split('=')
    if (parts.length === 2) {
      fileName = parts[1].trim()
    }
  } else if (val.includes('dest=')) {
    const parts = val.split('=')
    if (parts.length === 2) {
      output_folder = parts[1].trim()
    }
  }
});
console.log('input file =', fileName)
// console.log('output format =', format)

if (fileName) {

  // Read the Excel file
  const workbook = XLSX.readFile(SOURCE_FOLDER + fileName);
  let fileExtension = '.html'
  if (format === 'hugo' || format === 'md') {
    fileExtension = '.md'
  }

  // Export all the sheets
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const html = excelToHtml(sheetName, sheet);
    // console.log(html);
    sheetName = sheetName.toLowerCase().replace(/( )/g, '-')
    console.log('writing file to folder', output_folder)
    fs.writeFile(output_folder + sheetName + fileExtension, html, err => {
      if (err) {
        console.error(err);
      }
    })
  })

} else {
  console.warn(`\nPlease provide the name of the Excel file. The generated HTML files will be places in your ${output_folder} folder.\n`);
}
