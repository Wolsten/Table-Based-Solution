"use strict"

// class MyCustomTimeline extends HTMLElement {
class TableTimeline extends HTMLElement {

    static DEFAULT_SORT
    static AXIS_YEARS

    shadow
    eventTags
    events
    start
    end
    range
    controls
    colours


    constructor() {
        super()
        this.DEFAULT_SORT = 'date'
        this.AXIS_YEARS = 5
        this.SATURATION = "30%"
        this.LIGHTNESS = "70%"
        // console.log('created timeline')
    }


    connectedCallback() {
        this.initTimeline()
    }


    initTimeline() {
        this.controls = this.getControl(this.getAttribute('data-controls'))

        // Process events up front to collect the tags
        this.processEvents('table tbody tr')

        const view = this.getAttribute('data-view') || 'chart'
        const tags = this.getAttribute('data-tag-colours') || ''
        let cssUrl = this.getAttribute('data-css-url') || '/'
        if (!cssUrl.endsWith('/')) {
            cssUrl += '/'
        }
        let imagesUrl = this.getAttribute('data-images-url') || '/'
        if (!imagesUrl.endsWith('/')) {
            imagesUrl += '/'
        }
        const customCSS = this.getColourPalette(tags)
        const title = this.querySelector('figcaption')
        const caption = title ? `<figcaption>Timeline of ${title.textContent}</figcaption>` : ''
        const filters = this.getTimelineControls(view)
        const filtersHtml = filters ? `<div class="filters">${filters}</div>` : ''

        let eventsHtml = ''
        this.events.forEach(event => eventsHtml += this.formatEvent(event, imagesUrl))

        const xAxisHtml = this.getXAxis()

        // Create a shadow root (closed so any parent css cannot impact)
        const shadowContainer = document.createElement('div')
        this.shadow = shadowContainer.attachShadow({ mode: "closed" })

        // console.log('loc', window.location)

        this.shadow.innerHTML = /* html */`
            <div class="table-timeline" data-view="${view}">
                <link rel="stylesheet" href="${cssUrl}table-timeline.css">
                ${customCSS}
                ${filtersHtml}
                <div class="container">
                    <div class="summary"></div>
                    <div class="events">
                        ${eventsHtml}
                        <div class="x-axis">${xAxisHtml}</div>
                    </div>
                </div>
                ${caption}
            </div>`

        // Reset the element pointers
        const eventElements = this.shadow.querySelectorAll('.container .events .event')
        eventElements.forEach((element, index) => {
            this.events[index].element = element
        })

        this.innerHTML = ''
        this.appendChild(shadowContainer)

        this.addEventHandlers()
    }


    getControl(controlsString) {
        const defaults = {
            search: true,
            view: true,
            tags: true,
            sorting: true,
            test: false
        }
        if (controlsString) {
            const controls = controlsString.split(',')
            controls.forEach(control => {
                const parts = control.split(':')
                if (parts.length === 2) {
                    const param = parts[0].trim()
                    let value = parts[1].trim().toLowerCase()
                    switch (param) {
                        case 'search':
                            defaults.search = value === 'true'
                            break;
                        case 'view':
                            defaults.view = value === 'true'
                            break;
                        case 'tags':
                            defaults.tags = value === 'true'
                            break;
                        case 'sorting':
                            defaults.sorting = value === 'true'
                            break;
                        case 'test':
                            defaults.test = value === 'true'
                            break;
                    }
                }
            })
        }
        // console.log('options', defaults)
        return defaults
    }

    parseEvent(eventElement) {
        const title = eventElement.querySelector('td:nth-child(1)').textContent.trim()
        const start = this.readDate(eventElement.querySelector('td:nth-child(2)').textContent.trim())
        const end = this.readDate(eventElement.querySelector('td:nth-child(3)').textContent.trim())
        const tag = eventElement.querySelector('td:nth-child(4)').textContent.trim()
        const content = this.convertLinks(eventElement.querySelector('td:nth-child(5)').innerHTML.trim())
        const citations = eventElement.querySelector('td:nth-child(6)').innerHTML.trim()
        const link = eventElement.querySelector('td:nth-child(7)').innerHTML.trim()
        const image = eventElement.querySelector('td:nth-child(8)').innerHTML.trim()
        return { title, start, end, tag, content, citations, link, image, margin: 0, width: 0, tagIndex: -1, element: null }
    }


