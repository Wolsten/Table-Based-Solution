Attribute VB_Name = "TableTimeline"
Option Explicit

' For information and source code control only

Const START_WORKSHEET_INDEX = 7 ' 1-based
Const START_FILES_GENERATED_ROW As Integer = 20
Const COMPONENT_NAME As String = "table-timeline"

Private Type optionsType
    format As String
    markdownConfig As String
    destinationFolder As String
    extension As String
    styleSheetUrl As String
    imagesUrl As String
    outputUrl As String
    test As Boolean
End Type



Private Type timelinePropsType
    name As String
    categories As String
    summary As String
    image As String
    date As String
    tagColours As String
End Type




Private Type timelineEventType
    title As String
    start As String
    end As String
    tag As String
    content As String
    citations As String
    link As String          ' linked timeline, should just be the name which will be hyphenated and suffixed .html if running in test mode
    image As String      ' Full image url, could be an external image or a local image (in which case can use a root relative reference)
End Type


Private Type timelineType
    events() As timelineEventType
    tags() As String
End Type


Dim options As optionsType




Public Sub ExportWorksheetsToFiles()
    Dim ws As Worksheet
    Dim wb As Workbook
    Dim path As String
    Dim fileName As String
    Dim rowNum As Long
    Dim fileNum As Long
    Dim html As String
    Dim props As timelinePropsType
    Dim timeline As timelineType
    Dim events() As timelineEventType
    Dim generateIndex As Boolean
    Dim exportedFilesList As String
    Dim hyphenated As String
    Dim template As String
    Dim fileIndex As Integer
    Dim files() As String
    Dim contents() As String
    Dim i As Integer
    

    ' Get the workbook containing the VBA code
    Set wb = ThisWorkbook
    
    ' Path
    ' Debug.Print "Workbook path =" & wb.path
    
    exportedFilesList = ""
    
    ' Get options
    options.format = Range("format").Value
    
    options.destinationFolder = wb.path
    If (Range("destinationFolder").Value <> "") Then
       options.destinationFolder = Range("destinationFolder").Value
    End If
 
    options.styleSheetUrl = Range("styleSheetUrl").Value
    options.imagesUrl = Range("imagesUrl").Value
    options.test = (Range("testOption").Value = "True")
    
    ' Currently same as format but could change in future
    options.extension = options.format

    options.markdownConfig = Range("mdConfig").Value
    
    options.outputUrl = "/"
    
    If options.test Then
        options.format = "html"
        options.extension = "html"
        options.destinationFolder = ThisWorkbook.path & "/exported"
        options.outputUrl = "/exported/"
    End If
    
    fileIndex = -1
    
    ' Loop through each worksheet
    For Each ws In wb.Worksheets
    
        If ws.index >= START_WORKSHEET_INDEX Then
           
            props = getProps(ws.cells)
            timeline = getEventsWithTags(ws.cells)
            html = generateTimelineCode(props, timeline.events, timeline.tags)
            
            ' Construct file name
            hyphenated = LCase(Replace(props.name, " ", "-"))
            fileName = options.destinationFolder & "/" & hyphenated & "." & options.extension
            

            fileIndex = fileIndex + 1
            ReDim Preserve files(fileIndex)
            files(fileIndex) = fileName
            ReDim Preserve contents(fileIndex)
            contents(i) = html
        
            If options.format = "html" Then
                exportedFilesList = exportedFilesList & "<li><a href='" & options.outputUrl & hyphenated & ".html'>" & props.name & "</a></li>" & vbCr
            Else
                exportedFilesList = exportedFilesList & "- [" & props.name & "](" & options.outputUrl & hyphenated & ")" & vbCr
            End If
            
        End If
    Next ws
    
    If options.format = "html" Then
        template = getIndexHTML()
        exportedFilesList = "<ol>" & vbCrLf & exportedFilesList & vbCrLf & "</ol>"
    Else
        template = getIndexMarkdown()
    End If
    
'    Debug.Print template

    Dim indexFilename As String
    indexFilename = "timelines." + options.extension
    If options.test Then
        indexFilename = "index." + options.extension
    End If
        
    html = Replace(template, "***TIMELINES***", exportedFilesList)
    fileName = options.destinationFolder & "/" & indexFilename
    
    fileIndex = fileIndex + 1
    ReDim Preserve files(fileIndex)
    files(fileIndex) = fileName
    ReDim Preserve contents(fileIndex)
    contents(fileIndex) = html
    
    ' Ask for permission
    If requestAccess(files) Then
        fileNum = 1
        For i = 0 To fileIndex
            Open files(i) For Output As #fileNum
            Print #fileNum, contents(i)
            Close #fileNum
            ' Save name in ToC sheet
            Sheets("ToC").cells(START_FILES_GENERATED_ROW + i, 1).Value = files(i)
        Next i
    Else
        MsgBox "You must grant permision to export timeline files", vbOKOnly
    End If
    
    ' Clear any old values
    While Sheets("ToC").cells(START_FILES_GENERATED_ROW + i, 1).Value <> ""
        Sheets("ToC").cells(START_FILES_GENERATED_ROW + i, 1).Value = ""
        i = i + 1
    Wend
    
    Debug.Print "Data exported successfully to text files."
