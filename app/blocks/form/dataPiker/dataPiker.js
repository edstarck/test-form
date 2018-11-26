flatpickr('#birthdate', {
  allowInput: true,
  dateFormat: 'd.m.Y',
  onValueUpdate: (selectedDates, dateStr, instance) => {
    birthdayMask.updateValue();
  },
  disableMobile: 'true',
  locale: 'ru',
  minDate: new Date(1957, 0, 1),
  maxDate: new Date(today.fullYear - 18, today.month, today.day),
});

flatpickr('#dateissue', {
  allowInput: true,
  dateFormat: 'd.m.Y',
  onValueUpdate: (selectedDates, dateStr, instance) => {
    dateissueMask.updateValue();
  },
  disableMobile: 'true',
  locale: 'ru',
  minDate: new Date(1997, 0, 1),
  maxDate: new Date(today.fullYear, today.month, today.day),
});