    processEvents(selector) {
        // console.log('PROCESSING EVENTS')
        const today = new Date()
        // Initialise start and end of events plus the "when", startString and endString for each event
        this.start = { decimal: Number.POSITIVE_INFINITY }
        this.end = { decimal: Number.NEGATIVE_INFINITY }
        // Get the events
        const eventElements = this.querySelectorAll(selector)
        // console.log('event elements', eventElements)
        this.events = []
        this.eventTags = []
        // Extra data from each event and parse start and end dates
        eventElements.forEach(el => {
            const event = this.parseEvent(el)
            this.events.push(event)
            // Unique tags
            if (!this.eventTags.find(tag => tag === event.tag)) {
                this.eventTags.push(event.tag)
            }
            // Extreme dates
            if (event.start.decimal < this.start.decimal) {
                this.start = event.start
            }
            if (event.start.decimal > this.end.decimal) {
                this.end = event.start
            }
            if (event.end.decimal > this.end.decimal) {
                this.end = event.end
            }
        })
        // console.log('start and end dates', this.start, this.end)
        this.range = this.getRange()
        this.events.forEach(event => {
            // Category index
            const tagIndex = this.eventTags.findIndex(tag => tag === event.tag)
            event.tagIndex = tagIndex
            // Margin and width
            const endDecimal = event.end.type !== 'none' ? event.end.decimal : event.start.decimal
            event.margin = 1.0 * (100 * (event.start.decimal - this.start.decimal) / this.range).toFixed(1)
            let width = 1.0 * (100 * (endDecimal - event.start.decimal) / this.range).toFixed(1)
            if (width < 2) {
                width = 2
            }
            event.width = width
        })

        this.sortEvents(this.DEFAULT_SORT)

        // console.log('events', this.events, this.eventCategories)
    }

    getColourPalette(tagColourString) {
        // console.log('colour palette in style?', tagColourString)
        // console.log('loading custom palette for timeline', timeline)
        let palette = ''
        // Extract tags from the timeline tags property
        tagColourString = tagColourString.trim()
        const tagColours = tagColourString.split(',')
        const tagColourTable = []
        tagColours.forEach(tag => {
            tag = tag.trim()
            if (tag && tag.includes(':')) {
                const parts = tag.split(':')
                if (parts.length === 2) {
                    const tag = parts[0].trim()
                    const colour = parts[1].trim()
                    tagColourTable.push({ tag, colour })
                }
            }
        })
        const interval = Math.floor(245 / this.eventTags.length)
        let hue = 10
        let tagRules = []
        let colour = ''
        this.eventTags.forEach((tag, index) => {
            const match = tagColourTable.find(entry => entry.tag === tag.toLowerCase())
            // console.log('checking tag', tag, 'found match', match, 'at index', index)
            if (match) {
                colour = match.colour
            } else {
                colour = `hsl(${hue}, ${this.SATURATION}, ${this.LIGHTNESS})`
                hue += interval
            }
            tagRules.push(`.filters form.tags label.tag-${index} span {`)
            tagRules.push(`    border-bottom-color: ${colour}`)
            tagRules.push(`}`)
            tagRules.push(`.summary .content[data-tag-index="${index}"] .tag::before,`)
            tagRules.push(`.event[data-tag-index="${index}"] .tag::before,`)
            tagRules.push(`[data-view="chart"] .event[data-tag-index="${index}"] {`)
            tagRules.push(`    background-color: ${colour}`)
            tagRules.push(`}`)
        })
        // console.log('new palette', palette)
        return `<style>\n${tagRules.join('\n')}\n</style>`
    }


