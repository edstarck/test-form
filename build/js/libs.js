//! moment.js

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () { 'use strict';

    var hookCallback;

    function hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
    }

    function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return input != null && Object.prototype.toString.call(input) === '[object Object]';
    }

    function isObjectEmpty(obj) {
        if (Object.getOwnPropertyNames) {
            return (Object.getOwnPropertyNames(obj).length === 0);
        } else {
            var k;
            for (k in obj) {
                if (obj.hasOwnProperty(k)) {
                    return false;
                }
            }
            return true;
        }
    }

    function isUndefined(input) {
        return input === void 0;
    }

    function isNumber(input) {
        return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false,
            parsedDateParts : [],
            meridiem        : null,
            rfc2822         : false,
            weekdayMismatch : false
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this);
            var len = t.length >>> 0;

            for (var i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            var parsedParts = some.call(flags.parsedDateParts, function (i) {
                return i != null;
            });
            var isNowValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.weekdayMismatch &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated &&
                (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                isNowValid = isNowValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }

            if (Object.isFrozen == null || !Object.isFrozen(m)) {
                m._isValid = isNowValid;
            }
            else {
                return isNowValid;
            }
        }
        return m._isValid;
    }

    function createInvalid (flags) {
        var m = createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i = 0; i < momentProperties.length; i++) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        if (!this.isValid()) {
            this._d = new Date(NaN);
        }
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function warn(msg) {
        if (hooks.suppressDeprecationWarnings === false &&
                (typeof console !==  'undefined') && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (hooks.deprecationHandler != null) {
                hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                var args = [];
                var arg;
                for (var i = 0; i < arguments.length; i++) {
                    arg = '';
                    if (typeof arguments[i] === 'object') {
                        arg += '\n[' + i + '] ';
                        for (var key in arguments[0]) {
                            arg += key + ': ' + arguments[0][key] + ', ';
                        }
                        arg = arg.slice(0, -2); // Remove trailing comma and space
                    } else {
                        arg = arguments[i];
                    }
                    args.push(arg);
                }
                warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    hooks.suppressDeprecationWarnings = false;
    hooks.deprecationHandler = null;

    function isFunction(input) {
        return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
    }

    function set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (isFunction(prop)) {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
        // TODO: Remove "ordinalParse" fallback in next major release.
        this._dayOfMonthOrdinalParseLenient = new RegExp(
            (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
                '|' + (/\d{1,2}/).source);
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig), prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (hasOwnProp(parentConfig, prop) &&
                    !hasOwnProp(childConfig, prop) &&
                    isObject(parentConfig[prop])) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i, res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function calendar (key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        ss : '%d seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (isFunction(output)) ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [];
        for (var u in unitsObj) {
            units.push({unit: u, priority: priorities[u]});
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '', i;
            for (i = 0; i < length; i++) {
                output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match3to4      = /\d\d\d\d?/;     //     999 - 9999
    var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
    var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    // includes scottish gaelic two word and hyphenated months
    var matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i;

    var regexes = {};

    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }));
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (isNumber(callback)) {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;
    var WEEK = 7;
    var WEEKDAY = 8;

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? '' + y : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                set$1(this, unit, value);
                hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get(this, unit);
            }
        };
    }

    function get (mom, unit) {
        return mom.isValid() ?
            mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
    }

    function set$1 (mom, unit, value) {
        if (mom.isValid() && !isNaN(value)) {
            if (unit === 'FullYear' && isLeapYear(mom.year()) && mom.month() === 1 && mom.date() === 29) {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value, mom.month(), daysInMonth(value, mom.month()));
            }
            else {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
            }
        }
    }

    // MOMENTS

    function stringGet (units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }


    function stringSet (units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units);
            for (var i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    function mod(n, x) {
        return ((n % x) + x) % x;
    }

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        if (isNaN(year) || isNaN(month)) {
            return NaN;
        }
        var modMonth = mod(month, 12);
        year += (month - modMonth) / 12;
        return modMonth === 1 ? (isLeapYear(year) ? 29 : 28) : (31 - modMonth % 7 % 2);
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m, format) {
        if (!m) {
            return isArray(this._months) ? this._months :
                this._months['standalone'];
        }
        return isArray(this._months) ? this._months[m.month()] :
            this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m, format) {
        if (!m) {
            return isArray(this._monthsShort) ? this._monthsShort :
                this._monthsShort['standalone'];
        }
        return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
            this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    function handleStrictParse(monthName, format, strict) {
        var i, ii, mom, llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (!isNumber(value)) {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            hooks.updateOffset(this, true);
            return this;
        } else {
            return get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    var defaultMonthsShortRegex = matchWord;
    function monthsShortRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict ?
                this._monthsShortStrictRegex : this._monthsShortRegex;
        }
    }

    var defaultMonthsRegex = matchWord;
    function monthsRegex (isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict ?
                this._monthsStrictRegex : this._monthsRegex;
        }
    }

    function computeMonthsParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    }

    function createDate (y, m, d, h, M, s, ms) {
        // can't just apply() to create a date:
        // https://stackoverflow.com/q/181348
        var date = new Date(y, m, d, h, M, s, ms);

        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
            date.setFullYear(y);
        }
        return date;
    }

    function createUTCDate (y) {
        var date = new Date(Date.UTC.apply(null, arguments));

        // the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear, resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek, resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd',   function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd',   function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m, format) {
        if (!m) {
            return isArray(this._weekdays) ? this._weekdays :
                this._weekdays['standalone'];
        }
        return isArray(this._weekdays) ? this._weekdays[m.day()] :
            this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
    }

    function handleStrictParse$1(weekdayName, format, strict) {
        var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse (weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return handleStrictParse$1.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\\.?') + '$', 'i');
                this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$', 'i');
                this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$', 'i');
            }
            if (!this._weekdaysParse[i]) {
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    var defaultWeekdaysRegex = matchWord;
    function weekdaysRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict ?
                this._weekdaysStrictRegex : this._weekdaysRegex;
        }
    }

    var defaultWeekdaysShortRegex = matchWord;
    function weekdaysShortRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict ?
                this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
        }
    }

    var defaultWeekdaysMinRegex = matchWord;
    function weekdaysMinRegex (isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict ?
                this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
        }
    }


    function computeWeekdaysParse () {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom, minp, shortp, longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, 1]).day(i);
            minp = this.weekdaysMin(mom, '');
            shortp = this.weekdaysShort(mom, '');
            longp = this.weekdays(mom, '');
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 7; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
        this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('k',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);
    addRegexToken('kk', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['k', 'kk'], function (input, array, config) {
        var kInput = toInt(input);
        array[HOUR] = kInput === 24 ? 0 : kInput;
    });
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour they want. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse
    };

    // internal storage for locale config files
    var locales = {};
    var localeFamilies = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return globalLocale;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && (typeof module !== 'undefined') &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                var aliasedRequire = require;
                aliasedRequire('./locale/' + name);
                getSetGlobalLocale(oldLocale);
            } catch (e) {}
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
            else {
                if ((typeof console !==  'undefined') && console.warn) {
                    //warn user if arguments are passed but the locale could not be set
                    console.warn('Locale ' + key +  ' not found. Did you forget to load it?');
                }
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, config) {
        if (config !== null) {
            var locale, parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple('defineLocaleOverride',
                        'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    locale = loadLocale(config.parentLocale);
                    if (locale != null) {
                        parentConfig = locale._config;
                    } else {
                        if (!localeFamilies[config.parentLocale]) {
                            localeFamilies[config.parentLocale] = [];
                        }
                        localeFamilies[config.parentLocale].push({
                            name: name,
                            config: config
                        });
                        return null;
                    }
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            if (localeFamilies[name]) {
                localeFamilies[name].forEach(function (x) {
                    defineLocale(x.name, x.config);
                });
            }

            // backwards compat for now: also set the locale
            // make sure we set the locale AFTER all child locales have been
            // created, so we won't end up with the child locale set.
            getSetGlobalLocale(name);


            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale, tmpLocale, parentConfig = baseConfig;
            // MERGE
            tmpLocale = loadLocale(name);
            if (tmpLocale != null) {
                parentConfig = tmpLocale._config;
            }
            config = mergeConfigs(parentConfig, config);
            locale = new Locale(config);
            locale.parentLocale = locales[name];
            locales[name] = locale;

            // backwards compat for now: also set the locale
            getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function listLocales() {
        return keys(locales);
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(hooks.now());
        if (config._useUTC) {
            return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, expectedWeekday, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear != null) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay();

        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }

        // check for mismatching day of week
        if (config._w && typeof config._w.d !== 'undefined' && config._w.d !== expectedWeekday) {
            getParsingFlags(config).weekdayMismatch = true;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            var curWeek = weekOfYear(createLocal(), dow, doy);

            weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

            // Default to current week.
            week = defaults(w.w, curWeek.week);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
    var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

    var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
        ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
        ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
        ['YYYY-DDD', /\d{4}-\d{3}/],
        ['YYYY-MM', /\d{4}-\d\d/, false],
        ['YYYYYYMMDD', /[+-]\d{10}/],
        ['YYYYMMDD', /\d{8}/],
        // YYYYMM is NOT allowed by the standard
        ['GGGG[W]WWE', /\d{4}W\d{3}/],
        ['GGGG[W]WW', /\d{4}W\d{2}/, false],
        ['YYYYDDD', /\d{7}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
        ['HH:mm:ss', /\d\d:\d\d:\d\d/],
        ['HH:mm', /\d\d:\d\d/],
        ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
        ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
        ['HHmmss', /\d\d\d\d\d\d/],
        ['HHmm', /\d\d\d\d/],
        ['HH', /\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime, dateFormat, timeFormat, tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
    var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;

    function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
        var result = [
            untruncateYear(yearStr),
            defaultLocaleMonthsShort.indexOf(monthStr),
            parseInt(dayStr, 10),
            parseInt(hourStr, 10),
            parseInt(minuteStr, 10)
        ];

        if (secondStr) {
            result.push(parseInt(secondStr, 10));
        }

        return result;
    }

    function untruncateYear(yearStr) {
        var year = parseInt(yearStr, 10);
        if (year <= 49) {
            return 2000 + year;
        } else if (year <= 999) {
            return 1900 + year;
        }
        return year;
    }

    function preprocessRFC2822(s) {
        // Remove comments and folding whitespace and replace multiple-spaces with a single space
        return s.replace(/\([^)]*\)|[\n\t]/g, ' ').replace(/(\s\s+)/g, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }

    function checkWeekday(weekdayStr, parsedInput, config) {
        if (weekdayStr) {
            // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
            var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
                weekdayActual = new Date(parsedInput[0], parsedInput[1], parsedInput[2]).getDay();
            if (weekdayProvided !== weekdayActual) {
                getParsingFlags(config).weekdayMismatch = true;
                config._isValid = false;
                return false;
            }
        }
        return true;
    }

    var obsOffsets = {
        UT: 0,
        GMT: 0,
        EDT: -4 * 60,
        EST: -5 * 60,
        CDT: -5 * 60,
        CST: -6 * 60,
        MDT: -6 * 60,
        MST: -7 * 60,
        PDT: -7 * 60,
        PST: -8 * 60
    };

    function calculateOffset(obsOffset, militaryOffset, numOffset) {
        if (obsOffset) {
            return obsOffsets[obsOffset];
        } else if (militaryOffset) {
            // the only allowed military tz is Z
            return 0;
        } else {
            var hm = parseInt(numOffset, 10);
            var m = hm % 100, h = (hm - m) / 100;
            return h * 60 + m;
        }
    }

    // date and time from ref 2822 format
    function configFromRFC2822(config) {
        var match = rfc2822.exec(preprocessRFC2822(config._i));
        if (match) {
            var parsedArray = extractFromRFC2822Strings(match[4], match[3], match[2], match[5], match[6], match[7]);
            if (!checkWeekday(match[1], parsedArray, config)) {
                return;
            }

            config._a = parsedArray;
            config._tzm = calculateOffset(match[8], match[9], match[10]);

            config._d = createUTCDate.apply(null, config._a);
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

            getParsingFlags(config).rfc2822 = true;
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        configFromRFC2822(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        // Final attempt, use Input Fallback
        hooks.createFromInputFallback(config);
    }

    hooks.createFromInputFallback = deprecate(
        'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
        'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
        'discouraged and will be removed in an upcoming major release. Please refer to ' +
        'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // constant that refers to the ISO standard
    hooks.ISO_8601 = function () {};

    // constant that refers to the RFC 2822 form
    hooks.RFC_2822 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === hooks.ISO_8601) {
            configFromISO(config);
            return;
        }
        if (config._f === hooks.RFC_2822) {
            configFromRFC2822(config);
            return;
        }
        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            // console.log('token', token, 'parsedInput', parsedInput,
            //         'regex', getParseRegexForToken(token, config));
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
            return obj && parseInt(obj, 10);
        });

        configFromArray(config);
    }

    function createFromConfig (config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig (config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isDate(input)) {
            config._d = input;
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        }  else {
            configFromInput(config);
        }

        if (!isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (isUndefined(input)) {
            config._d = new Date(hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (isObject(input)) {
            configFromObject(config);
        } else if (isNumber(input)) {
            // from milliseconds
            config._d = new Date(input);
        } else {
            hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (locale === true || locale === false) {
            strict = locale;
            locale = undefined;
        }

        if ((isObject(input) && isObjectEmpty(input)) ||
                (isArray(input) && input.length === 0)) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
        'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other < this ? this : other;
            } else {
                return createInvalid();
            }
        }
    );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other > this ? this : other;
            } else {
                return createInvalid();
            }
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +(new Date());
    };

    var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

    function isDurationValid(m) {
        for (var key in m) {
            if (!(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
                return false;
            }
        }

        var unitHasDecimal = false;
        for (var i = 0; i < ordering.length; ++i) {
            if (m[ordering[i]]) {
                if (unitHasDecimal) {
                    return false; // only allow non-integers for smallest unit
                }
                if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                    unitHasDecimal = true;
                }
            }
        }

        return true;
    }

    function isValid$1() {
        return this._isValid;
    }

    function createInvalid$1() {
        return createDuration(NaN);
    }

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        this._isValid = isDurationValid(normalizedInput);

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible to translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    function absRound (number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // FORMATTING

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = (string || '').match(matcher);

        if (matches === null) {
            return null;
        }

        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return minutes === 0 ?
          0 :
          parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            hooks.updateOffset(res, false);
            return res;
        } else {
            return createLocal(input).local();
        }
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime, keepMinutes) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
                if (input === null) {
                    return this;
                }
            } else if (Math.abs(input) < 16 && !keepMinutes) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    addSubtract(this, createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm != null) {
            this.utcOffset(this._tzm, false, true);
        } else if (typeof this._i === 'string') {
            var tZone = offsetFromString(matchOffset, this._i);
            if (tZone != null) {
                this.utcOffset(tZone);
            }
            else {
                this.utcOffset(0, true);
            }
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal () {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset () {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc () {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    // and further modified to allow for strings containing both week and day
    var isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

    function createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (isNumber(input)) {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])                         * sign,
                h  : toInt(match[HOUR])                         * sign,
                m  : toInt(match[MINUTE])                       * sign,
                s  : toInt(match[SECOND])                       * sign,
                ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
            };
        } else if (!!(match = isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : (match[1] === '+') ? 1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                w : parseIso(match[4], sign),
                d : parseIso(match[5], sign),
                h : parseIso(match[6], sign),
                m : parseIso(match[7], sign),
                s : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    createDuration.fn = Duration.prototype;
    createDuration.invalid = createInvalid$1;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return {milliseconds: 0, months: 0};
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
                'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = createDuration(val, period);
            addSubtract(this, dur, direction);
            return this;
        };
    }

    function addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (months) {
            setMonth(mom, get(mom, 'Month') + months * isAdding);
        }
        if (days) {
            set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
        }
        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (updateOffset) {
            hooks.updateOffset(mom, days || months);
        }
    }

    var add      = createAdder(1, 'add');
    var subtract = createAdder(-1, 'subtract');

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
    }

    function calendar$1 (time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = hooks.calendarFormat(this, sod) || 'sameElse';

        var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

        return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore (input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween (from, to, units, inclusivity) {
        inclusivity = inclusivity || '()';
        return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
            (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
    }

    function isSame (input, units) {
        var localInput = isMoment(input) ? input : createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
        }
    }

    function isSameOrAfter (input, units) {
        return this.isSame(input, units) || this.isAfter(input,units);
    }

    function isSameOrBefore (input, units) {
        return this.isSame(input, units) || this.isBefore(input,units);
    }

    function diff (input, units, asFloat) {
        var that,
            zoneDelta,
            output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        switch (units) {
            case 'year': output = monthDiff(this, that) / 12; break;
            case 'month': output = monthDiff(this, that); break;
            case 'quarter': output = monthDiff(this, that) / 3; break;
            case 'second': output = (this - that) / 1e3; break; // 1000
            case 'minute': output = (this - that) / 6e4; break; // 1000 * 60
            case 'hour': output = (this - that) / 36e5; break; // 1000 * 60 * 60
            case 'day': output = (this - that - zoneDelta) / 864e5; break; // 1000 * 60 * 60 * 24, negate dst
            case 'week': output = (this - that - zoneDelta) / 6048e5; break; // 1000 * 60 * 60 * 24 * 7, negate dst
            default: output = this - that;
        }

        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function toISOString(keepOffset) {
        if (!this.isValid()) {
            return null;
        }
        var utc = keepOffset !== true;
        var m = utc ? this.clone().utc() : this;
        if (m.year() < 0 || m.year() > 9999) {
            return formatMoment(m, utc ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ');
        }
        if (isFunction(Date.prototype.toISOString)) {
            // native implementation is ~50x faster, use it when we can
            if (utc) {
                return this.toDate().toISOString();
            } else {
                return new Date(this.valueOf() + this.utcOffset() * 60 * 1000).toISOString().replace('Z', formatMoment(m, 'Z'));
            }
        }
        return formatMoment(m, utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ');
    }

    /**
     * Return a human readable representation of a moment that can
     * also be evaluated to get a new moment which is the same
     *
     * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
     */
    function inspect () {
        if (!this.isValid()) {
            return 'moment.invalid(/* ' + this._i + ' */)';
        }
        var func = 'moment';
        var zone = '';
        if (!this.isLocal()) {
            func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
            zone = 'Z';
        }
        var prefix = '[' + func + '("]';
        var year = (0 <= this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
        var datetime = '-MM-DD[T]HH:mm:ss.SSS';
        var suffix = zone + '[")]';

        return this.format(prefix + year + datetime + suffix);
    }

    function format (inputString) {
        if (!inputString) {
            inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 createLocal(time).isValid())) {
            return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow (withoutSuffix) {
        return this.from(createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 createLocal(time).isValid())) {
            return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow (withoutSuffix) {
        return this.to(createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    function startOf (units) {
        units = normalizeUnits(units);
        // the following switch intentionally omits break keywords
        // to utilize falling through the cases.
        switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
            case 'date':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
        }

        // weeks are a special case
        if (units === 'week') {
            this.weekday(0);
        }
        if (units === 'isoWeek') {
            this.isoWeekday(1);
        }

        // quarters are also special
        if (units === 'quarter') {
            this.month(Math.floor(this.month() / 3) * 3);
        }

        return this;
    }

    function endOf (units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
            return this;
        }

        // 'date' is an alias for 'day', so it should be considered as such.
        if (units === 'date') {
            units = 'day';
        }

        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function valueOf () {
        return this._d.valueOf() - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate () {
        return new Date(this.valueOf());
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function toJSON () {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function isValid$2 () {
        return isValid(this);
    }

    function parsingFlags () {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict
        };
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);


    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input,
                this.week(),
                this.weekday(),
                this.localeData()._week.dow,
                this.localeData()._week.doy);
    }

    function getSetISOWeekYear (input) {
        return getSetWeekYearHelper.call(this,
                input, this.isoWeek(), this.isoWeekday(), 1, 4);
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIORITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        // TODO: Remove "ordinalParse" fallback in next major release.
        return isStrict ?
          (locale._dayOfMonthOrdinalParse || locale._ordinalParse) :
          locale._dayOfMonthOrdinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0]);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var proto = Moment.prototype;

    proto.add               = add;
    proto.calendar          = calendar$1;
    proto.clone             = clone;
    proto.diff              = diff;
    proto.endOf             = endOf;
    proto.format            = format;
    proto.from              = from;
    proto.fromNow           = fromNow;
    proto.to                = to;
    proto.toNow             = toNow;
    proto.get               = stringGet;
    proto.invalidAt         = invalidAt;
    proto.isAfter           = isAfter;
    proto.isBefore          = isBefore;
    proto.isBetween         = isBetween;
    proto.isSame            = isSame;
    proto.isSameOrAfter     = isSameOrAfter;
    proto.isSameOrBefore    = isSameOrBefore;
    proto.isValid           = isValid$2;
    proto.lang              = lang;
    proto.locale            = locale;
    proto.localeData        = localeData;
    proto.max               = prototypeMax;
    proto.min               = prototypeMin;
    proto.parsingFlags      = parsingFlags;
    proto.set               = stringSet;
    proto.startOf           = startOf;
    proto.subtract          = subtract;
    proto.toArray           = toArray;
    proto.toObject          = toObject;
    proto.toDate            = toDate;
    proto.toISOString       = toISOString;
    proto.inspect           = inspect;
    proto.toJSON            = toJSON;
    proto.toString          = toString;
    proto.unix              = unix;
    proto.valueOf           = valueOf;
    proto.creationData      = creationData;
    proto.year       = getSetYear;
    proto.isLeapYear = getIsLeapYear;
    proto.weekYear    = getSetWeekYear;
    proto.isoWeekYear = getSetISOWeekYear;
    proto.quarter = proto.quarters = getSetQuarter;
    proto.month       = getSetMonth;
    proto.daysInMonth = getDaysInMonth;
    proto.week           = proto.weeks        = getSetWeek;
    proto.isoWeek        = proto.isoWeeks     = getSetISOWeek;
    proto.weeksInYear    = getWeeksInYear;
    proto.isoWeeksInYear = getISOWeeksInYear;
    proto.date       = getSetDayOfMonth;
    proto.day        = proto.days             = getSetDayOfWeek;
    proto.weekday    = getSetLocaleDayOfWeek;
    proto.isoWeekday = getSetISODayOfWeek;
    proto.dayOfYear  = getSetDayOfYear;
    proto.hour = proto.hours = getSetHour;
    proto.minute = proto.minutes = getSetMinute;
    proto.second = proto.seconds = getSetSecond;
    proto.millisecond = proto.milliseconds = getSetMillisecond;
    proto.utcOffset            = getSetOffset;
    proto.utc                  = setOffsetToUTC;
    proto.local                = setOffsetToLocal;
    proto.parseZone            = setOffsetToParsedOffset;
    proto.hasAlignedHourOffset = hasAlignedHourOffset;
    proto.isDST                = isDaylightSavingTime;
    proto.isLocal              = isLocal;
    proto.isUtcOffset          = isUtcOffset;
    proto.isUtc                = isUtc;
    proto.isUTC                = isUtc;
    proto.zoneAbbr = getZoneAbbr;
    proto.zoneName = getZoneName;
    proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
    proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

    function createUnix (input) {
        return createLocal(input * 1000);
    }

    function createInZone () {
        return createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat (string) {
        return string;
    }

    var proto$1 = Locale.prototype;

    proto$1.calendar        = calendar;
    proto$1.longDateFormat  = longDateFormat;
    proto$1.invalidDate     = invalidDate;
    proto$1.ordinal         = ordinal;
    proto$1.preparse        = preParsePostFormat;
    proto$1.postformat      = preParsePostFormat;
    proto$1.relativeTime    = relativeTime;
    proto$1.pastFuture      = pastFuture;
    proto$1.set             = set;

    proto$1.months            =        localeMonths;
    proto$1.monthsShort       =        localeMonthsShort;
    proto$1.monthsParse       =        localeMonthsParse;
    proto$1.monthsRegex       = monthsRegex;
    proto$1.monthsShortRegex  = monthsShortRegex;
    proto$1.week = localeWeek;
    proto$1.firstDayOfYear = localeFirstDayOfYear;
    proto$1.firstDayOfWeek = localeFirstDayOfWeek;

    proto$1.weekdays       =        localeWeekdays;
    proto$1.weekdaysMin    =        localeWeekdaysMin;
    proto$1.weekdaysShort  =        localeWeekdaysShort;
    proto$1.weekdaysParse  =        localeWeekdaysParse;

    proto$1.weekdaysRegex       =        weekdaysRegex;
    proto$1.weekdaysShortRegex  =        weekdaysShortRegex;
    proto$1.weekdaysMinRegex    =        weekdaysMinRegex;

    proto$1.isPM = localeIsPM;
    proto$1.meridiem = localeMeridiem;

    function get$1 (format, index, field, setter) {
        var locale = getLocale();
        var utc = createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl (format, index, field) {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return get$1(format, index, field, 'month');
        }

        var i;
        var out = [];
        for (i = 0; i < 12; i++) {
            out[i] = get$1(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl (localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = getLocale(),
            shift = localeSorted ? locale._week.dow : 0;

        if (index != null) {
            return get$1(format, (index + shift) % 7, field, 'day');
        }

        var i;
        var out = [];
        for (i = 0; i < 7; i++) {
            out[i] = get$1(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function listMonths (format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function listMonthsShort (format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function listWeekdays (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function listWeekdaysShort (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function listWeekdaysMin (localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    getSetGlobalLocale('en', {
        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports

    hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
    hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

    var mathAbs = Math.abs;

    function abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function addSubtract$1 (duration, input, value, direction) {
        var other = createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function add$1 (input, value) {
        return addSubtract$1(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function subtract$1 (input, value) {
        return addSubtract$1(this, input, value, -1);
    }

    function absCeil (number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToMonths (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays (months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as (units) {
        if (!this.isValid()) {
            return NaN;
        }
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'year') {
            days   = this._days   + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            return units === 'month' ? months : months / 12;
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week'   : return days / 7     + milliseconds / 6048e5;
                case 'day'    : return days         + milliseconds / 864e5;
                case 'hour'   : return days * 24    + milliseconds / 36e5;
                case 'minute' : return days * 1440  + milliseconds / 6e4;
                case 'second' : return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function valueOf$1 () {
        if (!this.isValid()) {
            return NaN;
        }
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asYears        = makeAs('y');

    function clone$1 () {
        return createDuration(this);
    }

    function get$2 (units) {
        units = normalizeUnits(units);
        return this.isValid() ? this[units + 's']() : NaN;
    }

    function makeGetter(name) {
        return function () {
            return this.isValid() ? this._data[name] : NaN;
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        ss: 44,         // a few seconds to seconds
        s : 45,         // seconds to minute
        m : 45,         // minutes to hour
        h : 22,         // hours to day
        d : 26,         // days to month
        M : 11          // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
        var duration = createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds <= thresholds.ss && ['s', seconds]  ||
                seconds < thresholds.s   && ['ss', seconds] ||
                minutes <= 1             && ['m']           ||
                minutes < thresholds.m   && ['mm', minutes] ||
                hours   <= 1             && ['h']           ||
                hours   < thresholds.h   && ['hh', hours]   ||
                days    <= 1             && ['d']           ||
                days    < thresholds.d   && ['dd', days]    ||
                months  <= 1             && ['M']           ||
                months  < thresholds.M   && ['MM', months]  ||
                years   <= 1             && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function getSetRelativeTimeRounding (roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof(roundingFunction) === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        if (threshold === 's') {
            thresholds.ss = limit - 1;
        }
        return true;
    }

    function humanize (withSuffix) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var locale = this.localeData();
        var output = relativeTime$1(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var abs$1 = Math.abs;

    function sign(x) {
        return ((x > 0) - (x < 0)) || +x;
    }

    function toISOString$1() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var seconds = abs$1(this._milliseconds) / 1000;
        var days         = abs$1(this._days);
        var months       = abs$1(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes           = absFloor(seconds / 60);
        hours             = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years  = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        var totalSign = total < 0 ? '-' : '';
        var ymSign = sign(this._months) !== sign(total) ? '-' : '';
        var daysSign = sign(this._days) !== sign(total) ? '-' : '';
        var hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

        return totalSign + 'P' +
            (Y ? ymSign + Y + 'Y' : '') +
            (M ? ymSign + M + 'M' : '') +
            (D ? daysSign + D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? hmsSign + h + 'H' : '') +
            (m ? hmsSign + m + 'M' : '') +
            (s ? hmsSign + s + 'S' : '');
    }

    var proto$2 = Duration.prototype;

    proto$2.isValid        = isValid$1;
    proto$2.abs            = abs;
    proto$2.add            = add$1;
    proto$2.subtract       = subtract$1;
    proto$2.as             = as;
    proto$2.asMilliseconds = asMilliseconds;
    proto$2.asSeconds      = asSeconds;
    proto$2.asMinutes      = asMinutes;
    proto$2.asHours        = asHours;
    proto$2.asDays         = asDays;
    proto$2.asWeeks        = asWeeks;
    proto$2.asMonths       = asMonths;
    proto$2.asYears        = asYears;
    proto$2.valueOf        = valueOf$1;
    proto$2._bubble        = bubble;
    proto$2.clone          = clone$1;
    proto$2.get            = get$2;
    proto$2.milliseconds   = milliseconds;
    proto$2.seconds        = seconds;
    proto$2.minutes        = minutes;
    proto$2.hours          = hours;
    proto$2.days           = days;
    proto$2.weeks          = weeks;
    proto$2.months         = months;
    proto$2.years          = years;
    proto$2.humanize       = humanize;
    proto$2.toISOString    = toISOString$1;
    proto$2.toString       = toISOString$1;
    proto$2.toJSON         = toISOString$1;
    proto$2.locale         = locale;
    proto$2.localeData     = localeData;

    proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
    proto$2.lang = lang;

    // Side effect imports

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    hooks.version = '2.22.2';

    setHookCallback(createLocal);

    hooks.fn                    = proto;
    hooks.min                   = min;
    hooks.max                   = max;
    hooks.now                   = now;
    hooks.utc                   = createUTC;
    hooks.unix                  = createUnix;
    hooks.months                = listMonths;
    hooks.isDate                = isDate;
    hooks.locale                = getSetGlobalLocale;
    hooks.invalid               = createInvalid;
    hooks.duration              = createDuration;
    hooks.isMoment              = isMoment;
    hooks.weekdays              = listWeekdays;
    hooks.parseZone             = createInZone;
    hooks.localeData            = getLocale;
    hooks.isDuration            = isDuration;
    hooks.monthsShort           = listMonthsShort;
    hooks.weekdaysMin           = listWeekdaysMin;
    hooks.defineLocale          = defineLocale;
    hooks.updateLocale          = updateLocale;
    hooks.locales               = listLocales;
    hooks.weekdaysShort         = listWeekdaysShort;
    hooks.normalizeUnits        = normalizeUnits;
    hooks.relativeTimeRounding  = getSetRelativeTimeRounding;
    hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
    hooks.calendarFormat        = getCalendarFormat;
    hooks.prototype             = proto;

    // currently HTML5 input type only supports 24-hour formats
    hooks.HTML5_FMT = {
        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm',             // <input type="datetime-local" />
        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss',  // <input type="datetime-local" step="1" />
        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS',   // <input type="datetime-local" step="0.001" />
        DATE: 'YYYY-MM-DD',                             // <input type="date" />
        TIME: 'HH:mm',                                  // <input type="time" />
        TIME_SECONDS: 'HH:mm:ss',                       // <input type="time" step="1" />
        TIME_MS: 'HH:mm:ss.SSS',                        // <input type="time" step="0.001" />
        WEEK: 'YYYY-[W]WW',                             // <input type="week" />
        MONTH: 'YYYY-MM'                                // <input type="month" />
    };

    return hooks;

})));
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.IMask = factory());
}(this, (function () { 'use strict';

  // 7.2.1 RequireObjectCoercible(argument)
  var _defined = function (it) {
    if (it == undefined) throw TypeError("Can't call method on  " + it);
    return it;
  };

  // 7.1.13 ToObject(argument)

  var _toObject = function (it) {
    return Object(_defined(it));
  };

  var hasOwnProperty = {}.hasOwnProperty;
  var _has = function (it, key) {
    return hasOwnProperty.call(it, key);
  };

  var toString = {}.toString;

  var _cof = function (it) {
    return toString.call(it).slice(8, -1);
  };

  // fallback for non-array-like ES3 and non-enumerable old V8 strings

  // eslint-disable-next-line no-prototype-builtins
  var _iobject = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
    return _cof(it) == 'String' ? it.split('') : Object(it);
  };

  // to indexed object, toObject with fallback for non-array-like ES3 strings


  var _toIobject = function (it) {
    return _iobject(_defined(it));
  };

  // 7.1.4 ToInteger
  var ceil = Math.ceil;
  var floor = Math.floor;
  var _toInteger = function (it) {
    return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
  };

  // 7.1.15 ToLength

  var min = Math.min;
  var _toLength = function (it) {
    return it > 0 ? min(_toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
  };

  var max = Math.max;
  var min$1 = Math.min;
  var _toAbsoluteIndex = function (index, length) {
    index = _toInteger(index);
    return index < 0 ? max(index + length, 0) : min$1(index, length);
  };

  // false -> Array#indexOf
  // true  -> Array#includes



  var _arrayIncludes = function (IS_INCLUDES) {
    return function ($this, el, fromIndex) {
      var O = _toIobject($this);
      var length = _toLength(O.length);
      var index = _toAbsoluteIndex(fromIndex, length);
      var value;
      // Array#includes uses SameValueZero equality algorithm
      // eslint-disable-next-line no-self-compare
      if (IS_INCLUDES && el != el) while (length > index) {
        value = O[index++];
        // eslint-disable-next-line no-self-compare
        if (value != value) return true;
      // Array#indexOf ignores holes, Array#includes - not
      } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
        if (O[index] === el) return IS_INCLUDES || index || 0;
      } return !IS_INCLUDES && -1;
    };
  };

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var _global = createCommonjsModule(function (module) {
  // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
  var global = module.exports = typeof window != 'undefined' && window.Math == Math
    ? window : typeof self != 'undefined' && self.Math == Math ? self
    // eslint-disable-next-line no-new-func
    : Function('return this')();
  if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef
  });

  var SHARED = '__core-js_shared__';
  var store = _global[SHARED] || (_global[SHARED] = {});
  var _shared = function (key) {
    return store[key] || (store[key] = {});
  };

  var id = 0;
  var px = Math.random();
  var _uid = function (key) {
    return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
  };

  var shared = _shared('keys');

  var _sharedKey = function (key) {
    return shared[key] || (shared[key] = _uid(key));
  };

  var arrayIndexOf = _arrayIncludes(false);
  var IE_PROTO = _sharedKey('IE_PROTO');

  var _objectKeysInternal = function (object, names) {
    var O = _toIobject(object);
    var i = 0;
    var result = [];
    var key;
    for (key in O) if (key != IE_PROTO) _has(O, key) && result.push(key);
    // Don't enum bug & hidden keys
    while (names.length > i) if (_has(O, key = names[i++])) {
      ~arrayIndexOf(result, key) || result.push(key);
    }
    return result;
  };

  // IE 8- don't enum bug keys
  var _enumBugKeys = (
    'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
  ).split(',');

  // 19.1.2.14 / 15.2.3.14 Object.keys(O)



  var _objectKeys = Object.keys || function keys(O) {
    return _objectKeysInternal(O, _enumBugKeys);
  };

  var _core = createCommonjsModule(function (module) {
  var core = module.exports = { version: '2.5.5' };
  if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef
  });
  var _core_1 = _core.version;

  var _isObject = function (it) {
    return typeof it === 'object' ? it !== null : typeof it === 'function';
  };

  var _anObject = function (it) {
    if (!_isObject(it)) throw TypeError(it + ' is not an object!');
    return it;
  };

  var _fails = function (exec) {
    try {
      return !!exec();
    } catch (e) {
      return true;
    }
  };

  // Thank's IE8 for his funny defineProperty
  var _descriptors = !_fails(function () {
    return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
  });

  var document$1 = _global.document;
  // typeof document.createElement is 'object' in old IE
  var is = _isObject(document$1) && _isObject(document$1.createElement);
  var _domCreate = function (it) {
    return is ? document$1.createElement(it) : {};
  };

  var _ie8DomDefine = !_descriptors && !_fails(function () {
    return Object.defineProperty(_domCreate('div'), 'a', { get: function () { return 7; } }).a != 7;
  });

  // 7.1.1 ToPrimitive(input [, PreferredType])

  // instead of the ES6 spec version, we didn't implement @@toPrimitive case
  // and the second argument - flag - preferred type is a string
  var _toPrimitive = function (it, S) {
    if (!_isObject(it)) return it;
    var fn, val;
    if (S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
    if (typeof (fn = it.valueOf) == 'function' && !_isObject(val = fn.call(it))) return val;
    if (!S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
    throw TypeError("Can't convert object to primitive value");
  };

  var dP = Object.defineProperty;

  var f = _descriptors ? Object.defineProperty : function defineProperty(O, P, Attributes) {
    _anObject(O);
    P = _toPrimitive(P, true);
    _anObject(Attributes);
    if (_ie8DomDefine) try {
      return dP(O, P, Attributes);
    } catch (e) { /* empty */ }
    if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
    if ('value' in Attributes) O[P] = Attributes.value;
    return O;
  };

  var _objectDp = {
  	f: f
  };

  var _propertyDesc = function (bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  };

  var _hide = _descriptors ? function (object, key, value) {
    return _objectDp.f(object, key, _propertyDesc(1, value));
  } : function (object, key, value) {
    object[key] = value;
    return object;
  };

  var _redefine = createCommonjsModule(function (module) {
  var SRC = _uid('src');
  var TO_STRING = 'toString';
  var $toString = Function[TO_STRING];
  var TPL = ('' + $toString).split(TO_STRING);

  _core.inspectSource = function (it) {
    return $toString.call(it);
  };

  (module.exports = function (O, key, val, safe) {
    var isFunction = typeof val == 'function';
    if (isFunction) _has(val, 'name') || _hide(val, 'name', key);
    if (O[key] === val) return;
    if (isFunction) _has(val, SRC) || _hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
    if (O === _global) {
      O[key] = val;
    } else if (!safe) {
      delete O[key];
      _hide(O, key, val);
    } else if (O[key]) {
      O[key] = val;
    } else {
      _hide(O, key, val);
    }
  // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
  })(Function.prototype, TO_STRING, function toString() {
    return typeof this == 'function' && this[SRC] || $toString.call(this);
  });
  });

  var _aFunction = function (it) {
    if (typeof it != 'function') throw TypeError(it + ' is not a function!');
    return it;
  };

  // optional / simple context binding

  var _ctx = function (fn, that, length) {
    _aFunction(fn);
    if (that === undefined) return fn;
    switch (length) {
      case 1: return function (a) {
        return fn.call(that, a);
      };
      case 2: return function (a, b) {
        return fn.call(that, a, b);
      };
      case 3: return function (a, b, c) {
        return fn.call(that, a, b, c);
      };
    }
    return function (/* ...args */) {
      return fn.apply(that, arguments);
    };
  };

  var PROTOTYPE = 'prototype';

  var $export = function (type, name, source) {
    var IS_FORCED = type & $export.F;
    var IS_GLOBAL = type & $export.G;
    var IS_STATIC = type & $export.S;
    var IS_PROTO = type & $export.P;
    var IS_BIND = type & $export.B;
    var target = IS_GLOBAL ? _global : IS_STATIC ? _global[name] || (_global[name] = {}) : (_global[name] || {})[PROTOTYPE];
    var exports = IS_GLOBAL ? _core : _core[name] || (_core[name] = {});
    var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
    var key, own, out, exp;
    if (IS_GLOBAL) source = name;
    for (key in source) {
      // contains in native
      own = !IS_FORCED && target && target[key] !== undefined;
      // export native or passed
      out = (own ? target : source)[key];
      // bind timers to global for call from export context
      exp = IS_BIND && own ? _ctx(out, _global) : IS_PROTO && typeof out == 'function' ? _ctx(Function.call, out) : out;
      // extend global
      if (target) _redefine(target, key, out, type & $export.U);
      // export
      if (exports[key] != out) _hide(exports, key, exp);
      if (IS_PROTO && expProto[key] != out) expProto[key] = out;
    }
  };
  _global.core = _core;
  // type bitmap
  $export.F = 1;   // forced
  $export.G = 2;   // global
  $export.S = 4;   // static
  $export.P = 8;   // proto
  $export.B = 16;  // bind
  $export.W = 32;  // wrap
  $export.U = 64;  // safe
  $export.R = 128; // real proto method for `library`
  var _export = $export;

  // most Object methods by ES6 should accept primitives



  var _objectSap = function (KEY, exec) {
    var fn = (_core.Object || {})[KEY] || Object[KEY];
    var exp = {};
    exp[KEY] = exec(fn);
    _export(_export.S + _export.F * _fails(function () { fn(1); }), 'Object', exp);
  };

  // 19.1.2.14 Object.keys(O)



  _objectSap('keys', function () {
    return function keys(it) {
      return _objectKeys(_toObject(it));
    };
  });

  var keys = _core.Object.keys;

  var _stringRepeat = function repeat(count) {
    var str = String(_defined(this));
    var res = '';
    var n = _toInteger(count);
    if (n < 0 || n == Infinity) throw RangeError("Count can't be negative");
    for (;n > 0; (n >>>= 1) && (str += str)) if (n & 1) res += str;
    return res;
  };

  _export(_export.P, 'String', {
    // 21.1.3.13 String.prototype.repeat(count)
    repeat: _stringRepeat
  });

  var repeat = _core.String.repeat;

  // https://github.com/tc39/proposal-string-pad-start-end




  var _stringPad = function (that, maxLength, fillString, left) {
    var S = String(_defined(that));
    var stringLength = S.length;
    var fillStr = fillString === undefined ? ' ' : String(fillString);
    var intMaxLength = _toLength(maxLength);
    if (intMaxLength <= stringLength || fillStr == '') return S;
    var fillLen = intMaxLength - stringLength;
    var stringFiller = _stringRepeat.call(fillStr, Math.ceil(fillLen / fillStr.length));
    if (stringFiller.length > fillLen) stringFiller = stringFiller.slice(0, fillLen);
    return left ? stringFiller + S : S + stringFiller;
  };

  var navigator = _global.navigator;

  var _userAgent = navigator && navigator.userAgent || '';

  // https://github.com/tc39/proposal-string-pad-start-end




  // https://github.com/zloirock/core-js/issues/280
  _export(_export.P + _export.F * /Version\/10\.\d+(\.\d+)? Safari\//.test(_userAgent), 'String', {
    padStart: function padStart(maxLength /* , fillString = ' ' */) {
      return _stringPad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, true);
    }
  });

  var padStart = _core.String.padStart;

  // https://github.com/tc39/proposal-string-pad-start-end




  // https://github.com/zloirock/core-js/issues/280
  _export(_export.P + _export.F * /Version\/10\.\d+(\.\d+)? Safari\//.test(_userAgent), 'String', {
    padEnd: function padEnd(maxLength /* , fillString = ' ' */) {
      return _stringPad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, false);
    }
  });

  var padEnd = _core.String.padEnd;

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      var ownKeys = Object.keys(source);

      if (typeof Object.getOwnPropertySymbols === 'function') {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }

      ownKeys.forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    }

    return target;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;

    for (i = 0; i < sourceKeys.length; i++) {
      key = sourceKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }

    return target;
  }

  function _objectWithoutProperties(source, excluded) {
    if (source == null) return {};

    var target = _objectWithoutPropertiesLoose(source, excluded);

    var key, i;

    if (Object.getOwnPropertySymbols) {
      var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

      for (i = 0; i < sourceSymbolKeys.length; i++) {
        key = sourceSymbolKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
        target[key] = source[key];
      }
    }

    return target;
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }

    return object;
  }

  function _get(target, property, receiver) {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get;
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);

        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);

        if (desc.get) {
          return desc.get.call(receiver);
        }

        return desc.value;
      };
    }

    return _get(target, property, receiver || target);
  }

  function set(target, property, value, receiver) {
    if (typeof Reflect !== "undefined" && Reflect.set) {
      set = Reflect.set;
    } else {
      set = function set(target, property, value, receiver) {
        var base = _superPropBase(target, property);

        var desc;

        if (base) {
          desc = Object.getOwnPropertyDescriptor(base, property);

          if (desc.set) {
            desc.set.call(receiver, value);
            return true;
          } else if (!desc.writable) {
            return false;
          }
        }

        desc = Object.getOwnPropertyDescriptor(receiver, property);

        if (desc) {
          if (!desc.writable) {
            return false;
          }

          desc.value = value;
          Object.defineProperty(receiver, property, desc);
        } else {
          _defineProperty(receiver, property, value);
        }

        return true;
      };
    }

    return set(target, property, value, receiver);
  }

  function _set(target, property, value, receiver, isStrict) {
    var s = set(target, property, value, receiver || target);

    if (!s && isStrict) {
      throw new Error('failed to set property');
    }

    return value;
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }

  /** Checks if value is string */
  function isString(str) {
    return typeof str === 'string' || str instanceof String;
  }
  /**
    Direction
    @prop {string} NONE
    @prop {string} LEFT
    @prop {string} FORCE_LEFT
    @prop {string} RIGHT
    @prop {string} FORCE_RIGHT
  */

  var DIRECTION = {
    NONE: 'NONE',
    LEFT: 'LEFT',
    FORCE_LEFT: 'FORCE_LEFT',
    RIGHT: 'RIGHT',
    FORCE_RIGHT: 'FORCE_RIGHT'
    /**
      Direction
      @enum {string}
    */

  };

  /** Returns next char index in direction */
  function indexInDirection(pos, direction) {
    if (direction === DIRECTION.LEFT) --pos;
    return pos;
  }
  /** Returns next char position in direction */

  function posInDirection(pos, direction) {
    switch (direction) {
      case DIRECTION.LEFT:
        return --pos;

      case DIRECTION.RIGHT:
      case DIRECTION.FORCE_RIGHT:
        return ++pos;

      default:
        return pos;
    }
  }
  /** */

  function forceDirection(direction) {
    switch (direction) {
      case DIRECTION.LEFT:
        return DIRECTION.FORCE_LEFT;

      case DIRECTION.RIGHT:
        return DIRECTION.FORCE_RIGHT;

      default:
        return direction;
    }
  }
  /** Escapes regular expression control chars */

  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
  } // cloned from https://github.com/epoberezkin/fast-deep-equal with small changes

  function objectIncludes(b, a) {
    if (a === b) return true;
    var arrA = Array.isArray(a),
        arrB = Array.isArray(b),
        i;

    if (arrA && arrB) {
      if (a.length != b.length) return false;

      for (i = 0; i < a.length; i++) {
        if (!objectIncludes(a[i], b[i])) return false;
      }

      return true;
    }

    if (arrA != arrB) return false;

    if (a && b && _typeof(a) === 'object' && _typeof(b) === 'object') {
      var dateA = a instanceof Date,
          dateB = b instanceof Date;
      if (dateA && dateB) return a.getTime() == b.getTime();
      if (dateA != dateB) return false;
      var regexpA = a instanceof RegExp,
          regexpB = b instanceof RegExp;
      if (regexpA && regexpB) return a.toString() == b.toString();
      if (regexpA != regexpB) return false;
      var keys = Object.keys(a); // if (keys.length !== Object.keys(b).length) return false;

      for (i = 0; i < keys.length; i++) {
        if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
      }

      for (i = 0; i < keys.length; i++) {
        if (!objectIncludes(b[keys[i]], a[keys[i]])) return false;
      }

      return true;
    }

    return false;
  }
  /* eslint-disable no-undef */

  var g = typeof window !== 'undefined' && window || typeof global !== 'undefined' && global.global === global && global || typeof self !== 'undefined' && self.self === self && self || {};
  /* eslint-enable no-undef */

  /** Selection range */

  /** Provides details of changing input */

  var ActionDetails =
  /*#__PURE__*/
  function () {
    /** Current input value */

    /** Current cursor position */

    /** Old input value */

    /** Old selection */
    function ActionDetails(value, cursorPos, oldValue, oldSelection) {
      _classCallCheck(this, ActionDetails);

      this.value = value;
      this.cursorPos = cursorPos;
      this.oldValue = oldValue;
      this.oldSelection = oldSelection; // double check if left part was changed (autofilling, other non-standard input triggers)

      while (this.value.slice(0, this.startChangePos) !== this.oldValue.slice(0, this.startChangePos)) {
        --this.oldSelection.start;
      }
    }
    /**
      Start changing position
      @readonly
    */


    _createClass(ActionDetails, [{
      key: "startChangePos",
      get: function get() {
        return Math.min(this.cursorPos, this.oldSelection.start);
      }
      /**
        Inserted symbols count
        @readonly
      */

    }, {
      key: "insertedCount",
      get: function get() {
        return this.cursorPos - this.startChangePos;
      }
      /**
        Inserted symbols
        @readonly
      */

    }, {
      key: "inserted",
      get: function get() {
        return this.value.substr(this.startChangePos, this.insertedCount);
      }
      /**
        Removed symbols count
        @readonly
      */

    }, {
      key: "removedCount",
      get: function get() {
        // Math.max for opposite operation
        return Math.max(this.oldSelection.end - this.startChangePos || // for Delete
        this.oldValue.length - this.value.length, 0);
      }
      /**
        Removed symbols
        @readonly
      */

    }, {
      key: "removed",
      get: function get() {
        return this.oldValue.substr(this.startChangePos, this.removedCount);
      }
      /**
        Unchanged head symbols
        @readonly
      */

    }, {
      key: "head",
      get: function get() {
        return this.value.substring(0, this.startChangePos);
      }
      /**
        Unchanged tail symbols
        @readonly
      */

    }, {
      key: "tail",
      get: function get() {
        return this.value.substring(this.startChangePos + this.insertedCount);
      }
      /**
        Remove direction
        @readonly
      */

    }, {
      key: "removeDirection",
      get: function get() {
        if (!this.removedCount || this.insertedCount) return DIRECTION.NONE; // align right if delete at right or if range removed (event with backspace)

        return this.oldSelection.end === this.cursorPos || this.oldSelection.start === this.cursorPos ? DIRECTION.RIGHT : DIRECTION.LEFT;
      }
    }]);

    return ActionDetails;
  }();

  /**
    Provides details of changing model value
    @param {Object} [details]
    @param {string} [details.inserted] - Inserted symbols
    @param {boolean} [details.skip] - Can skip chars
    @param {number} [details.removeCount] - Removed symbols count
    @param {number} [details.tailShift] - Additional offset if any changes occurred before tail
  */
  var ChangeDetails =
  /*#__PURE__*/
  function () {
    /** Inserted symbols */

    /** Can skip chars */

    /** Additional offset if any changes occurred before tail */

    /** Raw inserted is used by dynamic mask */
    function ChangeDetails(details) {
      _classCallCheck(this, ChangeDetails);

      _extends(this, {
        inserted: '',
        rawInserted: '',
        skip: false,
        tailShift: 0
      }, details);
    }
    /**
      Aggregate changes
      @returns {ChangeDetails} `this`
    */


    _createClass(ChangeDetails, [{
      key: "aggregate",
      value: function aggregate(details) {
        this.rawInserted += details.rawInserted;
        this.skip = this.skip || details.skip;
        this.inserted += details.inserted;
        this.tailShift += details.tailShift;
        return this;
      }
      /** Total offset considering all changes */

    }, {
      key: "offset",
      get: function get() {
        return this.tailShift + this.inserted.length;
      }
    }]);

    return ChangeDetails;
  }();

  /** Provides common masking stuff */
  var Masked =
  /*#__PURE__*/
  function () {
    // $Shape<MaskedOptions>; TODO after fix https://github.com/facebook/flow/issues/4773

    /** @type {Mask} */

    /** */
    // $FlowFixMe TODO no ideas

    /** Transforms value before mask processing */

    /** Validates if value is acceptable */

    /** Does additional processing in the end of editing */

    /** */
    function Masked(opts) {
      _classCallCheck(this, Masked);

      this._value = '';

      this._update(opts);

      this.isInitialized = true;
    }
    /** Sets and applies new options */


    _createClass(Masked, [{
      key: "updateOptions",
      value: function updateOptions(opts) {
        this.withValueRefresh(this._update.bind(this, opts));
      }
      /**
        Sets new options
        @protected
      */

    }, {
      key: "_update",
      value: function _update(opts) {
        _extends(this, opts);
      }
      /** Mask state */

    }, {
      key: "reset",

      /** Resets value */
      value: function reset() {
        this._value = '';
      }
      /** */

    }, {
      key: "resolve",

      /** Resolve new value */
      value: function resolve(value) {
        this.reset();
        this.append(value, {
          input: true
        }, {
          value: ''
        });
        this.doCommit();
        return this.value;
      }
      /** */

    }, {
      key: "nearestInputPos",

      /** Finds nearest input position in direction */
      value: function nearestInputPos(cursorPos, direction) {
        return cursorPos;
      }
      /** Extracts value in range considering flags */

    }, {
      key: "extractInput",
      value: function extractInput() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
        return this.value.slice(fromPos, toPos);
      }
      /** Extracts tail in range */

    }, {
      key: "extractTail",
      value: function extractTail() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
        return {
          value: this.extractInput(fromPos, toPos)
        };
      }
      /** Stores state before tail */

    }, {
      key: "_storeBeforeTailState",
      value: function _storeBeforeTailState() {
        this._beforeTailState = this.state;
      }
      /** Restores state before tail */

    }, {
      key: "_restoreBeforeTailState",
      value: function _restoreBeforeTailState() {
        this.state = this._beforeTailState;
      }
      /** Resets state before tail */

    }, {
      key: "_resetBeforeTailState",
      value: function _resetBeforeTailState() {
        this._beforeTailState = null;
      }
      /** Appends tail */

    }, {
      key: "appendTail",
      value: function appendTail(tail) {
        return this.append(tail ? tail.value : '', {
          tail: true
        });
      }
      /** Appends char */

    }, {
      key: "_appendCharRaw",
      value: function _appendCharRaw(ch) {
        this._value += ch;
        return new ChangeDetails({
          inserted: ch,
          rawInserted: ch
        });
      }
      /** Appends char */

    }, {
      key: "_appendChar",
      value: function _appendChar(ch) {
        var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var checkTail = arguments.length > 2 ? arguments[2] : undefined;
        ch = this.doPrepare(ch, flags);
        if (!ch) return new ChangeDetails();
        var consistentState = this.state;

        var details = this._appendCharRaw(ch, flags);

        if (details.inserted) {
          var appended = this.doValidate(flags) !== false;

          if (appended && checkTail != null) {
            // validation ok, check tail
            this._storeBeforeTailState();

            var tailDetails = this.appendTail(checkTail);
            appended = tailDetails.rawInserted === checkTail.value; // if ok, rollback state after tail

            if (appended && tailDetails.inserted) this._restoreBeforeTailState();
          } // revert all if something went wrong


          if (!appended) {
            details.rawInserted = details.inserted = '';
            this.state = consistentState;
          }
        }

        return details;
      }
      /** Appends symbols considering flags */

    }, {
      key: "append",
      value: function append(str, flags, tail) {
        var oldValueLength = this.value.length;
        var details = new ChangeDetails();

        for (var ci = 0; ci < str.length; ++ci) {
          details.aggregate(this._appendChar(str[ci], flags, tail));
        } // append tail but aggregate only tailShift


        if (tail != null) {
          this._storeBeforeTailState();

          details.tailShift += this.appendTail(tail).tailShift; // TODO it's a good idea to clear state after appending ends
          // but it causes bugs when one append calls another (when dynamic dispatch set rawInputValue)
          // this._resetBeforeTailState();
        }

        return details;
      }
      /** */

    }, {
      key: "remove",
      value: function remove() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
        this._value = this.value.slice(0, fromPos) + this.value.slice(toPos);
        return new ChangeDetails();
      }
      /** Calls function and reapplies current value */

    }, {
      key: "withValueRefresh",
      value: function withValueRefresh(fn) {
        if (this._refreshing || !this.isInitialized) return fn();
        this._refreshing = true;
        var unmasked = this.unmaskedValue;
        var value = this.value;
        var ret = fn(); // try to update with raw value first to keep fixed chars

        if (this.resolve(value) !== value) {
          // or fallback to unmasked
          this.unmaskedValue = unmasked;
        }

        delete this._refreshing;
        return ret;
      }
      /**
        Prepares string before mask processing
        @protected
      */

    }, {
      key: "doPrepare",
      value: function doPrepare(str) {
        var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        return this.prepare ? this.prepare(str, this, flags) : str;
      }
      /**
        Validates if value is acceptable
        @protected
      */

    }, {
      key: "doValidate",
      value: function doValidate(flags) {
        return (!this.validate || this.validate(this.value, this, flags)) && (!this.parent || this.parent.doValidate(flags));
      }
      /**
        Does additional processing in the end of editing
        @protected
      */

    }, {
      key: "doCommit",
      value: function doCommit() {
        if (this.commit) this.commit(this.value, this);
      }
      /** */

    }, {
      key: "splice",
      value: function splice(start, deleteCount, inserted, removeDirection) {
        var tailPos = start + deleteCount;
        var tail = this.extractTail(tailPos);
        var startChangePos = this.nearestInputPos(start, removeDirection);
        var changeDetails = new ChangeDetails({
          tailShift: startChangePos - start // adjust tailShift if start was aligned

        }).aggregate(this.remove(startChangePos)).aggregate(this.append(inserted, {
          input: true
        }, tail));
        return changeDetails;
      }
    }, {
      key: "state",
      get: function get() {
        return {
          _value: this.value
        };
      },
      set: function set(state) {
        this._value = state._value;
      }
    }, {
      key: "value",
      get: function get() {
        return this._value;
      },
      set: function set(value) {
        this.resolve(value);
      }
    }, {
      key: "unmaskedValue",
      get: function get() {
        return this.value;
      },
      set: function set(value) {
        this.reset();
        this.append(value, {}, {
          value: ''
        });
        this.doCommit();
      }
      /** */

    }, {
      key: "typedValue",
      get: function get() {
        return this.unmaskedValue;
      },
      set: function set(value) {
        this.unmaskedValue = value;
      }
      /** Value that includes raw user input */

    }, {
      key: "rawInputValue",
      get: function get() {
        return this.extractInput(0, this.value.length, {
          raw: true
        });
      },
      set: function set(value) {
        this.reset();
        this.append(value, {
          raw: true
        }, {
          value: ''
        });
        this.doCommit();
      }
      /** */

    }, {
      key: "isComplete",
      get: function get() {
        return true;
      }
    }]);

    return Masked;
  }();

  /** Get Masked class by mask type */
  function maskedClass(mask) {
    if (mask == null) {
      throw new Error('mask property should be defined');
    }

    if (mask instanceof RegExp) return g.IMask.MaskedRegExp;
    if (isString(mask)) return g.IMask.MaskedPattern;
    if (mask instanceof Date || mask === Date) return g.IMask.MaskedDate;
    if (mask instanceof Number || typeof mask === 'number' || mask === Number) return g.IMask.MaskedNumber;
    if (Array.isArray(mask) || mask === Array) return g.IMask.MaskedDynamic; // $FlowFixMe

    if (mask.prototype instanceof g.IMask.Masked) return mask; // $FlowFixMe

    if (mask instanceof Function) return g.IMask.MaskedFunction;
    console.warn('Mask not found for mask', mask); // eslint-disable-line no-console

    return g.IMask.Masked;
  }
  /** Creates new {@link Masked} depending on mask type */

  function createMask(opts) {
    opts = _objectSpread({}, opts);
    var mask = opts.mask;
    if (mask instanceof g.IMask.Masked) return mask;
    var MaskedClass = maskedClass(mask);
    return new MaskedClass(opts);
  }

  var DEFAULT_INPUT_DEFINITIONS = {
    '0': /\d/,
    'a': /[\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
    // http://stackoverflow.com/a/22075070
    '*': /./
  };
  /** */

  var PatternInputDefinition =
  /*#__PURE__*/
  function () {
    /** */

    /** */

    /** */

    /** */

    /** */

    /** */
    function PatternInputDefinition(opts) {
      _classCallCheck(this, PatternInputDefinition);

      var mask = opts.mask,
          blockOpts = _objectWithoutProperties(opts, ["mask"]);

      this.masked = createMask({
        mask: mask
      });

      _extends(this, blockOpts);
    }

    _createClass(PatternInputDefinition, [{
      key: "reset",
      value: function reset() {
        this._isFilled = false;
        this.masked.reset();
      }
    }, {
      key: "remove",
      value: function remove() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;

        if (fromPos === 0 && toPos >= 1) {
          this._isFilled = false;
          return this.masked.remove(fromPos, toPos);
        }

        return new ChangeDetails();
      }
    }, {
      key: "_appendChar",
      value: function _appendChar(str) {
        var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        if (this._isFilled) return new ChangeDetails();
        var state = this.masked.state; // simulate input

        var details = this.masked._appendChar(str, flags);

        if (details.inserted && this.doValidate(flags) === false) {
          details.inserted = details.rawInserted = '';
          this.masked.state = state;
        }

        if (!details.inserted && !this.isOptional && !this.lazy && !flags.input) {
          details.inserted = this.placeholderChar;
        }

        details.skip = !details.inserted && !this.isOptional;
        this._isFilled = Boolean(details.inserted);
        return details;
      }
    }, {
      key: "_appendPlaceholder",
      value: function _appendPlaceholder() {
        var details = new ChangeDetails();
        if (this._isFilled || this.isOptional) return details;
        this._isFilled = true;
        details.inserted = this.placeholderChar;
        return details;
      }
    }, {
      key: "extractTail",
      value: function extractTail() {
        var _this$masked;

        return (_this$masked = this.masked).extractTail.apply(_this$masked, arguments);
      }
    }, {
      key: "appendTail",
      value: function appendTail() {
        var _this$masked2;

        return (_this$masked2 = this.masked).appendTail.apply(_this$masked2, arguments);
      }
    }, {
      key: "extractInput",
      value: function extractInput() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
        var flags = arguments.length > 2 ? arguments[2] : undefined;
        return this.masked.extractInput(fromPos, toPos, flags);
      }
    }, {
      key: "nearestInputPos",
      value: function nearestInputPos(cursorPos) {
        var direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DIRECTION.NONE;
        var minPos = 0;
        var maxPos = this.value.length;
        var boundPos = Math.min(Math.max(cursorPos, minPos), maxPos);

        switch (direction) {
          case DIRECTION.LEFT:
          case DIRECTION.FORCE_LEFT:
            return this.isComplete ? boundPos : minPos;

          case DIRECTION.RIGHT:
          case DIRECTION.FORCE_RIGHT:
            return this.isComplete ? boundPos : maxPos;

          case DIRECTION.NONE:
          default:
            return boundPos;
        }
      }
    }, {
      key: "doValidate",
      value: function doValidate() {
        var _this$masked3, _this$parent;

        return (_this$masked3 = this.masked).doValidate.apply(_this$masked3, arguments) && (!this.parent || (_this$parent = this.parent).doValidate.apply(_this$parent, arguments));
      }
    }, {
      key: "doCommit",
      value: function doCommit() {
        this.masked.doCommit();
      }
    }, {
      key: "value",
      get: function get() {
        return this.masked.value || (this._isFilled && !this.isOptional ? this.placeholderChar : '');
      }
    }, {
      key: "unmaskedValue",
      get: function get() {
        return this.masked.unmaskedValue;
      }
    }, {
      key: "isComplete",
      get: function get() {
        return Boolean(this.masked.value) || this.isOptional;
      }
    }, {
      key: "state",
      get: function get() {
        return {
          masked: this.masked.state,
          _isFilled: this._isFilled
        };
      },
      set: function set(state) {
        this.masked.state = state.masked;
        this._isFilled = state._isFilled;
      }
    }]);

    return PatternInputDefinition;
  }();

  var PatternFixedDefinition =
  /*#__PURE__*/
  function () {
    /** */

    /** */

    /** */

    /** */
    function PatternFixedDefinition(opts) {
      _classCallCheck(this, PatternFixedDefinition);

      _extends(this, opts);

      this._value = '';
    }

    _createClass(PatternFixedDefinition, [{
      key: "reset",
      value: function reset() {
        this._isRawInput = false;
        this._value = '';
      }
    }, {
      key: "remove",
      value: function remove() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._value.length;
        this._value = this._value.slice(0, fromPos) + this._value.slice(toPos);
        if (!this._value) this._isRawInput = false;
        return new ChangeDetails();
      }
    }, {
      key: "nearestInputPos",
      value: function nearestInputPos(cursorPos) {
        var direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DIRECTION.NONE;
        var minPos = 0;
        var maxPos = this._value.length;

        switch (direction) {
          case DIRECTION.LEFT:
          case DIRECTION.FORCE_LEFT:
            return minPos;

          case DIRECTION.NONE:
          case DIRECTION.RIGHT:
          case DIRECTION.FORCE_RIGHT:
          default:
            return maxPos;
        }
      }
    }, {
      key: "extractInput",
      value: function extractInput() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._value.length;
        var flags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        return flags.raw && this._isRawInput && this._value.slice(fromPos, toPos) || '';
      }
    }, {
      key: "_appendChar",
      value: function _appendChar(str, flags) {
        var details = new ChangeDetails();
        if (this._value) return details;
        var appended = this.char === str[0];
        var isResolved = appended && (this.isUnmasking || flags.input || flags.raw) && !flags.tail;
        if (isResolved) details.rawInserted = this.char;
        this._value = details.inserted = this.char;
        this._isRawInput = isResolved && (flags.raw || flags.input);
        return details;
      }
    }, {
      key: "_appendPlaceholder",
      value: function _appendPlaceholder() {
        var details = new ChangeDetails();
        if (this._value) return details;
        this._value = details.inserted = this.char;
        return details;
      }
    }, {
      key: "extractTail",
      value: function extractTail() {
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
        return {
          value: ''
        };
      }
    }, {
      key: "appendTail",
      value: function appendTail(tail) {
        return this._appendChar(tail ? tail.value : '', {
          tail: true
        });
      }
    }, {
      key: "doCommit",
      value: function doCommit() {}
    }, {
      key: "value",
      get: function get() {
        return this._value;
      }
    }, {
      key: "unmaskedValue",
      get: function get() {
        return this.isUnmasking ? this.value : '';
      }
    }, {
      key: "isComplete",
      get: function get() {
        return true;
      }
    }, {
      key: "state",
      get: function get() {
        return {
          _value: this._value,
          _isRawInput: this._isRawInput
        };
      },
      set: function set(state) {
        _extends(this, state);
      }
    }]);

    return PatternFixedDefinition;
  }();

  var ChunksTailDetails =
  /*#__PURE__*/
  function () {
    function ChunksTailDetails(chunks) {
      _classCallCheck(this, ChunksTailDetails);

      this.chunks = chunks;
    }

    _createClass(ChunksTailDetails, [{
      key: "value",
      get: function get() {
        return this.chunks.map(function (c) {
          return c.value;
        }).join('');
      }
    }]);

    return ChunksTailDetails;
  }();

  /**
    Pattern mask
    @param {Object} opts
    @param {Object} opts.blocks
    @param {Object} opts.definitions
    @param {string} opts.placeholderChar
    @param {boolean} opts.lazy
  */
  var MaskedPattern =
  /*#__PURE__*/
  function (_Masked) {
    _inherits(MaskedPattern, _Masked);

    /** */

    /** */

    /** Single char for empty input */

    /** Show placeholder only when needed */
    function MaskedPattern() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _classCallCheck(this, MaskedPattern);

      // TODO type $Shape<MaskedPatternOptions>={} does not work
      opts.definitions = _extends({}, DEFAULT_INPUT_DEFINITIONS, opts.definitions);
      return _possibleConstructorReturn(this, _getPrototypeOf(MaskedPattern).call(this, _objectSpread({}, MaskedPattern.DEFAULTS, opts)));
    }
    /**
      @override
      @param {Object} opts
    */


    _createClass(MaskedPattern, [{
      key: "_update",
      value: function _update() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        opts.definitions = _extends({}, this.definitions, opts.definitions);

        _get(_getPrototypeOf(MaskedPattern.prototype), "_update", this).call(this, opts);

        this._rebuildMask();
      }
      /** */

    }, {
      key: "_rebuildMask",
      value: function _rebuildMask() {
        var _this = this;

        var defs = this.definitions;
        this._blocks = [];
        this._stops = [];
        this._maskedBlocks = {};
        var pattern = this.mask;
        if (!pattern || !defs) return;
        var unmaskingBlock = false;
        var optionalBlock = false;

        for (var i = 0; i < pattern.length; ++i) {
          if (this.blocks) {
            var _ret = function () {
              var p = pattern.slice(i);
              var bNames = Object.keys(_this.blocks).filter(function (bName) {
                return p.indexOf(bName) === 0;
              }); // order by key length

              bNames.sort(function (a, b) {
                return b.length - a.length;
              }); // use block name with max length

              var bName = bNames[0];

              if (bName) {
                var maskedBlock = createMask(_objectSpread({
                  parent: _this,
                  lazy: _this.lazy,
                  placeholderChar: _this.placeholderChar
                }, _this.blocks[bName]));

                if (maskedBlock) {
                  _this._blocks.push(maskedBlock); // store block index


                  if (!_this._maskedBlocks[bName]) _this._maskedBlocks[bName] = [];

                  _this._maskedBlocks[bName].push(_this._blocks.length - 1);
                }

                i += bName.length - 1;
                return "continue";
              }
            }();

            if (_ret === "continue") continue;
          }

          var char = pattern[i];

          var _isInput = char in defs;

          if (char === MaskedPattern.STOP_CHAR) {
            this._stops.push(this._blocks.length);

            continue;
          }

          if (char === '{' || char === '}') {
            unmaskingBlock = !unmaskingBlock;
            continue;
          }

          if (char === '[' || char === ']') {
            optionalBlock = !optionalBlock;
            continue;
          }

          if (char === MaskedPattern.ESCAPE_CHAR) {
            ++i;
            char = pattern[i];
            if (!char) break;
            _isInput = false;
          }

          var def = void 0;

          if (_isInput) {
            def = new PatternInputDefinition({
              parent: this,
              lazy: this.lazy,
              placeholderChar: this.placeholderChar,
              mask: defs[char],
              isOptional: optionalBlock
            });
          } else {
            def = new PatternFixedDefinition({
              char: char,
              isUnmasking: unmaskingBlock
            });
          }

          this._blocks.push(def);
        }
      }
      /**
        @override
      */

    }, {
      key: "_storeBeforeTailState",

      /**
        @override
      */
      value: function _storeBeforeTailState() {
        this._blocks.forEach(function (b) {
          // $FlowFixMe _storeBeforeTailState is not exist in PatternBlock
          if (typeof b._storeBeforeTailState === 'function') {
            b._storeBeforeTailState();
          }
        });

        _get(_getPrototypeOf(MaskedPattern.prototype), "_storeBeforeTailState", this).call(this);
      }
      /**
        @override
      */

    }, {
      key: "_restoreBeforeTailState",
      value: function _restoreBeforeTailState() {
        this._blocks.forEach(function (b) {
          // $FlowFixMe _restoreBeforeTailState is not exist in PatternBlock
          if (typeof b._restoreBeforeTailState === 'function') {
            b._restoreBeforeTailState();
          }
        });

        _get(_getPrototypeOf(MaskedPattern.prototype), "_restoreBeforeTailState", this).call(this);
      }
      /**
        @override
      */

    }, {
      key: "_resetBeforeTailState",
      value: function _resetBeforeTailState() {
        this._blocks.forEach(function (b) {
          // $FlowFixMe _resetBeforeTailState is not exist in PatternBlock
          if (typeof b._resetBeforeTailState === 'function') {
            b._resetBeforeTailState();
          }
        });

        _get(_getPrototypeOf(MaskedPattern.prototype), "_resetBeforeTailState", this).call(this);
      }
      /**
        @override
      */

    }, {
      key: "reset",
      value: function reset() {
        _get(_getPrototypeOf(MaskedPattern.prototype), "reset", this).call(this);

        this._blocks.forEach(function (b) {
          return b.reset();
        });
      }
      /**
        @override
      */

    }, {
      key: "doCommit",

      /**
        @override
      */
      value: function doCommit() {
        this._blocks.forEach(function (b) {
          return b.doCommit();
        });

        _get(_getPrototypeOf(MaskedPattern.prototype), "doCommit", this).call(this);
      }
      /**
        @override
      */

    }, {
      key: "appendTail",

      /**
        @override
      */
      value: function appendTail(tail) {
        var details = new ChangeDetails();

        if (tail) {
          details.aggregate(tail instanceof ChunksTailDetails ? this._appendTailChunks(tail.chunks) : _get(_getPrototypeOf(MaskedPattern.prototype), "appendTail", this).call(this, tail));
        }

        return details.aggregate(this._appendPlaceholder());
      }
      /**
        @override
      */

    }, {
      key: "_appendCharRaw",
      value: function _appendCharRaw(ch) {
        var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var blockData = this._mapPosToBlock(this.value.length);

        var details = new ChangeDetails();
        if (!blockData) return details;

        for (var bi = blockData.index;; ++bi) {
          var _block = this._blocks[bi];
          if (!_block) break;

          var blockDetails = _block._appendChar(ch, flags);

          var skip = blockDetails.skip;
          details.aggregate(blockDetails);
          if (skip || blockDetails.rawInserted) break; // go next char
        }

        return details;
      }
      /** Appends chunks splitted by stop chars */

    }, {
      key: "_appendTailChunks",
      value: function _appendTailChunks(chunks) {
        var details = new ChangeDetails();

        for (var ci = 0; ci < chunks.length && !details.skip; ++ci) {
          var chunk = chunks[ci];

          var lastBlock = this._mapPosToBlock(this.value.length);

          var chunkBlock = chunk instanceof ChunksTailDetails && chunk.index != null && (!lastBlock || lastBlock.index <= chunk.index) && this._blocks[chunk.index];

          if (chunkBlock) {
            // $FlowFixMe we already check index above
            details.aggregate(this._appendPlaceholder(chunk.index));
            var tailDetails = chunkBlock.appendTail(chunk);
            tailDetails.skip = false; // always ignore skip, it will be set on last

            details.aggregate(tailDetails);
            this._value += tailDetails.inserted; // get not inserted chars

            var remainChars = chunk.value.slice(tailDetails.rawInserted.length);
            if (remainChars) details.aggregate(this.append(remainChars, {
              tail: true
            }));
          } else {
            var _ref = chunk,
                stop = _ref.stop,
                value = _ref.value;
            if (stop != null && this._stops.indexOf(stop) >= 0) details.aggregate(this._appendPlaceholder(stop));
            details.aggregate(this.append(value, {
              tail: true
            }));
          }
        }
        return details;
      }
      /**
        @override
      */

    }, {
      key: "extractTail",
      value: function extractTail() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
        return new ChunksTailDetails(this._extractTailChunks(fromPos, toPos));
      }
      /**
        @override
      */

    }, {
      key: "extractInput",
      value: function extractInput() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
        var flags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        if (fromPos === toPos) return '';
        var input = '';

        this._forEachBlocksInRange(fromPos, toPos, function (b, _, fromPos, toPos) {
          input += b.extractInput(fromPos, toPos, flags);
        });

        return input;
      }
      /** Extracts chunks from input splitted by stop chars */

    }, {
      key: "_extractTailChunks",
      value: function _extractTailChunks() {
        var _this2 = this;

        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
        if (fromPos === toPos) return [];
        var chunks = [];
        var lastChunk;

        this._forEachBlocksInRange(fromPos, toPos, function (b, bi, fromPos, toPos) {
          var blockChunk = b.extractTail(fromPos, toPos);
          var nearestStop;

          for (var si = 0; si < _this2._stops.length; ++si) {
            var stop = _this2._stops[si];
            if (stop <= bi) nearestStop = stop;else break;
          }

          if (blockChunk instanceof ChunksTailDetails) {
            // TODO append to lastChunk with same index
            if (nearestStop == null) {
              // try append floating chunks to existed lastChunk
              var headFloatChunksCount = blockChunk.chunks.length;

              for (var ci = 0; ci < blockChunk.chunks.length; ++ci) {
                if (blockChunk.chunks[ci].stop != null) {
                  headFloatChunksCount = ci;
                  break;
                }
              }

              var headFloatChunks = blockChunk.chunks.splice(0, headFloatChunksCount);
              headFloatChunks.filter(function (chunk) {
                return chunk.value;
              }).forEach(function (chunk) {
                if (lastChunk) lastChunk.value += chunk.value; // will flat nested chunks
                else lastChunk = {
                    value: chunk.value
                  };
              });
            } // if block chunk has stops


            if (blockChunk.chunks.length) {
              if (lastChunk) chunks.push(lastChunk);
              blockChunk.index = nearestStop;
              chunks.push(blockChunk); // we cant append to ChunksTailDetails, so just reset lastChunk to force adding new

              lastChunk = null;
            }
          } else {
            if (nearestStop != null) {
              // on middle chunks consider stop flag and do not consider value
              // add block even if it is empty
              if (lastChunk) chunks.push(lastChunk);
              blockChunk.stop = nearestStop;
            } else if (lastChunk) {
              lastChunk.value += blockChunk.value;
              return;
            }

            lastChunk = blockChunk;
          }
        });

        if (lastChunk && lastChunk.value) chunks.push(lastChunk);
        return chunks;
      }
      /** Appends placeholder depending on laziness */

    }, {
      key: "_appendPlaceholder",
      value: function _appendPlaceholder(toBlockIndex) {
        var _this3 = this;

        var details = new ChangeDetails();
        if (this.lazy && toBlockIndex == null) return details;

        var startBlockData = this._mapPosToBlock(this.value.length);

        if (!startBlockData) return details;
        var startBlockIndex = startBlockData.index;
        var endBlockIndex = toBlockIndex != null ? toBlockIndex : this._blocks.length;

        this._blocks.slice(startBlockIndex, endBlockIndex).forEach(function (b) {
          if (typeof b._appendPlaceholder === 'function') {
            // $FlowFixMe `_blocks` may not be present
            var args = b._blocks != null ? [b._blocks.length] : [];

            var bDetails = b._appendPlaceholder.apply(b, args);

            _this3._value += bDetails.inserted;
            details.aggregate(bDetails);
          }
        });

        return details;
      }
      /** Finds block in pos */

    }, {
      key: "_mapPosToBlock",
      value: function _mapPosToBlock(pos) {
        var accVal = '';

        for (var bi = 0; bi < this._blocks.length; ++bi) {
          var _block2 = this._blocks[bi];
          var blockStartPos = accVal.length;
          accVal += _block2.value;

          if (pos <= accVal.length) {
            return {
              index: bi,
              offset: pos - blockStartPos
            };
          }
        }
      }
      /** */

    }, {
      key: "_blockStartPos",
      value: function _blockStartPos(blockIndex) {
        return this._blocks.slice(0, blockIndex).reduce(function (pos, b) {
          return pos += b.value.length;
        }, 0);
      }
      /** */

    }, {
      key: "_forEachBlocksInRange",
      value: function _forEachBlocksInRange(fromPos) {
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
        var fn = arguments.length > 2 ? arguments[2] : undefined;

        var fromBlock = this._mapPosToBlock(fromPos);

        if (fromBlock) {
          var toBlock = this._mapPosToBlock(toPos); // process first block


          var isSameBlock = toBlock && fromBlock.index === toBlock.index;
          var fromBlockRemoveBegin = fromBlock.offset;
          var fromBlockRemoveEnd = toBlock && isSameBlock ? toBlock.offset : undefined;
          fn(this._blocks[fromBlock.index], fromBlock.index, fromBlockRemoveBegin, fromBlockRemoveEnd);

          if (toBlock && !isSameBlock) {
            // process intermediate blocks
            for (var bi = fromBlock.index + 1; bi < toBlock.index; ++bi) {
              fn(this._blocks[bi], bi);
            } // process last block


            fn(this._blocks[toBlock.index], toBlock.index, 0, toBlock.offset);
          }
        }
      }
      /**
        @override
      */

    }, {
      key: "remove",
      value: function remove() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;

        var removeDetails = _get(_getPrototypeOf(MaskedPattern.prototype), "remove", this).call(this, fromPos, toPos);

        this._forEachBlocksInRange(fromPos, toPos, function (b, _, bFromPos, bToPos) {
          removeDetails.aggregate(b.remove(bFromPos, bToPos));
        });

        return removeDetails;
      }
      /**
        @override
      */

    }, {
      key: "nearestInputPos",
      value: function nearestInputPos(cursorPos) {
        var direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DIRECTION.NONE;
        // TODO refactor - extract alignblock
        var beginBlockData = this._mapPosToBlock(cursorPos) || {
          index: 0,
          offset: 0
        };
        var beginBlockOffset = beginBlockData.offset,
            beginBlockIndex = beginBlockData.index;
        var beginBlock = this._blocks[beginBlockIndex];
        if (!beginBlock) return cursorPos;
        var beginBlockCursorPos = beginBlockOffset; // if position inside block - try to adjust it

        if (beginBlockCursorPos !== 0 && beginBlockCursorPos < beginBlock.value.length) {
          beginBlockCursorPos = beginBlock.nearestInputPos(beginBlockOffset, forceDirection(direction));
        }

        var cursorAtRight = beginBlockCursorPos === beginBlock.value.length;
        var cursorAtLeft = beginBlockCursorPos === 0; //  cursor is INSIDE first block (not at bounds)

        if (!cursorAtLeft && !cursorAtRight) return this._blockStartPos(beginBlockIndex) + beginBlockCursorPos;
        var searchBlockIndex = cursorAtRight ? beginBlockIndex + 1 : beginBlockIndex;

        if (direction === DIRECTION.NONE) {
          // NONE direction used to calculate start input position if no chars were removed
          // FOR NONE:
          // -
          // input|any
          // ->
          //  any|input
          // <-
          //  filled-input|any
          // check if first block at left is input
          if (searchBlockIndex > 0) {
            var blockIndexAtLeft = searchBlockIndex - 1;
            var blockAtLeft = this._blocks[blockIndexAtLeft];
            var blockInputPos = blockAtLeft.nearestInputPos(0, DIRECTION.NONE); // is input

            if (!blockAtLeft.value.length || blockInputPos !== blockAtLeft.value.length) {
              return this._blockStartPos(searchBlockIndex);
            }
          } // ->


          var firstInputAtRight = searchBlockIndex;

          for (var bi = firstInputAtRight; bi < this._blocks.length; ++bi) {
            var _block3 = this._blocks[bi];

            var _blockInputPos = _block3.nearestInputPos(0, DIRECTION.NONE);

            if (_blockInputPos !== _block3.value.length) {
              return this._blockStartPos(bi) + _blockInputPos;
            }
          }

          return this.value.length;
        }

        if (direction === DIRECTION.LEFT || direction === DIRECTION.FORCE_LEFT) {
          // -
          //  any|filled-input
          // <-
          //  any|first not empty is not-len-aligned
          //  not-0-aligned|any
          // ->
          //  any|not-len-aligned or end
          // check if first block at right is filled input
          var firstFilledBlockIndexAtRight;

          for (var _bi = searchBlockIndex; _bi < this._blocks.length; ++_bi) {
            if (this._blocks[_bi].value) {
              firstFilledBlockIndexAtRight = _bi;
              break;
            }
          }

          if (firstFilledBlockIndexAtRight != null) {
            var filledBlock = this._blocks[firstFilledBlockIndexAtRight];

            var _blockInputPos2 = filledBlock.nearestInputPos(0, DIRECTION.RIGHT);

            if (_blockInputPos2 === 0 && filledBlock.unmaskedValue.length) {
              // filled block is input
              return this._blockStartPos(firstFilledBlockIndexAtRight) + _blockInputPos2;
            }
          } // <-
          // find this vars


          var firstFilledInputBlockIndex = -1;
          var firstEmptyInputBlockIndex; // TODO consider nested empty inputs

          for (var _bi2 = searchBlockIndex - 1; _bi2 >= 0; --_bi2) {
            var _block4 = this._blocks[_bi2];

            var _blockInputPos3 = _block4.nearestInputPos(_block4.value.length, DIRECTION.FORCE_LEFT);

            if (firstEmptyInputBlockIndex == null && (!_block4.value || _blockInputPos3 !== 0)) {
              firstEmptyInputBlockIndex = _bi2;
            }

            if (_blockInputPos3 !== 0) {
              if (_blockInputPos3 !== _block4.value.length) {
                // aligned inside block - return immediately
                return this._blockStartPos(_bi2) + _blockInputPos3;
              } else {
                // found filled
                firstFilledInputBlockIndex = _bi2;
                break;
              }
            }
          }

          if (direction === DIRECTION.LEFT) {
            // try find first empty input before start searching position only when not forced
            for (var _bi3 = firstFilledInputBlockIndex + 1; _bi3 <= Math.min(searchBlockIndex, this._blocks.length - 1); ++_bi3) {
              var _block5 = this._blocks[_bi3];

              var _blockInputPos4 = _block5.nearestInputPos(0, DIRECTION.NONE);

              var blockAlignedPos = this._blockStartPos(_bi3) + _blockInputPos4; // if block is empty and last or not lazy input


              if ((!_block5.value.length && blockAlignedPos === this.value.length || _blockInputPos4 !== _block5.value.length) && blockAlignedPos <= cursorPos) {
                return blockAlignedPos;
              }
            }
          } // process overflow


          if (firstFilledInputBlockIndex >= 0) {
            return this._blockStartPos(firstFilledInputBlockIndex) + this._blocks[firstFilledInputBlockIndex].value.length;
          } // for lazy if has aligned left inside fixed and has came to the start - use start position


          if (direction === DIRECTION.FORCE_LEFT || this.lazy && !this.extractInput() && !isInput(this._blocks[searchBlockIndex])) {
            return 0;
          }

          if (firstEmptyInputBlockIndex != null) {
            return this._blockStartPos(firstEmptyInputBlockIndex);
          } // find first input


          for (var _bi4 = searchBlockIndex; _bi4 < this._blocks.length; ++_bi4) {
            var _block6 = this._blocks[_bi4];

            var _blockInputPos5 = _block6.nearestInputPos(0, DIRECTION.NONE); // is input


            if (!_block6.value.length || _blockInputPos5 !== _block6.value.length) {
              return this._blockStartPos(_bi4) + _blockInputPos5;
            }
          }

          return 0;
        }

        if (direction === DIRECTION.RIGHT || direction === DIRECTION.FORCE_RIGHT) {
          // ->
          //  any|not-len-aligned and filled
          //  any|not-len-aligned
          // <-
          var firstInputBlockAlignedIndex;
          var firstInputBlockAlignedPos;

          for (var _bi5 = searchBlockIndex; _bi5 < this._blocks.length; ++_bi5) {
            var _block7 = this._blocks[_bi5];

            var _blockInputPos6 = _block7.nearestInputPos(0, DIRECTION.NONE);

            if (_blockInputPos6 !== _block7.value.length) {
              firstInputBlockAlignedPos = this._blockStartPos(_bi5) + _blockInputPos6;
              firstInputBlockAlignedIndex = _bi5;
              break;
            }
          }

          if (firstInputBlockAlignedIndex != null && firstInputBlockAlignedPos != null) {
            for (var _bi6 = firstInputBlockAlignedIndex; _bi6 < this._blocks.length; ++_bi6) {
              var _block8 = this._blocks[_bi6];

              var _blockInputPos7 = _block8.nearestInputPos(0, DIRECTION.FORCE_RIGHT);

              if (_blockInputPos7 !== _block8.value.length) {
                return this._blockStartPos(_bi6) + _blockInputPos7;
              }
            }

            return direction === DIRECTION.FORCE_RIGHT ? this.value.length : firstInputBlockAlignedPos;
          }

          for (var _bi7 = Math.min(searchBlockIndex, this._blocks.length - 1); _bi7 >= 0; --_bi7) {
            var _block9 = this._blocks[_bi7];

            var _blockInputPos8 = _block9.nearestInputPos(_block9.value.length, DIRECTION.LEFT);

            if (_blockInputPos8 !== 0) {
              var alignedPos = this._blockStartPos(_bi7) + _blockInputPos8;

              if (alignedPos >= cursorPos) return alignedPos;
              break;
            }
          }
        }

        return cursorPos;
      }
      /** Get block by name */

    }, {
      key: "maskedBlock",
      value: function maskedBlock(name) {
        return this.maskedBlocks(name)[0];
      }
      /** Get all blocks by name */

    }, {
      key: "maskedBlocks",
      value: function maskedBlocks(name) {
        var _this4 = this;

        var indices = this._maskedBlocks[name];
        if (!indices) return [];
        return indices.map(function (gi) {
          return _this4._blocks[gi];
        });
      }
    }, {
      key: "state",
      get: function get$$1() {
        return _objectSpread({}, _get(_getPrototypeOf(MaskedPattern.prototype), "state", this), {
          _blocks: this._blocks.map(function (b) {
            return b.state;
          })
        });
      },
      set: function set$$1(state) {
        var _blocks = state._blocks,
            maskedState = _objectWithoutProperties(state, ["_blocks"]);

        this._blocks.forEach(function (b, bi) {
          return b.state = _blocks[bi];
        });

        _set(_getPrototypeOf(MaskedPattern.prototype), "state", maskedState, this, true);
      }
    }, {
      key: "isComplete",
      get: function get$$1() {
        return this._blocks.every(function (b) {
          return b.isComplete;
        });
      }
    }, {
      key: "unmaskedValue",
      get: function get$$1() {
        return this._blocks.reduce(function (str, b) {
          return str += b.unmaskedValue;
        }, '');
      },
      set: function set$$1(unmaskedValue) {
        _set(_getPrototypeOf(MaskedPattern.prototype), "unmaskedValue", unmaskedValue, this, true);
      }
      /**
        @override
      */

    }, {
      key: "value",
      get: function get$$1() {
        // TODO return _value when not in change?
        return this._blocks.reduce(function (str, b) {
          return str += b.value;
        }, '');
      },
      set: function set$$1(value) {
        _set(_getPrototypeOf(MaskedPattern.prototype), "value", value, this, true);
      }
    }]);

    return MaskedPattern;
  }(Masked);
  MaskedPattern.DEFAULTS = {
    lazy: true,
    placeholderChar: '_'
  };
  MaskedPattern.STOP_CHAR = '`';
  MaskedPattern.ESCAPE_CHAR = '\\';
  MaskedPattern.InputDefinition = PatternInputDefinition;
  MaskedPattern.FixedDefinition = PatternFixedDefinition;

  function isInput(block) {
    if (!block) return false;
    var value = block.value;
    return !value || block.nearestInputPos(0, DIRECTION.NONE) !== value.length;
  }

  /** Pattern which accepts ranges */

  var MaskedRange =
  /*#__PURE__*/
  function (_MaskedPattern) {
    _inherits(MaskedRange, _MaskedPattern);

    function MaskedRange() {
      _classCallCheck(this, MaskedRange);

      return _possibleConstructorReturn(this, _getPrototypeOf(MaskedRange).apply(this, arguments));
    }

    _createClass(MaskedRange, [{
      key: "_update",

      /**
        @override
      */
      value: function _update(opts) {
        // TODO type
        var maxLength = String(opts.to).length;
        if (opts.maxLength != null) maxLength = Math.max(maxLength, opts.maxLength);
        opts.maxLength = maxLength;
        var toStr = String(opts.to).padStart(maxLength, '0');
        var fromStr = String(opts.from).padStart(maxLength, '0');
        var sameCharsCount = 0;

        while (sameCharsCount < toStr.length && toStr[sameCharsCount] === fromStr[sameCharsCount]) {
          ++sameCharsCount;
        }

        opts.mask = toStr.slice(0, sameCharsCount).replace(/0/g, '\\0') + '0'.repeat(maxLength - sameCharsCount);

        _get(_getPrototypeOf(MaskedRange.prototype), "_update", this).call(this, opts);
      }
      /**
        @override
      */

    }, {
      key: "doValidate",

      /**
        @override
      */
      value: function doValidate() {
        var _get2;

        var str = this.value;
        var minstr = '';
        var maxstr = '';

        var _ref = str.match(/^(\D*)(\d*)(\D*)/) || [],
            _ref2 = _slicedToArray(_ref, 3),
            placeholder = _ref2[1],
            num = _ref2[2];

        if (num) {
          minstr = '0'.repeat(placeholder.length) + num;
          maxstr = '9'.repeat(placeholder.length) + num;
        }

        var firstNonZero = str.search(/[^0]/);
        if (firstNonZero === -1 && str.length <= this._matchFrom) return true;
        minstr = minstr.padEnd(this.maxLength, '0');
        maxstr = maxstr.padEnd(this.maxLength, '9');

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return this.from <= Number(maxstr) && Number(minstr) <= this.to && (_get2 = _get(_getPrototypeOf(MaskedRange.prototype), "doValidate", this)).call.apply(_get2, [this].concat(args));
      }
    }, {
      key: "_matchFrom",

      /**
        Optionally sets max length of pattern.
        Used when pattern length is longer then `to` param length. Pads zeros at start in this case.
      */

      /** Min bound */

      /** Max bound */
      get: function get$$1() {
        return this.maxLength - String(this.from).length;
      }
    }, {
      key: "isComplete",
      get: function get$$1() {
        return _get(_getPrototypeOf(MaskedRange.prototype), "isComplete", this) && Boolean(this.value);
      }
    }]);

    return MaskedRange;
  }(MaskedPattern);

  /** Date mask */

  var MaskedDate =
  /*#__PURE__*/
  function (_MaskedPattern) {
    _inherits(MaskedDate, _MaskedPattern);

    /** Parse string to Date */

    /** Format Date to string */

    /** Pattern mask for date according to {@link MaskedDate#format} */

    /** Start date */

    /** End date */

    /**
      @param {Object} opts
    */
    function MaskedDate(opts) {
      _classCallCheck(this, MaskedDate);

      return _possibleConstructorReturn(this, _getPrototypeOf(MaskedDate).call(this, _objectSpread({}, MaskedDate.DEFAULTS, opts)));
    }
    /**
      @override
    */


    _createClass(MaskedDate, [{
      key: "_update",
      value: function _update(opts) {
        if (opts.mask === Date) delete opts.mask;

        if (opts.pattern) {
          opts.mask = opts.pattern;
          delete opts.pattern;
        }

        var blocks = opts.blocks;
        opts.blocks = _extends({}, MaskedDate.GET_DEFAULT_BLOCKS()); // adjust year block

        if (opts.min) opts.blocks.Y.from = opts.min.getFullYear();
        if (opts.max) opts.blocks.Y.to = opts.max.getFullYear();

        if (opts.min && opts.max && opts.blocks.Y.from === opts.blocks.Y.to) {
          opts.blocks.m.from = opts.min.getMonth() + 1;
          opts.blocks.m.to = opts.max.getMonth() + 1;

          if (opts.blocks.m.from === opts.blocks.m.to) {
            opts.blocks.d.from = opts.min.getDate();
            opts.blocks.d.to = opts.max.getDate();
          }
        }

        _extends(opts.blocks, blocks);

        _get(_getPrototypeOf(MaskedDate.prototype), "_update", this).call(this, opts);
      }
      /**
        @override
      */

    }, {
      key: "doValidate",
      value: function doValidate() {
        var _get2;

        var date = this.date;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return (_get2 = _get(_getPrototypeOf(MaskedDate.prototype), "doValidate", this)).call.apply(_get2, [this].concat(args)) && (!this.isComplete || this.isDateExist(this.value) && date != null && (this.min == null || this.min <= date) && (this.max == null || date <= this.max));
      }
      /** Checks if date is exists */

    }, {
      key: "isDateExist",
      value: function isDateExist(str) {
        return this.format(this.parse(str)) === str;
      }
      /** Parsed Date */

    }, {
      key: "date",
      get: function get$$1() {
        return this.isComplete ? this.parse(this.value) : null;
      },
      set: function set(date) {
        this.value = this.format(date);
      }
      /**
        @override
      */

    }, {
      key: "typedValue",
      get: function get$$1() {
        return this.date;
      },
      set: function set(value) {
        this.date = value;
      }
    }]);

    return MaskedDate;
  }(MaskedPattern);
  MaskedDate.DEFAULTS = {
    pattern: 'd{.}`m{.}`Y',
    format: function format(date) {
      var day = String(date.getDate()).padStart(2, '0');
      var month = String(date.getMonth() + 1).padStart(2, '0');
      var year = date.getFullYear();
      return [day, month, year].join('.');
    },
    parse: function parse(str) {
      var _str$split = str.split('.'),
          _str$split2 = _slicedToArray(_str$split, 3),
          day = _str$split2[0],
          month = _str$split2[1],
          year = _str$split2[2];

      return new Date(year, month - 1, day);
    }
  };

  MaskedDate.GET_DEFAULT_BLOCKS = function () {
    return {
      d: {
        mask: MaskedRange,
        from: 1,
        to: 31,
        maxLength: 2
      },
      m: {
        mask: MaskedRange,
        from: 1,
        to: 12,
        maxLength: 2
      },
      Y: {
        mask: MaskedRange,
        from: 1900,
        to: 9999
      }
    };
  };

  /**
    Generic element API to use with mask
    @interface
  */
  var MaskElement =
  /*#__PURE__*/
  function () {
    function MaskElement() {
      _classCallCheck(this, MaskElement);
    }

    _createClass(MaskElement, [{
      key: "select",

      /** Safely sets element selection */
      value: function select(start, end) {
        if (start == null || end == null || start === this.selectionStart && end === this.selectionEnd) return;

        try {
          this._unsafeSelect(start, end);
        } catch (e) {}
      }
      /** Should be overriden in subclasses */

    }, {
      key: "_unsafeSelect",
      value: function _unsafeSelect(start, end) {}
      /** Should be overriden in subclasses */

    }, {
      key: "bindEvents",

      /** Should be overriden in subclasses */
      value: function bindEvents(handlers) {}
      /** Should be overriden in subclasses */

    }, {
      key: "unbindEvents",
      value: function unbindEvents() {}
    }, {
      key: "selectionStart",

      /** */

      /** */

      /** */

      /** Safely returns selection start */
      get: function get() {
        var start;

        try {
          start = this._unsafeSelectionStart;
        } catch (e) {}

        return start != null ? start : this.value.length;
      }
      /** Safely returns selection end */

    }, {
      key: "selectionEnd",
      get: function get() {
        var end;

        try {
          end = this._unsafeSelectionEnd;
        } catch (e) {}

        return end != null ? end : this.value.length;
      }
    }, {
      key: "isActive",
      get: function get() {
        return false;
      }
    }]);

    return MaskElement;
  }();

  /** Bridge between HTMLElement and {@link Masked} */

  var HTMLMaskElement =
  /*#__PURE__*/
  function (_MaskElement) {
    _inherits(HTMLMaskElement, _MaskElement);

    /** Mapping between HTMLElement events and mask internal events */

    /** HTMLElement to use mask on */

    /**
      @param {HTMLInputElement|HTMLTextAreaElement} input
    */
    function HTMLMaskElement(input) {
      var _this;

      _classCallCheck(this, HTMLMaskElement);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(HTMLMaskElement).call(this));
      _this.input = input;
      _this._handlers = {};
      return _this;
    }
    /**
      Is element in focus
      @readonly
    */


    _createClass(HTMLMaskElement, [{
      key: "_unsafeSelect",

      /**
        Sets HTMLElement selection
        @override
      */
      value: function _unsafeSelect(start, end) {
        this.input.setSelectionRange(start, end);
      }
      /**
        HTMLElement value
        @override
      */

    }, {
      key: "bindEvents",

      /**
        Binds HTMLElement events to mask internal events
        @override
      */
      value: function bindEvents(handlers) {
        var _this2 = this;

        Object.keys(handlers).forEach(function (event) {
          return _this2._toggleEventHandler(HTMLMaskElement.EVENTS_MAP[event], handlers[event]);
        });
      }
      /**
        Unbinds HTMLElement events to mask internal events
        @override
      */

    }, {
      key: "unbindEvents",
      value: function unbindEvents() {
        var _this3 = this;

        Object.keys(this._handlers).forEach(function (event) {
          return _this3._toggleEventHandler(event);
        });
      }
      /** */

    }, {
      key: "_toggleEventHandler",
      value: function _toggleEventHandler(event, handler) {
        if (this._handlers[event]) {
          this.input.removeEventListener(event, this._handlers[event]);
          delete this._handlers[event];
        }

        if (handler) {
          this.input.addEventListener(event, handler);
          this._handlers[event] = handler;
        }
      }
    }, {
      key: "isActive",
      get: function get() {
        return this.input === document.activeElement;
      }
      /**
        Returns HTMLElement selection start
        @override
      */

    }, {
      key: "_unsafeSelectionStart",
      get: function get() {
        return this.input.selectionStart;
      }
      /**
        Returns HTMLElement selection end
        @override
      */

    }, {
      key: "_unsafeSelectionEnd",
      get: function get() {
        return this.input.selectionEnd;
      }
    }, {
      key: "value",
      get: function get() {
        return this.input.value;
      },
      set: function set(value) {
        this.input.value = value;
      }
    }]);

    return HTMLMaskElement;
  }(MaskElement);
  HTMLMaskElement.EVENTS_MAP = {
    selectionChange: 'keydown',
    input: 'input',
    drop: 'drop',
    click: 'click',
    focus: 'focus',
    commit: 'change'
  };

  /** Listens to element events and controls changes between element and {@link Masked} */

  var InputMask =
  /*#__PURE__*/
  function () {
    /**
      View element
      @readonly
    */

    /**
      Internal {@link Masked} model
      @readonly
    */

    /**
      @param {MaskElement|HTMLInputElement|HTMLTextAreaElement} el
      @param {Object} opts
    */
    function InputMask(el, opts) {
      _classCallCheck(this, InputMask);

      this.el = el instanceof MaskElement ? el : new HTMLMaskElement(el);
      this.masked = createMask(opts);
      this._listeners = {};
      this._value = '';
      this._unmaskedValue = '';
      this._saveSelection = this._saveSelection.bind(this);
      this._onInput = this._onInput.bind(this);
      this._onChange = this._onChange.bind(this);
      this._onDrop = this._onDrop.bind(this);
      this.alignCursor = this.alignCursor.bind(this);
      this.alignCursorFriendly = this.alignCursorFriendly.bind(this);

      this._bindEvents(); // refresh


      this.updateValue();

      this._onChange();
    }
    /** Read or update mask */


    _createClass(InputMask, [{
      key: "_bindEvents",

      /**
        Starts listening to element events
        @protected
      */
      value: function _bindEvents() {
        this.el.bindEvents({
          selectionChange: this._saveSelection,
          input: this._onInput,
          drop: this._onDrop,
          click: this.alignCursorFriendly,
          focus: this.alignCursorFriendly,
          commit: this._onChange
        });
      }
      /**
        Stops listening to element events
        @protected
       */

    }, {
      key: "_unbindEvents",
      value: function _unbindEvents() {
        this.el.unbindEvents();
      }
      /**
        Fires custom event
        @protected
       */

    }, {
      key: "_fireEvent",
      value: function _fireEvent(ev) {
        var listeners = this._listeners[ev];
        if (!listeners) return;
        listeners.forEach(function (l) {
          return l();
        });
      }
      /**
        Current selection start
        @readonly
      */

    }, {
      key: "_saveSelection",

      /**
        Stores current selection
        @protected
      */
      value: function _saveSelection()
      /* ev */
      {
        if (this.value !== this.el.value) {
          console.warn('Element value was changed outside of mask. Syncronize mask using `mask.updateValue()` to work properly.'); // eslint-disable-line no-console
        }

        this._selection = {
          start: this.selectionStart,
          end: this.cursorPos
        };
      }
      /** Syncronizes model value from view */

    }, {
      key: "updateValue",
      value: function updateValue() {
        this.masked.value = this.el.value;
      }
      /** Syncronizes view from model value, fires change events */

    }, {
      key: "updateControl",
      value: function updateControl() {
        var newUnmaskedValue = this.masked.unmaskedValue;
        var newValue = this.masked.value;
        var isChanged = this.unmaskedValue !== newUnmaskedValue || this.value !== newValue;
        this._unmaskedValue = newUnmaskedValue;
        this._value = newValue;
        if (this.el.value !== newValue) this.el.value = newValue;
        if (isChanged) this._fireChangeEvents();
      }
      /** Updates options with deep equal check, recreates @{link Masked} model if mask type changes */

    }, {
      key: "updateOptions",
      value: function updateOptions(opts) {
        opts = _objectSpread({}, opts);
        this.mask = opts.mask;
        delete opts.mask; // check if changed

        if (!objectIncludes(this.masked, opts)) {
          this.masked.updateOptions(opts);
        }

        this.updateControl();
      }
      /** Updates cursor */

    }, {
      key: "updateCursor",
      value: function updateCursor(cursorPos) {
        if (cursorPos == null) return;
        this.cursorPos = cursorPos; // also queue change cursor for mobile browsers

        this._delayUpdateCursor(cursorPos);
      }
      /**
        Delays cursor update to support mobile browsers
        @private
      */

    }, {
      key: "_delayUpdateCursor",
      value: function _delayUpdateCursor(cursorPos) {
        var _this = this;

        this._abortUpdateCursor();

        this._changingCursorPos = cursorPos;
        this._cursorChanging = setTimeout(function () {
          if (!_this.el) return; // if was destroyed

          _this.cursorPos = _this._changingCursorPos;

          _this._abortUpdateCursor();
        }, 10);
      }
      /**
        Fires custom events
        @protected
      */

    }, {
      key: "_fireChangeEvents",
      value: function _fireChangeEvents() {
        this._fireEvent('accept');

        if (this.masked.isComplete) this._fireEvent('complete');
      }
      /**
        Aborts delayed cursor update
        @private
      */

    }, {
      key: "_abortUpdateCursor",
      value: function _abortUpdateCursor() {
        if (this._cursorChanging) {
          clearTimeout(this._cursorChanging);
          delete this._cursorChanging;
        }
      }
      /** Aligns cursor to nearest available position */

    }, {
      key: "alignCursor",
      value: function alignCursor() {
        this.cursorPos = this.masked.nearestInputPos(this.cursorPos, DIRECTION.LEFT);
      }
      /** Aligns cursor only if selection is empty */

    }, {
      key: "alignCursorFriendly",
      value: function alignCursorFriendly() {
        if (this.selectionStart !== this.cursorPos) return;
        this.alignCursor();
      }
      /** Adds listener on custom event */

    }, {
      key: "on",
      value: function on(ev, handler) {
        if (!this._listeners[ev]) this._listeners[ev] = [];

        this._listeners[ev].push(handler);

        return this;
      }
      /** Removes custom event listener */

    }, {
      key: "off",
      value: function off(ev, handler) {
        if (!this._listeners[ev]) return;

        if (!handler) {
          delete this._listeners[ev];
          return;
        }

        var hIndex = this._listeners[ev].indexOf(handler);

        if (hIndex >= 0) this._listeners[ev].splice(hIndex, 1);
        return this;
      }
      /** Handles view input event */

    }, {
      key: "_onInput",
      value: function _onInput() {
        this._abortUpdateCursor(); // fix strange IE behavior


        if (!this._selection) return this.updateValue();
        var details = new ActionDetails( // new state
        this.el.value, this.cursorPos, // old state
        this.value, this._selection);
        var offset = this.masked.splice(details.startChangePos, details.removed.length, details.inserted, details.removeDirection).offset;
        var cursorPos = this.masked.nearestInputPos(details.startChangePos + offset, details.removeDirection);
        this.updateControl();
        this.updateCursor(cursorPos);
      }
      /** Handles view change event and commits model value */

    }, {
      key: "_onChange",
      value: function _onChange() {
        if (this.value !== this.el.value) {
          this.updateValue();
        }

        this.masked.doCommit();
        this.updateControl();
      }
      /** Handles view drop event, prevents by default */

    }, {
      key: "_onDrop",
      value: function _onDrop(ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      /** Unbind view events and removes element reference */

    }, {
      key: "destroy",
      value: function destroy() {
        this._unbindEvents(); // $FlowFixMe why not do so?


        this._listeners.length = 0;
        delete this.el;
      }
    }, {
      key: "mask",
      get: function get() {
        return this.masked.mask;
      },
      set: function set(mask) {
        if (mask == null || mask === this.masked.mask || mask === Date && this.masked instanceof MaskedDate) return;

        if (this.masked.constructor === maskedClass(mask)) {
          this.masked.updateOptions({
            mask: mask
          });
          return;
        }

        var masked = createMask({
          mask: mask
        });
        masked.unmaskedValue = this.masked.unmaskedValue;
        this.masked = masked;
      }
      /** Raw value */

    }, {
      key: "value",
      get: function get() {
        return this._value;
      },
      set: function set(str) {
        this.masked.value = str;
        this.updateControl();
        this.alignCursor();
      }
      /** Unmasked value */

    }, {
      key: "unmaskedValue",
      get: function get() {
        return this._unmaskedValue;
      },
      set: function set(str) {
        this.masked.unmaskedValue = str;
        this.updateControl();
        this.alignCursor();
      }
      /** Typed unmasked value */

    }, {
      key: "typedValue",
      get: function get() {
        return this.masked.typedValue;
      },
      set: function set(val) {
        this.masked.typedValue = val;
        this.updateControl();
        this.alignCursor();
      }
    }, {
      key: "selectionStart",
      get: function get() {
        return this._cursorChanging ? this._changingCursorPos : this.el.selectionStart;
      }
      /** Current cursor position */

    }, {
      key: "cursorPos",
      get: function get() {
        return this._cursorChanging ? this._changingCursorPos : this.el.selectionEnd;
      },
      set: function set(pos) {
        if (!this.el.isActive) return;
        this.el.select(pos, pos);

        this._saveSelection();
      }
    }]);

    return InputMask;
  }();

  /** Pattern which validates enum values */

  var MaskedEnum =
  /*#__PURE__*/
  function (_MaskedPattern) {
    _inherits(MaskedEnum, _MaskedPattern);

    function MaskedEnum() {
      _classCallCheck(this, MaskedEnum);

      return _possibleConstructorReturn(this, _getPrototypeOf(MaskedEnum).apply(this, arguments));
    }

    _createClass(MaskedEnum, [{
      key: "_update",

      /**
        @override
        @param {Object} opts
      */
      value: function _update(opts) {
        // TODO type
        if (opts.enum) opts.mask = '*'.repeat(opts.enum[0].length);

        _get(_getPrototypeOf(MaskedEnum.prototype), "_update", this).call(this, opts);
      }
      /**
        @override
      */

    }, {
      key: "doValidate",
      value: function doValidate() {
        var _this = this,
            _get2;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return this.enum.some(function (e) {
          return e.indexOf(_this.unmaskedValue) >= 0;
        }) && (_get2 = _get(_getPrototypeOf(MaskedEnum.prototype), "doValidate", this)).call.apply(_get2, [this].concat(args));
      }
    }]);

    return MaskedEnum;
  }(MaskedPattern);

  /**
    Number mask
    @param {Object} opts
    @param {string} opts.radix - Single char
    @param {string} opts.thousandsSeparator - Single char
    @param {Array<string>} opts.mapToRadix - Array of single chars
    @param {number} opts.min
    @param {number} opts.max
    @param {number} opts.scale - Digits after point
    @param {boolean} opts.signed - Allow negative
    @param {boolean} opts.normalizeZeros - Flag to remove leading and trailing zeros in the end of editing
    @param {boolean} opts.padFractionalZeros - Flag to pad trailing zeros after point in the end of editing
  */
  var MaskedNumber =
  /*#__PURE__*/
  function (_Masked) {
    _inherits(MaskedNumber, _Masked);

    /** Single char */

    /** Single char */

    /** Array of single chars */

    /** */

    /** */

    /** Digits after point */

    /** */

    /** Flag to remove leading and trailing zeros in the end of editing */

    /** Flag to pad trailing zeros after point in the end of editing */
    function MaskedNumber(opts) {
      _classCallCheck(this, MaskedNumber);

      return _possibleConstructorReturn(this, _getPrototypeOf(MaskedNumber).call(this, _objectSpread({}, MaskedNumber.DEFAULTS, opts)));
    }
    /**
      @override
    */


    _createClass(MaskedNumber, [{
      key: "_update",
      value: function _update(opts) {
        _get(_getPrototypeOf(MaskedNumber.prototype), "_update", this).call(this, opts);

        this._updateRegExps();
      }
      /** */

    }, {
      key: "_updateRegExps",
      value: function _updateRegExps() {
        // use different regexp to process user input (more strict, input suffix) and tail shifting
        var start = '^';
        var midInput = '';
        var mid = '';

        if (this.allowNegative) {
          midInput += '([+|\\-]?|([+|\\-]?(0|([1-9]+\\d*))))';
          mid += '[+|\\-]?';
        } else {
          midInput += '(0|([1-9]+\\d*))';
        }

        mid += '\\d*';
        var end = (this.scale ? '(' + escapeRegExp(this.radix) + '\\d{0,' + this.scale + '})?' : '') + '$';
        this._numberRegExpInput = new RegExp(start + midInput + end);
        this._numberRegExp = new RegExp(start + mid + end);
        this._mapToRadixRegExp = new RegExp('[' + this.mapToRadix.map(escapeRegExp).join('') + ']', 'g');
        this._thousandsSeparatorRegExp = new RegExp(escapeRegExp(this.thousandsSeparator), 'g');
      }
      /**
        @override
      */

    }, {
      key: "extractTail",
      value: function extractTail() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;

        var tail = _get(_getPrototypeOf(MaskedNumber.prototype), "extractTail", this).call(this, fromPos, toPos); // $FlowFixMe no ideas


        return _objectSpread({}, tail, {
          value: this._removeThousandsSeparators(tail.value)
        });
      }
      /** */

    }, {
      key: "_removeThousandsSeparators",
      value: function _removeThousandsSeparators(value) {
        return value.replace(this._thousandsSeparatorRegExp, '');
      }
      /** */

    }, {
      key: "_insertThousandsSeparators",
      value: function _insertThousandsSeparators(value) {
        // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        var parts = value.split(this.radix);
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandsSeparator);
        return parts.join(this.radix);
      }
      /**
        @override
      */

    }, {
      key: "doPrepare",
      value: function doPrepare(str) {
        var _get2;

        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        return (_get2 = _get(_getPrototypeOf(MaskedNumber.prototype), "doPrepare", this)).call.apply(_get2, [this, this._removeThousandsSeparators(str.replace(this._mapToRadixRegExp, this.radix))].concat(args));
      }
      /** */

    }, {
      key: "_separatorsCount",
      value: function _separatorsCount() {
        var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._value;

        var rawValueLength = this._removeThousandsSeparators(value).length;

        var valueWithSeparatorsLength = rawValueLength;

        for (var pos = 0; pos <= valueWithSeparatorsLength; ++pos) {
          if (this._value[pos] === this.thousandsSeparator) ++valueWithSeparatorsLength;
        }

        return valueWithSeparatorsLength - rawValueLength;
      }
      /**
        @override
      */

    }, {
      key: "_appendCharRaw",
      value: function _appendCharRaw(ch) {
        var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        if (!this.thousandsSeparator) return _get(_getPrototypeOf(MaskedNumber.prototype), "_appendCharRaw", this).call(this, ch, flags);

        var previousBeforeTailSeparatorsCount = this._separatorsCount(flags.tail && this._beforeTailState ? this._beforeTailState._value : this._value);

        this._value = this._removeThousandsSeparators(this.value);

        var appendDetails = _get(_getPrototypeOf(MaskedNumber.prototype), "_appendCharRaw", this).call(this, ch, flags);

        this._value = this._insertThousandsSeparators(this._value);

        var beforeTailSeparatorsCount = this._separatorsCount(flags.tail && this._beforeTailState ? this._beforeTailState._value : this._value);

        appendDetails.tailShift += beforeTailSeparatorsCount - previousBeforeTailSeparatorsCount;
        return appendDetails;
      }
      /**
        @override
      */

    }, {
      key: "remove",
      value: function remove() {
        var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
        var valueBeforePos = this.value.slice(0, fromPos);
        var valueAfterPos = this.value.slice(toPos);

        var previousBeforeTailSeparatorsCount = this._separatorsCount(valueBeforePos);

        this._value = this._insertThousandsSeparators(this._removeThousandsSeparators(valueBeforePos + valueAfterPos));

        var beforeTailSeparatorsCount = this._separatorsCount(valueBeforePos);

        return new ChangeDetails({
          tailShift: beforeTailSeparatorsCount - previousBeforeTailSeparatorsCount
        });
      }
      /**
        @override
      */

    }, {
      key: "nearestInputPos",
      value: function nearestInputPos(cursorPos, direction) {
        if (!direction) return cursorPos;
        var nextPos = indexInDirection(cursorPos, direction);
        if (this.value[nextPos] === this.thousandsSeparator) cursorPos = posInDirection(cursorPos, direction);
        return cursorPos;
      }
      /**
        @override
      */

    }, {
      key: "doValidate",
      value: function doValidate(flags) {
        var regexp = flags.input ? this._numberRegExpInput : this._numberRegExp; // validate as string

        var valid = regexp.test(this._removeThousandsSeparators(this.value));

        if (valid) {
          // validate as number
          var number = this.number;
          valid = valid && !isNaN(number) && ( // check min bound for negative values
          this.min == null || this.min >= 0 || this.min <= this.number) && ( // check max bound for positive values
          this.max == null || this.max <= 0 || this.number <= this.max);
        }

        return valid && _get(_getPrototypeOf(MaskedNumber.prototype), "doValidate", this).call(this, flags);
      }
      /**
        @override
      */

    }, {
      key: "doCommit",
      value: function doCommit() {
        var number = this.number;
        var validnum = number; // check bounds

        if (this.min != null) validnum = Math.max(validnum, this.min);
        if (this.max != null) validnum = Math.min(validnum, this.max);
        if (validnum !== number) this.unmaskedValue = String(validnum);
        var formatted = this.value;
        if (this.normalizeZeros) formatted = this._normalizeZeros(formatted);
        if (this.padFractionalZeros) formatted = this._padFractionalZeros(formatted);
        this._value = this._insertThousandsSeparators(formatted);

        _get(_getPrototypeOf(MaskedNumber.prototype), "doCommit", this).call(this);
      }
      /** */

    }, {
      key: "_normalizeZeros",
      value: function _normalizeZeros(value) {
        var parts = this._removeThousandsSeparators(value).split(this.radix); // remove leading zeros


        parts[0] = parts[0].replace(/^(\D*)(0*)(\d*)/, function (match, sign, zeros, num) {
          return sign + num;
        }); // add leading zero

        if (value.length && !/\d$/.test(parts[0])) parts[0] = parts[0] + '0';

        if (parts.length > 1) {
          parts[1] = parts[1].replace(/0*$/, ''); // remove trailing zeros

          if (!parts[1].length) parts.length = 1; // remove fractional
        }

        return this._insertThousandsSeparators(parts.join(this.radix));
      }
      /** */

    }, {
      key: "_padFractionalZeros",
      value: function _padFractionalZeros(value) {
        if (!value) return value;
        var parts = value.split(this.radix);
        if (parts.length < 2) parts.push('');
        parts[1] = parts[1].padEnd(this.scale, '0');
        return parts.join(this.radix);
      }
      /**
        @override
      */

    }, {
      key: "unmaskedValue",
      get: function get$$1() {
        return this._removeThousandsSeparators(this._normalizeZeros(this.value)).replace(this.radix, '.');
      },
      set: function set$$1(unmaskedValue) {
        _set(_getPrototypeOf(MaskedNumber.prototype), "unmaskedValue", unmaskedValue.replace('.', this.radix), this, true);
      }
      /** Parsed Number */

    }, {
      key: "number",
      get: function get$$1() {
        return Number(this.unmaskedValue);
      },
      set: function set$$1(number) {
        this.unmaskedValue = String(number);
      }
      /**
        @override
      */

    }, {
      key: "typedValue",
      get: function get$$1() {
        return this.number;
      },
      set: function set$$1(value) {
        this.number = value;
      }
      /**
        Is negative allowed
        @readonly
      */

    }, {
      key: "allowNegative",
      get: function get$$1() {
        return this.signed || this.min != null && this.min < 0 || this.max != null && this.max < 0;
      }
    }]);

    return MaskedNumber;
  }(Masked);
  MaskedNumber.DEFAULTS = {
    radix: ',',
    thousandsSeparator: '',
    mapToRadix: ['.'],
    scale: 2,
    signed: false,
    normalizeZeros: true,
    padFractionalZeros: false
  };

  /** Masking by RegExp */

  var MaskedRegExp =
  /*#__PURE__*/
  function (_Masked) {
    _inherits(MaskedRegExp, _Masked);

    function MaskedRegExp() {
      _classCallCheck(this, MaskedRegExp);

      return _possibleConstructorReturn(this, _getPrototypeOf(MaskedRegExp).apply(this, arguments));
    }

    _createClass(MaskedRegExp, [{
      key: "_update",

      /**
        @override
        @param {Object} opts
      */
      value: function _update(opts) {
        opts.validate = function (value) {
          return value.search(opts.mask) >= 0;
        };

        _get(_getPrototypeOf(MaskedRegExp.prototype), "_update", this).call(this, opts);
      }
    }]);

    return MaskedRegExp;
  }(Masked);

  /** Masking by custom Function */

  var MaskedFunction =
  /*#__PURE__*/
  function (_Masked) {
    _inherits(MaskedFunction, _Masked);

    function MaskedFunction() {
      _classCallCheck(this, MaskedFunction);

      return _possibleConstructorReturn(this, _getPrototypeOf(MaskedFunction).apply(this, arguments));
    }

    _createClass(MaskedFunction, [{
      key: "_update",

      /**
        @override
        @param {Object} opts
      */
      value: function _update(opts) {
        opts.validate = opts.mask;

        _get(_getPrototypeOf(MaskedFunction.prototype), "_update", this).call(this, opts);
      }
    }]);

    return MaskedFunction;
  }(Masked);

  /** Dynamic mask for choosing apropriate mask in run-time */
  var MaskedDynamic =
  /*#__PURE__*/
  function (_Masked) {
    _inherits(MaskedDynamic, _Masked);

    /** Currently chosen mask */

    /** Compliled {@link Masked} options */

    /** Chooses {@link Masked} depending on input value */

    /**
      @param {Object} opts
    */
    function MaskedDynamic(opts) {
      var _this;

      _classCallCheck(this, MaskedDynamic);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(MaskedDynamic).call(this, _objectSpread({}, MaskedDynamic.DEFAULTS, opts)));
      _this.currentMask = null;
      return _this;
    }
    /**
      @override
    */


    _createClass(MaskedDynamic, [{
      key: "_update",
      value: function _update(opts) {
        _get(_getPrototypeOf(MaskedDynamic.prototype), "_update", this).call(this, opts); // mask could be totally dynamic with only `dispatch` option


        this.compiledMasks = Array.isArray(opts.mask) ? opts.mask.map(function (m) {
          return createMask(m);
        }) : [];
      }
      /**
        @override
      */

    }, {
      key: "_appendCharRaw",
      value: function _appendCharRaw() {
        var details = this._applyDispatch.apply(this, arguments);

        if (this.currentMask) {
          var _this$currentMask;

          details.aggregate((_this$currentMask = this.currentMask)._appendChar.apply(_this$currentMask, arguments));
        }

        return details;
      }
      /**
        @override
      */

    }, {
      key: "_storeBeforeTailState",
      value: function _storeBeforeTailState() {
        _get(_getPrototypeOf(MaskedDynamic.prototype), "_storeBeforeTailState", this).call(this);

        if (this.currentMask) this.currentMask._storeBeforeTailState();
      }
      /**
        @override
      */

    }, {
      key: "_restoreBeforeTailState",
      value: function _restoreBeforeTailState() {
        _get(_getPrototypeOf(MaskedDynamic.prototype), "_restoreBeforeTailState", this).call(this);

        if (this.currentMask) this.currentMask._restoreBeforeTailState();
      }
      /**
        @override
      */

    }, {
      key: "_resetBeforeTailState",
      value: function _resetBeforeTailState() {
        _get(_getPrototypeOf(MaskedDynamic.prototype), "_resetBeforeTailState", this).call(this);

        if (this.currentMask) this.currentMask._resetBeforeTailState();
      }
    }, {
      key: "_applyDispatch",
      value: function _applyDispatch() {
        var appended = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
        var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var prevValueBeforeTail = flags.tail && this._beforeTailState ? this._beforeTailState._value : this.value;
        var inputValue = this.rawInputValue;
        var insertValue = flags.tail && this._beforeTailState ? // $FlowFixMe - tired to fight with type system
        this._beforeTailState._rawInputValue : inputValue;
        var tailValue = inputValue.slice(insertValue.length);
        var prevMask = this.currentMask;
        var details = new ChangeDetails();
        var prevMaskState = prevMask && prevMask.state;
        var prevMaskBeforeTailState = prevMask && prevMask._beforeTailState;
        this.currentMask = this.doDispatch(appended, flags); // restore state after dispatch

        if (this.currentMask) {
          if (this.currentMask !== prevMask) {
            // if mask changed reapply input
            this.currentMask.reset(); // $FlowFixMe - it's ok, we don't change current mask above

            var d = this.currentMask.append(insertValue, {
              raw: true
            });
            details.tailShift = d.inserted.length - prevValueBeforeTail.length;

            this._storeBeforeTailState();

            if (tailValue) {
              // $FlowFixMe - it's ok, we don't change current mask above
              details.tailShift += this.currentMask.append(tailValue, {
                raw: true,
                tail: true
              }).tailShift;
            }
          } else {
            // Dispatch can do something bad with state, so
            // restore prev mask state
            this.currentMask.state = prevMaskState;
            this.currentMask._beforeTailState = prevMaskBeforeTailState;
          }
        }

        return details;
      }
      /**
        @override
      */

    }, {
      key: "doDispatch",
      value: function doDispatch(appended) {
        var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        return this.dispatch(appended, this, flags);
      }
      /**
        @override
      */

    }, {
      key: "doValidate",
      value: function doValidate() {
        var _get2, _this$currentMask2;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return (_get2 = _get(_getPrototypeOf(MaskedDynamic.prototype), "doValidate", this)).call.apply(_get2, [this].concat(args)) && (!this.currentMask || (_this$currentMask2 = this.currentMask).doValidate.apply(_this$currentMask2, args));
      }
      /**
        @override
      */

    }, {
      key: "reset",
      value: function reset() {
        if (this.currentMask) this.currentMask.reset();
        this.compiledMasks.forEach(function (m) {
          return m.reset();
        });
      }
      /**
        @override
      */

    }, {
      key: "remove",

      /**
        @override
      */
      value: function remove() {
        var details = new ChangeDetails();

        if (this.currentMask) {
          var _this$currentMask3;

          details.aggregate((_this$currentMask3 = this.currentMask).remove.apply(_this$currentMask3, arguments)) // update with dispatch
          .aggregate(this._applyDispatch());
        }

        return details;
      }
      /**
        @override
      */

    }, {
      key: "extractInput",

      /**
        @override
      */
      value: function extractInput() {
        var _this$currentMask4;

        return this.currentMask ? (_this$currentMask4 = this.currentMask).extractInput.apply(_this$currentMask4, arguments) : '';
      }
      /**
        @override
      */

    }, {
      key: "extractTail",
      value: function extractTail() {
        var _this$currentMask5, _get3;

        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        return this.currentMask ? (_this$currentMask5 = this.currentMask).extractTail.apply(_this$currentMask5, args) : (_get3 = _get(_getPrototypeOf(MaskedDynamic.prototype), "extractTail", this)).call.apply(_get3, [this].concat(args));
      }
      /**
        @override
      */

    }, {
      key: "doCommit",
      value: function doCommit() {
        if (this.currentMask) this.currentMask.doCommit();

        _get(_getPrototypeOf(MaskedDynamic.prototype), "doCommit", this).call(this);
      }
      /**
        @override
      */

    }, {
      key: "nearestInputPos",
      value: function nearestInputPos() {
        var _this$currentMask6, _get4;

        for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        return this.currentMask ? (_this$currentMask6 = this.currentMask).nearestInputPos.apply(_this$currentMask6, args) : (_get4 = _get(_getPrototypeOf(MaskedDynamic.prototype), "nearestInputPos", this)).call.apply(_get4, [this].concat(args));
      }
    }, {
      key: "value",
      get: function get$$1() {
        return this.currentMask ? this.currentMask.value : '';
      },
      set: function set$$1(value) {
        _set(_getPrototypeOf(MaskedDynamic.prototype), "value", value, this, true);
      }
      /**
        @override
      */

    }, {
      key: "unmaskedValue",
      get: function get$$1() {
        return this.currentMask ? this.currentMask.unmaskedValue : '';
      },
      set: function set$$1(unmaskedValue) {
        _set(_getPrototypeOf(MaskedDynamic.prototype), "unmaskedValue", unmaskedValue, this, true);
      }
      /**
        @override
      */

    }, {
      key: "typedValue",
      get: function get$$1() {
        return this.currentMask ? this.currentMask.typedValue : '';
      } // probably typedValue should not be used with dynamic
      ,
      set: function set$$1(value) {
        var unmaskedValue = String(value); // double check it

        if (this.currentMask) {
          this.currentMask.typedValue = value;
          unmaskedValue = this.currentMask.unmaskedValue;
        }

        this.unmaskedValue = unmaskedValue;
      }
      /**
        @override
      */

    }, {
      key: "isComplete",
      get: function get$$1() {
        return !!this.currentMask && this.currentMask.isComplete;
      }
    }, {
      key: "state",
      get: function get$$1() {
        return _objectSpread({}, _get(_getPrototypeOf(MaskedDynamic.prototype), "state", this), {
          _rawInputValue: this.rawInputValue,
          compiledMasks: this.compiledMasks.map(function (m) {
            return m.state;
          }),
          currentMaskRef: this.currentMask,
          currentMask: this.currentMask && this.currentMask.state
        });
      },
      set: function set$$1(state) {
        var compiledMasks = state.compiledMasks,
            currentMaskRef = state.currentMaskRef,
            currentMask = state.currentMask,
            maskedState = _objectWithoutProperties(state, ["compiledMasks", "currentMaskRef", "currentMask"]);

        this.compiledMasks.forEach(function (m, mi) {
          return m.state = compiledMasks[mi];
        });

        if (currentMaskRef != null) {
          this.currentMask = currentMaskRef;
          this.currentMask.state = currentMask;
        }

        _set(_getPrototypeOf(MaskedDynamic.prototype), "state", maskedState, this, true);
      }
    }]);

    return MaskedDynamic;
  }(Masked);
  MaskedDynamic.DEFAULTS = {
    dispatch: function dispatch(appended, masked, flags) {
      if (!masked.compiledMasks.length) return;
      var inputValue = masked.rawInputValue; // simulate input

      var inputs = masked.compiledMasks.map(function (m, index) {
        m.rawInputValue = inputValue;
        m.append(appended, flags);
        var weight = m.rawInputValue.length;
        return {
          weight: weight,
          index: index
        };
      }); // pop masks with longer values first

      inputs.sort(function (i1, i2) {
        return i2.weight - i1.weight;
      });
      return masked.compiledMasks[inputs[0].index];
    }
  };

  /**
   * Applies mask on element.
   * @constructor
   * @param {HTMLInputElement|HTMLTextAreaElement|MaskElement} el - Element to apply mask
   * @param {Object} opts - Custom mask options
   * @return {InputMask}
   */

  function IMask(el) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    // currently available only for input-like elements
    return new InputMask(el, opts);
  }
  /** {@link InputMask} */

  IMask.InputMask = InputMask;
  /** {@link Masked} */

  IMask.Masked = Masked;
  /** {@link MaskedPattern} */

  IMask.MaskedPattern = MaskedPattern;
  /** {@link MaskedEnum} */

  IMask.MaskedEnum = MaskedEnum;
  /** {@link MaskedRange} */

  IMask.MaskedRange = MaskedRange;
  /** {@link MaskedNumber} */

  IMask.MaskedNumber = MaskedNumber;
  /** {@link MaskedDate} */

  IMask.MaskedDate = MaskedDate;
  /** {@link MaskedRegExp} */

  IMask.MaskedRegExp = MaskedRegExp;
  /** {@link MaskedFunction} */

  IMask.MaskedFunction = MaskedFunction;
  /** {@link MaskedDynamic} */

  IMask.MaskedDynamic = MaskedDynamic;
  /** {@link createMask} */

  IMask.createMask = createMask;
  /** {@link MaskElement} */

  IMask.MaskElement = MaskElement;
  /** {@link HTMLMaskElement} */

  IMask.HTMLMaskElement = HTMLMaskElement;
  g.IMask = IMask;

  return IMask;

})));
//# sourceMappingURL=imask.js.map
/*!
 * validate.js 0.12.0
 * http://validatejs.org/
 * (c) 2013-2015 Nicklas Ansman, 2013 Wrapp
 * validate.js may be freely distributed under the MIT license.
*/

(function(a,b,c){"use strict";var d=function(a,b,c){c=e.extend({},e.options,c);var f=e.runValidations(a,b,c);if(f.some(function(a){return e.isPromise(a.error)}))throw new Error("Use validate.async if you want support for promises");return d.processValidationResults(f,c)},e=d;e.extend=function(a){return[].slice.call(arguments,1).forEach(function(b){for(var c in b)a[c]=b[c]}),a},e.extend(d,{version:{major:0,minor:12,patch:0,metadata:null,toString:function(){var a=e.format("%{major}.%{minor}.%{patch}",e.version);return e.isEmpty(e.version.metadata)||(a+="+"+e.version.metadata),a}},Promise:"undefined"!=typeof Promise?Promise:null,EMPTY_STRING_REGEXP:/^\s*$/,runValidations:function(a,b,c){var d,f,g,h,i,j,k,l=[];(e.isDomElement(a)||e.isJqueryElement(a))&&(a=e.collectFormValues(a));for(d in b){g=e.getDeepObjectValue(a,d),h=e.result(b[d],g,a,d,c,b);for(f in h){if(i=e.validators[f],!i)throw k=e.format("Unknown validator %{name}",{name:f}),new Error(k);j=h[f],j=e.result(j,g,a,d,c,b),j&&l.push({attribute:d,value:g,validator:f,globalOptions:c,attributes:a,options:j,error:i.call(i,g,j,d,a,c)})}}return l},processValidationResults:function(a,b){a=e.pruneEmptyErrors(a,b),a=e.expandMultipleErrors(a,b),a=e.convertErrorMessages(a,b);var c=b.format||"grouped";if("function"!=typeof e.formatters[c])throw new Error(e.format("Unknown format %{format}",b));return a=e.formatters[c](a),e.isEmpty(a)?void 0:a},async:function(a,b,c){c=e.extend({},e.async.options,c);var d=c.wrapErrors||function(a){return a};c.cleanAttributes!==!1&&(a=e.cleanAttributes(a,b));var f=e.runValidations(a,b,c);return new e.Promise(function(g,h){e.waitForResults(f).then(function(){var i=e.processValidationResults(f,c);i?h(new d(i,c,a,b)):g(a)},function(a){h(a)})})},single:function(a,b,c){return c=e.extend({},e.single.options,c,{format:"flat",fullMessages:!1}),e({single:a},{single:b},c)},waitForResults:function(a){return a.reduce(function(a,b){return e.isPromise(b.error)?a.then(function(){return b.error.then(function(a){b.error=a||null})}):a},new e.Promise(function(a){a()}))},result:function(a){var b=[].slice.call(arguments,1);return"function"==typeof a&&(a=a.apply(null,b)),a},isNumber:function(a){return"number"==typeof a&&!isNaN(a)},isFunction:function(a){return"function"==typeof a},isInteger:function(a){return e.isNumber(a)&&a%1===0},isBoolean:function(a){return"boolean"==typeof a},isObject:function(a){return a===Object(a)},isDate:function(a){return a instanceof Date},isDefined:function(a){return null!==a&&void 0!==a},isPromise:function(a){return!!a&&e.isFunction(a.then)},isJqueryElement:function(a){return a&&e.isString(a.jquery)},isDomElement:function(a){return a&&a.querySelectorAll&&a.querySelector?e.isObject(document)&&a===document?!0:"object"==typeof HTMLElement?a instanceof HTMLElement:a&&"object"==typeof a&&null!==a&&1===a.nodeType&&"string"==typeof a.nodeName:!1},isEmpty:function(a){var b;if(!e.isDefined(a))return!0;if(e.isFunction(a))return!1;if(e.isString(a))return e.EMPTY_STRING_REGEXP.test(a);if(e.isArray(a))return 0===a.length;if(e.isDate(a))return!1;if(e.isObject(a)){for(b in a)return!1;return!0}return!1},format:e.extend(function(a,b){return e.isString(a)?a.replace(e.format.FORMAT_REGEXP,function(a,c,d){return"%"===c?"%{"+d+"}":String(b[d])}):a},{FORMAT_REGEXP:/(%?)%\{([^\}]+)\}/g}),prettify:function(a){return e.isNumber(a)?100*a%1===0?""+a:parseFloat(Math.round(100*a)/100).toFixed(2):e.isArray(a)?a.map(function(a){return e.prettify(a)}).join(", "):e.isObject(a)?a.toString():(a=""+a,a.replace(/([^\s])\.([^\s])/g,"$1 $2").replace(/\\+/g,"").replace(/[_-]/g," ").replace(/([a-z])([A-Z])/g,function(a,b,c){return""+b+" "+c.toLowerCase()}).toLowerCase())},stringifyValue:function(a,b){var c=b&&b.prettify||e.prettify;return c(a)},isString:function(a){return"string"==typeof a},isArray:function(a){return"[object Array]"==={}.toString.call(a)},isHash:function(a){return e.isObject(a)&&!e.isArray(a)&&!e.isFunction(a)},contains:function(a,b){return e.isDefined(a)?e.isArray(a)?-1!==a.indexOf(b):b in a:!1},unique:function(a){return e.isArray(a)?a.filter(function(a,b,c){return c.indexOf(a)==b}):a},forEachKeyInKeypath:function(a,b,c){if(e.isString(b)){var d,f="",g=!1;for(d=0;d<b.length;++d)switch(b[d]){case".":g?(g=!1,f+="."):(a=c(a,f,!1),f="");break;case"\\":g?(g=!1,f+="\\"):g=!0;break;default:g=!1,f+=b[d]}return c(a,f,!0)}},getDeepObjectValue:function(a,b){return e.isObject(a)?e.forEachKeyInKeypath(a,b,function(a,b){return e.isObject(a)?a[b]:void 0}):void 0},collectFormValues:function(a,b){var c,d,f,g,h,i,j={};if(e.isJqueryElement(a)&&(a=a[0]),!a)return j;for(b=b||{},g=a.querySelectorAll("input[name], textarea[name]"),c=0;c<g.length;++c)f=g.item(c),e.isDefined(f.getAttribute("data-ignored"))||(name=f.name.replace(/\./g,"\\\\."),i=e.sanitizeFormValue(f.value,b),"number"===f.type?i=i?+i:null:"checkbox"===f.type?f.attributes.value?f.checked||(i=j[name]||null):i=f.checked:"radio"===f.type&&(f.checked||(i=j[name]||null)),j[name]=i);for(g=a.querySelectorAll("select[name]"),c=0;c<g.length;++c)if(f=g.item(c),!e.isDefined(f.getAttribute("data-ignored"))){if(f.multiple){i=[];for(d in f.options)h=f.options[d],h&&h.selected&&i.push(e.sanitizeFormValue(h.value,b))}else{var k="undefined"!=typeof f.options[f.selectedIndex]?f.options[f.selectedIndex].value:"";i=e.sanitizeFormValue(k,b)}j[f.name]=i}return j},sanitizeFormValue:function(a,b){return b.trim&&e.isString(a)&&(a=a.trim()),b.nullify!==!1&&""===a?null:a},capitalize:function(a){return e.isString(a)?a[0].toUpperCase()+a.slice(1):a},pruneEmptyErrors:function(a){return a.filter(function(a){return!e.isEmpty(a.error)})},expandMultipleErrors:function(a){var b=[];return a.forEach(function(a){e.isArray(a.error)?a.error.forEach(function(c){b.push(e.extend({},a,{error:c}))}):b.push(a)}),b},convertErrorMessages:function(a,b){b=b||{};var c=[],d=b.prettify||e.prettify;return a.forEach(function(a){var f=e.result(a.error,a.value,a.attribute,a.options,a.attributes,a.globalOptions);return e.isString(f)?("^"===f[0]?f=f.slice(1):b.fullMessages!==!1&&(f=e.capitalize(d(a.attribute))+" "+f),f=f.replace(/\\\^/g,"^"),f=e.format(f,{value:e.stringifyValue(a.value,b)}),void c.push(e.extend({},a,{error:f}))):void c.push(a)}),c},groupErrorsByAttribute:function(a){var b={};return a.forEach(function(a){var c=b[a.attribute];c?c.push(a):b[a.attribute]=[a]}),b},flattenErrorsToArray:function(a){return a.map(function(a){return a.error}).filter(function(a,b,c){return c.indexOf(a)===b})},cleanAttributes:function(a,b){function c(a,b,c){return e.isObject(a[b])?a[b]:a[b]=c?!0:{}}function d(a){var b,d={};for(b in a)a[b]&&e.forEachKeyInKeypath(d,b,c);return d}function f(a,b){if(!e.isObject(a))return a;var c,d,g=e.extend({},a);for(d in a)c=b[d],e.isObject(c)?g[d]=f(g[d],c):c||delete g[d];return g}return e.isObject(b)&&e.isObject(a)?(b=d(b),f(a,b)):{}},exposeModule:function(a,b,c,d,e){c?(d&&d.exports&&(c=d.exports=a),c.validate=a):(b.validate=a,a.isFunction(e)&&e.amd&&e([],function(){return a}))},warn:function(a){"undefined"!=typeof console&&console.warn&&console.warn("[validate.js] "+a)},error:function(a){"undefined"!=typeof console&&console.error&&console.error("[validate.js] "+a)}}),d.validators={presence:function(a,b){return b=e.extend({},this.options,b),(b.allowEmpty!==!1?!e.isDefined(a):e.isEmpty(a))?b.message||this.message||"can't be blank":void 0},length:function(a,b,c){if(e.isDefined(a)){b=e.extend({},this.options,b);var d,f=b.is,g=b.maximum,h=b.minimum,i=b.tokenizer||function(a){return a},j=[];a=i(a);var k=a.length;return e.isNumber(k)?(e.isNumber(f)&&k!==f&&(d=b.wrongLength||this.wrongLength||"is the wrong length (should be %{count} characters)",j.push(e.format(d,{count:f}))),e.isNumber(h)&&h>k&&(d=b.tooShort||this.tooShort||"is too short (minimum is %{count} characters)",j.push(e.format(d,{count:h}))),e.isNumber(g)&&k>g&&(d=b.tooLong||this.tooLong||"is too long (maximum is %{count} characters)",j.push(e.format(d,{count:g}))),j.length>0?b.message||j:void 0):(e.error(e.format("Attribute %{attr} has a non numeric value for `length`",{attr:c})),b.message||this.notValid||"has an incorrect length")}},numericality:function(a,b,c,d,f){if(e.isDefined(a)){b=e.extend({},this.options,b);var g,h,i=[],j={greaterThan:function(a,b){return a>b},greaterThanOrEqualTo:function(a,b){return a>=b},equalTo:function(a,b){return a===b},lessThan:function(a,b){return b>a},lessThanOrEqualTo:function(a,b){return b>=a},divisibleBy:function(a,b){return a%b===0}},k=b.prettify||f&&f.prettify||e.prettify;if(e.isString(a)&&b.strict){var l="^-?(0|[1-9]\\d*)";if(b.onlyInteger||(l+="(\\.\\d+)?"),l+="$",!new RegExp(l).test(a))return b.message||b.notValid||this.notValid||this.message||"must be a valid number"}if(b.noStrings!==!0&&e.isString(a)&&!e.isEmpty(a)&&(a=+a),!e.isNumber(a))return b.message||b.notValid||this.notValid||this.message||"is not a number";if(b.onlyInteger&&!e.isInteger(a))return b.message||b.notInteger||this.notInteger||this.message||"must be an integer";for(g in j)if(h=b[g],e.isNumber(h)&&!j[g](a,h)){var m="not"+e.capitalize(g),n=b[m]||this[m]||this.message||"must be %{type} %{count}";i.push(e.format(n,{count:h,type:k(g)}))}return b.odd&&a%2!==1&&i.push(b.notOdd||this.notOdd||this.message||"must be odd"),b.even&&a%2!==0&&i.push(b.notEven||this.notEven||this.message||"must be even"),i.length?b.message||i:void 0}},datetime:e.extend(function(a,b){if(!e.isFunction(this.parse)||!e.isFunction(this.format))throw new Error("Both the parse and format functions needs to be set to use the datetime/date validator");if(e.isDefined(a)){b=e.extend({},this.options,b);var c,d=[],f=b.earliest?this.parse(b.earliest,b):NaN,g=b.latest?this.parse(b.latest,b):NaN;return a=this.parse(a,b),isNaN(a)||b.dateOnly&&a%864e5!==0?(c=b.notValid||b.message||this.notValid||"must be a valid date",e.format(c,{value:arguments[0]})):(!isNaN(f)&&f>a&&(c=b.tooEarly||b.message||this.tooEarly||"must be no earlier than %{date}",c=e.format(c,{value:this.format(a,b),date:this.format(f,b)}),d.push(c)),!isNaN(g)&&a>g&&(c=b.tooLate||b.message||this.tooLate||"must be no later than %{date}",c=e.format(c,{date:this.format(g,b),value:this.format(a,b)}),d.push(c)),d.length?e.unique(d):void 0)}},{parse:null,format:null}),date:function(a,b){return b=e.extend({},b,{dateOnly:!0}),e.validators.datetime.call(e.validators.datetime,a,b)},format:function(a,b){(e.isString(b)||b instanceof RegExp)&&(b={pattern:b}),b=e.extend({},this.options,b);var c,d=b.message||this.message||"is invalid",f=b.pattern;return e.isDefined(a)?e.isString(a)?(e.isString(f)&&(f=new RegExp(b.pattern,b.flags)),c=f.exec(a),c&&c[0].length==a.length?void 0:d):d:void 0},inclusion:function(a,b){if(e.isDefined(a)&&(e.isArray(b)&&(b={within:b}),b=e.extend({},this.options,b),!e.contains(b.within,a))){var c=b.message||this.message||"^%{value} is not included in the list";return e.format(c,{value:a})}},exclusion:function(a,b){if(e.isDefined(a)&&(e.isArray(b)&&(b={within:b}),b=e.extend({},this.options,b),e.contains(b.within,a))){var c=b.message||this.message||"^%{value} is restricted";return e.format(c,{value:a})}},email:e.extend(function(a,b){b=e.extend({},this.options,b);var c=b.message||this.message||"is not a valid email";if(e.isDefined(a))return e.isString(a)&&this.PATTERN.exec(a)?void 0:c},{PATTERN:/^[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9\u007F-\uffff!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i}),equality:function(a,b,c,d,f){if(e.isDefined(a)){e.isString(b)&&(b={attribute:b}),b=e.extend({},this.options,b);var g=b.message||this.message||"is not equal to %{attribute}";if(e.isEmpty(b.attribute)||!e.isString(b.attribute))throw new Error("The attribute must be a non empty string");var h=e.getDeepObjectValue(d,b.attribute),i=b.comparator||function(a,b){return a===b},j=b.prettify||f&&f.prettify||e.prettify;return i(a,h,b,c,d)?void 0:e.format(g,{attribute:j(b.attribute)})}},url:function(a,b){if(e.isDefined(a)){b=e.extend({},this.options,b);var c=b.message||this.message||"is not a valid url",d=b.schemes||this.schemes||["http","https"],f=b.allowLocal||this.allowLocal||!1;if(!e.isString(a))return c;var g="^(?:(?:"+d.join("|")+")://)(?:\\S+(?::\\S*)?@)?(?:",h="(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))";f?h+="?":g+="(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})",g+="(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*"+h+")(?::\\d{2,5})?(?:[/?#]\\S*)?$";var i=new RegExp(g,"i");return i.exec(a)?void 0:c}}},d.formatters={detailed:function(a){return a},flat:e.flattenErrorsToArray,grouped:function(a){var b;a=e.groupErrorsByAttribute(a);for(b in a)a[b]=e.flattenErrorsToArray(a[b]);return a},constraint:function(a){var b;a=e.groupErrorsByAttribute(a);for(b in a)a[b]=a[b].map(function(a){return a.validator}).sort();return a}},d.exposeModule(d,this,a,b,c)}).call(this,"undefined"!=typeof exports?exports:null,"undefined"!=typeof module?module:null,"undefined"!=typeof define?define:null);
//# sourceMappingURL=validate.min.map
/* flatpickr v4.5.2,, @license MIT */
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):e.flatpickr=t()}(this,function(){"use strict";var X=function(e){return("0"+e).slice(-2)},ee=function(e){return!0===e?1:0};function te(n,a,i){var o;return void 0===i&&(i=!1),function(){var e=this,t=arguments;null!==o&&clearTimeout(o),o=window.setTimeout(function(){o=null,i||n.apply(e,t)},a),i&&!o&&n.apply(e,t)}}var ne=function(e){return e instanceof Array?e:[e]},e=function(){},ae=function(e,t,n){return n.months[t?"shorthand":"longhand"][e]},w={D:e,F:function(e,t,n){e.setMonth(n.months.longhand.indexOf(t))},G:function(e,t){e.setHours(parseFloat(t))},H:function(e,t){e.setHours(parseFloat(t))},J:function(e,t){e.setDate(parseFloat(t))},K:function(e,t,n){e.setHours(e.getHours()%12+12*ee(new RegExp(n.amPM[1],"i").test(t)))},M:function(e,t,n){e.setMonth(n.months.shorthand.indexOf(t))},S:function(e,t){e.setSeconds(parseFloat(t))},U:function(e,t){return new Date(1e3*parseFloat(t))},W:function(e,t){var n=parseInt(t);return new Date(e.getFullYear(),0,2+7*(n-1),0,0,0,0)},Y:function(e,t){e.setFullYear(parseFloat(t))},Z:function(e,t){return new Date(t)},d:function(e,t){e.setDate(parseFloat(t))},h:function(e,t){e.setHours(parseFloat(t))},i:function(e,t){e.setMinutes(parseFloat(t))},j:function(e,t){e.setDate(parseFloat(t))},l:e,m:function(e,t){e.setMonth(parseFloat(t)-1)},n:function(e,t){e.setMonth(parseFloat(t)-1)},s:function(e,t){e.setSeconds(parseFloat(t))},w:e,y:function(e,t){e.setFullYear(2e3+parseFloat(t))}},ie={D:"(\\w+)",F:"(\\w+)",G:"(\\d\\d|\\d)",H:"(\\d\\d|\\d)",J:"(\\d\\d|\\d)\\w+",K:"",M:"(\\w+)",S:"(\\d\\d|\\d)",U:"(.+)",W:"(\\d\\d|\\d)",Y:"(\\d{4})",Z:"(.+)",d:"(\\d\\d|\\d)",h:"(\\d\\d|\\d)",i:"(\\d\\d|\\d)",j:"(\\d\\d|\\d)",l:"(\\w+)",m:"(\\d\\d|\\d)",n:"(\\d\\d|\\d)",s:"(\\d\\d|\\d)",w:"(\\d\\d|\\d)",y:"(\\d{2})"},l={Z:function(e){return e.toISOString()},D:function(e,t,n){return t.weekdays.shorthand[l.w(e,t,n)]},F:function(e,t,n){return ae(l.n(e,t,n)-1,!1,t)},G:function(e,t,n){return X(l.h(e,t,n))},H:function(e){return X(e.getHours())},J:function(e,t){return void 0!==t.ordinal?e.getDate()+t.ordinal(e.getDate()):e.getDate()},K:function(e,t){return t.amPM[ee(11<e.getHours())]},M:function(e,t){return ae(e.getMonth(),!0,t)},S:function(e){return X(e.getSeconds())},U:function(e){return e.getTime()/1e3},W:function(e,t,n){return n.getWeek(e)},Y:function(e){return e.getFullYear()},d:function(e){return X(e.getDate())},h:function(e){return e.getHours()%12?e.getHours()%12:12},i:function(e){return X(e.getMinutes())},j:function(e){return e.getDate()},l:function(e,t){return t.weekdays.longhand[e.getDay()]},m:function(e){return X(e.getMonth()+1)},n:function(e){return e.getMonth()+1},s:function(e){return e.getSeconds()},w:function(e){return e.getDay()},y:function(e){return String(e.getFullYear()).substring(2)}},oe={weekdays:{shorthand:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],longhand:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]},months:{shorthand:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],longhand:["January","February","March","April","May","June","July","August","September","October","November","December"]},daysInMonth:[31,28,31,30,31,30,31,31,30,31,30,31],firstDayOfWeek:0,ordinal:function(e){var t=e%100;if(3<t&&t<21)return"th";switch(t%10){case 1:return"st";case 2:return"nd";case 3:return"rd";default:return"th"}},rangeSeparator:" to ",weekAbbreviation:"Wk",scrollTitle:"Scroll to increment",toggleTitle:"Click to toggle",amPM:["AM","PM"],yearAriaLabel:"Year"},re=function(e){var t=e.config,o=void 0===t?C:t,n=e.l10n,r=void 0===n?oe:n;return function(a,e,t){var i=t||r;return void 0!==o.formatDate?o.formatDate(a,e,i):e.split("").map(function(e,t,n){return l[e]&&"\\"!==n[t-1]?l[e](a,i,o):"\\"!==e?e:""}).join("")}},le=function(e){var t=e.config,D=void 0===t?C:t,n=e.l10n,b=void 0===n?oe:n;return function(e,t,n,a){if(0===e||e){var i,o=a||b,r=e;if(e instanceof Date)i=new Date(e.getTime());else if("string"!=typeof e&&void 0!==e.toFixed)i=new Date(e);else if("string"==typeof e){var l=t||(D||C).dateFormat,c=String(e).trim();if("today"===c)i=new Date,n=!0;else if(/Z$/.test(c)||/GMT$/.test(c))i=new Date(e);else if(D&&D.parseDate)i=D.parseDate(e,l);else{i=D&&D.noCalendar?new Date((new Date).setHours(0,0,0,0)):new Date((new Date).getFullYear(),0,1,0,0,0,0);for(var d,s=[],u=0,f=0,m="";u<l.length;u++){var g=l[u],p="\\"===g,h="\\"===l[u-1]||p;if(ie[g]&&!h){m+=ie[g];var v=new RegExp(m).exec(e);v&&(d=!0)&&s["Y"!==g?"push":"unshift"]({fn:w[g],val:v[++f]})}else p||(m+=".");s.forEach(function(e){var t=e.fn,n=e.val;return i=t(i,n,o)||i})}i=d?i:void 0}}if(i instanceof Date&&!isNaN(i.getTime()))return!0===n&&i.setHours(0,0,0,0),i;D.errorHandler(new Error("Invalid date provided: "+r))}}};function ce(e,t,n){return void 0===n&&(n=!0),!1!==n?new Date(e.getTime()).setHours(0,0,0,0)-new Date(t.getTime()).setHours(0,0,0,0):e.getTime()-t.getTime()}var de=function(e,t,n){return e>Math.min(t,n)&&e<Math.max(t,n)},se={DAY:864e5},ue=["onChange","onClose","onDayCreate","onDestroy","onKeyDown","onMonthChange","onOpen","onParseConfig","onReady","onValueUpdate","onYearChange","onPreCalendarPosition"],C={_disable:[],_enable:[],allowInput:!1,altFormat:"F j, Y",altInput:!1,altInputClass:"form-control input",animate:"object"==typeof window&&-1===window.navigator.userAgent.indexOf("MSIE"),ariaDateFormat:"F j, Y",clickOpens:!0,closeOnSelect:!0,conjunction:", ",dateFormat:"Y-m-d",defaultHour:12,defaultMinute:0,defaultSeconds:0,disable:[],disableMobile:!1,enable:[],enableSeconds:!1,enableTime:!1,errorHandler:function(e){return"undefined"!=typeof console&&console.warn(e)},getWeek:function(e){var t=new Date(e.getTime());t.setHours(0,0,0,0),t.setDate(t.getDate()+3-(t.getDay()+6)%7);var n=new Date(t.getFullYear(),0,4);return 1+Math.round(((t.getTime()-n.getTime())/864e5-3+(n.getDay()+6)%7)/7)},hourIncrement:1,ignoredFocusElements:[],inline:!1,locale:"default",minuteIncrement:5,mode:"single",nextArrow:"<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 17 17'><g></g><path d='M13.207 8.472l-7.854 7.854-0.707-0.707 7.146-7.146-7.146-7.148 0.707-0.707 7.854 7.854z' /></svg>",noCalendar:!1,now:new Date,onChange:[],onClose:[],onDayCreate:[],onDestroy:[],onKeyDown:[],onMonthChange:[],onOpen:[],onParseConfig:[],onReady:[],onValueUpdate:[],onYearChange:[],onPreCalendarPosition:[],plugins:[],position:"auto",positionElement:void 0,prevArrow:"<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 17 17'><g></g><path d='M5.207 8.471l7.146 7.147-0.707 0.707-7.853-7.854 7.854-7.853 0.707 0.707-7.147 7.146z' /></svg>",shorthandCurrentMonth:!1,showMonths:1,static:!1,time_24hr:!1,weekNumbers:!1,wrap:!1};function fe(e,t,n){if(!0===n)return e.classList.add(t);e.classList.remove(t)}function me(e,t,n){var a=window.document.createElement(e);return t=t||"",n=n||"",a.className=t,void 0!==n&&(a.textContent=n),a}function ge(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function pe(e,t){var n=me("div","numInputWrapper"),a=me("input","numInput "+e),i=me("span","arrowUp"),o=me("span","arrowDown");if(a.type="text",a.pattern="\\d*",void 0!==t)for(var r in t)a.setAttribute(r,t[r]);return n.appendChild(a),n.appendChild(i),n.appendChild(o),n}"function"!=typeof Object.assign&&(Object.assign=function(n){if(!n)throw TypeError("Cannot convert undefined or null to object");for(var e=arguments.length,a=new Array(1<e?e-1:0),t=1;t<e;t++)a[t-1]=arguments[t];for(var i=function(){var t=a[o];t&&Object.keys(t).forEach(function(e){return n[e]=t[e]})},o=0;o<a.length;o++)i();return n});var he=300;function r(d,s){var h={config:Object.assign({},ve.defaultConfig),l10n:oe};function u(e){return e.bind(h)}function t(){var t=h.config;!1===t.weekNumbers&&1===t.showMonths||!0!==t.noCalendar&&window.requestAnimationFrame(function(){if(h.calendarContainer.style.visibility="hidden",h.calendarContainer.style.display="block",void 0!==h.daysContainer){var e=(h.days.offsetWidth+1)*t.showMonths;h.daysContainer.style.width=e+"px",h.calendarContainer.style.width=e+(void 0!==h.weekWrapper?h.weekWrapper.offsetWidth:0)+"px",h.calendarContainer.style.removeProperty("visibility"),h.calendarContainer.style.removeProperty("display")}})}function f(e){if(0!==h.selectedDates.length){void 0!==e&&"blur"!==e.type&&function(e){e.preventDefault();var t="keydown"===e.type,n=e.target;void 0!==h.amPM&&e.target===h.amPM&&(h.amPM.textContent=h.l10n.amPM[ee(h.amPM.textContent===h.l10n.amPM[0])]);var a=parseFloat(n.getAttribute("data-min")),i=parseFloat(n.getAttribute("data-max")),o=parseFloat(n.getAttribute("data-step")),r=parseInt(n.value,10),l=e.delta||(t?38===e.which?1:-1:0),c=r+o*l;if(void 0!==n.value&&2===n.value.length){var d=n===h.hourElement,s=n===h.minuteElement;c<a?(c=i+c+ee(!d)+(ee(d)&&ee(!h.amPM)),s&&v(void 0,-1,h.hourElement)):i<c&&(c=n===h.hourElement?c-i-ee(!h.amPM):a,s&&v(void 0,1,h.hourElement)),h.amPM&&d&&(1===o?c+r===23:Math.abs(c-r)>o)&&(h.amPM.textContent=h.l10n.amPM[ee(h.amPM.textContent===h.l10n.amPM[0])]),n.value=X(c)}}(e);var t=h._input.value;m(),Z(),h._input.value!==t&&h._debouncedChange()}}function m(){if(void 0!==h.hourElement&&void 0!==h.minuteElement){var e,t,n=(parseInt(h.hourElement.value.slice(-2),10)||0)%24,a=(parseInt(h.minuteElement.value,10)||0)%60,i=void 0!==h.secondElement?(parseInt(h.secondElement.value,10)||0)%60:0;void 0!==h.amPM&&(e=n,t=h.amPM.textContent,n=e%12+12*ee(t===h.l10n.amPM[1]));var o=void 0!==h.config.minTime||h.config.minDate&&h.minDateHasTime&&h.latestSelectedDateObj&&0===ce(h.latestSelectedDateObj,h.config.minDate,!0);if(void 0!==h.config.maxTime||h.config.maxDate&&h.maxDateHasTime&&h.latestSelectedDateObj&&0===ce(h.latestSelectedDateObj,h.config.maxDate,!0)){var r=void 0!==h.config.maxTime?h.config.maxTime:h.config.maxDate;(n=Math.min(n,r.getHours()))===r.getHours()&&(a=Math.min(a,r.getMinutes())),a===r.getMinutes()&&(i=Math.min(i,r.getSeconds()))}if(o){var l=void 0!==h.config.minTime?h.config.minTime:h.config.minDate;(n=Math.max(n,l.getHours()))===l.getHours()&&(a=Math.max(a,l.getMinutes())),a===l.getMinutes()&&(i=Math.max(i,l.getSeconds()))}c(n,a,i)}}function i(e){var t=e||h.latestSelectedDateObj;t&&c(t.getHours(),t.getMinutes(),t.getSeconds())}function a(){var e=h.config.defaultHour,t=h.config.defaultMinute,n=h.config.defaultSeconds;if(void 0!==h.config.minDate){var a=h.config.minDate.getHours(),i=h.config.minDate.getMinutes();(e=Math.max(e,a))===a&&(t=Math.max(i,t)),e===a&&t===i&&(n=h.config.minDate.getSeconds())}if(void 0!==h.config.maxDate){var o=h.config.maxDate.getHours(),r=h.config.maxDate.getMinutes();(e=Math.min(e,o))===o&&(t=Math.min(r,t)),e===o&&t===r&&(n=h.config.maxDate.getSeconds())}c(e,t,n)}function c(e,t,n){void 0!==h.latestSelectedDateObj&&h.latestSelectedDateObj.setHours(e%24,t,n||0,0),h.hourElement&&h.minuteElement&&!h.isMobile&&(h.hourElement.value=X(h.config.time_24hr?e:(12+e)%12+12*ee(e%12==0)),h.minuteElement.value=X(t),void 0!==h.amPM&&(h.amPM.textContent=h.l10n.amPM[ee(12<=e)]),void 0!==h.secondElement&&(h.secondElement.value=X(n)))}function n(e){var t=parseInt(e.target.value)+(e.delta||0);(1<t/1e3||"Enter"===e.key&&!/[^\d]/.test(t.toString()))&&_(t)}function o(t,n,a,i){return n instanceof Array?n.forEach(function(e){return o(t,e,a,i)}):t instanceof Array?t.forEach(function(e){return o(e,n,a,i)}):(t.addEventListener(n,a,i),void h._handlers.push({element:t,event:n,handler:a,options:i}))}function r(t){return function(e){1===e.which&&t(e)}}function g(){q("onChange")}function l(e){var t=void 0!==e?h.parseDate(e):h.latestSelectedDateObj||(h.config.minDate&&h.config.minDate>h.now?h.config.minDate:h.config.maxDate&&h.config.maxDate<h.now?h.config.maxDate:h.now);try{void 0!==t&&(h.currentYear=t.getFullYear(),h.currentMonth=t.getMonth())}catch(e){e.message="Invalid date supplied: "+t,h.config.errorHandler(e)}h.redraw()}function p(e){~e.target.className.indexOf("arrow")&&v(e,e.target.classList.contains("arrowUp")?1:-1)}function v(e,t,n){var a=e&&e.target,i=n||a&&a.parentNode&&a.parentNode.firstChild,o=$("increment");o.delta=t,i&&i.dispatchEvent(o)}function D(e,t,n,a){var i,o=N(t,!0),r=me("span","flatpickr-day "+e,t.getDate().toString());return r.dateObj=t,r.$i=a,r.setAttribute("aria-label",h.formatDate(t,h.config.ariaDateFormat)),-1===e.indexOf("hidden")&&0===ce(t,h.now)&&((h.todayDateElem=r).classList.add("today"),r.setAttribute("aria-current","date")),o?(r.tabIndex=-1,z(t)&&(r.classList.add("selected"),h.selectedDateElem=r,"range"===h.config.mode&&(fe(r,"startRange",h.selectedDates[0]&&0===ce(t,h.selectedDates[0],!0)),fe(r,"endRange",h.selectedDates[1]&&0===ce(t,h.selectedDates[1],!0)),"nextMonthDay"===e&&r.classList.add("inRange")))):r.classList.add("disabled"),"range"===h.config.mode&&(i=t,!("range"!==h.config.mode||h.selectedDates.length<2)&&0<=ce(i,h.selectedDates[0])&&ce(i,h.selectedDates[1])<=0&&!z(t)&&r.classList.add("inRange")),h.weekNumbers&&1===h.config.showMonths&&"prevMonthDay"!==e&&n%7==1&&h.weekNumbers.insertAdjacentHTML("beforeend","<span class='flatpickr-day'>"+h.config.getWeek(t)+"</span>"),q("onDayCreate",r),r}function b(e){e.focus(),"range"===h.config.mode&&P(e)}function w(e){for(var t=0<e?0:h.config.showMonths-1,n=0<e?h.config.showMonths:-1,a=t;a!=n;a+=e)for(var i=h.daysContainer.children[a],o=0<e?0:i.children.length-1,r=0<e?i.children.length:-1,l=o;l!=r;l+=e){var c=i.children[l];if(-1===c.className.indexOf("hidden")&&N(c.dateObj))return c}}function C(e,t){var n=F(document.activeElement||document.body),a=void 0!==e?e:n?document.activeElement:void 0!==h.selectedDateElem&&F(h.selectedDateElem)?h.selectedDateElem:void 0!==h.todayDateElem&&F(h.todayDateElem)?h.todayDateElem:w(0<t?1:-1);return void 0===a?h._input.focus():n?void function(e,t){for(var n=-1===e.className.indexOf("Month")?e.dateObj.getMonth():h.currentMonth,a=0<t?h.config.showMonths:-1,i=0<t?1:-1,o=n-h.currentMonth;o!=a;o+=i)for(var r=h.daysContainer.children[o],l=n-h.currentMonth===o?e.$i+t:t<0?r.children.length-1:0,c=r.children.length,d=l;0<=d&&d<c&&d!=(0<t?c:-1);d+=i){var s=r.children[d];if(-1===s.className.indexOf("hidden")&&N(s.dateObj)&&Math.abs(e.$i-d)>=Math.abs(t))return b(s)}h.changeMonth(i),C(w(i),0)}(a,t):b(a)}function y(e,t){for(var n=(new Date(e,t,1).getDay()-h.l10n.firstDayOfWeek+7)%7,a=h.utils.getDaysInMonth((t-1+12)%12),i=h.utils.getDaysInMonth(t),o=window.document.createDocumentFragment(),r=1<h.config.showMonths,l=r?"prevMonthDay hidden":"prevMonthDay",c=r?"nextMonthDay hidden":"nextMonthDay",d=a+1-n,s=0;d<=a;d++,s++)o.appendChild(D(l,new Date(e,t-1,d),d,s));for(d=1;d<=i;d++,s++)o.appendChild(D("",new Date(e,t,d),d,s));for(var u=i+1;u<=42-n&&(1===h.config.showMonths||s%7!=0);u++,s++)o.appendChild(D(c,new Date(e,t+1,u%i),u,s));var f=me("div","dayContainer");return f.appendChild(o),f}function M(){if(void 0!==h.daysContainer){ge(h.daysContainer),h.weekNumbers&&ge(h.weekNumbers);for(var e=document.createDocumentFragment(),t=0;t<h.config.showMonths;t++){var n=new Date(h.currentYear,h.currentMonth,1);n.setMonth(h.currentMonth+t),e.appendChild(y(n.getFullYear(),n.getMonth()))}h.daysContainer.appendChild(e),h.days=h.daysContainer.firstChild,"range"===h.config.mode&&1===h.selectedDates.length&&P()}}function x(){var e=me("div","flatpickr-month"),t=window.document.createDocumentFragment(),n=me("span","cur-month"),a=pe("cur-year",{tabindex:"-1"}),i=a.getElementsByTagName("input")[0];i.setAttribute("aria-label",h.l10n.yearAriaLabel),h.config.minDate&&i.setAttribute("data-min",h.config.minDate.getFullYear().toString()),h.config.maxDate&&(i.setAttribute("data-max",h.config.maxDate.getFullYear().toString()),i.disabled=!!h.config.minDate&&h.config.minDate.getFullYear()===h.config.maxDate.getFullYear());var o=me("div","flatpickr-current-month");return o.appendChild(n),o.appendChild(a),t.appendChild(o),e.appendChild(t),{container:e,yearElement:i,monthElement:n}}function E(){ge(h.monthNav),h.monthNav.appendChild(h.prevMonthNav);for(var e=h.config.showMonths;e--;){var t=x();h.yearElements.push(t.yearElement),h.monthElements.push(t.monthElement),h.monthNav.appendChild(t.container)}h.monthNav.appendChild(h.nextMonthNav)}function T(){h.weekdayContainer?ge(h.weekdayContainer):h.weekdayContainer=me("div","flatpickr-weekdays");for(var e=h.config.showMonths;e--;){var t=me("div","flatpickr-weekdaycontainer");h.weekdayContainer.appendChild(t)}return k(),h.weekdayContainer}function k(){var e=h.l10n.firstDayOfWeek,t=h.l10n.weekdays.shorthand.concat();0<e&&e<t.length&&(t=t.splice(e,t.length).concat(t.splice(0,e)));for(var n=h.config.showMonths;n--;)h.weekdayContainer.children[n].innerHTML="\n      <span class=flatpickr-weekday>\n        "+t.join("</span><span class=flatpickr-weekday>")+"\n      </span>\n      "}function I(e,t){void 0===t&&(t=!0);var n=t?e:e-h.currentMonth;n<0&&!0===h._hidePrevMonthArrow||0<n&&!0===h._hideNextMonthArrow||(h.currentMonth+=n,(h.currentMonth<0||11<h.currentMonth)&&(h.currentYear+=11<h.currentMonth?1:-1,h.currentMonth=(h.currentMonth+12)%12,q("onYearChange")),M(),q("onMonthChange"),G())}function O(e){return!(!h.config.appendTo||!h.config.appendTo.contains(e))||h.calendarContainer.contains(e)}function S(t){if(h.isOpen&&!h.config.inline){var e=O(t.target),n=t.target===h.input||t.target===h.altInput||h.element.contains(t.target)||t.path&&t.path.indexOf&&(~t.path.indexOf(h.input)||~t.path.indexOf(h.altInput)),a="blur"===t.type?n&&t.relatedTarget&&!O(t.relatedTarget):!n&&!e,i=!h.config.ignoredFocusElements.some(function(e){return e.contains(t.target)});a&&i&&(h.close(),"range"===h.config.mode&&1===h.selectedDates.length&&(h.clear(!1),h.redraw()))}}function _(e){if(!(!e||h.config.minDate&&e<h.config.minDate.getFullYear()||h.config.maxDate&&e>h.config.maxDate.getFullYear())){var t=e,n=h.currentYear!==t;h.currentYear=t||h.currentYear,h.config.maxDate&&h.currentYear===h.config.maxDate.getFullYear()?h.currentMonth=Math.min(h.config.maxDate.getMonth(),h.currentMonth):h.config.minDate&&h.currentYear===h.config.minDate.getFullYear()&&(h.currentMonth=Math.max(h.config.minDate.getMonth(),h.currentMonth)),n&&(h.redraw(),q("onYearChange"))}}function N(e,t){void 0===t&&(t=!0);var n=h.parseDate(e,void 0,t);if(h.config.minDate&&n&&ce(n,h.config.minDate,void 0!==t?t:!h.minDateHasTime)<0||h.config.maxDate&&n&&0<ce(n,h.config.maxDate,void 0!==t?t:!h.maxDateHasTime))return!1;if(0===h.config.enable.length&&0===h.config.disable.length)return!0;if(void 0===n)return!1;for(var a,i=0<h.config.enable.length,o=i?h.config.enable:h.config.disable,r=0;r<o.length;r++){if("function"==typeof(a=o[r])&&a(n))return i;if(a instanceof Date&&void 0!==n&&a.getTime()===n.getTime())return i;if("string"==typeof a&&void 0!==n){var l=h.parseDate(a,void 0,!0);return l&&l.getTime()===n.getTime()?i:!i}if("object"==typeof a&&void 0!==n&&a.from&&a.to&&n.getTime()>=a.from.getTime()&&n.getTime()<=a.to.getTime())return i}return!i}function F(e){return void 0!==h.daysContainer&&(-1===e.className.indexOf("hidden")&&h.daysContainer.contains(e))}function A(e){var t=e.target===h._input,n=h.config.allowInput,a=h.isOpen&&(!n||!t),i=h.config.inline&&t&&!n;if(13===e.keyCode&&t){if(n)return h.setDate(h._input.value,!0,e.target===h.altInput?h.config.altFormat:h.config.dateFormat),e.target.blur();h.open()}else if(O(e.target)||a||i){var o=!!h.timeContainer&&h.timeContainer.contains(e.target);switch(e.keyCode){case 13:o?f():B(e);break;case 27:e.preventDefault(),R();break;case 8:case 46:t&&!h.config.allowInput&&(e.preventDefault(),h.clear());break;case 37:case 39:if(o)h.hourElement&&h.hourElement.focus();else if(e.preventDefault(),void 0!==h.daysContainer&&(!1===n||F(document.activeElement))){var r=39===e.keyCode?1:-1;e.ctrlKey?(I(r),C(w(1),0)):C(void 0,r)}break;case 38:case 40:e.preventDefault();var l=40===e.keyCode?1:-1;h.daysContainer&&void 0!==e.target.$i?e.ctrlKey?(_(h.currentYear-l),C(w(1),0)):o||C(void 0,7*l):h.config.enableTime&&(!o&&h.hourElement&&h.hourElement.focus(),f(e),h._debouncedChange());break;case 9:if(!o){h.element.focus();break}var c=[h.hourElement,h.minuteElement,h.secondElement,h.amPM].filter(function(e){return e}),d=c.indexOf(e.target);if(-1!==d){var s=c[d+(e.shiftKey?-1:1)];void 0!==s?(e.preventDefault(),s.focus()):h.element.focus()}}}if(void 0!==h.amPM&&e.target===h.amPM)switch(e.key){case h.l10n.amPM[0].charAt(0):case h.l10n.amPM[0].charAt(0).toLowerCase():h.amPM.textContent=h.l10n.amPM[0],m(),Z();break;case h.l10n.amPM[1].charAt(0):case h.l10n.amPM[1].charAt(0).toLowerCase():h.amPM.textContent=h.l10n.amPM[1],m(),Z()}q("onKeyDown",e)}function P(o){if(1===h.selectedDates.length&&(!o||o.classList.contains("flatpickr-day")&&!o.classList.contains("disabled"))){for(var r=o?o.dateObj.getTime():h.days.firstElementChild.dateObj.getTime(),l=h.parseDate(h.selectedDates[0],void 0,!0).getTime(),e=Math.min(r,h.selectedDates[0].getTime()),t=Math.max(r,h.selectedDates[0].getTime()),n=h.daysContainer.lastChild.lastChild.dateObj.getTime(),c=!1,d=0,s=0,a=e;a<n;a+=se.DAY)N(new Date(a),!0)||(c=c||e<a&&a<t,a<l&&(!d||d<a)?d=a:l<a&&(!s||a<s)&&(s=a));for(var u=0;u<h.config.showMonths;u++)for(var f=h.daysContainer.children[u],m=h.daysContainer.children[u-1],i=function(e,t){var n=f.children[e],a=n.dateObj.getTime(),i=0<d&&a<d||0<s&&s<a;return i?(n.classList.add("notAllowed"),["inRange","startRange","endRange"].forEach(function(e){n.classList.remove(e)}),"continue"):c&&!i?"continue":(["startRange","inRange","endRange","notAllowed"].forEach(function(e){n.classList.remove(e)}),void(void 0!==o&&(o.classList.add(r<h.selectedDates[0].getTime()?"startRange":"endRange"),!f.contains(o)&&0<u&&m&&m.lastChild.dateObj.getTime()>=a||(l<r&&a===l?n.classList.add("startRange"):r<l&&a===l&&n.classList.add("endRange"),d<=a&&(0===s||a<=s)&&de(a,l,r)&&n.classList.add("inRange")))))},g=0,p=f.children.length;g<p;g++)i(g)}}function j(){!h.isOpen||h.config.static||h.config.inline||L()}function Y(a){return function(e){var t=h.config["_"+a+"Date"]=h.parseDate(e,h.config.dateFormat),n=h.config["_"+("min"===a?"max":"min")+"Date"];void 0!==t&&(h["min"===a?"minDateHasTime":"maxDateHasTime"]=0<t.getHours()||0<t.getMinutes()||0<t.getSeconds()),h.selectedDates&&(h.selectedDates=h.selectedDates.filter(function(e){return N(e)}),h.selectedDates.length||"min"!==a||i(t),Z()),h.daysContainer&&(W(),void 0!==t?h.currentYearElement[a]=t.getFullYear().toString():h.currentYearElement.removeAttribute(a),h.currentYearElement.disabled=!!n&&void 0!==t&&n.getFullYear()===t.getFullYear())}}function H(){"object"!=typeof h.config.locale&&void 0===ve.l10ns[h.config.locale]&&h.config.errorHandler(new Error("flatpickr: invalid locale "+h.config.locale)),h.l10n=Object.assign({},ve.l10ns.default,"object"==typeof h.config.locale?h.config.locale:"default"!==h.config.locale?ve.l10ns[h.config.locale]:void 0),ie.K="("+h.l10n.amPM[0]+"|"+h.l10n.amPM[1]+"|"+h.l10n.amPM[0].toLowerCase()+"|"+h.l10n.amPM[1].toLowerCase()+")",h.formatDate=re(h),h.parseDate=le({config:h.config,l10n:h.l10n})}function L(e){if(void 0!==h.calendarContainer){q("onPreCalendarPosition");var t=e||h._positionElement,n=Array.prototype.reduce.call(h.calendarContainer.children,function(e,t){return e+t.offsetHeight},0),a=h.calendarContainer.offsetWidth,i=h.config.position.split(" "),o=i[0],r=1<i.length?i[1]:null,l=t.getBoundingClientRect(),c=window.innerHeight-l.bottom,d="above"===o||"below"!==o&&c<n&&l.top>n,s=window.pageYOffset+l.top+(d?-n-2:t.offsetHeight+2);if(fe(h.calendarContainer,"arrowTop",!d),fe(h.calendarContainer,"arrowBottom",d),!h.config.inline){var u=window.pageXOffset+l.left-(null!=r&&"center"===r?(a-l.width)/2:0),f=window.document.body.offsetWidth-l.right,m=u+a>window.document.body.offsetWidth;fe(h.calendarContainer,"rightMost",m),h.config.static||(h.calendarContainer.style.top=s+"px",m?(h.calendarContainer.style.left="auto",h.calendarContainer.style.right=f+"px"):(h.calendarContainer.style.left=u+"px",h.calendarContainer.style.right="auto"))}}}function W(){h.config.noCalendar||h.isMobile||(G(),M())}function R(){h._input.focus(),-1!==window.navigator.userAgent.indexOf("MSIE")||void 0!==navigator.msMaxTouchPoints?setTimeout(h.close,0):h.close()}function B(e){e.preventDefault(),e.stopPropagation();var t=function e(t,n){return n(t)?t:t.parentNode?e(t.parentNode,n):void 0}(e.target,function(e){return e.classList&&e.classList.contains("flatpickr-day")&&!e.classList.contains("disabled")&&!e.classList.contains("notAllowed")});if(void 0!==t){var n=t,a=h.latestSelectedDateObj=new Date(n.dateObj.getTime()),i=(a.getMonth()<h.currentMonth||a.getMonth()>h.currentMonth+h.config.showMonths-1)&&"range"!==h.config.mode;if(h.selectedDateElem=n,"single"===h.config.mode)h.selectedDates=[a];else if("multiple"===h.config.mode){var o=z(a);o?h.selectedDates.splice(parseInt(o),1):h.selectedDates.push(a)}else"range"===h.config.mode&&(2===h.selectedDates.length&&h.clear(!1),h.selectedDates.push(a),0!==ce(a,h.selectedDates[0],!0)&&h.selectedDates.sort(function(e,t){return e.getTime()-t.getTime()}));if(m(),i){var r=h.currentYear!==a.getFullYear();h.currentYear=a.getFullYear(),h.currentMonth=a.getMonth(),r&&q("onYearChange"),q("onMonthChange")}if(G(),M(),Z(),h.config.enableTime&&setTimeout(function(){return h.showTimeInput=!0},50),i||"range"===h.config.mode||1!==h.config.showMonths?h.selectedDateElem&&h.selectedDateElem.focus():b(n),void 0!==h.hourElement&&setTimeout(function(){return void 0!==h.hourElement&&h.hourElement.select()},451),h.config.closeOnSelect){var l="single"===h.config.mode&&!h.config.enableTime,c="range"===h.config.mode&&2===h.selectedDates.length&&!h.config.enableTime;(l||c)&&R()}g()}}h.parseDate=le({config:h.config,l10n:h.l10n}),h._handlers=[],h._bind=o,h._setHoursFromDate=i,h._positionCalendar=L,h.changeMonth=I,h.changeYear=_,h.clear=function(e){void 0===e&&(e=!0);h.input.value="",void 0!==h.altInput&&(h.altInput.value="");void 0!==h.mobileInput&&(h.mobileInput.value="");h.selectedDates=[],h.latestSelectedDateObj=void 0,!(h.showTimeInput=!1)===h.config.enableTime&&a();h.redraw(),e&&q("onChange")},h.close=function(){h.isOpen=!1,h.isMobile||(h.calendarContainer.classList.remove("open"),h._input.classList.remove("active"));q("onClose")},h._createElement=me,h.destroy=function(){void 0!==h.config&&q("onDestroy");for(var e=h._handlers.length;e--;){var t=h._handlers[e];t.element.removeEventListener(t.event,t.handler,t.options)}if(h._handlers=[],h.mobileInput)h.mobileInput.parentNode&&h.mobileInput.parentNode.removeChild(h.mobileInput),h.mobileInput=void 0;else if(h.calendarContainer&&h.calendarContainer.parentNode)if(h.config.static&&h.calendarContainer.parentNode){var n=h.calendarContainer.parentNode;if(n.lastChild&&n.removeChild(n.lastChild),n.parentNode){for(;n.firstChild;)n.parentNode.insertBefore(n.firstChild,n);n.parentNode.removeChild(n)}}else h.calendarContainer.parentNode.removeChild(h.calendarContainer);h.altInput&&(h.input.type="text",h.altInput.parentNode&&h.altInput.parentNode.removeChild(h.altInput),delete h.altInput);h.input&&(h.input.type=h.input._type,h.input.classList.remove("flatpickr-input"),h.input.removeAttribute("readonly"),h.input.value="");["_showTimeInput","latestSelectedDateObj","_hideNextMonthArrow","_hidePrevMonthArrow","__hideNextMonthArrow","__hidePrevMonthArrow","isMobile","isOpen","selectedDateElem","minDateHasTime","maxDateHasTime","days","daysContainer","_input","_positionElement","innerContainer","rContainer","monthNav","todayDateElem","calendarContainer","weekdayContainer","prevMonthNav","nextMonthNav","currentMonthElement","currentYearElement","navigationCurrentMonth","selectedDateElem","config"].forEach(function(e){try{delete h[e]}catch(e){}})},h.isEnabled=N,h.jumpToDate=l,h.open=function(e,t){void 0===t&&(t=h._positionElement);if(!0===h.isMobile)return e&&(e.preventDefault(),e.target&&e.target.blur()),void 0!==h.mobileInput&&(h.mobileInput.focus(),h.mobileInput.click()),void q("onOpen");if(h._input.disabled||h.config.inline)return;var n=h.isOpen;h.isOpen=!0,n||(h.calendarContainer.classList.add("open"),h._input.classList.add("active"),q("onOpen"),L(t));!0===h.config.enableTime&&!0===h.config.noCalendar&&(0===h.selectedDates.length&&(h.setDate(void 0!==h.config.minDate?new Date(h.config.minDate.getTime()):new Date,!1),a(),Z()),!1!==h.config.allowInput||void 0!==e&&h.timeContainer.contains(e.relatedTarget)||setTimeout(function(){return h.hourElement.select()},50))},h.redraw=W,h.set=function(e,t){null!==e&&"object"==typeof e?Object.assign(h.config,e):(h.config[e]=t,void 0!==K[e]?K[e].forEach(function(e){return e()}):-1<ue.indexOf(e)&&(h.config[e]=ne(t)));h.redraw(),l(),Z(!1)},h.setDate=function(e,t,n){void 0===t&&(t=!1);void 0===n&&(n=h.config.dateFormat);if(0!==e&&!e||e instanceof Array&&0===e.length)return h.clear(t);J(e,n),h.showTimeInput=0<h.selectedDates.length,h.latestSelectedDateObj=h.selectedDates[0],h.redraw(),l(),i(),Z(t),t&&q("onChange")},h.toggle=function(e){if(!0===h.isOpen)return h.close();h.open(e)};var K={locale:[H,k],showMonths:[E,t,T]};function J(e,t){var n=[];if(e instanceof Array)n=e.map(function(e){return h.parseDate(e,t)});else if(e instanceof Date||"number"==typeof e)n=[h.parseDate(e,t)];else if("string"==typeof e)switch(h.config.mode){case"single":case"time":n=[h.parseDate(e,t)];break;case"multiple":n=e.split(h.config.conjunction).map(function(e){return h.parseDate(e,t)});break;case"range":n=e.split(h.l10n.rangeSeparator).map(function(e){return h.parseDate(e,t)})}else h.config.errorHandler(new Error("Invalid date supplied: "+JSON.stringify(e)));h.selectedDates=n.filter(function(e){return e instanceof Date&&N(e,!1)}),"range"===h.config.mode&&h.selectedDates.sort(function(e,t){return e.getTime()-t.getTime()})}function U(e){return e.slice().map(function(e){return"string"==typeof e||"number"==typeof e||e instanceof Date?h.parseDate(e,void 0,!0):e&&"object"==typeof e&&e.from&&e.to?{from:h.parseDate(e.from,void 0),to:h.parseDate(e.to,void 0)}:e}).filter(function(e){return e})}function q(e,t){if(void 0!==h.config){var n=h.config[e];if(void 0!==n&&0<n.length)for(var a=0;n[a]&&a<n.length;a++)n[a](h.selectedDates,h.input.value,h,t);"onChange"===e&&(h.input.dispatchEvent($("change")),h.input.dispatchEvent($("input")))}}function $(e){var t=document.createEvent("Event");return t.initEvent(e,!0,!0),t}function z(e){for(var t=0;t<h.selectedDates.length;t++)if(0===ce(h.selectedDates[t],e))return""+t;return!1}function G(){h.config.noCalendar||h.isMobile||!h.monthNav||(h.yearElements.forEach(function(e,t){var n=new Date(h.currentYear,h.currentMonth,1);n.setMonth(h.currentMonth+t),h.monthElements[t].textContent=ae(n.getMonth(),h.config.shorthandCurrentMonth,h.l10n)+" ",e.value=n.getFullYear().toString()}),h._hidePrevMonthArrow=void 0!==h.config.minDate&&(h.currentYear===h.config.minDate.getFullYear()?h.currentMonth<=h.config.minDate.getMonth():h.currentYear<h.config.minDate.getFullYear()),h._hideNextMonthArrow=void 0!==h.config.maxDate&&(h.currentYear===h.config.maxDate.getFullYear()?h.currentMonth+1>h.config.maxDate.getMonth():h.currentYear>h.config.maxDate.getFullYear()))}function V(t){return h.selectedDates.map(function(e){return h.formatDate(e,t)}).filter(function(e,t,n){return"range"!==h.config.mode||h.config.enableTime||n.indexOf(e)===t}).join("range"!==h.config.mode?h.config.conjunction:h.l10n.rangeSeparator)}function Z(e){if(void 0===e&&(e=!0),0===h.selectedDates.length)return h.clear(e);void 0!==h.mobileInput&&h.mobileFormatStr&&(h.mobileInput.value=void 0!==h.latestSelectedDateObj?h.formatDate(h.latestSelectedDateObj,h.mobileFormatStr):""),h.input.value=V(h.config.dateFormat),void 0!==h.altInput&&(h.altInput.value=V(h.config.altFormat)),!1!==e&&q("onValueUpdate")}function Q(e){e.preventDefault();var t=h.prevMonthNav.contains(e.target),n=h.nextMonthNav.contains(e.target);t||n?I(t?-1:1):0<=h.yearElements.indexOf(e.target)?e.target.select():e.target.classList.contains("arrowUp")?h.changeYear(h.currentYear+1):e.target.classList.contains("arrowDown")&&h.changeYear(h.currentYear-1)}return function(){h.element=h.input=d,h.isOpen=!1,function(){var e=["wrap","weekNumbers","allowInput","clickOpens","time_24hr","enableTime","noCalendar","altInput","shorthandCurrentMonth","inline","static","enableSeconds","disableMobile"],t=Object.assign({},s,JSON.parse(JSON.stringify(d.dataset||{}))),n={};h.config.parseDate=t.parseDate,h.config.formatDate=t.formatDate,Object.defineProperty(h.config,"enable",{get:function(){return h.config._enable},set:function(e){h.config._enable=U(e)}}),Object.defineProperty(h.config,"disable",{get:function(){return h.config._disable},set:function(e){h.config._disable=U(e)}});var a="time"===t.mode;t.dateFormat||!t.enableTime&&!a||(n.dateFormat=t.noCalendar||a?"H:i"+(t.enableSeconds?":S":""):ve.defaultConfig.dateFormat+" H:i"+(t.enableSeconds?":S":"")),t.altInput&&(t.enableTime||a)&&!t.altFormat&&(n.altFormat=t.noCalendar||a?"h:i"+(t.enableSeconds?":S K":" K"):ve.defaultConfig.altFormat+" h:i"+(t.enableSeconds?":S":"")+" K"),Object.defineProperty(h.config,"minDate",{get:function(){return h.config._minDate},set:Y("min")}),Object.defineProperty(h.config,"maxDate",{get:function(){return h.config._maxDate},set:Y("max")});var i=function(t){return function(e){h.config["min"===t?"_minTime":"_maxTime"]=h.parseDate(e,"H:i")}};Object.defineProperty(h.config,"minTime",{get:function(){return h.config._minTime},set:i("min")}),Object.defineProperty(h.config,"maxTime",{get:function(){return h.config._maxTime},set:i("max")}),"time"===t.mode&&(h.config.noCalendar=!0,h.config.enableTime=!0),Object.assign(h.config,n,t);for(var o=0;o<e.length;o++)h.config[e[o]]=!0===h.config[e[o]]||"true"===h.config[e[o]];ue.filter(function(e){return void 0!==h.config[e]}).forEach(function(e){h.config[e]=ne(h.config[e]||[]).map(u)}),h.isMobile=!h.config.disableMobile&&!h.config.inline&&"single"===h.config.mode&&!h.config.disable.length&&!h.config.enable.length&&!h.config.weekNumbers&&/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);for(var r=0;r<h.config.plugins.length;r++){var l=h.config.plugins[r](h)||{};for(var c in l)-1<ue.indexOf(c)?h.config[c]=ne(l[c]).map(u).concat(h.config[c]):void 0===t[c]&&(h.config[c]=l[c])}q("onParseConfig")}(),H(),function(){if(h.input=h.config.wrap?d.querySelector("[data-input]"):d,!h.input)return h.config.errorHandler(new Error("Invalid input element specified"));h.input._type=h.input.type,h.input.type="text",h.input.classList.add("flatpickr-input"),h._input=h.input,h.config.altInput&&(h.altInput=me(h.input.nodeName,h.input.className+" "+h.config.altInputClass),h._input=h.altInput,h.altInput.placeholder=h.input.placeholder,h.altInput.disabled=h.input.disabled,h.altInput.required=h.input.required,h.altInput.tabIndex=h.input.tabIndex,h.altInput.type="text",h.input.setAttribute("type","hidden"),!h.config.static&&h.input.parentNode&&h.input.parentNode.insertBefore(h.altInput,h.input.nextSibling)),h.config.allowInput||h._input.setAttribute("readonly","readonly"),h._positionElement=h.config.positionElement||h._input}(),function(){h.selectedDates=[],h.now=h.parseDate(h.config.now)||new Date;var e=h.config.defaultDate||("INPUT"!==h.input.nodeName&&"TEXTAREA"!==h.input.nodeName||!h.input.placeholder||h.input.value!==h.input.placeholder?h.input.value:null);e&&J(e,h.config.dateFormat);var t=0<h.selectedDates.length?h.selectedDates[0]:h.config.minDate&&h.config.minDate.getTime()>h.now.getTime()?h.config.minDate:h.config.maxDate&&h.config.maxDate.getTime()<h.now.getTime()?h.config.maxDate:h.now;h.currentYear=t.getFullYear(),h.currentMonth=t.getMonth(),0<h.selectedDates.length&&(h.latestSelectedDateObj=h.selectedDates[0]),void 0!==h.config.minTime&&(h.config.minTime=h.parseDate(h.config.minTime,"H:i")),void 0!==h.config.maxTime&&(h.config.maxTime=h.parseDate(h.config.maxTime,"H:i")),h.minDateHasTime=!!h.config.minDate&&(0<h.config.minDate.getHours()||0<h.config.minDate.getMinutes()||0<h.config.minDate.getSeconds()),h.maxDateHasTime=!!h.config.maxDate&&(0<h.config.maxDate.getHours()||0<h.config.maxDate.getMinutes()||0<h.config.maxDate.getSeconds()),Object.defineProperty(h,"showTimeInput",{get:function(){return h._showTimeInput},set:function(e){h._showTimeInput=e,h.calendarContainer&&fe(h.calendarContainer,"showTimeInput",e),h.isOpen&&L()}})}(),h.utils={getDaysInMonth:function(e,t){return void 0===e&&(e=h.currentMonth),void 0===t&&(t=h.currentYear),1===e&&(t%4==0&&t%100!=0||t%400==0)?29:h.l10n.daysInMonth[e]}},h.isMobile||function(){var e=window.document.createDocumentFragment();if(h.calendarContainer=me("div","flatpickr-calendar"),h.calendarContainer.tabIndex=-1,!h.config.noCalendar){if(e.appendChild((h.monthNav=me("div","flatpickr-months"),h.yearElements=[],h.monthElements=[],h.prevMonthNav=me("span","flatpickr-prev-month"),h.prevMonthNav.innerHTML=h.config.prevArrow,h.nextMonthNav=me("span","flatpickr-next-month"),h.nextMonthNav.innerHTML=h.config.nextArrow,E(),Object.defineProperty(h,"_hidePrevMonthArrow",{get:function(){return h.__hidePrevMonthArrow},set:function(e){h.__hidePrevMonthArrow!==e&&(fe(h.prevMonthNav,"disabled",e),h.__hidePrevMonthArrow=e)}}),Object.defineProperty(h,"_hideNextMonthArrow",{get:function(){return h.__hideNextMonthArrow},set:function(e){h.__hideNextMonthArrow!==e&&(fe(h.nextMonthNav,"disabled",e),h.__hideNextMonthArrow=e)}}),h.currentYearElement=h.yearElements[0],G(),h.monthNav)),h.innerContainer=me("div","flatpickr-innerContainer"),h.config.weekNumbers){var t=function(){h.calendarContainer.classList.add("hasWeeks");var e=me("div","flatpickr-weekwrapper");e.appendChild(me("span","flatpickr-weekday",h.l10n.weekAbbreviation));var t=me("div","flatpickr-weeks");return e.appendChild(t),{weekWrapper:e,weekNumbers:t}}(),n=t.weekWrapper,a=t.weekNumbers;h.innerContainer.appendChild(n),h.weekNumbers=a,h.weekWrapper=n}h.rContainer=me("div","flatpickr-rContainer"),h.rContainer.appendChild(T()),h.daysContainer||(h.daysContainer=me("div","flatpickr-days"),h.daysContainer.tabIndex=-1),M(),h.rContainer.appendChild(h.daysContainer),h.innerContainer.appendChild(h.rContainer),e.appendChild(h.innerContainer)}h.config.enableTime&&e.appendChild(function(){h.calendarContainer.classList.add("hasTime"),h.config.noCalendar&&h.calendarContainer.classList.add("noCalendar"),h.timeContainer=me("div","flatpickr-time"),h.timeContainer.tabIndex=-1;var e=me("span","flatpickr-time-separator",":"),t=pe("flatpickr-hour");h.hourElement=t.getElementsByTagName("input")[0];var n=pe("flatpickr-minute");if(h.minuteElement=n.getElementsByTagName("input")[0],h.hourElement.tabIndex=h.minuteElement.tabIndex=-1,h.hourElement.value=X(h.latestSelectedDateObj?h.latestSelectedDateObj.getHours():h.config.time_24hr?h.config.defaultHour:function(e){switch(e%24){case 0:case 12:return 12;default:return e%12}}(h.config.defaultHour)),h.minuteElement.value=X(h.latestSelectedDateObj?h.latestSelectedDateObj.getMinutes():h.config.defaultMinute),h.hourElement.setAttribute("data-step",h.config.hourIncrement.toString()),h.minuteElement.setAttribute("data-step",h.config.minuteIncrement.toString()),h.hourElement.setAttribute("data-min",h.config.time_24hr?"0":"1"),h.hourElement.setAttribute("data-max",h.config.time_24hr?"23":"12"),h.minuteElement.setAttribute("data-min","0"),h.minuteElement.setAttribute("data-max","59"),h.timeContainer.appendChild(t),h.timeContainer.appendChild(e),h.timeContainer.appendChild(n),h.config.time_24hr&&h.timeContainer.classList.add("time24hr"),h.config.enableSeconds){h.timeContainer.classList.add("hasSeconds");var a=pe("flatpickr-second");h.secondElement=a.getElementsByTagName("input")[0],h.secondElement.value=X(h.latestSelectedDateObj?h.latestSelectedDateObj.getSeconds():h.config.defaultSeconds),h.secondElement.setAttribute("data-step",h.minuteElement.getAttribute("data-step")),h.secondElement.setAttribute("data-min",h.minuteElement.getAttribute("data-min")),h.secondElement.setAttribute("data-max",h.minuteElement.getAttribute("data-max")),h.timeContainer.appendChild(me("span","flatpickr-time-separator",":")),h.timeContainer.appendChild(a)}return h.config.time_24hr||(h.amPM=me("span","flatpickr-am-pm",h.l10n.amPM[ee(11<(h.latestSelectedDateObj?h.hourElement.value:h.config.defaultHour))]),h.amPM.title=h.l10n.toggleTitle,h.amPM.tabIndex=-1,h.timeContainer.appendChild(h.amPM)),h.timeContainer}()),fe(h.calendarContainer,"rangeMode","range"===h.config.mode),fe(h.calendarContainer,"animate",!0===h.config.animate),fe(h.calendarContainer,"multiMonth",1<h.config.showMonths),h.calendarContainer.appendChild(e);var i=void 0!==h.config.appendTo&&void 0!==h.config.appendTo.nodeType;if((h.config.inline||h.config.static)&&(h.calendarContainer.classList.add(h.config.inline?"inline":"static"),h.config.inline&&(!i&&h.element.parentNode?h.element.parentNode.insertBefore(h.calendarContainer,h._input.nextSibling):void 0!==h.config.appendTo&&h.config.appendTo.appendChild(h.calendarContainer)),h.config.static)){var o=me("div","flatpickr-wrapper");h.element.parentNode&&h.element.parentNode.insertBefore(o,h.element),o.appendChild(h.element),h.altInput&&o.appendChild(h.altInput),o.appendChild(h.calendarContainer)}h.config.static||h.config.inline||(void 0!==h.config.appendTo?h.config.appendTo:window.document.body).appendChild(h.calendarContainer)}(),function(){if(h.config.wrap&&["open","close","toggle","clear"].forEach(function(t){Array.prototype.forEach.call(h.element.querySelectorAll("[data-"+t+"]"),function(e){return o(e,"click",h[t])})}),h.isMobile)return function(){var e=h.config.enableTime?h.config.noCalendar?"time":"datetime-local":"date";h.mobileInput=me("input",h.input.className+" flatpickr-mobile"),h.mobileInput.step=h.input.getAttribute("step")||"any",h.mobileInput.tabIndex=1,h.mobileInput.type=e,h.mobileInput.disabled=h.input.disabled,h.mobileInput.required=h.input.required,h.mobileInput.placeholder=h.input.placeholder,h.mobileFormatStr="datetime-local"===e?"Y-m-d\\TH:i:S":"date"===e?"Y-m-d":"H:i:S",0<h.selectedDates.length&&(h.mobileInput.defaultValue=h.mobileInput.value=h.formatDate(h.selectedDates[0],h.mobileFormatStr)),h.config.minDate&&(h.mobileInput.min=h.formatDate(h.config.minDate,"Y-m-d")),h.config.maxDate&&(h.mobileInput.max=h.formatDate(h.config.maxDate,"Y-m-d")),h.input.type="hidden",void 0!==h.altInput&&(h.altInput.type="hidden");try{h.input.parentNode&&h.input.parentNode.insertBefore(h.mobileInput,h.input.nextSibling)}catch(e){}o(h.mobileInput,"change",function(e){h.setDate(e.target.value,!1,h.mobileFormatStr),q("onChange"),q("onClose")})}();var e=te(j,50);h._debouncedChange=te(g,he),h.daysContainer&&!/iPhone|iPad|iPod/i.test(navigator.userAgent)&&o(h.daysContainer,"mouseover",function(e){"range"===h.config.mode&&P(e.target)}),o(window.document.body,"keydown",A),h.config.static||o(h._input,"keydown",A),h.config.inline||h.config.static||o(window,"resize",e),void 0!==window.ontouchstart?o(window.document,"click",S):o(window.document,"mousedown",r(S)),o(window.document,"focus",S,{capture:!0}),!0===h.config.clickOpens&&(o(h._input,"focus",h.open),o(h._input,"mousedown",r(h.open))),void 0!==h.daysContainer&&(o(h.monthNav,"mousedown",r(Q)),o(h.monthNav,["keyup","increment"],n),o(h.daysContainer,"mousedown",r(B))),void 0!==h.timeContainer&&void 0!==h.minuteElement&&void 0!==h.hourElement&&(o(h.timeContainer,["increment"],f),o(h.timeContainer,"blur",f,{capture:!0}),o(h.timeContainer,"mousedown",r(p)),o([h.hourElement,h.minuteElement],["focus","click"],function(e){return e.target.select()}),void 0!==h.secondElement&&o(h.secondElement,"focus",function(){return h.secondElement&&h.secondElement.select()}),void 0!==h.amPM&&o(h.amPM,"mousedown",r(function(e){f(e),g()})))}(),(h.selectedDates.length||h.config.noCalendar)&&(h.config.enableTime&&i(h.config.noCalendar?h.latestSelectedDateObj||h.config.minDate:void 0),Z(!1)),t(),h.showTimeInput=0<h.selectedDates.length||h.config.noCalendar;var e=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);!h.isMobile&&e&&L(),q("onReady")}(),h}function n(e,t){for(var n=Array.prototype.slice.call(e),a=[],i=0;i<n.length;i++){var o=n[i];try{if(null!==o.getAttribute("data-fp-omit"))continue;void 0!==o._flatpickr&&(o._flatpickr.destroy(),o._flatpickr=void 0),o._flatpickr=r(o,t||{}),a.push(o._flatpickr)}catch(e){console.error(e)}}return 1===a.length?a[0]:a}"undefined"!=typeof HTMLElement&&(HTMLCollection.prototype.flatpickr=NodeList.prototype.flatpickr=function(e){return n(this,e)},HTMLElement.prototype.flatpickr=function(e){return n([this],e)});var ve=function(e,t){return e instanceof NodeList?n(e,t):n("string"==typeof e?window.document.querySelectorAll(e):[e],t)};return ve.defaultConfig=C,ve.l10ns={en:Object.assign({},oe),default:Object.assign({},oe)},ve.localize=function(e){ve.l10ns.default=Object.assign({},ve.l10ns.default,e)},ve.setDefaults=function(e){ve.defaultConfig=Object.assign({},ve.defaultConfig,e)},ve.parseDate=le({}),ve.formatDate=re({}),ve.compareDates=ce,"undefined"!=typeof jQuery&&(jQuery.fn.flatpickr=function(e){return n(this,e)}),Date.prototype.fp_incr=function(e){return new Date(this.getFullYear(),this.getMonth(),this.getDate()+("string"==typeof e?parseInt(e,10):e))},"undefined"!=typeof window&&(window.flatpickr=ve),ve});
/* flatpickr v4.5.2, @license MIT */
(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports)
    : typeof define === 'function' && define.amd
    ? define(['exports'], factory)
    : factory((global.ru = {}));
})(this, function(exports) {
  'use strict';

  var fp =
    typeof window !== 'undefined' && window.flatpickr !== undefined
      ? window.flatpickr
      : {
          l10ns: {},
        };
  var Russian = {
    weekdays: {
      shorthand: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      longhand: [
        'Воскресенье',
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота',
      ],
    },
    months: {
      shorthand: [
        'Янв',
        'Фев',
        'Март',
        'Апр',
        'Май',
        'Июнь',
        'Июль',
        'Авг',
        'Сен',
        'Окт',
        'Ноя',
        'Дек',
      ],
      longhand: [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь',
      ],
    },
    firstDayOfWeek: 1,
    ordinal: function ordinal() {
      return '';
    },
    rangeSeparator: ' — ',
    weekAbbreviation: 'Нед.',
    scrollTitle: 'Прокрутите для увеличения',
    toggleTitle: 'Нажмите для переключения',
    amPM: ['ДП', 'ПП'],
    yearAriaLabel: 'Год',
  };
  fp.l10ns.ru = Russian;
  var ru = fp.l10ns;

  exports.Russian = Russian;
  exports.default = ru;

  Object.defineProperty(exports, '__esModule', { value: true });
});
