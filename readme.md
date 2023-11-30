# Table Timeline
30/11/2023

## Introduction

Table timeline is a simple Javascript program that takes a correctly structured HTML table and converts it into a graphical timeline and formatted with a custom stylesheet.

A timeline table should be structured as a simple table composed of TABLE, TR and TD tags as follows:

## Installation

The main files you need are the javascript module ```table-timeline.js``` and the css file ```style.css```.

Link the css file in the head of your page:

```<link rel="stylesheet" href="style.css">```

and add the script tag at the end of the page body:

```<script src="table-timeline.js"></script>```

## Usage

```
<table 
    class="timeline-table" 
    id="timeline name" 
    data-category-colours="white;hsl(220, 40%, 50%);hsl(220, 60%, 60%);hsl(220, 80%, 70%);hsl(60, 60%, 40%);hsl(60, 90%, 70%);hsl(0, 80%, 80%)">
    <tr>
        <td>Event name</td>
        <td>Start</td>
        <td>End date</td>
        <td>Category</td>
        <td>Summary</td>
        <td>Citations</td>
    </tr>
</table>
```

Timeline tables are identified with the class ```timeline-table``` and named via their ```id```. They also have an optional attribute ```data-category-colours``` which lists the colours for each category of event. If not provided a set of default colours will be used. These are specified in the ```style.css``` file and can of course be overridden.

Dates can be formatted in a number of ways:

* Year, *e.g. 2023*
* UTC date, *e.g. 2023-12-25*
* Christian era, *e.g. 100BC and 2023BC*
* Geologic, *e.g. 4.5bya, where units can be bya, mya and tya*

Christian era and geologic indicators are case-insensitive.

Each timeline should use the same method. Ongoing events are specified by setting their end date to the word **date**.

There is also a node script for converting an Excel spreadsheet table into the equivalent HTML page to display as a graphical timeline.

## Licence

MIT License

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