    getTimelineControls(view) {
        let html = ''
        let filter = false
        // console.log('tags', this.tagsCategories)
        if (this.controls.tags && this.eventTags.length > 1) {
            this.eventTags.forEach((tag, index) => {
                html += /* html */`
                    <label title="Hide/show events with this tag" class="tag-${index}">
                        <span>${tag}</span>
                        <input type="checkbox" name="tag[${index}]" value="${index}" checked />
                    </label>`
            })
            html = /* html */
                `<form class="tags">
                    ${html}
                </form>`
            filter = true
        }
        if (this.controls.search) {
            html += /* html */
                `<form class="search">
                    <label>Search
                        <input class="event-search" type="text" name="search" value="" />
                    </label>
                </form>`
            filter = true
        }

        if (this.controls.sorting && this.eventTags.length > 1) {
            const other =  this.DEFAULT_SORT === 'date' ? 'Switch to tag sorting' : 'Switch to date sorting'
            const checked = this.DEFAULT_SORT === 'date' ? "checked" : ""
            const state = this.DEFAULT_SORT === 'date' ? "on" : "off"
            html += /* html */
                `<form class="sorting switch">
                    <label title="${other}">
                        <input type="checkbox" name="sorting" value="${state}"/>
                        <span class="off">Tag</span><span class="on">Date</span>
                    </label>
                </form>`
        }
        if (this.controls.view) {
            const other = view === 'chart' ? 'Switch to text view' : 'Switch to chart view'
            const checked = view === 'chart' ? "checked" : ""
            const state = view === 'chart' ? "on" : "off"
            html += /* html */
                `<form class="views switch">
                    <label title="${other}">
                        <input type="checkbox" name="view" value="${state}" ${checked}/>
                        <span class="off">Text</span><span class="on">Chart</span>
                    </label>
                </form>`
        }


        if (filter) {
            html += /* html */ `<div class="filter-results"></div>`
        }

        return html
    }


    formatEvent(event,imagesUrl) {
        const endDate = event.end.formatted === ''
            ? ''
            : /* html */`<span> to </span>
                         <span class="end">${event.end.formatted}</span>`
        let textAlign = ''
        if (event.margin > 50) {
            textAlign = ' right'
        } else if ((event.margin + event.width) > 70) {
            textAlign = ' centre'
        }
        let content = this.convertLinks(event.content).trim()
        if (event.citations) {
            content += `<h4>Citations</h4>`
            const citationsList = this.convertLinks(event.citations).trim().split('\n')
            citationsList.forEach(citation => content += `<cite>${citation}</cite>`)
        }

        // Construct a link - assumes that all timeline fiels are in the same
        // folder and that urls are generated from links in the same way that 
        // the website generator (e.g. Hugo) does it, e.g. replacing spaces
        // with hyphens
        if (event.link) {
            // console.log('pathname', window.location.pathname)
            let parts = window.location.pathname.split('/')
            // parts = ['', 'deeper', 'posts', 'this-post/', '']
            parts = parts.filter(part => part !== '')
            let prefix = ''
            parts.forEach((part, index) => {
                if (index < parts.length - 1) {
                    prefix += `/${part}`
                } else {
                    prefix += '/'
                }
            })
            const link = event.link.trim()
            const url = link.toLowerCase().replace(/ /g, '-')
            const ext = this.controls.test ? ".html" : ''
            content += `<h4>Linked timeline</h4>`
            content += `<a href="${prefix}${url}${ext}">${link}</a>`
        }
        const img = event.image ? `<div class="event-image"><img src="${imagesUrl}${event.image}" loading="lazy"></div>` : ''
        const newEventElement = document.createElement('div')
        newEventElement.className = `event${textAlign}`
        newEventElement.setAttribute('data-tag-index', event.tagIndex)
        newEventElement.style = `margin-left: ${event.margin}%; width: ${event.width}%;`
        newEventElement.innerHTML = /* html */`
            ${img}
            <h3 class="title">${event.title}</h3>
            <div class="dates-tag">
                <span class="dates">
                    <span class="start">
                        ${event.start.formatted}
                    </span>
                    ${endDate}
                </span>
                <span class="tag">${event.tag}</span>
            </div>
            <div class="content">
                ${content}
            </div>`
        return newEventElement.outerHTML
    }


    getRange() {
        let years = parseInt((this.end.decimal - this.start.decimal) * 1.05)
        if (years < this.AXIS_YEARS) {
            return years
        }
        years = Math.ceil(years / this.AXIS_YEARS) * this.AXIS_YEARS
        // console.log('years', years)
        return years;
    }


