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
