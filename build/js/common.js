class Popup {
  constructor(config = { blur: false }) {
    this.currently_opened = [];
    if ('blur' in config) {
      if (config.blur) {
        var main_content = document.querySelector('.popup_main_content');
        if (main_content) {
          main_content.classList.add('popup_blur');
        }
      }
    }
    this.bindEvents();
  }
  bindEvents() {
    const triggers = document.querySelectorAll('[data-popup-target]');
    const closers = document.querySelectorAll('[data-popup-close]');
    const popups = document.querySelectorAll('[data-popup-id]');
    const self = this;
    if (triggers) {
      for (var i = 0; i < triggers.length; i++) {
        triggers[i].addEventListener(
          'click',
          function(e) {
            e.preventDefault();
            var popup_id = this.getAttribute('data-popup-target');
            if (popup_id) {
              self.open(popup_id);
            }
          },
          false
        );
      }
    }
    if (closers) {
      for (var i = 0; i < closers.length; i++) {
        closers[i].addEventListener(
          'click',
          function(e) {
            e.preventDefault();
            var popup_id = this.getAttribute('data-popup-close');
            if (popup_id) {
              self.close(popup_id);
            }
          },
          false
        );
      }
    }
    if (popups) {
      for (var i = 0; i < popups.length; i++) {
        popups[i].addEventListener(
          'click',
          function(e) {
            e.preventDefault();
            var popup_id = e.target.getAttribute('data-popup-id');
            if (popup_id) {
              self.close(popup_id);
            }
          },
          false
        );

        popups[i].addEventListener(self.transition, function(e) {
          if (
            this.classList.contains('opened') &&
            !this.classList.contains('visible')
          ) {
            this.classList.remove('opened');
          }
        });
      }
    }
    document.addEventListener('keyup', function(e) {
      if (self.current(true) && e.keyCode == 27) {
        self.close(self.current(true));
      }
    });
  }
  opened(popup) {
    if (popup) {
      const event = new CustomEvent('popup_opened', {
        bubbles: true,
        detail: { popup: popup },
      });
      popup.dispatchEvent(event);
    }
  }
  opening(popup) {
    if (popup) {
      const event = new CustomEvent('popup_opening', {
        bubbles: true,
        detail: { popup: popup },
      });
      popup.dispatchEvent(event);
    }
  }
  closing(popup) {
    if (popup) {
      const event = new CustomEvent('popup_closing', {
        bubbles: true,
        detail: { popup: popup },
      });
      popup.dispatchEvent(event);
    }
  }
  closed(popup) {
    if (popup) {
      const event = new CustomEvent('popup_closed', {
        bubbles: true,
        detail: { popup: popup },
      });
      popup.dispatchEvent(event);
    }
  }
  current(last = false) {
    if (last) {
      let current = null;
      if (this.currently_opened.length) {
        current = this.currently_opened[this.currently_opened.length - 1];
      }
      return current;
    } else {
      return this.currently_opened;
    }
  }
  add(popup) {
    const popup_id = this.getId(popup);
    this.remove(popup_id);
    this.currently_opened.push(popup_id);
  }
  remove(popup) {
    const popup_id = this.getId(popup);
    var index = this.currently_opened.indexOf(popup_id);
    if (index > -1) {
      this.currently_opened.splice(index, 1);
    }
  }
  zIndex() {
    const zindex = 9999;
    var last = this.current(true);
    if (last) {
      var last = this.find(last);
      if (last) {
        zindex = parseInt(last.style.zIndex);
      }
    }

    return zindex;
  }
  find(popup_id) {
    const popup = this.select('[data-popup-id="' + popup_id + '"]');
    return popup;
  }
  select(selector) {
    return document.querySelector(selector);
  }
  clear() {
    const popupes = document.querySelectorAll('[data-popup-id].opened');
    for (var i = 0; i < popupes.length; i++) {
      this.close(popupes[i]);
    }
    this.currently_opened = [];
    this.select('html').classList.remove('popup_locked');
    this.select('html').removeAttribute('popup');
  }
  close(popup) {
    var popup_id = this.getId(popup);
    var popup = this.getpopup(popup);
    if (popup) {
      this.closing(popup);
      this.remove(popup_id);
      popup.classList.remove('visible');
      popup.style.zIndex = -999;
      if (this.currently_opened.length == 0) {
        this.select('html').classList.remove('popup_locked');
      }
      if (this.current(true)) {
        this.select('html').setAttribute('popup', this.current(true));
      } else {
        this.select('html').removeAttribute('popup');
      }
      this.closed(popup);
    }
  }
  getpopup(popup) {
    if (popup instanceof HTMLElement) {
      return popup;
    } else {
      return this.find(popup);
    }
  }
  getId(popup) {
    if (popup instanceof HTMLElement) {
      return popup.getAttribute('data-popup-id');
    } else {
      return popup;
    }
  }
  open(popup) {
    var popup_id = this.getId(popup);
    var popup = this.getpopup(popup);
    if (popup) {
      this.opening(popup);
      popup.style.zIndex = this.zIndex() + 1;
      popup.classList.add('opened');
      setTimeout(function() {
        popup.classList.add('visible');
      });
      this.select('html').classList.add('popup_locked');
      this.select('html').setAttribute('popup', popup_id);
      this.add(popup_id);
      this.opened(popup);
    }
  }
}