    getXAxis() {
        const interval = this.range <= this.AXIS_YEARS ? 1 : this.range / this.AXIS_YEARS
        const startYear = parseInt(this.start.decimal)
        const endYear = startYear + this.range
        let year = startYear - interval
        // console.log('start year', startYear, 'end year', endYear, 'range', this.range)
        let html = ''
        while (year < endYear) {
            year += interval
            const text = this.formatDate(year)
            const percentageWidth = interval === 1 ? 100 : 20
            // console.log('added axis year', text)
            html += /* html */`
                <div class="x-axis-label" style="flex-basis:${percentageWidth}%;">
                    ${text}
                </div>`
        }
        return html;
    }


    sortEvents(value) {
        // Sort events
        if (value === 'date') {
            this.events.sort((a, b) => {
                if (a.start.decimal < b.start.decimal) {
                    return -1
                } else if (a.start.decimal > b.start.decimal) {
                    return 1
                }
                return 0
            })
        } else if (value === 'tag') {
            this.events.sort((a, b) => {
                if (a.tagIndex < b.tagIndex) {
                    return -1
                } else if (a.tagIndex > b.tagIndex) {
                    return 1
                }
                return 0
            })
        }
    }

    redrawEvents() {
        const eventsElement = this.shadow.querySelector('.events')
        const axisElement = eventsElement.querySelector('.x-axis')
        this.events.forEach(event => {
            eventsElement.append(event.element)
        })
        eventsElement.append(axisElement)
    }


