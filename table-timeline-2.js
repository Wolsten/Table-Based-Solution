"use strict"

document.addEventListener('DOMContentLoaded', function () {

  const timelines = []
  const dayMs = 86400000

  class Timeline {

    id = generateRandomId()
    timelineContainer
    timelineStyle
    timelineTitle
    timelineContent
    timelineSummaryContainer
    timelineSummaryText
    timelineSummaryCloseButton
    timelineChartContainer
    timelineEvents
    timelineXAxis
    timelineFilterControls
    timelineCategoriesGroup
    timelineCategories
    timelineSearchGroup
    eventsTable  // => timeline
    minPosition
    maxPosition
    start
    end
    startYear
    endYear
    range
    events = []
    categories = ['All']
    customColours = ''
    selectedEventId = ''


    constructor(timelineTag) {

      this.eventsTable = timelineTag
      // console.log(this.eventsTable)

      this.customColours = this.getCustomColours(timelineTag)
      // console.log('customColours', this.customColours)
      timelineTag.style = this.customColours

      const eventTags = timelineTag.getElementsByTagName('event')
      this.readEvents(eventTags)

      let proseEvents = ''
      this.events.forEach(event => {
        proseEvents += this.buildProseEvent(event)
      })
      console.log('proseEvents', proseEvents)

      // this.buildDomElements()
      // this.addFilterControls()
      // this.addXAxis()
      // this.displayEvents()
    }


    getCustomColours(timelineTag) {
      const categories = timelineTag.getAttribute('categories')
      if (!categories) {
        return ''
      }
      console.log('categories', categories)
      const colours = categories.split(';')
      let index = 0
      let customColours = '' //'timeline {'
      colours.forEach(colour => {
        // console.log('colour', colour)
        colour = colour.trim()
        if (colour !== '') {
          index++
          const colourValue = colour.split(':')[1]
          customColours += '--colour-category-' + index + ':' + colourValue + ';'
        }
      })
      // customColours += '}'
      timelineTag.removeAttribute('categories')
      return customColours
    }


    buildProseEvent(event) {
      // Start and end years as full years or fractions (if UTC dates)
      let start
      let end
      if (event.type === 'UTC') {
        start = this.getYearFraction(event.start)
        end = this.getYearFraction(event.end)
      } else {
        start = event.start
        end = event.end
      }
      return `
        <article class="prose-event">
          <h1>${event.title}</h1>
          <strong>${start} - ${end}</strong>
          <p>category: ${event.category}</p>
          ${event.summary}
          <h2>Citations</h2>
          ${event.citations}
        </article>`
    }


    buildDomElements() {
      const html =
        `<div class="timeline-container" id="${this.id}">

          <style class="timeline-style"></style>

          <h1 class="timeline-title">${this.eventsTable.title}</h1>

          <div class="timeline-filter-controls">
            <div class="timeline-categories-group">
              <label>Categories:</label><span class="timeline-categories"></span>
            </div>
            <div class="timeline-search-group">
              <label>Search:</label><input type="text" class="timeline-search" value=""/><button class="timeline-search-clear-button">X</button>
            </div>
          </div>

          <div class="timeline-content">

            <div class="timeline-summary-container">

              <div class="timeline-summary-text"></div>

              <button class="timeline-summary-close-button">X</button>

            </div>
          
            <div class="timeline-chart-container">

              <div class="timeline-zomm-panel">
                <div class="timeline-events"></div>
                <div class="timeline-x-axis"></div>
              </div>

            </div>

          </div>

        </div>`
      this.eventsTable.insertAdjacentHTML("afterend", html)

      this.timelineContainer = document.getElementById(this.id)
      this.timelineStyle = this.timelineContainer.querySelector(".timeline-style")
      this.timelineTitle = this.timelineContainer.querySelector(".timeline-title")
      this.timelineContent = this.timelineContainer.querySelector(".timeline-content")
      this.timelineSummaryContainer = this.timelineContainer.querySelector(".timeline-summary-container")
      this.timelineSummaryText = this.timelineContainer.querySelector(".timeline-summary-text")
      this.timelineSummaryCloseButton = this.timelineContainer.querySelector(".timeline-summary-close-button")
      this.timelineChartContainer = this.timelineContainer.querySelector(".timeline-chart-container")
      this.timelineEvents = this.timelineContainer.querySelector(".timeline-events")
      this.timelineXAxis = this.timelineContainer.querySelector(".timeline-x-axis")
      this.timelineFilterControls = this.timelineContainer.querySelector(".timeline-filter-controls")
      this.timelineCategoriesGroup = this.timelineFilterControls.querySelector(".timeline-categories-group")
      this.timelineCategories = this.timelineFilterControls.querySelector(".timeline-categories")
      this.timelineSearchGroup = this.timelineFilterControls.querySelector(".timeline-search-group")
      this.timelineSummaryCloseButton.addEventListener('click', () => this.clearSummary())
    }


    readEvents(eventTags) {

      Array.from(eventTags).forEach((eventTag, index) => {
        // Dates
        const startString = eventTag.getAttribute('start').trim()
        let endString = eventTag.getAttribute('end').trim()
        const start = this.readDate(startString)
        const end = this.readDate(endString, start)
        if (endString === 'date' || endString === '-') {
          endString = 'date'
        } else if (end.type === 'UTC') {
          endString = end.when.toLocaleDateString()
        }
        // Extract citations
        const citations = eventTag.querySelector('citations')
        const summary = eventTag.innerHTML.replace(citations.outerHTML, '')
        // console.log('citations after', citations.innerHTML)
        // console.log('eventTag inner html', eventTag.innerHTML)
        // Save event
        const event = {
          id: index,
          title: eventTag.title.trim(),
          startString: start.type === 'UTC' ? start.when.toLocaleDateString() : startString,
          endString,
          start: start.when,
          end: end.when,
          type: start.type,
          category: eventTag.getAttribute('category').trim(),
          summary,
          citations: citations.innerHTML.trim()
        }
        // Check for earliest date
        if (!this.start || event.start < this.start) {
          this.start = event.type === 'UTC' ? new Date(event.start) : event.start
        }
        // Check for latest date
        if (!this.end || event.end > this.end) {
          this.end = event.type === 'UTC' ? new Date(event.end) : event.end
        }
        // Collect new categories
        if (event.category !== '' && !this.categories.includes(event.category)) this.categories.push(event.category)
        this.events.push(event)
      })
      console.table(this.events)
      console.log('range', this.start, this.end)
    }


    addXAxis() {
      this.startYear = typeof this.start === 'number' ? this.start : this.start.getFullYear()
      this.endYear = typeof this.end === 'number' ? this.end : this.end.getFullYear()
      const years = this.endYear - this.startYear + 1
      let labels = []
      let interval = 1
      if (years > 5) {
        interval = Math.round(years / 5)
      }
      let year = this.startYear
      while (year < this.endYear) {
        labels.push(year)
        year += interval
      }
      this.endYear = year
      this.range = this.endYear - this.startYear
      // console.log('Ranged start year = ', this.startYear)
      // console.log('Ranged year end =', this.endYear)
      // console.table(labels)
      this.timelineXAxis.innerHTML = ''
      labels.forEach((label, index) => {
        const text = this.displayDate(label, 'axis')
        const percentageWidth = interval === 1 ? 100 : 20
        const style = index !== 0 ? `style="flex-basis:${percentageWidth}%;"` : ''
        const className = index === 0 ? 'class="first"' : ''
        this.timelineXAxis.innerHTML += `<div ${className} ${style}>${text}</div>`
      })
      const text = this.displayDate(year, 'axis')
      this.timelineXAxis.innerHTML += `<div class="last">${text}</div>`
    }


    /**
     * 
     * @param {number} date Axis date or event date
     * @param {string} type If type is 'axis' date will be a year
     * @returns 
     */
    displayDate(date, type) {
      if (date < -999) {
        const magnitude = Math.abs(date)
        if (magnitude > 1000000000) {
          return (magnitude / 1000000000).toFixed(1) + 'bya';
        } else if (magnitude > 1000000) {
          return (magnitude / 1000000).toFixed(1) + 'mya';
        } else if (magnitude > 1000) {
          return (magnitude / 1000).toFixed(1) + 'tya';
        }
      } else if (type === 'UTC') {
        return new Date(date).toLocaleDateString();
      } else {
        return date
      }
    }

    // The getTime() method of Date instances returns the number of milliseconds for this date 
    // since the epoch, which is defined as the midnight at the beginning of January 1, 1970, UTC.
    // Take in a string date and returns either a number year or a UTC date along with the type of date
    readDate(stringDate, start) {
      let when
      let type
      // console.log('reading date',stringDate)

      // Special processing for end events
      if (start !== undefined) {

        // Look for ongoing events (type will already be set from start date)
        if (stringDate === 'date' || stringDate === '-') {
          if (start.type === 'UTC') {
            when = new Date()
            when.setUTCHours(12, 0, 0, 0)
          } else if (start.type === 'billionYearsAgo' || start.type === 'thousandYearsAgo' || start.type === 'thousandYearsAgo') {
            when = 0
          } else {
            when = new Date().getFullYear()
          }
          type = start.type
          return { type, when }
        }

        // Check for "start-only" events
        if (stringDate === '') {
          return { ...start }
        }
      }

      // Test for a geological timescale such as 10mya
      const geologicalRegexPattern = /^([0-9]+[.]*[0-9]*)([bmtBMT])ya$/
      let matchResult = geologicalRegexPattern.exec(stringDate)
      if (matchResult !== null) {
        const numericPart = matchResult[1]
        const magnitudePart = matchResult[2].toLowerCase()
        switch (magnitudePart) {
          case 'b':
            type = 'billionYearsAgo'
            when = numericPart * -1000000000
            break
          case 'm':
            type = 'millionYearsAgo'
            when = numericPart * -1000000
            break
          case 't':
            type = 'thousandYearsAgo'
            when = numericPart * -1000
            break
        }
        return { type, when }
      }

      // Check for a Gregorian year (suffixed with bc or ad)
      const gregorianRegexPattern = /^([0-9]+)(bc|BC|ad|AD)$/
      matchResult = gregorianRegexPattern.exec(stringDate)
      if (matchResult !== null) {
        type = 'gregoriam'
        const sign = matchResult[2].toLowerCase() == 'bc' ? -1 : 1
        when = sign * matchResult[1]
        return { type, when }
      }

      // Check for a common era year (suffixed with bce or ce)
      const commonEraRegexPattern = /^([0-9]+)(bce|BCE|ce|CE)$/
      matchResult = commonEraRegexPattern.exec(stringDate)
      if (matchResult !== null) {
        type = 'commonEra'
        const sign = matchResult[2].toLowerCase() == 'bce' ? -1 : 1
        when = sign * matchResult[1]
        return { type, when }
      }

      // Full UTC date?
      const dateRegexPattern = /^([0-9]+)-([0-9]+)-([0-9]+)$/
      matchResult = dateRegexPattern.exec(stringDate)
      if (matchResult !== null) {
        type = 'UTC'
        when = new Date(stringDate + 'T12:00:00')
        return { type, when }
      }

      // Check for a plain year, e.g. 1961
      const yearRegexPattern = /^([0-9]+)$/
      matchResult = yearRegexPattern.exec(stringDate)
      if (matchResult !== null) {
        type = 'plain'
        when = parseInt(matchResult[1])
        return { type, when }
      }

      console.error(`Date [${stringDate}] not recognised`)
      return { type: 'error', when: `Date [${stringDate}] not recognised` }
    }


    filterByCategory(event) {
      const active = [];
      const eventElements = this.timelineChartContainer.getElementsByClassName('timeline-event');
      const checkboxes = this.timelineCategories.querySelectorAll('input');
      const allCheckbox = checkboxes[0];
      Array.from(checkboxes).forEach((checkbox, index) => {
        if (event.value === '0' && event.checked && index > 0) {
          checkbox.checked = true
        }
        if (index > 0 && checkbox.checked) {
          active.push(index)
        }
        if (index > 0 && !checkbox.checked) {
          allCheckbox.checked = false
        }
      })
      Array.from(eventElements).forEach((event) => {
        const categoryIndex = parseInt(event.dataset.categoryIndex)
        if (active.includes(categoryIndex)) {
          event.classList.remove('hide')
        } else {
          event.classList.add('hide')
        }
      })
    }


    filterBySearchText(search) {
      const eventElements = this.timelineChartContainer.getElementsByClassName('timeline-event');
      Array.from(eventElements).forEach((event) => {
        const title = event.getElementsByClassName('title')[0].innerText.toLowerCase();
        if (title.includes(search)) {
          event.classList.remove('filter')
        } else {
          event.classList.add('filter')
        }
      })
    }


    addFilterControls() {
      // Categories
      // By default there will always be the All category, so need at least three to make worth while
      if (this.categories.length <= 2) {
        this.timelineCategoriesGroup.remove()
      } else {
        this.timelineCategories.innerHTML = this.categories.map((category, index) => {
          const colour = this.categoryColours.length > 0 ? `style="border: 1px solid ${this.categoryColours[index]};"` : ''
          return `<label class="timeline-category category-${index}" ${colour}>${category}
            <input type="checkbox" name="category[${index}]" value="${index}" checked />
          </label>`
        }).join('')
        // Event listener
        this.timelineCategories.addEventListener('click', (evt) => {
          const event = evt.target
          console.log('Clicked', event.value, 'with value', event.checked)
          this.filterByCategory(event)
          this.clearSummary()
        })
      }
      // Text search
      if (this.events.length < 10) {
        this.timelineSearchGroup.remove()
      } else {
        const textSearch = this.timelineFilterControls.querySelector(".timeline-search")
        const textSearchClearButton = this.timelineFilterControls.querySelector(".timeline-search-clear-button")
        textSearch.addEventListener('change', () => {
          this.filterBySearchText(textSearch.value.toLowerCase())
          this.clearSummary()
        })
        textSearchClearButton.addEventListener('click', () => {
          textSearch.value = ''
          this.filterBySearchText('')
          this.clearSummary()
        })
      }
    }

    getYearFraction(utcDate) {
      const fullYear = utcDate.getFullYear()
      const fullYearStart = new Date('' + fullYear)
      const fullYearEnd = new Date('' + (fullYear + 1))
      return fullYear + (fullYearStart - utcDate) / (fullYearEnd - fullYearStart)
    }


    displayEvents() {
      this.events.forEach(event => {

        const eventElement = document.createElement('div');
        eventElement.dataset.id = event.id
        eventElement.className = 'timeline-event'

        // Start and end years as full years or fractions (if UTC dates)
        let start
        let end
        if (event.type === 'UTC') {
          start = this.getYearFraction(event.start)
          end = this.getYearFraction(event.end)
        } else {
          start = event.start
          end = event.end
        }

        const leftPercent = 100 * (start - this.startYear) / this.range
        let widthPercent = 100 * Math.abs((end - start)) / this.range
        if (widthPercent < 0.3) widthPercent = 0.3

        eventElement.style.marginLeft = `${leftPercent}%`;
        eventElement.style.width = `${widthPercent}%`

        const categoryIndex = this.categories.findIndex(category => event.category === category)
        if (categoryIndex !== -1) {
          if (this.categoryColours.length > 0) {
            eventElement.style.backgroundColor = this.categoryColours[categoryIndex]
          }
          eventElement.classList.add(`category-${categoryIndex}`)
          eventElement.dataset.categoryIndex = categoryIndex;
        }

        if (leftPercent + widthPercent > 50) {
          eventElement.classList.add('right')
        }
        eventElement.innerHTML = `<div class="title">${event.title}</div>`
        this.timelineEvents.appendChild(eventElement)
        // Event click listener
        eventElement.addEventListener('click', evt => this.handleEventClick(evt.currentTarget))
      })
    }


    handleEventClick(eventElement) {
      // Clear any previous selection class
      const selectedEvent = this.timelineChartContainer.querySelector('.timeline-event.selected')
      if (selectedEvent) {
        selectedEvent.classList.remove('selected');
      }
      // Close summary if click same event
      if (this.selectedEventId === eventElement.dataset.id) {
        this.clearSummary()
      } else {
        this.showSummary(eventElement)
      }
    }


    showSummary(eventElement) {
      const regex = /(https?:\/\/[\w.,-_?=&\/;]+)/gm
      const subst = `<a href="$1">$1</a>`;
      // Save instance for use in clearing summary
      eventElement.classList.add('selected')
      this.selectedEventId = eventElement.dataset.id
      const event = this.events[this.selectedEventId]
      const citations = event.citations !== '' ? `<h3>Citations</h3> ${event.citations.replace(regex, subst)}` : ''
      const dates = event.startString !== event.endString
        ? `${event.startString} - ${event.endString}`
        : event.startString
      const category = this.categories.length > 1 ? ` <span class="timeline-summary-title-small">(${event.category})</span>` : ''
      this.timelineSummaryText.innerHTML =
        `<h2>${event.title}${category}</h2>
         <div class="timeline-summary-dates">${dates}</div>
         <div>${event.summary}</div>
         ${citations}`
      this.timelineContent.classList.add('show')
    }


    clearSummary() {
      if (this.selectedEventId !== '') {
        this.selectedEventId = '';
        this.timelineSummaryText.innerHTML = '';
        this.timelineContent.classList.remove('show');
      }
    }

  } // End Timeline class


  function generateRandomId() {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 8; // Change the length as needed
    let randomId = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomId += characters.charAt(randomIndex);
    }
    return randomId;
  }


  // Initialisation
  const timelineTags = document.getElementsByTagName('timeline')
  console.log('timelineTags', timelineTags)

  Array.from(timelineTags).forEach(timelineTag => {
    timelines.push(new Timeline(timelineTag));
  })

});