(function() {
  // create popup
  const popup = new Popup({
    blur: true,
    overlay: true,
  });

  const toggles = document.querySelectorAll('.js-consent');
  [...toggles].forEach(toggle => {
    toggle.addEventListener('click', () => {
      popup.open('popup');
    });
  });
})();

const today = (() => {
  const nowDay = new Date();
  const day = nowDay.getDate();
  const month = nowDay.getMonth();
  const fullYear = nowDay.getFullYear();

  return {
    day,
    month,
    fullYear,
  };
})();

function ChekboxAction() {
  const $ch_shance = document.getElementById('shance');
  const $ch_consent = document.getElementById('consent');
  const $ch_error = document.getElementById('checkbox-error');
  const $box_hidden = document.getElementById('box-up');
  const $toggle_up = document.querySelector('.js-toggle-checked');

  const slide = () => {
    let className = $box_hidden.className;
    if (className.indexOf(' expanded') == -1) {
      className += ' expanded';
    } else {
      $ch_shance.checked = true;
      className = className.replace(' expanded', '');
    }
    $box_hidden.className = className;
    return false;
  };

  const showError = () => {
    if ($ch_consent.checked) {
      $ch_error.style.cssText = 'display: none';
    } else {
      $ch_error.style.cssText = 'display: block';
    }
  };

  this.consent = $ch_consent;
  this.shance = $ch_shance;
  this.up = $toggle_up;
  this.error = showError;
  this.slideToggle = slide;
}

const action = new ChekboxAction();

action.shance.addEventListener('click', action.slideToggle, false);
action.up.addEventListener('click', action.slideToggle, false);
action.consent.addEventListener('click', action.error, false);

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

