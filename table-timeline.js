document.addEventListener('DOMContentLoaded', function () {

  const timelines = []
  const dayMs = 86400000

  class Timeline {

    id = generateRandomId()
    timelineContainer
    timelineTitle
    timelineContent
    timelineSummaryContainer
    timelineSummaryText
    timelineSummaryCloseButton
    timelineChartContainer
    timelineEvents
    timelineXAxis
    timelineFilterControls
    timelineCategories
    eventsTable
    minPosition
    maxPosition
    start
    end
    startYear
    endYear
    range
    events = []
    categories = ['All']
    categoryColours = []
    selectedEventId = ''


    constructor(timelineTable) {
      this.eventsTable = timelineTable
      // console.log(this.eventsTable)
      this.tableData = Array.from(this.eventsTable.getElementsByTagName('tr'))
      if (timelineTable.dataset.categoryColours) {
        this.categoryColours = timelineTable.dataset.categoryColours.split(';')
      }
      this.buildDomElements()
      this.readEvents()
      this.addFilterControls()
      this.addXAxis()
      this.displayEvents()
    }


    buildDomElements() {
      const html =
        `<div class="timeline-container" id="${this.id}">

          <div class="timeline-title">${this.eventsTable.title}</div>

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

              <button class="timeline-summary-close-button">Close</button>

            </div>
          
            <div class="timeline-chart-container">
            
              <div class="timeline-events"></div>

              <div class="timeline-x-axis"></div>
            </div>

          </div>

        </div>`
      this.eventsTable.insertAdjacentHTML("afterend", html)
      this.timelineContainer = document.getElementById(this.id)
      this.timelineTitle = this.timelineContainer.querySelector(".timeline-title")
      this.timelineContent = this.timelineContainer.querySelector(".timeline-content")
      this.timelineSummaryContainer = this.timelineContainer.querySelector(".timeline-summary-container")
      this.timelineSummaryText = this.timelineContainer.querySelector(".timeline-summary-text")
      this.timelineSummaryCloseButton = this.timelineContainer.querySelector(".timeline-summary-close-button")
      this.timelineChartContainer = this.timelineContainer.querySelector(".timeline-chart-container")
      this.timelineEvents = this.timelineContainer.querySelector(".timeline-events")
      this.timelineXAxis = this.timelineContainer.querySelector(".timeline-x-axis")
      this.timelineFilterControls = this.timelineContainer.querySelector(".timeline-filter-controls")
      this.timelineCategories = this.timelineContainer.querySelector(".timeline-categories")
      this.timelineSummaryCloseButton.addEventListener('click', () => this.clearSummary())
    }

    readEvents() {
      Array.from(this.eventsTable.getElementsByTagName('tr')).forEach((row, index) => {
        const cells = row.getElementsByTagName('td');
        if (cells.length >= 5) { // Assuming each row has at least 5 cells (title, start, end, category, summary,citations)
          // Find "when" events happen, either as a year or date (convert)
          const startString = cells[1].innerText.trim()
          let endString = cells[2].innerText.trim()
          const start = this.readDate(startString)
          const end = this.readDate(endString, start)
          if (endString === 'date' || endString === '-') {
            endString = 'date'
          } else if (end.type === 'UTC') {
            endString = start.when.toLocaleDateString()
          }

          const event = {
            id: index - 1, // First row are headers
            title: cells[0].innerText.trim(),
            startString: start.type === 'UTC' ? start.when.toLocaleDateString() : startString,
            endString,
            start: start.when,
            end: end.when,
            type: start.type,
            category: cells[3].innerText.trim(),
            summary: cells[4].innerHTML,
            citations: cells[5].innerHTML
          }

          // if ( index === 1){
          //   console.log(event)
          //   debugger
          // }

          // Check for earliest date
          if (!this.start || event.start < this.start ) {
            this.start = event.type === 'UTC' ? new Date(event.start) : event.start
          }
          // Check for latest date
          if (!this.end || event.end > this.end ) {
            this.end = event.type === 'UTC' ? new Date(event.end) : event.end
          }
          // Collect new categories
          if (!this.categories.includes(event.category)) this.categories.push(event.category)
          this.events.push(event)
        }
      })
      //console.table(this.events)
      console.log('range',this.start,this.end)
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
          } else if (start.type === 'billionYearsAgo' || start.type === 'thousandYearsAgo' || start.yype === 'thousandYearsAgo') {
            when = 0
          } else {
            when = new Date().getFullYear()
          }
          type = start.type
          return { type, when }
        }

        // Check for "start-only" evets
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
      this.timelineCategories.innerHTML = this.categories.map((category, index) => {
        const colour = this.categoryColours.length > 0 ? `style="border: 1px solid ${this.categoryColours[index]};"` : ''
        return `<label class="timeline-category category-${index}" ${colour}>${category}
            <input type="checkbox" name="category[${index}]" value="${index}" checked />
          </label>`
      }).join('')
      // Text search
      const textSearch = this.timelineFilterControls.querySelector(".timeline-search")
      const textSearchClearButton = this.timelineFilterControls.querySelector(".timeline-search-clear-button")
      // Event listeners
      this.timelineCategories.addEventListener('click', (evt) => {
        const event = evt.target
        console.log('Clicked', event.value, 'with value', event.checked)
        this.filterByCategory(event)
        this.clearSummary()
      })
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
        // console.log('start=', start, 'end=', end)

        const leftPercent = 100 * (start - this.startYear) / this.range
        let widthPercent = 100 * Math.abs((end - start)) / this.range
        if ( widthPercent < 0.3 ) widthPercent = 0.3

        // console.log(event.title + ' widthPercent', widthPercent)

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
        if (leftPercent > 50) {
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
      const regex = /(https?:\/\/[\w.?=&\/;]+)/gm
      const subst = `<a href="$1">$1</a>`;
      // Save instance for use in clearing summary
      eventElement.classList.add('selected')
      this.selectedEventId = eventElement.dataset.id
      const event = this.events[this.selectedEventId]
      const citations = event.citations.replace(regex, subst);
      this.timelineSummaryText.innerHTML =
        `<h4>${event.title}</h4>` +
        `<h5>${event.startString} - ${event.endString}</h5>` +
        `<div>${event.summary}</div>` +
        '<h5>Citations</h5>' +
        citations
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
  const timelineTables = document.getElementsByClassName('timeline-table')
  // console.log('event tables', timelineTables)
  Array.from(timelineTables).forEach(table => {
    timelines.push(new Timeline(table));
  })

});
