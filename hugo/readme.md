# Readme

This folder contains the example layout and static files for an example Hugo site which needs to display Table Timelines.

To generate timeline Hugo `partial` files (one per timeline) issue the following command:

```
node excel-to-timeline format=hugo
```

Timelines can be included in Hugo markdown content files using the `timeline.html` shortcode, invoked as follows:

``` 
{{< timeline name="history-of-the-universe" view="chart" >}}
```

This shortcode file should be configured to include the static table-timeline.js file as well as site specific locations for the css and the images::

``` html
<!-- Include the timeline javascript file -->
<script src="/timeline/js/table-timeline.js" defer></script>

<!-- Set the global parameters, e.g. where the table-timeline.css file can be found (if not "/") -->
{{ .Scratch.Set "cssUrl" "/timeline/css/" }}
{{ .Scratch.Set "imagesUrl" "/timeline/images/" }}
<!-- @todo etc. -->
```

These defaults assume that the files are stored in a `timeline` folder within the `static` folder of your Hugo site. If you have different locations for your static files, make sure you update the three locations specified above.

To deploy the timelines in a Hugo application copy the files here, including the generated timeline files, into the corresponding folders in a normal Hugo application.

Finally, configure the application `hugo.toml` configuration file to allow shortcodes to be used in content markdown files:

``` toml
[security]
  enableInlineShortcodes = true
```