    addEventHandlers() {
        const timelineDiv = this.shadow.querySelector('.table-timeline')
        const filtersDiv = timelineDiv.querySelector('.filters')
        const containerDiv = timelineDiv.querySelector('.container')
        const summaryDiv = containerDiv.querySelector('.summary')
        const eventsDiv = containerDiv.querySelector('.events')
        const filterResultsDiv = timelineDiv.querySelector('.filter-results')
        const searchInput = timelineDiv.querySelector('form.search input')
        const tagInputs = timelineDiv.querySelectorAll('form.tags input')
        const closeSummary = function () {
            containerDiv.classList.remove('show-summary')
            summaryDiv.innerHTML = ''
            summaryDiv.style = '';
            const selected = eventsDiv.querySelector('.event.selected')
            if (selected) selected.classList.remove('selected')
        }
        const showFilterResults = function () {
            const matchingEvents = eventsDiv.querySelectorAll('.event:not(.hide):not(.not-matches)')
            const plural = matchingEvents.length === 1 ? '' : 's'
            filterResultsDiv.innerHTML = `<span>Found ${matchingEvents.length} event${plural}</span>
                <button class="reset-filters">Reset</button>`
            filterResultsDiv.classList.add('got-results')
        }
        if (filterResultsDiv) {
            filterResultsDiv.addEventListener('click', evt => {
                console.log('clicked', evt.target)
                if (evt.target.className === 'reset-filters') {
                    filterResultsDiv.innerHTML = ''
                    const events = eventsDiv.querySelectorAll('.event')
                    filterResultsDiv.classList.remove('got-results')
                    if (searchInput) searchInput.value = ''
                    if (tagInputs.length > 0) {
                        tagInputs.forEach(input => input.setAttribute('checked', 'checked'))
                    }
                    events.forEach(event => {
                        event.classList.remove('hide')
                        event.classList.remove('not-matches')
                    })
                }
            })
        }
        // View changes
        if (this.controls.view) {
            const input = timelineDiv.querySelector('form.views input')
            const label = timelineDiv.querySelector('form.views label')
            input.addEventListener( 'click', () => {
                timelineDiv.removeAttribute('data-view')
                if ( input.value === 'off' ){
                    input.value = 'on'
                    timelineDiv.setAttribute('data-view', 'chart')
                    label.title = "Switch to text view"
                } else {
                    input.value = 'off'
                    timelineDiv.setAttribute('data-view', 'text')
                    label.title = "Switch to chart view"
                }
            })
        }
        // Sorting
        if (this.controls.sorting) {
            const input = timelineDiv.querySelector('form.sorting input')
            const label = timelineDiv.querySelector('form.sorting label')
            input.addEventListener( 'click', () => {
                if ( input.value === 'off' ){
                    console.log('was off when clicked')
                    input.value = 'on'
                    label.title = "Switch to tag sorting"
                    this.sortEvents('date')
                } else {
                    console.log('was on when clicked')
                    input.value = 'off'
                    label.title = "Switch to date sorting"
                    this.sortEvents('tag')
                }
                this.redrawEvents()
            })
        }
        // Tag selections
        if (this.controls.tags) {
            let hide = false
            tagInputs.forEach(input => {
                input.addEventListener('click', event => {
                    const option = event.target
                    const value = option.value
                    const checked = option.checked
                    if (checked) {
                        input.setAttribute('checked', 'checked')
                    } else {
                        input.removeAttribute('checked')
                    }
                    this.events.forEach(event => {
                        if (event.element.getAttribute('data-tag-index') === value) {
                            if (checked) {
                                event.element.classList.remove("hide")
                            } else {
                                event.element.classList.add("hide")
                                hide = true
                            }
                        }
                    })
                    if (hide) showFilterResults()
                })
            })

        }
        // Search
        if (this.controls.search) {
            searchInput.addEventListener('input', evt => {
                const text = evt.target.value.trim().toLowerCase()
                let results = 0
                this.events.forEach(event => {
                    const title = event.title.toLowerCase()
                    const content = event.content.toLowerCase()
                    if (text === '' || title.includes(text) || content.includes(text)) {
                        event.element.classList.remove("not-matches")
                        results++
                    } else {
                        event.element.classList.add("not-matches")
                    }
                })
                if (text) showFilterResults()
            })
        }

        // Event click events
        containerDiv.addEventListener('click', evt => {
            // console.log('clicked:', evt.target)
            if (evt.target.className === 'close' || evt.target.className === 'events' ) {
                closeSummary()
            }
        })
        this.events.forEach(event => {
            event.element.addEventListener('click', evt => {
                // console.log('clicked', event.element)
                const selected = eventsDiv.querySelector('.event.selected')
                if (selected) selected.classList.remove('selected')
                evt.stopPropagation()
                if (timelineDiv.getAttribute('data-view') === 'chart') {
                    event.element.classList.add('selected')
                    const top = filtersDiv.getBoundingClientRect().height + 26
                    const height = containerDiv.getBoundingClientRect().height
                    const maxWidth = containerDiv.getBoundingClientRect().width
                    summaryDiv.style = `top:${top}px;height:${height}px;max-width:${maxWidth}px;`
                    const dates = event.element.querySelector('.dates').outerHTML
                    const content = event.element.querySelector('.content').innerHTML
                    const image = event.element.querySelector('.event-image')
                        ? event.element.querySelector('.event-image').outerHTML
                        : ''
                    const datesTag = event.element.querySelector('.dates-tag').outerHTML
                    summaryDiv.innerHTML = /* html */`
                        <button class="close">X</button>
                        <div class="content" data-tag-index="${event.tagIndex}">
                            ${image}
                            <h3 class="title">${event.title}</h3>
                            ${datesTag}
                            <div class="body">
                                ${content}
                            </div>
                        </div>`
                    containerDiv.classList.add('show-summary')
                    summaryDiv.scrollTo(0,0)
                }
            })
        })
    } // end addEventHandlers

    //                             ${dates}
    /* <span class="tag">${event.tag}</span> */



