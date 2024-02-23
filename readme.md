# Table Timeline

22nd Feb 2024

## Introduction

Table timeline is a custom web component that takes a correctly structured HTML table and converts it into a graphical timeline and a prose version, formatted with a custom stylesheet. Implementing the timeline as a table means that a timeline can be indexed without the javascript component being triggered.

An Excel workbook is also provided which supports the automatic generation of either html or markdown files from timelines stored as separate worksheets in the workbook.

To generate a number of sample timelines and an index file, open the workbook, go to sheet "ToC" and click **Export** button.

## Installation

The main files you need are the javascript module `timeline.js` and the css file `timneline.css`.

Add the script tag to the `<head>` section, using the `defer` attribute:

`<script src="/timeline.js" defer></script>`


## Usage

```
<figure is='my-timeline' data-view='chart|text' [data-cssurl='url']>

    <!-- Optional style section to override colours for -->
    [<style>
            table {
                --tag-name-x: hsl(123, 70%, 57%);
                --tag-name-y: hsl(194, 60%, 60%);
                --tag-name-z: hsl(221, 80%, 70%);
            }
    </style>]

    <table>

        <!-- Table head -->
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

            <!-- Event rows -->
            <tr>
                <th>event title</th>
                <th>event start</th>
                <th>event end</th>
                <th>event tag</th>
                <th>event content</th>
                <th>event citations</th>
                <th>event link</th>
            <tr>

        </tbody>

    </table>

<figcaption>Timeline Title</figcaption>
```

Timeline figures are identified with the is property `my-timeline` and named via the `figcaption` tag at the end of the figure. They also have an optional `styles` tag which can be used to override the colours for each category of event. If not provided a set of default colours will be used. These are specified in the `timeline.css` file. An optional `data-cssurl` parameter may also be specified so that the `timeline.css` file can be placed in different folder to the javascript component.

Dates can be formatted in a number of ways:

-   Year, _e.g. 2023_
-   UTC date, _e.g. 2023-12-25_
-   Gregorian calendar, _e.g. 100BC and 2023BC_
-   Common era, e.g. _e.g. 100BCE and 2023BE_
-   Geologic, _e.g. 4.5bya, where units can be bya, mya and tya_

Gregorian, common era and geologic indicators are case-insensitive.

Each timeline can mix date types for different events. Ongoing events are specified by setting their end date to the word **date** or **-**. Events can just have a start time (i.e. instants), in which case the end date should be left blank.

There is also a node script for converting an Excel spreadsheet table into the equivalent HTML page to display as a graphical timeline. This does not support custom style attributes at present.

## MIT Licence

Copyright (c) 2023 Stephen John Davison

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
