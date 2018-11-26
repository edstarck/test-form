const phone = document.getElementById('phone');
const snils = document.getElementById('snils');
const divisionCode = document.getElementById('divisionCode');
const series = document.getElementById('series');
const birthday = document.getElementById('birthdate');
const dateissue = document.getElementById('dateissue');
const numberpass = document.getElementById('numberpass');

const momentFormat = 'DD.MM.YYYY';

const phoneMask = new IMask(phone, {
  mask: [
    {
      mask: '+0(000)000-00-00',
      startsWith: '7',
      lazy: true,
    },
    {
      mask: '0(000)000-00-00',
      startsWith: '8',
      lazy: true,
    },
    {
      mask: '0(000)000-00-00',
      startsWith: '9',
      lazy: true,
    },
  ],
  dispatch: function(appended, dynamicMasked) {
    var number = (dynamicMasked.value + appended).replace(/\D/g, '');

    return dynamicMasked.compiledMasks.find(function(m) {
      return number.indexOf(m.startsWith) === 0;
    });
  },
});

const snilsMask = new IMask(snils, {
  mask: '000-000-000-00',
  lazy: true,
  placeholderChar: '0',
});

const divisionMask = new IMask(divisionCode, {
  mask: '000-000',
  lazy: true,
  placeholderChar: '0',
});

const seriesMask = new IMask(series, {
  mask: '00 00',
});

const birthdayMask = new IMask(birthday, {
  mask: Date,
  pattern: momentFormat,
  lazy: true,
  min: new Date(1946, 0, 1),
  max: new Date(today.fullYear - 18, today.month, today.day),
  format: function(date) {
    return moment(date).format(momentFormat);
  },
  parse: function(str) {
    return moment(str, momentFormat);
  },
  blocks: {
    DD: {
      mask: IMask.MaskedRange,
      from: 1,
      to: 31,
    },
    MM: {
      mask: IMask.MaskedRange,
      from: 1,
      to: 12,
    },
    YYYY: {
      mask: IMask.MaskedRange,
      from: 1946,
      to: today.fullYear - 18,
    },
  },
});

const dateissueMask = new IMask(dateissue, {
  mask: Date,
  pattern: momentFormat,
  lazy: true,
  min: new Date(1997, 0, 1),
  max: new Date(today.fullYear, today.month, today.day),
  format: function(date) {
    return moment(date).format(momentFormat);
  },
  parse: function(str) {
    return moment(str, momentFormat);
  },
  blocks: {
    DD: {
      mask: IMask.MaskedRange,
      from: 1,
      to: 31,
    },
    MM: {
      mask: IMask.MaskedRange,
      from: 1,
      to: 12,
    },
    YYYY: {
      mask: IMask.MaskedRange,
      from: 1997,
      to: today.fullYear,
    },
  },
});

const passMask = new IMask(numberpass, {
  mask: '000000',
  lazy: true,
  placeholderChar: '0',
});