    convertLinks(inputString) {

        // Find all links not preceded by a quote (single or double)
        // This will prevent conversion of form actions and other
        // quoted links
        const regex = /[^"'](https?:\/\/[\w.,-_?=&\/;]+)/gm
        const subst = /* html */` <a href="$1">$1</a>`
        if (inputString !== '') {
            inputString = inputString.replace(regex, subst)
        }
        return inputString
    }


    formatDate(year) {
        // console.log('year', year)
        if (year < -1000000000) return (-year / 1000000000).toFixed(1) + 'bya'
        if (year < -1000000) return (-year / 1000000).toFixed(1) + 'mya'
        if (year < -1000) return (-year / 1000).toFixed(1) + 'tya'
        if (year > 3000) return 'today'
        return year
    }


    getYearFraction(utcDate) {
        // console.log('utcDate', utcDate)
        const fullYear = utcDate.getFullYear()
        const fullYearStart = new Date('' + fullYear)
        const fullYearEnd = new Date('' + (fullYear + 1))
        const fraction = fullYear + (utcDate - fullYearStart) / (fullYearEnd - fullYearStart)
        // console.log('fraction', fraction)
        return fraction.toFixed(3)
    }


    // The getTime() method of Date instances returns the number of milliseconds for this date 
    // since the epoch, which is defined as the midnight at the beginning of January 1, 1970, UTC.
    // Take in a string date and returns either a number year or a UTC date along with the type of date
    readDate(stringDate) {
        // console.log('string date', stringDate)
        let when = `Date [${stringDate}] not recognised`
        let type = 'error'
        let decimal = 0
        let formatted = ''
        const formatOptions = {
            // weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }
        // No end date - event is an instant
        if (stringDate === '') {
            // console.log('returning date of type none')
            return {
                type: 'none',
                when: '',
                formatted: '',
                decimal
            }
        }
        stringDate.trim().toLowerCase()
        // No end date - event is ongoing
        if (stringDate === 'date' || stringDate === '-') {
            return {
                type: 'ongoing',
                when: '',
                formatted: 'date',
                decimal
            }
        }
        // Test for a geological timescale such as 10mya
        const geologicalRegexPattern = /^([0-9]+[.]*[0-9]*)([bmtBMT]ya)$/
        let matchResult = geologicalRegexPattern.exec(stringDate)
        if (matchResult !== null) {
            when = matchResult[1]
            type = matchResult[2].toLowerCase()
            formatted = stringDate
            switch (type) {
                case 'bya':
                    decimal = when * -1000000000
                    break
                case 'mya':
                    decimal = when * -1000000
                    break
                case 'tya':
                    decimal = when * -1000
                    break
            }
            when = decimal
            return { type, when, formatted, decimal }
        }
        // Check for a Gregorian year (suffixed with bc or ad)
        const gregorianRegexPattern = /^([0-9]+)(bc|BC|ad|AD)$/
        matchResult = gregorianRegexPattern.exec(stringDate)
        if (matchResult !== null) {
            type = matchResult[2].toLowerCase()
            const sign = type === 'bc' ? -1 : 1
            formatted = matchResult[1] + type
            when = sign * matchResult[1]
            decimal = when
            return { type, when, formatted, decimal }
        }
        // Check for a common era year (suffixed with bce or ce)
        const commonEraRegexPattern = /^([0-9]+)(bce|BCE|ce|CE)$/
        matchResult = commonEraRegexPattern.exec(stringDate)
        if (matchResult !== null) {
            type = matchResult[2].toLowerCase()
            const sign = type === 'bce' ? -1 : 1
            formatted = matchResult[1] + type
            when = sign * matchResult[1]
            decimal = when
            return { type, when, formatted, decimal }
        }
        // Full UTC date?
        const dateRegexPattern = /^([0-9]+)-([0-9]+)-([0-9]+)$/
        matchResult = dateRegexPattern.exec(stringDate)
        if (matchResult !== null) {
            when = new Date(stringDate + 'T12:00:00')
            type = 'UTC'
            formatted = when.toLocaleDateString(undefined, formatOptions)
            decimal = 1.0 * this.getYearFraction(when)
            return { type, when, formatted, decimal }
        }
        // Check for a plain year, e.g. 1961 - set date to mid year
        const yearRegexPattern = /^([0-9]+)$/
        matchResult = yearRegexPattern.exec(stringDate)
        if (matchResult !== null) {
            when = new Date(stringDate + '-06-30T12:00:00')
            type = 'UTC'
            formatted = stringDate
            decimal = 1.0 * this.getYearFraction(when)
            return { type, when, formatted, decimal }
        }
        console.error(`Date [${stringDate}] not recognised`)
        return { type, when, decimal, formatted }
    }
}

customElements.define("table-timeline", TableTimeline, { extends: 'figure' })