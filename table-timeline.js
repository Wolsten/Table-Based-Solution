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
    range
    type
    events = []
    categories = ['All']
    categoryColours = []
    selectedEventId = ''


    constructor(timelineTable) {
      this.eventsTable = timelineTable
      this.tableData = Array.from(this.eventsTable.getElementsByTagName('tr'))
      if (timelineTable.dataset.categoryColours) {
        this.categoryColours = timelineTable.dataset.categoryColours.split(';')
      }
      this.buildDomElements()
      this.readEventsFromTable()
      this.addFilterControls()
      this.addXAxis()
      this.addEventsToChart()
    }


    buildDomElements() {
      const html =
        `<div class="timeline-container" id="${this.id}">

          <div class="timeline-title">${this.eventsTable.id}</div>

          <div class="timeline-filter-controls">
            Categories: <span class="timeline-categories"></span>
            <div class="timeline-search-group">
              Search: <input type="text" class="timeline-search" value=""/><button class="timeline-search-clear-button">X</button>
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


    addXAxis() {
      let startYear = 0
      let endYear = 0
      let years = 0
      let labels = []
      if (this.type === 'UTC') {
        this.start.setMonth(0)
        this.start.setDate(1)
        this.end.setMonth(11)
        this.end.setDate(31)
        endYear = this.end.getFullYear()
        startYear = this.start.getFullYear()
      } else {
        endYear = this.end
        startYear = this.start
      }
      years = endYear - startYear + 1
      let interval = 1
      if (years > 5) {
        interval = Math.round(years / 5)
      }
      let year = startYear
      while (year < endYear) {
        labels.push(year)
        year += interval
      }
      if (this.type === 'UTC') {
        this.start = new Date((startYear) + '-01-01T12:00:00')
        this.end = new Date((year) + '-01-01T12:00:00')
      } else {
        this.end = year
      }
      this.range = this.end - this.start
      // console.log('Modifed start = ', this.start)
      // console.log('Modifed end =', this.end)
      // console.table(labels)
      let text
      this.timelineXAxis.innerHTML = ''
      labels.forEach(label => {
        if (this.type === 'UTC') {
          text = label
        } else {
          text = this.displayDate(label)
        }
        this.timelineXAxis.innerHTML += `<div>${text}</div>`
      })
    }



    displayDate(date) {
      if (this.type === 'UTC') {
        return new Date(date).toLocaleDateString();
      } else if (this.type === 'geological') {
        date = -date
        // console.log('date', date)
        if (date > 1000000000) {
          return (date / 1000000000).toFixed(1) + 'bya';
        } else if (date > 1000000) {
          return (date / 1000000).toFixed(1) + 'mya';
        } else if (date > 1000) {
          return (date / 1000).toFixed(1) + 'tya';
        } else {
          return date.toFixed(1) + 'ya'
        }
      } else {
        return date
      }
    }

    // The getTime() method of Date instances returns the number of milliseconds for this date 
    // since the epoch, which is defined as the midnight at the beginning of January 1, 1970, UTC.
    // Take in a string date and return UTC day
    readDate(stringDate) {
      let when
      // console.log('reading date',stringDate)
      // Test for a geological timescale such as 10mya
      const geologicalRegexPattern = /^([0-9]+[.]*[0-9]*)([bmtBMT])ya$/
      let matchResult = geologicalRegexPattern.exec(stringDate)
      if (matchResult !== null) {
        if (!this.type) this.type = 'geological'
        const numericPart = matchResult[1]
        const magnitudePart = matchResult[2].toLowerCase()
        switch (magnitudePart) {
          case 'b':
            when = -numericPart * 1000000000
            break
          case 'm':
            when = -numericPart * 1000000
            break
          case 't':
            when = -numericPart * 1000
            break
        }
        console.log('found geological year')
        return when
      }
      // Check for a christian year (suffixed with bc or ad)
      const christianRegexPattern = /^([0-9]+)(bc|BC|ad|AD)$/
      matchResult = christianRegexPattern.exec(stringDate)
      if (matchResult !== null) {
        if (!this.type) this.type = 'christian'
        const sign = matchResult[2].toLowerCase() == 'bc' ? -1 : 1
        when = sign * matchResult[1]
        return when
      }
      // Full UTC date?
      const dateRegexPattern = /^([0-9]+)-([0-9]+)-([0-9]+)$/
      matchResult = dateRegexPattern.exec(stringDate)
      if (matchResult !== null) {
        if (!this.type) this.type = 'UTC'
        when = new Date(stringDate + 'T12:00:00')
        return when
      }
      // Check for a plain year, e.g. 1961
      const yearRegexPattern = /^([0-9]+)$/
      matchResult = yearRegexPattern.exec(stringDate)
      if (matchResult !== null) {
        if (!this.type) this.type = 'christian'
        const sign = matchResult[2].toLowerCase() == 'bc' ? -1 : 1
        when = sign * matchResult[1]
        return when
      }
      // Look for ongoing events (type will already be set from start date)
      if (stringDate === 'date') {
        if (this.type === 'geological') {
          when = 0
        } else if (this.type === 'UTC') {
          when = new Date()
          when.setUTCHours(12, 0, 0, 0)
        } else {
          when = new Date().getFullYear()
        }
        return when
      }
      console.error(`Date [${stringDate}] not recognised`)
    }


    readEventsFromTable() {
      Array.from(this.eventsTable.getElementsByTagName('tr')).forEach((row, index) => {
        const cells = row.getElementsByTagName('td');
        if (cells.length >= 5) { // Assuming each row has at least 5 cells (title, start, end, category, summary,citations)
          // Find "when" events happen, either as a year or date (convert)
          const start = this.readDate(cells[1].innerText)
          const end = this.readDate(cells[2].innerText)
          const event = {
            id: index,
            title: cells[0].innerText,
            start,
            end,
            ongoing: cells[2].innerText === 'date',
            category: cells[3].innerText,
            summary: cells[4].innerHTML,
            citations: cells[5].innerHTML
          }
          // Check for earliest date
          if (!this.start || this.start > event.start) {
            if (this.type === 'UTC') {
              this.start = new Date(event.start)
            } else {
              this.start = event.start
            }
          }
          // Check for latest date
          if (!this.end || this.end < event.end) {
            if (this.type === 'UTC') {
              this.end = new Date(event.end)
            } else {
              this.end = event.end
            }
          }
          // Collect new categories
          if (!this.categories.includes(event.category)) this.categories.push(event.category)
          this.events.push(event)
        }
      })
      // console.table(this.events)
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
        const colour = this.categoryColours.length > 0 ? `style="background-color:${this.categoryColours[index]};"` : ''
        return `<label class="timeline-category category-${index}" ${colour}>${category} 
            <input type="checkbox" name="category[${index}]" value="${index}" checked/>
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


    addEventsToChart() {
      let rangeStart = this.start
      let range = this.range
      if (this.type === 'UTC') {
        rangeStart = this.start.getTime() / dayMs
        range = range / dayMs
      }
      this.events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.dataset.id = event.id
        eventElement.className = 'timeline-event'
        let start = event.start
        let end = event.end
        if (this.type === 'UTC') {
          start = event.start.getTime() / dayMs
          end = event.end.getTime() / dayMs
        }
        const leftPercent = 100 * (start - rangeStart) / range
        eventElement.style.marginLeft = `${leftPercent}%`;
        eventElement.style.width = `${100 * (end - start) / range}%`
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
      // Save instance for use in clearing summary
      eventElement.classList.add('selected')
      this.selectedEventId = eventElement.dataset.id
      const event = this.events[this.selectedEventId]
      let citations = event.citations.split('\n')
      citations = citations.map(citation => {
        const trimmed = citation.trim()
        return `<a href="${trimmed}">${trimmed}</a>`
      })
      const start = this.type === 'UTC' ? event.start.toLocaleDateString() : this.displayDate(event.start)
      const end = event.ongoing ? 'date' :
        (this.type === 'UTC' ? event.end.toLocaleDateString() : this.displayDate(event.end))
      this.timelineSummaryText.innerHTML =
        `<h4>${event.title}</h4>` +
        `<h5>${start} - ${end}</h5>` +
        `<div>${event.summary}</div>` +
        '<h4>Citations</h4>' +
        citations.join('<br>')
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
