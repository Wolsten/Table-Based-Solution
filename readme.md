# Table Timeline

22nd Feb 2024

## Introduction

Table timeline is a custom web component that takes an appropriately structured HTML table and converts it into a graphical timeline as well as a prose version, formatted with a custom stylesheet. Implementing the timeline as a table means that a timeline can be indexed without the javascript component being triggered.

An Excel workbook is also provided which supports the automatic generation of either html or markdown files from timelines stored as separate worksheets in the workbook. The markdown files may be including in static site generators like [Hugo](https://gohugo.io).



## Installation

The main files you need are the javascript module `table-timeline.js` and the css file `table-timeline.css`.

Add the script tag to the `<head>` section, using the `defer` attribute:

`<script src="/table-timeline.js" defer></script>`

The url location of the style sheet should be set as an option using the data-options attribute in any included table-timeline element. This means that you have the option of customising the stylesheet for each timeline - though this is unlikely to be that useful in practice.


## Quick Start

To generate a number of sample timelines and an index file, open the workbook, go to sheet `ToC`, make sure that the Export parameter `test` is set to `true` and click the `Export` button.

## Adding components manually

A table timeline is identified by a `figure` element with the `is` attribute set to `table-timeline`. The default view can be set using the `data-view` attribute. A number of options can be specified using a comma separated list for the `data-options` attribute as follows (default option is the first one in each case):

cssurl:\                Location of the css file relative to website root
search:[true|false]     Display search box?
view:[true|false]       Display view switch toggle buttons
tags:[true|false]       Display tag filter buttons
sorting:[true|false]    Display sorting options (date/tag)
test:[false|true]       Test site. If true any linked timeline links will includ
                        a `.html` suffix.


```
<figure is='table-timeline' data-view='chart|text' [data-options="cssurl:url"]>

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
                <th>image</th>
            </tr>
        </thead>

        <tbody>

            <!-- Event rows -->
            <tr>
                <th>event title</th>
                <th>event start data</th>
                <th>event end date </th>
                <th>event tag (the type of event)</th>
                <th>event content</th>
                <th>event citations</th>
                <th>event link - name of a linked timeline</th>
                <th>event image link</th>
            <tr>

            <!-- etc -->

        </tbody>

    </table>

    <figcaption>Timeline Title</figcaption>
</figure>
```

### Custom tag colours

Table timelines may also have a `styles` tag which can be used to override the colours for each type of event (identified by its tag). If not provided a set of default colours will be used. These are specified in the `table-timeline.css` file. The tag colours should be specified as hyphenated versions of the tag name prefixed with `--`. Therefore, the tag name `large animals` would be specified by `--large-animals`.

### Date formats

Dates can be formatted in a number of ways:

-   Year, _e.g. 2023_
-   UTC date, _e.g. 2023-12-25_
-   Gregorian calendar, _e.g. 100BC and 2023BC_
-   Common era, e.g. _e.g. 100BCE and 2023BE_
-   Geologic, _e.g. 4.5bya, where units can be bya, mya and tya_

Gregorian, common era and geologic indicators are case-insensitive.

Each timeline can mix date types for different events. Ongoing events are specified by setting their end date to the word `date` or `-`. Events can just have a start time (i.e. instants), in which case the end date should be left blank.

## License

This project is licensed under the terms of the (MIT license)[https://github.com/Wolsten/Table-Timeline/blob/main/LICENSE.md].