End Sub


Private Function generateTimelineCode(props As timelinePropsType, events() As timelineEventType, tags() As String) As String

    Dim eventsHtml As String
    Dim tableHtml As String
    Dim html As String
    Dim i As Integer
    Dim tagsList As String
    Dim figureHtml As String
    Dim template As String
    Dim dataOptions As String
    Dim customColours As String

    tagsList = Join(tags, ",")

    eventsHtml = ""
    For i = 0 To UBound(events)
        eventsHtml = eventsHtml & _
            "<tr>" & _
                "<td>" & events(i).title & "</td>" & _
                "<td>" & events(i).start & "</td>" & _
                "<td>" & events(i).end & "</td>" & _
                "<td>" & events(i).tag & "</td>" & _
                "<td>" & events(i).content & "</td>" & _
                "<td>" & events(i).citations & "</td>" & _
                "<td>" & events(i).link & "</td>" & _
                "<td>" & options.imagesUrl & events(i).image & "</td>" & _
            "</tr>"
    Next i
    
    tableHtml = _
        "<table>" & _
            "<thead>" & _
                "<tr>" & _
                    "<th>title</th>" & _
                    "<th>start</th>" & _
                    "<th>end</th>" & _
                    "<th>tag</th>" & _
                    "<th>content</th>" & _
                    "<th>citations</th>" & _
                    "<th>link</th>" & _
                    "<th>image</th>" & _
                "</tr>" & _
            "</thead>" & _
            "<tbody>" & _
                eventsHtml & _
            "</tbody>" & _
        "</table>"
            
    dataOptions = ""
    
    If options.test = False And options.styleSheetUrl <> "" Then
        dataOptions = "cssurl:" & options.styleSheetUrl
    End If
    
    If options.test Then
        If dataOptions <> "" Then
            dataOptions = dataOptions & ","
        End If
        dataOptions = dataOptions & "test:true"
    End If
    
    If dataOptions <> "" Then
        dataOptions = "data-options='" & dataOptions & "'"
    End If
    
    customColours = ""
    If props.tagColours <> "" Then
        customColours = " data-tags='" & props.tagColours & "'"
    End If
    
    figureHtml = _
        "<figure is='" & COMPONENT_NAME & "' data-view='chart' " & dataOptions & customColours & ">" _
            & vbCr & _
                tableHtml _
            & vbCr & _
            "<figcaption>" & props.name & "</figcaption>" & vbCr & _
        "</figure>"
    
    If options.extension = "md" Then
            template = getTimelineMarkdown()
            template = Replace(template, "***DATE***", props.date)
            template = Replace(template, "***SUMMARY***", quoted(props.summary))
            template = Replace(template, "***IMAGE***", quoted(props.image))
    Else
            template = getTimelineHTML()
    End If
    
    template = Replace(template, "***TIMELINE***", figureHtml)
    template = Replace(template, "***TITLE***", quoted(props.name))
    template = Replace(template, "***TAGS***", tagsList)
    template = Replace(template, "***CATEGORIES***", props.categories)

    ' Debug.Print template
            
    generateTimelineCode = template
End Function


Private Function quoted(inputString As String) As String
    quoted = "'" & inputString & "'"
End Function



Private Function getProps(cells As Range) As timelinePropsType

    Dim published As Date
    Dim props As timelinePropsType
    Dim col As Integer
    Dim hexColour As String
    
    props.name = cells(1, 2)
    props.categories = splitAndCombineNames(cells(2, 2))
    props.summary = cells(3, 2)
    props.image = cells(4, 2)
    props.date = format(Now, "yyyy-mm-ddThh:mm:ss")
    
    col = 2
    props.tagColours = ""
    While cells(5, col) <> ""
        hexColour = getCellBackgroundColour(cells(5, col))
        If props.tagColours <> "" Then
            props.tagColours = props.tagColours & ","
        End If
        props.tagColours = props.tagColours & cells(5, col) & ":" & "#" & hexColour
        col = col + 1
    Wend
    
    Debug.Print props.tagColours
    
    getProps = props
End Function



