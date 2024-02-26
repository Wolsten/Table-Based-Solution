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
    options


    constructor() {
        super()
        this.DEFAULT_SORT = 'date'
        this.AXIS_YEARS = 5
    }


    connectedCallback() {
        this.initTimeline()
    }


    initTimeline() {
        this.options = this.getOptions(this.getAttribute('data-options'))

        // Process events up front to collect the tags
        this.processEvents('table tbody tr')

        const view = this.getAttribute('data-view') || 'text'
        const style = this.querySelector('style')
        const customCSS = style ? this.getColourPalette(style.textContent) : ''
        const title = this.querySelector('figcaption')
        const caption = title ? `<figcaption>Timeline of ${title.textContent}</figcaption>` : ''
        const filters = this.getTimelineControls(view)
        const filtersHtml = filters ? `<div class="filters">${filters}</div>` : ''

        let eventsHtml = ''
        this.events.forEach(event => eventsHtml += this.formatEvent(event))

        const xAxisHtml = this.getXAxis()

        // Create a shadow root (closed so any parent css cannot impact)
        const shadowContainer = document.createElement('div')
        this.shadow = shadowContainer.attachShadow({ mode: "closed" })

        // console.log('loc', window.location)

        this.shadow.innerHTML = /* html */`
            <div class="table-timeline" data-view="${view}">
                <link rel="stylesheet" href="${this.options.cssurl}table-timeline.css">
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


    getOptions(optionsString) {
        const defaults = {
            search: true,
            view: true,
            tags: true,
            sorting: true,
            cssurl: '/',
            test: false
        }
        if (optionsString) {
            const options = optionsString.split(',')
            options.forEach(option => {
                const parts = option.split(':')
                if (parts.length === 2) {
                    const opt = parts[0].trim()
                    let val = parts[1].trim()
                    switch (opt) {
                        case 'search':
                            defaults.search = val === 'true'
                            break;
                        case 'view':
                            defaults.view = val === 'true'
                            break;
                        case 'tags':
                            defaults.tags = val === 'true'
                            break;
                        case 'sorting':
                            defaults.sorting = val === 'true'
                            break;
                        case 'test':
                            defaults.test = val === 'true'
                            break;
                        case 'cssurl':
                            if (val !== '') {
                                if (!val.endsWith('/')) {
                                    val += '/'
                                }
                                defaults.cssurl = val
                                break;
                            }
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

    getColourPalette(styleString) {
        // console.log('colour palette in style?', styleString)
        if (styleString === null) return ''
        // console.log('loading custom palette for timeline', timeline)
        let palette = ''
        // Extract tags from the timeline tags property
        styleString = styleString.trim()
        const tagColours = styleString.split('\n')
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
        this.eventTags.forEach((tag, index) => {
            const match = tagColourTable.find(entry => entry.tag === tag.toLowerCase())
            // console.log('checking tag', tag, 'found match', match, 'at index', index)
            if (match) {
                palette += `--colour-tag-${index}:${match.colour}`
            }
        })
        // console.log('new palette', palette)
        return `<style>[is=my-timeline] { ${palette} } </style>`
    }


    getTimelineControls(view) {
        let html = ''
        // console.log('tags', this.tagsCategories)
        if (this.options.tags && this.eventTags.length > 1) {
            this.eventTags.forEach((tag, index) => {
                html += /* html */`
                    <label title="Hide/show events with this tag" class="tag-${index}">${tag}
                        <input type="checkbox" name="tag[${index}]" value="${index}" checked />
                    </label>`
            })
            html = /* html */
                `<form class="tags">
                    ${html}
                </form>`
        }
        if (this.options.search) {
            html += /* html */
                `<form class="search">
                    <label>Search
                        <input class="event-search" type="text" name="search" value="" />
                    </label>
                    <div class="search-results"></div>
                </form>`
        }
        if (this.options.sorting && this.eventTags.length > 1) {
            html += /* html */
                `<form class="sorting">
                    <label title="Sort by date">Date<input type="radio" name="sorting" value="date" ${this.DEFAULT_SORT === 'date' ? 'checked' : ''}/></label>
                    <label title="Sort by tag">Tag<input type="radio" name="sorting" value="tag" ${this.DEFAULT_SORT === 'tag' ? 'checked' : ''}/></label>
                </form>`
        }
        if (this.options.view) {
            html += /* html */
                `<form class="views">
                    <label title="Switch to text view">Text<input type="radio" name="view" value="text" ${view === 'text' ? 'checked' : ''}/></label>
                    <label title="Switch to chart view">Chart<input type="radio" name="view" value="chart" ${view === 'chart' ? 'checked' : ''}/></label>
                </form>`
        }
        return html
    }


    formatEvent(event) {
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
            const ext = this.options.test ? ".html" : ''
            content += `<h4>Linked timeline</h4>`
            content += `<a href="${prefix}${url}${ext}">${link}</a>`
        }
        const img = event.image ? `<img src="${event.image}"/>` : ''
        const newEventElement = document.createElement('div')
        newEventElement.className = `event${textAlign}`
        newEventElement.setAttribute('data-tag-index', event.tagIndex)
        newEventElement.style = `margin-left: ${event.margin}%; width: ${event.width}%;`
        newEventElement.innerHTML = /* html */`
            <h3 class="title">${event.title}</h3>
            ${img}
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
        const containerDiv = timelineDiv.querySelector('.container')
        const summaryDiv = containerDiv.querySelector('.summary')
        const eventsDiv = containerDiv.querySelector('.events')
        const closeSummary = function () {
            containerDiv.classList.remove('show-summary')
            summaryDiv.innerHTML = ''
            summaryDiv.style = '';
            const selected = eventsDiv.querySelector('.event.selected')
            if (selected) selected.classList.remove('selected')
        }
        // View changes
        if (this.options.view) {
            const viewInputs = timelineDiv.querySelectorAll('form.views input')
            viewInputs.forEach(input => {
                input.addEventListener('click', () => {
                    viewInputs.forEach(i => {
                        i.removeAttribute('checked')
                        timelineDiv.removeAttribute('data-view')
                    })
                    input.setAttribute('checked', 'checked')
                    timelineDiv.setAttribute('data-view', input.value)
                    closeSummary()
                })
            })
        }
        // Sorting
        if (this.options.sorting) {
            const sortingInputs = timelineDiv.querySelectorAll('form.sorting input')
            sortingInputs.forEach(input => {
                input.addEventListener('click', event => {
                    console.log('clicked sorting', event.target.value)
                    sortingInputs.forEach(i => {
                        i.removeAttribute('checked')
                    })
                    input.setAttribute('checked', 'checked')
                    // Sort events
                    this.sortEvents(event.target.value)
                    this.redrawEvents()
                })
            })
        }
        // Category selections
        if (this.options.tags) {
            const tagInputs = timelineDiv.querySelectorAll('form.tags input')
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
                            }
                        }
                    })
                })
            })
        }
        // Search
        if (this.options.search) {
            const searchInput = timelineDiv.querySelector('form.search input')
            const searchResults = timelineDiv.querySelector('form.search .search-results')
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
                const plural = results > 1 ? 'es' : ''
                searchResults.innerHTML = text ? `Found ${results} match${plural}` : ''
            })
        }

        // Event click events
        summaryDiv.addEventListener('click', evt => {
            // console.log('clicked summary', evt.target)
            if (evt.target.className === 'close') {
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
                    // Get position relative to the viewport, i.e. the window
                    // and offset the summary top by negative this amount
                    event.element.classList.add('selected')
                    const viewportOffset = eventsDiv.getBoundingClientRect();
                    const top = viewportOffset.top < 0 ? -viewportOffset.top + 10 : 10
                    summaryDiv.style = `margin-top:${top}px`
                    const dates = event.element.querySelector('.dates').outerHTML
                    const content = event.element.querySelector('.content').innerHTML
                    const image = event.image 
                        ? /* html */ `<div class="summary-image"><img src="${event.image}" /></div>` 
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