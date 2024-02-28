# Table Timeline

27nd February 2024

![Table Timeline](table-timeline.png)

## Introduction

Table timeline is a custom web component that takes an appropriately structured HTML table and converts it into a graphical timeline or prose, formatted with a custom stylesheet. Implementing the timeline as a table means that a timeline can be indexed without the javascript component being triggered.

An Excel workbook is also provided which supports the automatic generation of either html or markdown files from timelines stored as separate worksheets in the workbook. The markdown files may be including in static site generators like [Hugo](https://gohugo.io).

## Installation

The main files you need are the javascript module `table-timeline.js` and the css file `table-timeline.css`.

Add the script tag to the `<head>` section, using the `defer` attribute:

`<script src="/table-timeline.js" defer></script>`

The url location of the style sheet should be set as an option using the data-options attribute in any included table-timeline element (see later). This means that you have the option of customising the stylesheet for each timeline.

### Installing as a Git Submodule

Issue the following command to install table-timeline in your website in the folder `static/timeline` for example, perhaps in a [Hugo website](https://gohugo.io):

```
git submodule add https://github.com/Wolsten/Table-Timeline.git static/timeline
```

## Quick Start

To generate a number of sample timelines and an index file, open the workbook, go to sheet `ToC`, make sure that the Export parameter `test` is set to `true` and click the `Export` button. Exported files will be placed in the `/exported` folder. 

You may be prompted to grant access when exporting as a result of system security controls preventing malicious access by macros. When prompted, select and grant access.

## Adding Components Manually

A table timeline is identified by a `figure` element with the `is` attribute set to `table-timeline`. The default view can be set using the `data-view` attribute. A number of options can be specified using a comma separated list of `attribute:value` pairs for the `data-options` attribute as follows:

| Attribute | Value | Usage |
| --------- | ----- | ----- |
| cssurl | string | Location of the css file relative to website root |
| search | true or false | Display search box? |
| view   | true or false | Display view switch toggle buttons |
| tags   | true or false | Display tag filter buttons |
| sorting | true or false | Display sorting options (date/tag) |
| test | true or false | Generate a test site. If true any linked timeline links will include a `.html` suffix. |
||||

e.g. 
```
data-options="cssurl:/,sorting:false,test:true"
```

Additionally one may choose the default view to display:

```
data-view="chart or text"
```

If not specified the default view is `chart`.

Finally, the component will generate default colours for each event according to its tag. You can override this using the `data-tags` option as follows:

```
data-tags="fruit:#E49EDD,vegetable:#4D93D9,animal:#83CCEB"
```

The tag colours should be specified as hyphenated versions of the tag name. Therefore, the tag name `large animals` would be specified by `large-animals`.

You can specify your colours as any valid CSS colour value.

So an example table timeline would be structured as follows:

```html
<figure
    is="table-timeline"
    [data-view="chart"]
    [data-options="cssurl:/,sorting:false,test:true"]
    [data-tags="fruit:#E49EDD,vegetable:#4D93D9,animal:#83CCEB"]
>
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
            <!-- First event row -->
            <tr>
                <th>event title</th>
                <th>event start data</th>
                <th>event end date</th>
                <th>event tag (the type of event)</th>
                <th>event content</th>
                <th>event citations</th>
                <th>event link - name of a linked timeline</th>
                <th>event image link</th>
            </tr>

            <tr>
                <!-- More event rows-->
            </tr>
        </tbody>
    </table>

    <figcaption>Timeline Title</figcaption>
</figure>
```

### Images

Optional event image links should be specified with a root relative url, e.g.:

```
/images/my-image.webp
```

according to where you store your images. Note that images are not processed or optimised in any way so you will need to ensure that image sizes are not too large, particularly for a large timeline. Images are however set to `load="lazy"`.

### Date formats

Start and end dates can be formatted in a number of ways:

-   Year, _e.g. 2023_
-   UTC date, _e.g. 2023-12-25_
-   Gregorian calendar, _e.g. 100BC and 2023BC_
-   Common era, e.g. _e.g. 100BCE and 2023BE_
-   Geologic, _e.g. 4.5bya, where units can be bya, mya and tya_

Gregorian, common era and geologic indicators are case-insensitive.

Each timeline can mix date types for different events. Ongoing events are specified by setting their end date to the word `date` or `-`. Events can just have a start time (i.e. instants), in which case the end date should be left blank.

## Using the Table Timeline Component

The component will display the events in either a textual format, one after the other, or as a waterfall chart.

At the top of the timeline, depending on the configuration options specified, there will be a number of controls for filtering and sorting the view:

| Filter | Usage |
| ------ | ----- |
| Tags   | All tags found in your timeline are listed, and by default all are shown as selected. Click a tag to toggle on and off the display of events with that tag. The number of matching events is shown along with a button to reset the filter. |
| Search | Enter search text to find events which contain the text in their title or summary. The number of matching events is shown along with a button to reset the filter. |
| Sort | Sort the events by date or tag order |
| View | Switch between tabular text view and the waterfall chart view |
|||

If you click on an event in the chart view a summary panel will display the summary information along with any citations, image or link to another timeline.



## License

This project is licensed under the terms of the MIT license.