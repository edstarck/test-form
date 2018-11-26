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
    proposal.innerHTML = success;
  }
})();