(function() {
  validate.extend(validate.validators.datetime, {
    parse: function(value, options) {
      var strictMode = options.strictMode ? options.strictMode : true;
      return options.format
        ? +moment.utc(value, options.format, strictMode)
        : +moment.utc(value, strictMode);
    },
    format: function(value, options) {
      var format = options.format
        ? options.format
        : options.dateOnly
        ? 'YYYY-MM-DD'
        : 'YYYY-MM-DD hh:mm:ss';
      return moment.utc(value).format(format);
    },
  });

  const form = document.querySelector('#form');
  const inputs = document.querySelectorAll('input, textarea, select');
  const constraints = {
    lastname: {
      presence: { message: '^Напишите свою фамилию' },
      format: {
        pattern: /^(\s*[а-яА-ЯёЁ]+\-?\s*)+$/,
        flags: 'ig',
        message: function(value) {
          if (value) {
            if (validate.isEmpty(value)) {
              return '^Напишите свою фамилию';
            } else if (/^-/.test(value)) {
              return '^Напишите свою фамилию';
            } else {
              return validate.format('^Используйте кириллицу', value);
            }
          }
        },
      },
    },
    username: {
      presence: { message: '^Напишите свое имя' },
      format: {
        pattern: /^(\s*[а-яА-ЯёЁ]+\-?\s*)+$/,
        flags: 'i',
        message: function(value) {
          if (value) {
            if (validate.isEmpty(value)) {
              return '^Напишите свое имя';
            } else if (/^-/.test(value)) {
              return '^Напишите свое имя';
            } else {
              return validate.format('^Используйте кириллицу', value);
            }
          }
        },
      },
    },
    middlename: {
      presence: { message: '^Напишите свое отчество' },
      format: {
        pattern: /^(\s*[а-яА-ЯёЁ]+\-?\s*)+$/,
        flags: 'i',
        message: function(value) {
          if (value) {
            if (validate.isEmpty(value)) {
              return '^Напишите свое отчество';
            } else if (/^-/.test(value)) {
              return '^Напишите свое отчество';
            } else {
              return validate.format('^Используйте кириллицу', value);
            }
          }
        },
      },
    },
    birthdate: {
      presence: { message: '^Введите дату рождения' },
      datetime: {
        format: 'DD.MM.YYYY',
        notValid: '^Некорректная дата',
        latest: moment().subtract(18, 'years'),
        message:
          '^Для использования этой услуги вам должно быть не менее 18 лет',
      },
    },
    email: {
      presence: { message: '^Введите свой email' },
      email: true,
      email: {
        message: '^Некорректный email',
      },
    },
    phone: {
      presence: { message: '^Введите номер телефона' },
      format: {
        pattern: /^((9|8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/,
        flags: 'i',
        message: '^Некорректный номер телефона',
      },
    },
    snils: {
      presence: { message: '^Введите СНИЛС' },
      format: {
        pattern: /^[\d\-]+$/,
        flags: 'ig',
        message: '^Введите корректный номер',
      },
      length: {
        is: 14,
        message: '^Введите корректный номер',
      },
    },
    city: {
      presence: { message: '^Введите город проживания' },
      format: {
        pattern: /^([а-яА-ЯёЁ]+((\s+)?\-?))+/,
        flags: 'ig',
        message: function(value) {
          if (value) {
            if (validate.isEmpty(value)) {
              return '^Введите город проживания';
            } else if (/^-/.test(value)) {
              return '^Введите город проживания';
            } else {
              return validate.format('^Используйте кирилицу', value);
            }
          }
        },
      },
    },
    series: {
      presence: { message: '^Заполните!' },
      format: {
        pattern: /^[\d\s]+$/,
        notValid: '^Ошибка!',
      },
      length: {
        is: 5,
        message: '^Ошибка!',
      },
    },
    numberpass: {
      presence: { message: '^Заполните!' },
      numericality: {
        onlyInteger: true,
        notValid: '^Ошибка!',
      },
      length: {
        is: 6,
        message: '^Ошибка!',
      },
    },
    dateissue: {
      presence: { message: '^Введите дату выдачи паспорта' },
      datetime: {
        format: 'DD.MM.YYYY',
        notValid: '^Некорректная дата',
        message: '^Некорректная дата',
      },
    },
    birthplace: {
      presence: { message: '^Введите место рождения' },
      format: {
        pattern: /^([а-яА-ЯёЁ]+((\s+)?\-?))+/,
        flags: 'ig',
        message: function(value) {
          if (value) {
            if (validate.isEmpty(value)) {
              return '^Введите место рождения';
            } else if (/^-/.test(value)) {
              return '^Введите место рождения';
            } else {
              return validate.format('^Используйте кирилицу', value);
            }
          }
        },
      },
    },
    divisionCode: {
      presence: { message: '^Введите код подразделения' },
      format: {
        pattern: /^[\d\-]+$/,
        flags: 'ig',
        message: '^Некорректный код',
      },
      length: {
        is: 7,
        message: '^Некорректный код',
      },
    },
    issuedby: {
      presence: { message: '^Введите название организации, выдавшей паспорт' },
      format: {
        pattern: /^([а-яА-ЯёЁ]+\s*)+$/,
        flags: 'ig',
        message: function(value) {
          if (value) {
            if (validate.isEmpty(value)) {
              return '^Введите название организации, выдавшей паспорт';
            } else if (/^-/.test(value)) {
              return '^Введите название организации, выдавшей паспорт';
            } else {
              return validate.format('^Используйте кирилицу', value);
            }
          }
        },
      },
    },
    reg_region: {
      presence: { message: '^Введите регион регистрации' },
      format: {
        pattern: /^([а-яА-ЯёЁ]+\s*)+$/,
        flags: 'ig',
        message: function(value) {
          if (value) {
            if (validate.isEmpty(value)) {
              return '^Введите регион регистрации';
            } else if (/^-/.test(value)) {
              return '^Введите регион регистрации';
            } else {
              return validate.format('^Используйте кирилицу', value);
            }
          }
        },
      },
    },
    city_region: {
      presence: { message: '^Введите город регистрации' },
      format: {
        pattern: /^([а-яА-ЯёЁ]+((\s+)?\-?))+/,
        flags: 'ig',
        message: function(value) {
          if (value) {
            if (validate.isEmpty(value)) {
              return '^Введите город регистрации';
            } else if (/^-/.test(value)) {
              return '^Введите город регистрации';
            } else {
              return validate.format('^Используйте кирилицу', value);
            }
          }
        },
      },
    },
    str_region: {
      presence: { message: '^Введите улицу регистрации' },
      format: {
        pattern: /^([а-яА-ЯёЁ(\,|\.|\-)?]+\s*)+$/,
        flags: 'ig',
        message: function(value) {
          if (value) {
            if (validate.isEmpty(value)) {
              return '^Введите улицу регистрации';
            } else if (/^-/.test(value)) {
              return '^Введите улицу регистрации';
            } else {
              return validate.format('^Используйте кирилицу', value);
            }
          }
        },
      },
    },
    building: {
      presence: { message: '^Заполните!' },
      format: {
        pattern: /^([а-яА-ЯёЁ0-9\.\-\:\,]+\s*)+$/,
        flags: 'ig',
        message: function(value) {
          if (value) {
            if (validate.isEmpty(value)) {
              return '^Заполните!';
            } else if (/^-/.test(value)) {
              return '^Заполните!';
            } else {
              return validate.format('^Используйте кирилицу', value);
            }
          }
        },
      },
    },
  };
  const success = `<div class="success-msg">
    <span class="success-msg__title">✓</span>
    <span class="success-msg__cnt">Заявка отправлена.</span>
    <span class="success-msg__replay">Ждите ответа от МФО.</span>
  </div>`;
  const proposal = document.getElementById('proposal');
  const consent = document.getElementById('consent');

  [...inputs].forEach(input => {
    input.addEventListener('focus', function() {
      this.classList.add('has-input');
    });
    input.addEventListener('blur', function() {
      this.classList.remove('has-input');
    });
  });

  form.addEventListener('submit', ev => {
    ev.preventDefault();
    handleFormSubmit(form);
  });

  [...inputs].forEach(input => {
    input.addEventListener('change', function(ev) {
      var errors = validate(form, constraints) || {};
      showErrorsForInput(this, errors[this.name]);
    });
  });

  function handleFormSubmit(form, input) {
    var errors = validate(form, constraints);
    showErrors(form, errors || {});
    if (!errors) {
      showSuccess();
    }
  }

  function showErrors(form, errors) {
    const inputs = form.querySelectorAll('input[name], select[name]');

    [].slice.call(inputs).forEach(input => {
      showErrorsForInput(input, errors && errors[input.name]);
    });
  }

  function showErrorsForInput(input, errors) {
    const formGroup = closestParent(input.parentNode, 'form__container');
    const hint = formGroup.querySelector('.form__hint');
    const messages = formGroup.querySelector('.form__messages');
    resetFormGroup(formGroup, hint);

    if (errors) {
      if (hint) {
        hint.style.display = 'none';
      }

      formGroup.classList.add('has-error');
      errors.forEach(error => addError(messages, error));
    } else {
      formGroup.classList.add('has-success');
    }
  }

  function closestParent(child, className) {
    if (!child || child == document) {
      return null;
    }
    if (child.classList.contains(className)) {
      return child;
    } else {
      return closestParent(child.parentNode, className);
    }
  }

  function resetFormGroup(formGroup, hint) {
    if (hint) {
      hint.style.display = 'block';
    }
    formGroup.classList.remove('has-error');
    formGroup.classList.remove('has-success');

    const blockError = formGroup.querySelectorAll('.help-block.error');
    blockError.forEach(el => el.parentNode.removeChild(el));
  }

  function addError(messages, error) {
    var block = document.createElement('span');
    block.classList.add('help-block');
    block.classList.add('error');
    block.innerText = error;
    messages.appendChild(block);
  }

  function showSuccess() {
    if (consent.checked) {
      proposal.innerHTML = success;
    } else {
      return false;
    }
  }
})();

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
