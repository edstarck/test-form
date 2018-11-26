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
