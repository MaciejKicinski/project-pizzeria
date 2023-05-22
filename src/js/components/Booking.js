import { classNames, select, settings, templates } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.initActions();

    thisBooking.selectedTable ={};
  }

  getData() {
    const thisBooking = this;

    const startDateParam =
      settings.db.dateStartParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePickerWidget.minDate);
    const endDateParam =
      settings.db.dateEndParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePickerWidget.maxDate);

    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    console.log('getData params', params);

    const urls = {
      booking:
        settings.db.url +
        '/' +
        settings.db.booking +
        '?' +
        params.booking.join('&'),
      eventsCurrent:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsCurrent.join('&'),
      eventsRepeat:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponse) {

        const bookingResponse = allResponse[0];
        const eventsCurrentResponse = allResponse[1];
        const eventsRepeatResponse = allResponse[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        console.log('bookings',bookings);
        console.log('eventsCurrent',eventsCurrent);
        console.log('eventsRepeat',eventsRepeat);

        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    //eslint-disable-line no-unused-vars

    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePickerWidget.minDate;
    const maxDate = thisBooking.datePickerWidget.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        )
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table
          );
      }
    }
    console.log('thisBooking.booked', thisBooking.booked);

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePickerWidget.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPickerWidget.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
        'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element) {
    const thisBooking = this;
    const generateHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generateHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.tables
    );

    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(
      select.booking.form
    );
    thisBooking.dom.orderConfirmation = thisBooking.dom.form.querySelector(
      select.booking.orderConfirmation
    );
    thisBooking.dom.phone = thisBooking.dom.orderConfirmation.querySelector(
      select.booking.phone
    );
    thisBooking.dom.address = thisBooking.dom.orderConfirmation.querySelector(
      select.booking.address
    );
    thisBooking.dom.starters = thisBooking.dom.form.querySelectorAll(
      select.booking.starter
    );
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmountWidget = new AmountWidget(
      thisBooking.dom.peopleAmount
    );
    thisBooking.hoursAmountWidget = new AmountWidget(
      thisBooking.dom.hoursAmount
    );
    thisBooking.datePickerWidget = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPickerWidget = new HourPicker(thisBooking.dom.hourPicker);
  }

  initActions() {
    const thisBooking = this;
    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

    thisBooking.dom.datePicker.addEventListener('updated', function () {
      thisBooking.resetTables();
    });
    thisBooking.dom.hourPicker.addEventListener('updated', function () {
      thisBooking.resetTables();
    });



    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });

    thisBooking.dom.tables.forEach(element => {
      element.addEventListener('click', function (event) {
        thisBooking.initTables(event);
      });
    });

  }

  initTables(event) {
    const thisBooking = this;
    console.log(event);
    const table = event.target.getAttribute(settings.booking.tableIdAttribute);
    if(table != null) {
      if(event.target.classList.contains(classNames.booking.tableBooked))     {
        alert('table booked');
      } else if (event.target.classList.contains(classNames.booking.selected)){
        event.target.classList.remove(classNames.booking.selected);
      } else{
        thisBooking.resetTables();
        event.target.classList.add(classNames.booking.selected);
        thisBooking.selectedTable = parseInt(table);
      }
    }
  }

  resetTables(){
    const thisBooking = this; 
    thisBooking.dom.tables.forEach(element => {
      if(element.classList.contains(classNames.booking.selected))
        element.classList.remove(classNames.booking.selected);
    });
  }

  sendBooking() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    let payload = {
      date: thisBooking.datePickerWidget.correctValue,
      hour: thisBooking.hourPickerWidget.correctValue,
      table: thisBooking.selectedTable,
      duration: thisBooking.hoursAmountWidget.correctValue ,
      ppl:thisBooking.peopleAmountWidget.correctValue ,
      starters: [],
      phone: thisBooking.dom.phone,
      address: thisBooking.dom.address.value,

    };
    for (let starter of thisBooking.dom.starters) {
      if(starter.checked){
        payload.starters.push(starter.getAttribute('value'));
      }
    }
    console.log('thisBooking', thisBooking);
    console.log('payload', payload);
    console.log('url', url);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      }).then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
      });

    thisBooking.makeBooked(
      thisBooking.datePickerWidget.correctValue,
      thisBooking.hourPickerWidget.correctValue,
      thisBooking.hoursAmountWidget.correctValue,
      thisBooking.selectedTable
    );
  }
}

export default Booking;