Private Function getEventsWithTags(cells As Range) As timelineType
    Dim row As Integer
    Dim index As Integer
    Dim evt As timelineEventType
    Dim evts() As timelineEventType
    Dim tags() As String
    Dim nTags As Integer
    
    row = 7
    index = 0
    nTags = 0
    
    While Not IsEmpty(cells(row, 1).Value)
    
        evt.title = cells(row, "A")
        evt.start = cells(row, "B")
        evt.end = cells(row, "C")
        evt.tag = LCase(cells(row, "D"))
        evt.citations = cells(row, "E")
        evt.link = cells(row, "F")
        evt.image = cells(row, "G")
        evt.content = cells(row, "H")
        
        ReDim Preserve evts(index) As timelineEventType
        evts(index) = evt
        
        If nTags = 0 Then
            ReDim Preserve tags(nTags)
            tags(nTags) = quoted(evt.tag)
            nTags = 1
        Else
            If UBound(Filter(tags, evt.tag)) = -1 Then
                ReDim Preserve tags(nTags)
                tags(nTags) = quoted(evt.tag)
                nTags = nTags + 1
            End If
        End If
    
        index = index + 1
        row = row + 1
    Wend
    
    Dim timeline As timelineType
    timeline.events = evts
    timeline.tags = tags
    
    getEventsWithTags = timeline
End Function


' Get the index HTML template file
Private Function getIndexHTML()
    Dim html As String
    Dim row As Integer
    html = ""
    row = 1
'    Debug.Print "generating html"
    With Sheets("Index HTML")
        While .cells(row, 1) <> ""
        html = html + vbCrLf + .cells(row, 1)
        row = row + 1
        Wend
    End With
    getIndexHTML = html
End Function


' Get the index markdowntemplate file
Private Function getIndexMarkdown()
    Dim md As String
    Dim row As Integer
    md = ""
    row = 1
    With Sheets("Index Markdown")
    
        While .cells(row, 1) <> ""
            md = md + .cells(row, 1) + vbCr
            If row > 1 And .cells(row, 1) = "+++" Then
                md = md + vbCr
            End If
            row = row + 1
        Wend
    End With
    
    ' Default config is TOML in the worksheet, convert to YAML?
    If options.markdownConfig = "YAML" Then
        md = Replace(md, "+++", "---")
        md = Replace(md, " = ", " : ")
    End If
    
    getIndexMarkdown = md
End Function


' Get the timeline template file
Private Function getTimelineHTML()
    Dim html As String
    Dim row As Integer
    html = ""
    row = 1
    With Sheets("Timeline HTML")
        While .cells(row, 1) <> ""
        html = html + vbCrLf + .cells(row, 1)
        row = row + 1
        Wend
    End With
    html = Replace(html, "***HOME***", options.outputUrl)
    getTimelineHTML = html
End Function


' Get the markdown timeline template file
Private Function getTimelineMarkdown()
    Dim md As String
    Dim row As Integer
    md = ""
    row = 1
    With Sheets("Timeline Markdown")
        While .cells(row, 1) <> ""
            md = md + .cells(row, 1) + vbCr
            If row > 1 And .cells(row, 1) = "+++" Then
                md = md + vbCr
            End If
            row = row + 1
        Wend
    End With
    
    ' Default config is TOML in the worksheet, convert to YAML?
    If options.markdownConfig = "YAML" Then
        md = Replace(md, "+++", "---")
        md = Replace(md, " = ", " : ")
    End If
    
    md = Replace(md, "***HOME***", options.outputUrl)
    
    getTimelineMarkdown = md
End Function



Private Function getCellBackgroundColour(cell As Range)
    Dim RGBColour As Long
    Dim hexColour As String
    Dim Red As Integer
    Dim Green As Integer
    Dim Blue As Integer
    
    ' Get the RGB Colour value of the cell's background Colour
    RGBColour = cell.Interior.Color
    
    ' Extract the Red, Green, and Blue components from the RGB Colour value
    Red = RGBColour Mod 256
    Green = RGBColour \ 256 Mod 256
    Blue = RGBColour \ 256 \ 256 Mod 256
    
    ' Convert the RGB Colour value to a hex Colour code
    hexColour = Right("0" & Hex(Red), 2) & Right("0" & Hex(Green), 2) & Right("0" & Hex(Blue), 2)
    
    ' Display the hex Colour code in a message box
    ' Debug.Print "The background Colour of the cell is #" & hexColour
    
    ' Convert the RGB components to hex and concatenate them into a hex Colour code
    getCellBackgroundColour = hexColour
End Function



Private Function splitAndCombineNames(names As String)
    Dim namesArray() As String
    Dim combinedNames As String
    Dim i As Integer
    
    ' Split the names into an array
    namesArray = Split(names, ",")
    
    ' Encapsulate each string in single quotes
    For i = LBound(namesArray) To UBound(namesArray)
        namesArray(i) = "'" & namesArray(i) & "'"
    Next i
    
    ' Combine the array elements back into one string
    combinedNames = Join(namesArray, ", ")
    
    splitAndCombineNames = combinedNames
End Function



Function requestAccess(files() As String) As Boolean
    ' returns true if access granted, false otherwise
    requestAccess = GrantAccessToMultipleFiles(files)
End Function
