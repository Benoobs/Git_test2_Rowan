'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};



function unwrapExports (x) {
	return x && x.__esModule ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var index$1 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = toDate;
  var MILLISECONDS_IN_HOUR = 3600000;
  var MILLISECONDS_IN_MINUTE = 60000;
  var DEFAULT_ADDITIONAL_DIGITS = 2;

  var patterns = {
    dateTimeDelimeter: /[T ]/,
    plainTime: /:/,

    // year tokens
    YY: /^(\d{2})$/,
    YYY: [/^([+-]\d{2})$/, // 0 additional digits
    /^([+-]\d{3})$/, // 1 additional digit
    /^([+-]\d{4})$/ // 2 additional digits
    ],
    YYYY: /^(\d{4})/,
    YYYYY: [/^([+-]\d{4})/, // 0 additional digits
    /^([+-]\d{5})/, // 1 additional digit
    /^([+-]\d{6})/ // 2 additional digits
    ],

    // date tokens
    MM: /^-(\d{2})$/,
    DDD: /^-?(\d{3})$/,
    MMDD: /^-?(\d{2})-?(\d{2})$/,
    Www: /^-?W(\d{2})$/,
    WwwD: /^-?W(\d{2})-?(\d{1})$/,

    HH: /^(\d{2}([.,]\d*)?)$/,
    HHMM: /^(\d{2}):?(\d{2}([.,]\d*)?)$/,
    HHMMSS: /^(\d{2}):?(\d{2}):?(\d{2}([.,]\d*)?)$/,

    // timezone tokens
    timezone: /([Z+-].*)$/,
    timezoneZ: /^(Z)$/,
    timezoneHH: /^([+-])(\d{2})$/,
    timezoneHHMM: /^([+-])(\d{2}):?(\d{2})$/
  };

  /**
   * @name toDate
   * @category Common Helpers
   * @summary Convert the given argument to an instance of Date.
   *
   * @description
   * Convert the given argument to an instance of Date.
   *
   * If the argument is an instance of Date, the function returns its clone.
   *
   * If the argument is a number, it is treated as a timestamp.
   *
   * If an argument is a string, the function tries to parse it.
   * Function accepts complete ISO 8601 formats as well as partial implementations.
   * ISO 8601: http://en.wikipedia.org/wiki/ISO_8601
   *
   * If all above fails, the function passes the given argument to Date constructor.
   *
   * **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
   * All *date-fns* functions will throw `RangeError` if `options.additionalDigits` is not 0, 1, 2 or undefined.
   *
   * @param {Date|String|Number} argument - the value to convert
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - the additional number of digits in the extended year format
   * @returns {Date} the parsed date in the local time zone
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Convert string '2014-02-11T11:30:30' to date:
   * var result = toDate('2014-02-11T11:30:30')
   * //=> Tue Feb 11 2014 11:30:30
   *
   * @example
   * // Convert string '+02014101' to date,
   * // if the additional number of digits in the extended year format is 1:
   * var result = toDate('+02014101', {additionalDigits: 1})
   * //=> Fri Apr 11 2014 00:00:00
   */
  function toDate(argument, dirtyOptions) {
    var options = dirtyOptions || {};

    var additionalDigits = options.additionalDigits === undefined ? DEFAULT_ADDITIONAL_DIGITS : Number(options.additionalDigits);
    if (additionalDigits !== 2 && additionalDigits !== 1 && additionalDigits !== 0) {
      throw new RangeError('additionalDigits must be 0, 1 or 2');
    }

    // Clone the date
    if (argument instanceof Date) {
      // Prevent the date to lose the milliseconds when passed to new Date() in IE10
      return new Date(argument.getTime());
    } else if (typeof argument !== 'string') {
      return new Date(argument);
    }

    var dateStrings = splitDateString(argument);

    var parseYearResult = parseYear(dateStrings.date, additionalDigits);
    var year = parseYearResult.year;
    var restDateString = parseYearResult.restDateString;

    var date = parseDate(restDateString, year);

    if (date) {
      var timestamp = date.getTime();
      var time = 0;
      var offset;

      if (dateStrings.time) {
        time = parseTime(dateStrings.time);
      }

      if (dateStrings.timezone) {
        offset = parseTimezone(dateStrings.timezone);
      } else {
        // get offset accurate to hour in timezones that change offset
        offset = new Date(timestamp + time).getTimezoneOffset();
        offset = new Date(timestamp + time + offset * MILLISECONDS_IN_MINUTE).getTimezoneOffset();
      }

      return new Date(timestamp + time + offset * MILLISECONDS_IN_MINUTE);
    } else {
      return new Date(argument);
    }
  }

  function splitDateString(dateString) {
    var dateStrings = {};
    var array = dateString.split(patterns.dateTimeDelimeter);
    var timeString;

    if (patterns.plainTime.test(array[0])) {
      dateStrings.date = null;
      timeString = array[0];
    } else {
      dateStrings.date = array[0];
      timeString = array[1];
    }

    if (timeString) {
      var token = patterns.timezone.exec(timeString);
      if (token) {
        dateStrings.time = timeString.replace(token[1], '');
        dateStrings.timezone = token[1];
      } else {
        dateStrings.time = timeString;
      }
    }

    return dateStrings;
  }

  function parseYear(dateString, additionalDigits) {
    var patternYYY = patterns.YYY[additionalDigits];
    var patternYYYYY = patterns.YYYYY[additionalDigits];

    var token;

    // YYYY or ±YYYYY
    token = patterns.YYYY.exec(dateString) || patternYYYYY.exec(dateString);
    if (token) {
      var yearString = token[1];
      return {
        year: parseInt(yearString, 10),
        restDateString: dateString.slice(yearString.length)
      };
    }

    // YY or ±YYY
    token = patterns.YY.exec(dateString) || patternYYY.exec(dateString);
    if (token) {
      var centuryString = token[1];
      return {
        year: parseInt(centuryString, 10) * 100,
        restDateString: dateString.slice(centuryString.length)
      };
    }

    // Invalid ISO-formatted year
    return {
      year: null
    };
  }

  function parseDate(dateString, year) {
    // Invalid ISO-formatted year
    if (year === null) {
      return null;
    }

    var token;
    var date;
    var month;
    var week;

    // YYYY
    if (dateString.length === 0) {
      date = new Date(0);
      date.setUTCFullYear(year);
      return date;
    }

    // YYYY-MM
    token = patterns.MM.exec(dateString);
    if (token) {
      date = new Date(0);
      month = parseInt(token[1], 10) - 1;
      date.setUTCFullYear(year, month);
      return date;
    }

    // YYYY-DDD or YYYYDDD
    token = patterns.DDD.exec(dateString);
    if (token) {
      date = new Date(0);
      var dayOfYear = parseInt(token[1], 10);
      date.setUTCFullYear(year, 0, dayOfYear);
      return date;
    }

    // YYYY-MM-DD or YYYYMMDD
    token = patterns.MMDD.exec(dateString);
    if (token) {
      date = new Date(0);
      month = parseInt(token[1], 10) - 1;
      var day = parseInt(token[2], 10);
      date.setUTCFullYear(year, month, day);
      return date;
    }

    // YYYY-Www or YYYYWww
    token = patterns.Www.exec(dateString);
    if (token) {
      week = parseInt(token[1], 10) - 1;
      return dayOfISOYear(year, week);
    }

    // YYYY-Www-D or YYYYWwwD
    token = patterns.WwwD.exec(dateString);
    if (token) {
      week = parseInt(token[1], 10) - 1;
      var dayOfWeek = parseInt(token[2], 10) - 1;
      return dayOfISOYear(year, week, dayOfWeek);
    }

    // Invalid ISO-formatted date
    return null;
  }

  function parseTime(timeString) {
    var token;
    var hours;
    var minutes;

    // hh
    token = patterns.HH.exec(timeString);
    if (token) {
      hours = parseFloat(token[1].replace(',', '.'));
      return hours % 24 * MILLISECONDS_IN_HOUR;
    }

    // hh:mm or hhmm
    token = patterns.HHMM.exec(timeString);
    if (token) {
      hours = parseInt(token[1], 10);
      minutes = parseFloat(token[2].replace(',', '.'));
      return hours % 24 * MILLISECONDS_IN_HOUR + minutes * MILLISECONDS_IN_MINUTE;
    }

    // hh:mm:ss or hhmmss
    token = patterns.HHMMSS.exec(timeString);
    if (token) {
      hours = parseInt(token[1], 10);
      minutes = parseInt(token[2], 10);
      var seconds = parseFloat(token[3].replace(',', '.'));
      return hours % 24 * MILLISECONDS_IN_HOUR + minutes * MILLISECONDS_IN_MINUTE + seconds * 1000;
    }

    // Invalid ISO-formatted time
    return null;
  }

  function parseTimezone(timezoneString) {
    var token;
    var absoluteOffset;

    // Z
    token = patterns.timezoneZ.exec(timezoneString);
    if (token) {
      return 0;
    }

    // ±hh
    token = patterns.timezoneHH.exec(timezoneString);
    if (token) {
      absoluteOffset = parseInt(token[2], 10) * 60;
      return token[1] === '+' ? -absoluteOffset : absoluteOffset;
    }

    // ±hh:mm or ±hhmm
    token = patterns.timezoneHHMM.exec(timezoneString);
    if (token) {
      absoluteOffset = parseInt(token[2], 10) * 60 + parseInt(token[3], 10);
      return token[1] === '+' ? -absoluteOffset : absoluteOffset;
    }

    return 0;
  }

  function dayOfISOYear(isoYear, week, day) {
    week = week || 0;
    day = day || 0;
    var date = new Date(0);
    date.setUTCFullYear(isoYear, 0, 4);
    var fourthOfJanuaryDay = date.getUTCDay() || 7;
    var diff = week * 7 + day + 1 - fourthOfJanuaryDay;
    date.setUTCDate(date.getUTCDate() + diff);
    return date;
  }
  module.exports = exports['default'];
});

var index$7 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = addMilliseconds;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name addMilliseconds
   * @category Millisecond Helpers
   * @summary Add the specified number of milliseconds to the given date.
   *
   * @description
   * Add the specified number of milliseconds to the given date.
   *
   * @param {Date|String|Number} date - the date to be changed
   * @param {Number} amount - the amount of milliseconds to be added
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Date} the new date with the milliseconds added
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Add 750 milliseconds to 10 July 2014 12:45:30.000:
   * var result = addMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
   * //=> Thu Jul 10 2014 12:45:30.750
   */
  function addMilliseconds(dirtyDate, dirtyAmount, dirtyOptions) {
    var timestamp = (0, _index2.default)(dirtyDate, dirtyOptions).getTime();
    var amount = Number(dirtyAmount);
    return new Date(timestamp + amount);
  }
  module.exports = exports['default'];
});

var index$5 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = addMinutes;

  var _index2 = _interopRequireDefault(index$7);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var MILLISECONDS_IN_MINUTE = 60000;

  /**
   * @name addMinutes
   * @category Minute Helpers
   * @summary Add the specified number of minutes to the given date.
   *
   * @description
   * Add the specified number of minutes to the given date.
   *
   * @param {Date|String|Number} date - the date to be changed
   * @param {Number} amount - the amount of minutes to be added
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Date} the new date with the minutes added
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Add 30 minutes to 10 July 2014 12:00:00:
   * var result = addMinutes(new Date(2014, 6, 10, 12, 0), 30)
   * //=> Thu Jul 10 2014 12:30:00
   */
  function addMinutes(dirtyDate, dirtyAmount, dirtyOptions) {
    var amount = Number(dirtyAmount);
    return (0, _index2.default)(dirtyDate, amount * MILLISECONDS_IN_MINUTE, dirtyOptions);
  }
  module.exports = exports['default'];
});

var index$3 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = subMinutes;

  var _index2 = _interopRequireDefault(index$5);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name subMinutes
   * @category Minute Helpers
   * @summary Subtract the specified number of minutes from the given date.
   *
   * @description
   * Subtract the specified number of minutes from the given date.
   *
   * @param {Date|String|Number} date - the date to be changed
   * @param {Number} amount - the amount of minutes to be subtracted
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Date} the new date with the mintues subtracted
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Subtract 30 minutes from 10 July 2014 12:00:00:
   * var result = subMinutes(new Date(2014, 6, 10, 12, 0), 30)
   * //=> Thu Jul 10 2014 11:30:00
   */
  function subMinutes(dirtyDate, dirtyAmount, dirtyOptions) {
    var amount = Number(dirtyAmount);
    return (0, _index2.default)(dirtyDate, -amount, dirtyOptions);
  }
  module.exports = exports['default'];
});

var index$11 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = formatDistance;
  var formatDistanceLocale = {
    lessThanXSeconds: {
      one: 'less than a second',
      other: 'less than {{count}} seconds'
    },

    xSeconds: {
      one: '1 second',
      other: '{{count}} seconds'
    },

    halfAMinute: 'half a minute',

    lessThanXMinutes: {
      one: 'less than a minute',
      other: 'less than {{count}} minutes'
    },

    xMinutes: {
      one: '1 minute',
      other: '{{count}} minutes'
    },

    aboutXHours: {
      one: 'about 1 hour',
      other: 'about {{count}} hours'
    },

    xHours: {
      one: '1 hour',
      other: '{{count}} hours'
    },

    xDays: {
      one: '1 day',
      other: '{{count}} days'
    },

    aboutXMonths: {
      one: 'about 1 month',
      other: 'about {{count}} months'
    },

    xMonths: {
      one: '1 month',
      other: '{{count}} months'
    },

    aboutXYears: {
      one: 'about 1 year',
      other: 'about {{count}} years'
    },

    xYears: {
      one: '1 year',
      other: '{{count}} years'
    },

    overXYears: {
      one: 'over 1 year',
      other: 'over {{count}} years'
    },

    almostXYears: {
      one: 'almost 1 year',
      other: 'almost {{count}} years'
    }
  };

  function formatDistance(token, count, options) {
    options = options || {};

    var result;
    if (typeof formatDistanceLocale[token] === 'string') {
      result = formatDistanceLocale[token];
    } else if (count === 1) {
      result = formatDistanceLocale[token].one;
    } else {
      result = formatDistanceLocale[token].other.replace('{{count}}', count);
    }

    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'in ' + result;
      } else {
        return result + ' ago';
      }
    }

    return result;
  }
  module.exports = exports['default'];
});

var index$15 = createCommonjsModule(function (module, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = buildFormatLongFn;
  var tokensToBeShortedPattern = /MMMM|MM|DD|dddd/g;

  function buildShortLongFormat(format) {
    return format.replace(tokensToBeShortedPattern, function (token) {
      return token.slice(1);
    });
  }

  /**
   * @name buildFormatLongFn
   * @category Locale Helpers
   * @summary Build `formatLong` property for locale used by `format`, `formatRelative` and `parse` functions.
   *
   * @description
   * Build `formatLong` property for locale used by `format`, `formatRelative` and `parse` functions.
   * Returns a function which takes one of the following tokens as the argument:
   * `'LTS'`, `'LT'`, `'L'`, `'LL'`, `'LLL'`, `'l'`, `'ll'`, `'lll'`, `'llll'`
   * and returns a long format string written as `format` token strings.
   * See [format]{@link https://date-fns.org/docs/format}
   *
   * `'l'`, `'ll'`, `'lll'` and `'llll'` formats are built automatically
   * by shortening some of the tokens from corresponding unshortened formats
   * (e.g., if `LL` is `'MMMM DD YYYY'` then `ll` will be `MMM D YYYY`)
   *
   * @param {Object} obj - the object with long formats written as `format` token strings
   * @param {String} obj.LT - time format: hours and minutes
   * @param {String} obj.LTS - time format: hours, minutes and seconds
   * @param {String} obj.L - short date format: numeric day, month and year
   * @param {String} [obj.l] - short date format: numeric day, month and year (shortened)
   * @param {String} obj.LL - long date format: day, month in words, and year
   * @param {String} [obj.ll] - long date format: day, month in words, and year (shortened)
   * @param {String} obj.LLL - long date and time format
   * @param {String} [obj.lll] - long date and time format (shortened)
   * @param {String} obj.LLLL - long date, time and weekday format
   * @param {String} [obj.llll] - long date, time and weekday format (shortened)
   * @returns {Function} `formatLong` property of the locale
   *
   * @example
   * // For `en-US` locale:
   * locale.formatLong = buildFormatLongFn({
   *   LT: 'h:mm aa',
   *   LTS: 'h:mm:ss aa',
   *   L: 'MM/DD/YYYY',
   *   LL: 'MMMM D YYYY',
   *   LLL: 'MMMM D YYYY h:mm aa',
   *   LLLL: 'dddd, MMMM D YYYY h:mm aa'
   * })
   */
  function buildFormatLongFn(obj) {
    var formatLongLocale = {
      LTS: obj.LTS,
      LT: obj.LT,
      L: obj.L,
      LL: obj.LL,
      LLL: obj.LLL,
      LLLL: obj.LLLL,
      l: obj.l || buildShortLongFormat(obj.L),
      ll: obj.ll || buildShortLongFormat(obj.LL),
      lll: obj.lll || buildShortLongFormat(obj.LLL),
      llll: obj.llll || buildShortLongFormat(obj.LLLL)
    };

    return function (token) {
      return formatLongLocale[token];
    };
  }
  module.exports = exports["default"];
});

var index$13 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _index2 = _interopRequireDefault(index$15);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var formatLong = (0, _index2.default)({
    LT: 'h:mm aa',
    LTS: 'h:mm:ss aa',
    L: 'MM/DD/YYYY',
    LL: 'MMMM D YYYY',
    LLL: 'MMMM D YYYY h:mm aa',
    LLLL: 'dddd, MMMM D YYYY h:mm aa'
  });

  exports.default = formatLong;
  module.exports = exports['default'];
});

var index$17 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = formatRelative;
  var formatRelativeLocale = {
    lastWeek: '[last] dddd [at] LT',
    yesterday: '[yesterday at] LT',
    today: '[today at] LT',
    tomorrow: '[tomorrow at] LT',
    nextWeek: 'dddd [at] LT',
    other: 'L'
  };

  function formatRelative(token, date, baseDate, options) {
    return formatRelativeLocale[token];
  }
  module.exports = exports['default'];
});

var index$21 = createCommonjsModule(function (module, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = buildLocalizeFn;
  /**
   * @name buildLocalizeFn
   * @category Locale Helpers
   * @summary Build `localize.weekday`, `localize.month` and `localize.timeOfDay` properties for the locale.
   *
   * @description
   * Build `localize.weekday`, `localize.month` and `localize.timeOfDay` properties for the locale
   * used by `format` function.
   * If no `type` is supplied to the options of the resulting function, `defaultType` will be used (see example).
   *
   * `localize.weekday` function takes the weekday index as argument (0 - Sunday).
   * `localize.month` takes the month index (0 - January).
   * `localize.timeOfDay` takes the hours. Use `indexCallback` to convert them to an array index (see example).
   *
   * @param {Object} values - the object with arrays of values
   * @param {String} defaultType - the default type for the localize function
   * @param {Function} [indexCallback] - the callback which takes the resulting function argument
   *   and converts it into value array index
   * @returns {Function} the resulting function
   *
   * @example
   * var timeOfDayValues = {
   *   uppercase: ['AM', 'PM'],
   *   lowercase: ['am', 'pm'],
   *   long: ['a.m.', 'p.m.']
   * }
   * locale.localize.timeOfDay = buildLocalizeFn(timeOfDayValues, 'long', function (hours) {
   *   // 0 is a.m. array index, 1 is p.m. array index
   *   return (hours / 12) >= 1 ? 1 : 0
   * })
   * locale.localize.timeOfDay(16, {type: 'uppercase'}) //=> 'PM'
   * locale.localize.timeOfDay(5) //=> 'a.m.'
   */
  function buildLocalizeFn(values, defaultType, indexCallback) {
    return function (dirtyIndex, dirtyOptions) {
      var options = dirtyOptions || {};
      var type = options.type ? String(options.type) : defaultType;
      var valuesArray = values[type] || values[defaultType];
      var index = indexCallback ? indexCallback(Number(dirtyIndex)) : Number(dirtyIndex);
      return valuesArray[index];
    };
  }
  module.exports = exports["default"];
});

var index$23 = createCommonjsModule(function (module, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = buildLocalizeArrayFn;
  /**
   * @name buildLocalizeArrayFn
   * @category Locale Helpers
   * @summary Build `localize.weekdays`, `localize.months` and `localize.timesOfDay` properties for the locale.
   *
   * @description
   * Build `localize.weekdays`, `localize.months` and `localize.timesOfDay` properties for the locale.
   * If no `type` is supplied to the options of the resulting function, `defaultType` will be used (see example).
   *
   * @param {Object} values - the object with arrays of values
   * @param {String} defaultType - the default type for the localize function
   * @returns {Function} the resulting function
   *
   * @example
   * var weekdayValues = {
   *   narrow: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
   *   short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
   *   long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
   * }
   * locale.localize.weekdays = buildLocalizeArrayFn(weekdayValues, 'long')
   * locale.localize.weekdays({type: 'narrow'}) //=> ['Su', 'Mo', ...]
   * locale.localize.weekdays() //=> ['Sunday', 'Monday', ...]
   */
  function buildLocalizeArrayFn(values, defaultType) {
    return function (dirtyOptions) {
      var options = dirtyOptions || {};
      var type = options.type ? String(options.type) : defaultType;
      return values[type] || values[defaultType];
    };
  }
  module.exports = exports["default"];
});

var index$19 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _index2 = _interopRequireDefault(index$21);

  var _index4 = _interopRequireDefault(index$23);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  // Note: in English, the names of days of the week and months are capitalized.
  // If you are making a new locale based on this one, check if the same is true for the language you're working on.
  // Generally, formatted dates should look like they are in the middle of a sentence,
  // e.g. in Spanish language the weekdays and months should be in the lowercase.
  var weekdayValues = {
    narrow: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };

  var monthValues = {
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };

  // `timeOfDay` is used to designate which part of the day it is, when used with 12-hour clock.
  // Use the system which is used the most commonly in the locale.
  // For example, if the country doesn't use a.m./p.m., you can use `night`/`morning`/`afternoon`/`evening`:
  //
  //   var timeOfDayValues = {
  //     any: ['in the night', 'in the morning', 'in the afternoon', 'in the evening']
  //   }
  //
  // And later:
  //
  //   var localize = {
  //     // The callback takes the hours as the argument and returns the array index
  //     timeOfDay: buildLocalizeFn(timeOfDayValues, 'any', function (hours) {
  //       if (hours >= 17) {
  //         return 3
  //       } else if (hours >= 12) {
  //         return 2
  //       } else if (hours >= 4) {
  //         return 1
  //       } else {
  //         return 0
  //       }
  //     }),
  //     timesOfDay: buildLocalizeArrayFn(timeOfDayValues, 'any')
  //   }
  var timeOfDayValues = {
    uppercase: ['AM', 'PM'],
    lowercase: ['am', 'pm'],
    long: ['a.m.', 'p.m.']
  };

  function ordinalNumber(dirtyNumber, dirtyOptions) {
    var number = Number(dirtyNumber);

    // If ordinal numbers depend on context, for example,
    // if they are different for different grammatical genders,
    // use `options.unit`:
    //
    //   var options = dirtyOptions || {}
    //   var unit = String(options.unit)
    //
    // where `unit` can be 'month', 'quarter', 'week', 'isoWeek', 'dayOfYear',
    // 'dayOfMonth' or 'dayOfWeek'

    var rem100 = number % 100;
    if (rem100 > 20 || rem100 < 10) {
      switch (rem100 % 10) {
        case 1:
          return number + 'st';
        case 2:
          return number + 'nd';
        case 3:
          return number + 'rd';
      }
    }
    return number + 'th';
  }

  var localize = {
    ordinalNumber: ordinalNumber,
    weekday: (0, _index2.default)(weekdayValues, 'long'),
    weekdays: (0, _index4.default)(weekdayValues, 'long'),
    month: (0, _index2.default)(monthValues, 'long'),
    months: (0, _index4.default)(monthValues, 'long'),
    timeOfDay: (0, _index2.default)(timeOfDayValues, 'long', function (hours) {
      return hours / 12 >= 1 ? 1 : 0;
    }),
    timesOfDay: (0, _index4.default)(timeOfDayValues, 'long')
  };

  exports.default = localize;
  module.exports = exports['default'];
});

var index$27 = createCommonjsModule(function (module, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = buildMatchFn;
  /**
   * @name buildMatchFn
   * @category Locale Helpers
   * @summary Build `match.weekdays`, `match.months` and `match.timesOfDay` properties for the locale.
   *
   * @description
   * Build `match.weekdays`, `match.months` and `match.timesOfDay` properties for the locale used by `parse` function.
   * If no `type` is supplied to the options of the resulting function, `defaultType` will be used (see example).
   * The result of the match function will be passed into corresponding parser function
   * (`match.weekday`, `match.month` or `match.timeOfDay` respectively. See `buildParseFn`).
   *
   * @param {Object} values - the object with RegExps
   * @param {String} defaultType - the default type for the match function
   * @returns {Function} the resulting function
   *
   * @example
   * var matchWeekdaysPatterns = {
   *   narrow: /^(su|mo|tu|we|th|fr|sa)/i,
   *   short: /^(sun|mon|tue|wed|thu|fri|sat)/i,
   *   long: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
   * }
   * locale.match.weekdays = buildMatchFn(matchWeekdaysPatterns, 'long')
   * locale.match.weekdays('Sunday', {type: 'narrow'}) //=> ['Su', 'Su', ...]
   * locale.match.weekdays('Sunday') //=> ['Sunday', 'Sunday', ...]
   */
  function buildMatchFn(patterns, defaultType) {
    return function (dirtyString, dirtyOptions) {
      var options = dirtyOptions || {};
      var type = options.type ? String(options.type) : defaultType;
      var pattern = patterns[type] || patterns[defaultType];
      var string = String(dirtyString);
      return string.match(pattern);
    };
  }
  module.exports = exports["default"];
});

var index$29 = createCommonjsModule(function (module, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = buildParseFn;
  /**
   * @name buildParseFn
   * @category Locale Helpers
   * @summary Build `match.weekday`, `match.month` and `match.timeOfDay` properties for the locale.
   *
   * @description
   * Build `match.weekday`, `match.month` and `match.timeOfDay` properties for the locale used by `parse` function.
   * The argument of the resulting function is the result of the corresponding match function
   * (`match.weekdays`, `match.months` or `match.timesOfDay` respectively. See `buildMatchFn`).
   *
   * @param {Object} values - the object with arrays of RegExps
   * @param {String} defaultType - the default type for the parser function
   * @returns {Function} the resulting function
   *
   * @example
   * var parseWeekdayPatterns = {
   *   any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
   * }
   * locale.match.weekday = buildParseFn(matchWeekdaysPatterns, 'long')
   * var matchResult = locale.match.weekdays('Friday')
   * locale.match.weekday(matchResult) //=> 5
   */
  function buildParseFn(patterns, defaultType) {
    return function (matchResult, dirtyOptions) {
      var options = dirtyOptions || {};
      var type = options.type ? String(options.type) : defaultType;
      var patternsArray = patterns[type] || patterns[defaultType];
      var string = matchResult[1];

      return patternsArray.findIndex(function (pattern) {
        return pattern.test(string);
      });
    };
  }
  module.exports = exports["default"];
});

var index$31 = createCommonjsModule(function (module, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = buildMatchPatternFn;
  /**
   * @name buildMatchPatternFn
   * @category Locale Helpers
   * @summary Build match function from a single RegExp.
   *
   * @description
   * Build match function from a single RegExp.
   * Usually used for building `match.ordinalNumbers` property of the locale.
   *
   * @param {Object} pattern - the RegExp
   * @returns {Function} the resulting function
   *
   * @example
   * locale.match.ordinalNumbers = buildMatchPatternFn(/^(\d+)(th|st|nd|rd)?/i)
   * locale.match.ordinalNumbers('3rd') //=> ['3rd', '3', 'rd', ...]
   */
  function buildMatchPatternFn(pattern) {
    return function (dirtyString) {
      var string = String(dirtyString);
      return string.match(pattern);
    };
  }
  module.exports = exports["default"];
});

var index$33 = createCommonjsModule(function (module, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = parseDecimal;
  /**
   * @name parseDecimal
   * @category Locale Helpers
   * @summary Parses the match result into decimal number.
   *
   * @description
   * Parses the match result into decimal number.
   * Uses the string matched with the first set of parentheses of match RegExp.
   *
   * @param {Array} matchResult - the object returned by matching function
   * @returns {Number} the parsed value
   *
   * @example
   * locale.match = {
   *   ordinalNumbers: (dirtyString) {
   *     return String(dirtyString).match(/^(\d+)(th|st|nd|rd)?/i)
   *   },
   *   ordinalNumber: parseDecimal
   * }
   */
  function parseDecimal(matchResult) {
    return parseInt(matchResult[1], 10);
  }
  module.exports = exports["default"];
});

var index$25 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _index2 = _interopRequireDefault(index$27);

  var _index4 = _interopRequireDefault(index$29);

  var _index6 = _interopRequireDefault(index$31);

  var _index8 = _interopRequireDefault(index$33);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var matchOrdinalNumbersPattern = /^(\d+)(th|st|nd|rd)?/i;

  var matchWeekdaysPatterns = {
    narrow: /^(su|mo|tu|we|th|fr|sa)/i,
    short: /^(sun|mon|tue|wed|thu|fri|sat)/i,
    long: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
  };

  var parseWeekdayPatterns = {
    any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
  };

  var matchMonthsPatterns = {
    short: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    long: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
  };

  var parseMonthPatterns = {
    any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^may/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
  };

  // `timeOfDay` is used to designate which part of the day it is, when used with 12-hour clock.
  // Use the system which is used the most commonly in the locale.
  // For example, if the country doesn't use a.m./p.m., you can use `night`/`morning`/`afternoon`/`evening`:
  //
  //   var matchTimesOfDayPatterns = {
  //     long: /^((in the)? (night|morning|afternoon|evening?))/i
  //   }
  //
  //   var parseTimeOfDayPatterns = {
  //     any: [/(night|morning)/i, /(afternoon|evening)/i]
  //   }
  var matchTimesOfDayPatterns = {
    short: /^(am|pm)/i,
    long: /^([ap]\.?\s?m\.?)/i
  };

  var parseTimeOfDayPatterns = {
    any: [/^a/i, /^p/i]
  };

  var match = {
    ordinalNumbers: (0, _index6.default)(matchOrdinalNumbersPattern),
    ordinalNumber: _index8.default,
    weekdays: (0, _index2.default)(matchWeekdaysPatterns, 'long'),
    weekday: (0, _index4.default)(parseWeekdayPatterns, 'any'),
    months: (0, _index2.default)(matchMonthsPatterns, 'long'),
    month: (0, _index4.default)(parseMonthPatterns, 'any'),
    timesOfDay: (0, _index2.default)(matchTimesOfDayPatterns, 'long'),
    timeOfDay: (0, _index4.default)(parseTimeOfDayPatterns, 'any')
  };

  exports.default = match;
  module.exports = exports['default'];
});

var index$9 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _index2 = _interopRequireDefault(index$11);

  var _index4 = _interopRequireDefault(index$13);

  var _index6 = _interopRequireDefault(index$17);

  var _index8 = _interopRequireDefault(index$19);

  var _index10 = _interopRequireDefault(index$25);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @type {Locale}
   * @category Locales
   * @summary English locale (United States).
   * @language English
   * @iso-639-2 eng
   */
  var locale = {
    formatDistance: _index2.default,
    formatLong: _index4.default,
    formatRelative: _index6.default,
    localize: _index8.default,
    match: _index10.default,
    options: {
      weekStartsOn: 0 /* Sunday */
      , firstWeekContainsDate: 1
    }
  };

  exports.default = locale;
  module.exports = exports['default'];
});

var index$35 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var patterns = {
    'M': /^(1[0-2]|0?\d)/, // 0 to 12
    'D': /^(3[0-1]|[0-2]?\d)/, // 0 to 31
    'DDD': /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/, // 0 to 366
    'W': /^(5[0-3]|[0-4]?\d)/, // 0 to 53
    'YYYY': /^(\d{1,4})/, // 0 to 9999
    'H': /^(2[0-3]|[0-1]?\d)/, // 0 to 23
    'm': /^([0-5]?\d)/, // 0 to 59
    'Z': /^([+-])(\d{2}):(\d{2})/,
    'ZZ': /^([+-])(\d{2})(\d{2})/,
    singleDigit: /^(\d)/,
    twoDigits: /^(\d{2})/,
    threeDigits: /^(\d{3})/,
    fourDigits: /^(\d{4})/,
    anyDigits: /^(\d+)/
  };

  function parseDecimal(matchResult) {
    return parseInt(matchResult[1], 10);
  }

  var parsers = {
    // Year: 00, 01, ..., 99
    'YY': {
      unit: 'twoDigitYear',
      match: patterns.twoDigits,
      parse: function parse(matchResult) {
        return parseDecimal(matchResult);
      }
    },

    // Year: 1900, 1901, ..., 2099
    'YYYY': {
      unit: 'year',
      match: patterns.YYYY,
      parse: parseDecimal
    },

    // ISO week-numbering year: 00, 01, ..., 99
    'GG': {
      unit: 'isoYear',
      match: patterns.twoDigits,
      parse: function parse(matchResult) {
        return parseDecimal(matchResult) + 1900;
      }
    },

    // ISO week-numbering year: 1900, 1901, ..., 2099
    'GGGG': {
      unit: 'isoYear',
      match: patterns.YYYY,
      parse: parseDecimal
    },

    // Quarter: 1, 2, 3, 4
    'Q': {
      unit: 'quarter',
      match: patterns.singleDigit,
      parse: parseDecimal
    },

    // Ordinal quarter
    'Qo': {
      unit: 'quarter',
      match: function match(string, options) {
        return options.locale.match.ordinalNumbers(string, { unit: 'quarter' });
      },
      parse: function parse(matchResult, options) {
        return options.locale.match.ordinalNumber(matchResult, { unit: 'quarter' });
      }
    },

    // Month: 1, 2, ..., 12
    'M': {
      unit: 'month',
      match: patterns.M,
      parse: function parse(matchResult) {
        return parseDecimal(matchResult) - 1;
      }
    },

    // Ordinal month
    'Mo': {
      unit: 'month',
      match: function match(string, options) {
        return options.locale.match.ordinalNumbers(string, { unit: 'month' });
      },
      parse: function parse(matchResult, options) {
        return options.locale.match.ordinalNumber(matchResult, { unit: 'month' }) - 1;
      }
    },

    // Month: 01, 02, ..., 12
    'MM': {
      unit: 'month',
      match: patterns.twoDigits,
      parse: function parse(matchResult) {
        return parseDecimal(matchResult) - 1;
      }
    },

    // Month: Jan, Feb, ..., Dec
    'MMM': {
      unit: 'month',
      match: function match(string, options) {
        return options.locale.match.months(string, { type: 'short' });
      },
      parse: function parse(matchResult, options) {
        return options.locale.match.month(matchResult, { type: 'short' });
      }
    },

    // Month: January, February, ..., December
    'MMMM': {
      unit: 'month',
      match: function match(string, options) {
        return options.locale.match.months(string, { type: 'long' }) || options.locale.match.months(string, { type: 'short' });
      },
      parse: function parse(matchResult, options) {
        var parseResult = options.locale.match.month(matchResult, { type: 'long' });

        if (parseResult == null) {
          parseResult = options.locale.match.month(matchResult, { type: 'short' });
        }

        return parseResult;
      }
    },

    // ISO week: 1, 2, ..., 53
    'W': {
      unit: 'isoWeek',
      match: patterns.W,
      parse: parseDecimal
    },

    // Ordinal ISO week
    'Wo': {
      unit: 'isoWeek',
      match: function match(string, options) {
        return options.locale.match.ordinalNumbers(string, { unit: 'isoWeek' });
      },
      parse: function parse(matchResult, options) {
        return options.locale.match.ordinalNumber(matchResult, { unit: 'isoWeek' });
      }
    },

    // ISO week: 01, 02, ..., 53
    'WW': {
      unit: 'isoWeek',
      match: patterns.twoDigits,
      parse: parseDecimal
    },

    // Day of week: 0, 1, ..., 6
    'd': {
      unit: 'dayOfWeek',
      match: patterns.singleDigit,
      parse: parseDecimal
    },

    // Ordinal day of week
    'do': {
      unit: 'dayOfWeek',
      match: function match(string, options) {
        return options.locale.match.ordinalNumbers(string, { unit: 'dayOfWeek' });
      },
      parse: function parse(matchResult, options) {
        return options.locale.match.ordinalNumber(matchResult, { unit: 'dayOfWeek' });
      }
    },

    // Day of week: Su, Mo, ..., Sa
    'dd': {
      unit: 'dayOfWeek',
      match: function match(string, options) {
        return options.locale.match.weekdays(string, { type: 'narrow' });
      },
      parse: function parse(matchResult, options) {
        return options.locale.match.weekday(matchResult, { type: 'narrow' });
      }
    },

    // Day of week: Sun, Mon, ..., Sat
    'ddd': {
      unit: 'dayOfWeek',
      match: function match(string, options) {
        return options.locale.match.weekdays(string, { type: 'short' }) || options.locale.match.weekdays(string, { type: 'narrow' });
      },
      parse: function parse(matchResult, options) {
        var parseResult = options.locale.match.weekday(matchResult, { type: 'short' });

        if (parseResult == null) {
          parseResult = options.locale.match.weekday(matchResult, { type: 'narrow' });
        }

        return parseResult;
      }
    },

    // Day of week: Sunday, Monday, ..., Saturday
    'dddd': {
      unit: 'dayOfWeek',
      match: function match(string, options) {
        return options.locale.match.weekdays(string, { type: 'long' }) || options.locale.match.weekdays(string, { type: 'short' }) || options.locale.match.weekdays(string, { type: 'narrow' });
      },
      parse: function parse(matchResult, options) {
        var parseResult = options.locale.match.weekday(matchResult, { type: 'long' });

        if (parseResult == null) {
          parseResult = options.locale.match.weekday(matchResult, { type: 'short' });

          if (parseResult == null) {
            parseResult = options.locale.match.weekday(matchResult, { type: 'narrow' });
          }
        }

        return parseResult;
      }
    },

    // Day of ISO week: 1, 2, ..., 7
    'E': {
      unit: 'dayOfISOWeek',
      match: patterns.singleDigit,
      parse: function parse(matchResult) {
        return parseDecimal(matchResult);
      }
    },

    // Day of month: 1, 2, ..., 31
    'D': {
      unit: 'dayOfMonth',
      match: patterns.D,
      parse: parseDecimal
    },

    // Ordinal day of month
    'Do': {
      unit: 'dayOfMonth',
      match: function match(string, options) {
        return options.locale.match.ordinalNumbers(string, { unit: 'dayOfMonth' });
      },
      parse: function parse(matchResult, options) {
        return options.locale.match.ordinalNumber(matchResult, { unit: 'dayOfMonth' });
      }
    },

    // Day of month: 01, 02, ..., 31
    'DD': {
      unit: 'dayOfMonth',
      match: patterns.twoDigits,
      parse: parseDecimal
    },

    // Day of year: 1, 2, ..., 366
    'DDD': {
      unit: 'dayOfYear',
      match: patterns.DDD,
      parse: parseDecimal
    },

    // Ordinal day of year
    'DDDo': {
      unit: 'dayOfYear',
      match: function match(string, options) {
        return options.locale.match.ordinalNumbers(string, { unit: 'dayOfYear' });
      },
      parse: function parse(matchResult, options) {
        return options.locale.match.ordinalNumber(matchResult, { unit: 'dayOfYear' });
      }
    },

    // Day of year: 001, 002, ..., 366
    'DDDD': {
      unit: 'dayOfYear',
      match: patterns.threeDigits,
      parse: parseDecimal
    },

    // AM, PM
    'A': {
      unit: 'timeOfDay',
      match: function match(string, options) {
        return options.locale.match.timesOfDay(string, { type: 'short' });
      },
      parse: function parse(matchResult, options) {
        return options.locale.match.timeOfDay(matchResult, { type: 'short' });
      }
    },

    // a.m., p.m.
    'aa': {
      unit: 'timeOfDay',
      match: function match(string, options) {
        return options.locale.match.timesOfDay(string, { type: 'long' }) || options.locale.match.timesOfDay(string, { type: 'short' });
      },
      parse: function parse(matchResult, options) {
        var parseResult = options.locale.match.timeOfDay(matchResult, { type: 'long' });

        if (parseResult == null) {
          parseResult = options.locale.match.timeOfDay(matchResult, { type: 'short' });
        }

        return parseResult;
      }
    },

    // Hour: 0, 1, ... 23
    'H': {
      unit: 'hours',
      match: patterns.H,
      parse: parseDecimal
    },

    // Hour: 00, 01, ..., 23
    'HH': {
      unit: 'hours',
      match: patterns.twoDigits,
      parse: parseDecimal
    },

    // Hour: 1, 2, ..., 12
    'h': {
      unit: 'timeOfDayHours',
      match: patterns.M,
      parse: parseDecimal
    },

    // Hour: 01, 02, ..., 12
    'hh': {
      unit: 'timeOfDayHours',
      match: patterns.twoDigits,
      parse: parseDecimal
    },

    // Minute: 0, 1, ..., 59
    'm': {
      unit: 'minutes',
      match: patterns.m,
      parse: parseDecimal
    },

    // Minute: 00, 01, ..., 59
    'mm': {
      unit: 'minutes',
      match: patterns.twoDigits,
      parse: parseDecimal
    },

    // Second: 0, 1, ..., 59
    's': {
      unit: 'seconds',
      match: patterns.m,
      parse: parseDecimal
    },

    // Second: 00, 01, ..., 59
    'ss': {
      unit: 'seconds',
      match: patterns.twoDigits,
      parse: parseDecimal
    },

    // 1/10 of second: 0, 1, ..., 9
    'S': {
      unit: 'milliseconds',
      match: patterns.singleDigit,
      parse: function parse(matchResult) {
        return parseDecimal(matchResult) * 100;
      }
    },

    // 1/100 of second: 00, 01, ..., 99
    'SS': {
      unit: 'milliseconds',
      match: patterns.twoDigits,
      parse: function parse(matchResult) {
        return parseDecimal(matchResult) * 10;
      }
    },

    // Millisecond: 000, 001, ..., 999
    'SSS': {
      unit: 'milliseconds',
      match: patterns.threeDigits,
      parse: parseDecimal
    },

    // Timezone: -01:00, +00:00, ... +12:00
    'Z': {
      unit: 'timezone',
      match: patterns.Z,
      parse: function parse(matchResult) {
        var sign = matchResult[1];
        var hours = parseInt(matchResult[2], 10);
        var minutes = parseInt(matchResult[3], 10);
        var absoluteOffset = hours * 60 + minutes;
        return sign === '+' ? absoluteOffset : -absoluteOffset;
      }
    },

    // Timezone: -0100, +0000, ... +1200
    'ZZ': {
      unit: 'timezone',
      match: patterns.ZZ,
      parse: function parse(matchResult) {
        var sign = matchResult[1];
        var hours = parseInt(matchResult[2], 10);
        var minutes = parseInt(matchResult[3], 10);
        var absoluteOffset = hours * 60 + minutes;
        return sign === '+' ? absoluteOffset : -absoluteOffset;
      }
    },

    // Seconds timestamp: 512969520
    'X': {
      unit: 'timestamp',
      match: patterns.anyDigits,
      parse: function parse(matchResult) {
        return parseDecimal(matchResult) * 1000;
      }
    },

    // Milliseconds timestamp: 512969520900
    'x': {
      unit: 'timestamp',
      match: patterns.anyDigits,
      parse: parseDecimal
    }
  };

  parsers['a'] = parsers['A'];

  exports.default = parsers;
  module.exports = exports['default'];
});

var index$39 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = setUTCDay;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function setUTCDay(dirtyDate, dirtyDay, dirtyOptions) {
    var options = dirtyOptions || {};
    var locale = options.locale;
    var localeWeekStartsOn = locale && locale.options && locale.options.weekStartsOn;
    var defaultWeekStartsOn = localeWeekStartsOn === undefined ? 0 : Number(localeWeekStartsOn);
    var weekStartsOn = options.weekStartsOn === undefined ? defaultWeekStartsOn : Number(options.weekStartsOn);

    // Test if weekStartsOn is between 0 and 6 _and_ is not NaN
    if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
      throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
    }

    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var day = Number(dirtyDay);

    var currentDay = date.getUTCDay();

    var remainder = day % 7;
    var dayIndex = (remainder + 7) % 7;

    var diff = (dayIndex < weekStartsOn ? 7 : 0) + day - currentDay;

    date.setUTCDate(date.getUTCDate() + diff);
    return date;
  }
  module.exports = exports['default'];
});

var index$41 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = setUTCISODay;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function setUTCISODay(dirtyDate, dirtyDay, dirtyOptions) {
    var day = Number(dirtyDay);

    if (day % 7 === 0) {
      day = day - 7;
    }

    var weekStartsOn = 1;
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var currentDay = date.getUTCDay();

    var remainder = day % 7;
    var dayIndex = (remainder + 7) % 7;

    var diff = (dayIndex < weekStartsOn ? 7 : 0) + day - currentDay;

    date.setUTCDate(date.getUTCDate() + diff);
    return date;
  }
  module.exports = exports['default'];
});

var index$47 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = startOfUTCISOWeek;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function startOfUTCISOWeek(dirtyDate, dirtyOptions) {
    var weekStartsOn = 1;

    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var day = date.getUTCDay();
    var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;

    date.setUTCDate(date.getUTCDate() - diff);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }
  module.exports = exports['default'];
});

var index$51 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = getUTCISOWeekYear;

  var _index2 = _interopRequireDefault(index$1);

  var _index4 = _interopRequireDefault(index$47);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function getUTCISOWeekYear(dirtyDate, dirtyOptions) {
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var year = date.getUTCFullYear();

    var fourthOfJanuaryOfNextYear = new Date(0);
    fourthOfJanuaryOfNextYear.setUTCFullYear(year + 1, 0, 4);
    fourthOfJanuaryOfNextYear.setUTCHours(0, 0, 0, 0);
    var startOfNextYear = (0, _index4.default)(fourthOfJanuaryOfNextYear, dirtyOptions);

    var fourthOfJanuaryOfThisYear = new Date(0);
    fourthOfJanuaryOfThisYear.setUTCFullYear(year, 0, 4);
    fourthOfJanuaryOfThisYear.setUTCHours(0, 0, 0, 0);
    var startOfThisYear = (0, _index4.default)(fourthOfJanuaryOfThisYear, dirtyOptions);

    if (date.getTime() >= startOfNextYear.getTime()) {
      return year + 1;
    } else if (date.getTime() >= startOfThisYear.getTime()) {
      return year;
    } else {
      return year - 1;
    }
  }
  module.exports = exports['default'];
});

var index$49 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = startOfUTCISOWeekYear;

  var _index2 = _interopRequireDefault(index$51);

  var _index4 = _interopRequireDefault(index$47);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function startOfUTCISOWeekYear(dirtyDate, dirtyOptions) {
    var year = (0, _index2.default)(dirtyDate, dirtyOptions);
    var fourthOfJanuary = new Date(0);
    fourthOfJanuary.setUTCFullYear(year, 0, 4);
    fourthOfJanuary.setUTCHours(0, 0, 0, 0);
    var date = (0, _index4.default)(fourthOfJanuary, dirtyOptions);
    return date;
  }
  module.exports = exports['default'];
});

var index$45 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = getUTCISOWeek;

  var _index2 = _interopRequireDefault(index$1);

  var _index4 = _interopRequireDefault(index$47);

  var _index6 = _interopRequireDefault(index$49);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var MILLISECONDS_IN_WEEK = 604800000;

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function getUTCISOWeek(dirtyDate, dirtyOptions) {
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var diff = (0, _index4.default)(date, dirtyOptions).getTime() - (0, _index6.default)(date, dirtyOptions).getTime();

    // Round the number of days to the nearest integer
    // because the number of milliseconds in a week is not constant
    // (e.g. it's different in the week of the daylight saving time clock shift)
    return Math.round(diff / MILLISECONDS_IN_WEEK) + 1;
  }
  module.exports = exports['default'];
});

var index$43 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = setUTCISOWeek;

  var _index2 = _interopRequireDefault(index$1);

  var _index4 = _interopRequireDefault(index$45);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function setUTCISOWeek(dirtyDate, dirtyISOWeek, dirtyOptions) {
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var isoWeek = Number(dirtyISOWeek);
    var diff = (0, _index4.default)(date, dirtyOptions) - isoWeek;
    date.setUTCDate(date.getUTCDate() - diff * 7);
    return date;
  }
  module.exports = exports['default'];
});

var index$53 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = setUTCISOWeekYear;

  var _index2 = _interopRequireDefault(index$1);

  var _index4 = _interopRequireDefault(index$49);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var MILLISECONDS_IN_DAY = 86400000;

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function setUTCISOWeekYear(dirtyDate, dirtyISOYear, dirtyOptions) {
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var isoYear = Number(dirtyISOYear);
    var dateStartOfYear = (0, _index4.default)(date, dirtyOptions);
    var diff = Math.floor((date.getTime() - dateStartOfYear.getTime()) / MILLISECONDS_IN_DAY);
    var fourthOfJanuary = new Date(0);
    fourthOfJanuary.setUTCFullYear(isoYear, 0, 4);
    fourthOfJanuary.setUTCHours(0, 0, 0, 0);
    date = (0, _index4.default)(fourthOfJanuary, dirtyOptions);
    date.setUTCDate(date.getUTCDate() + diff);
    return date;
  }
  module.exports = exports['default'];
});

var index$37 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _index2 = _interopRequireDefault(index$39);

  var _index4 = _interopRequireDefault(index$41);

  var _index6 = _interopRequireDefault(index$43);

  var _index8 = _interopRequireDefault(index$53);

  var _index10 = _interopRequireDefault(index$47);

  var _index12 = _interopRequireDefault(index$49);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var MILLISECONDS_IN_MINUTE = 60000;

  function setTimeOfDay(hours, timeOfDay) {
    var isAM = timeOfDay === 0;

    if (isAM) {
      if (hours === 12) {
        return 0;
      }
    } else {
      if (hours !== 12) {
        return 12 + hours;
      }
    }

    return hours;
  }

  var units = {
    twoDigitYear: {
      priority: 10,
      set: function set(dateValues, value) {
        var century = Math.floor(dateValues.date.getUTCFullYear() / 100);
        var year = century * 100 + value;
        dateValues.date.setUTCFullYear(year, 0, 1);
        dateValues.date.setUTCHours(0, 0, 0, 0);
        return dateValues;
      }
    },

    year: {
      priority: 10,
      set: function set(dateValues, value) {
        dateValues.date.setUTCFullYear(value, 0, 1);
        dateValues.date.setUTCHours(0, 0, 0, 0);
        return dateValues;
      }
    },

    isoYear: {
      priority: 10,
      set: function set(dateValues, value, options) {
        dateValues.date = (0, _index12.default)((0, _index8.default)(dateValues.date, value, options), options);
        return dateValues;
      }
    },

    quarter: {
      priority: 20,
      set: function set(dateValues, value) {
        dateValues.date.setUTCMonth((value - 1) * 3, 1);
        dateValues.date.setUTCHours(0, 0, 0, 0);
        return dateValues;
      }
    },

    month: {
      priority: 30,
      set: function set(dateValues, value) {
        dateValues.date.setUTCMonth(value, 1);
        dateValues.date.setUTCHours(0, 0, 0, 0);
        return dateValues;
      }
    },

    isoWeek: {
      priority: 40,
      set: function set(dateValues, value, options) {
        dateValues.date = (0, _index10.default)((0, _index6.default)(dateValues.date, value, options), options);
        return dateValues;
      }
    },

    dayOfWeek: {
      priority: 50,
      set: function set(dateValues, value, options) {
        dateValues.date = (0, _index2.default)(dateValues.date, value, options);
        dateValues.date.setUTCHours(0, 0, 0, 0);
        return dateValues;
      }
    },

    dayOfISOWeek: {
      priority: 50,
      set: function set(dateValues, value, options) {
        dateValues.date = (0, _index4.default)(dateValues.date, value, options);
        dateValues.date.setUTCHours(0, 0, 0, 0);
        return dateValues;
      }
    },

    dayOfMonth: {
      priority: 50,
      set: function set(dateValues, value) {
        dateValues.date.setUTCDate(value);
        dateValues.date.setUTCHours(0, 0, 0, 0);
        return dateValues;
      }
    },

    dayOfYear: {
      priority: 50,
      set: function set(dateValues, value) {
        dateValues.date.setUTCMonth(0, value);
        dateValues.date.setUTCHours(0, 0, 0, 0);
        return dateValues;
      }
    },

    timeOfDay: {
      priority: 60,
      set: function set(dateValues, value, options) {
        dateValues.timeOfDay = value;
        return dateValues;
      }
    },

    hours: {
      priority: 70,
      set: function set(dateValues, value, options) {
        dateValues.date.setUTCHours(value, 0, 0, 0);
        return dateValues;
      }
    },

    timeOfDayHours: {
      priority: 70,
      set: function set(dateValues, value, options) {
        var timeOfDay = dateValues.timeOfDay;
        if (timeOfDay != null) {
          value = setTimeOfDay(value, timeOfDay);
        }
        dateValues.date.setUTCHours(value, 0, 0, 0);
        return dateValues;
      }
    },

    minutes: {
      priority: 80,
      set: function set(dateValues, value) {
        dateValues.date.setUTCMinutes(value, 0, 0);
        return dateValues;
      }
    },

    seconds: {
      priority: 90,
      set: function set(dateValues, value) {
        dateValues.date.setUTCSeconds(value, 0);
        return dateValues;
      }
    },

    milliseconds: {
      priority: 100,
      set: function set(dateValues, value) {
        dateValues.date.setUTCMilliseconds(value);
        return dateValues;
      }
    },

    timezone: {
      priority: 110,
      set: function set(dateValues, value) {
        dateValues.date = new Date(dateValues.date.getTime() - value * MILLISECONDS_IN_MINUTE);
        return dateValues;
      }
    },

    timestamp: {
      priority: 120,
      set: function set(dateValues, value) {
        dateValues.date = new Date(value);
        return dateValues;
      }
    }
  };

  exports.default = units;
  module.exports = exports['default'];
});

var index$55 = createCommonjsModule(function (module, exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = cloneObject;
  function cloneObject(dirtyObject) {
    dirtyObject = dirtyObject || {};
    var object = {};

    for (var property in dirtyObject) {
      if (dirtyObject.hasOwnProperty(property)) {
        object[property] = dirtyObject[property];
      }
    }

    return object;
  }
  module.exports = exports["default"];
});

var index = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = parse;

  var _index2 = _interopRequireDefault(index$1);

  var _index4 = _interopRequireDefault(index$3);

  var _index6 = _interopRequireDefault(index$9);

  var _index8 = _interopRequireDefault(index$35);

  var _index10 = _interopRequireDefault(index$37);

  var _index12 = _interopRequireDefault(index$55);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var TIMEZONE_UNIT_PRIORITY = 110;
  var MILLISECONDS_IN_MINUTE = 60000;

  var longFormattingTokensRegExp = /(\[[^[]*])|(\\)?(LTS|LT|LLLL|LLL|LL|L|llll|lll|ll|l)/g;
  var defaultParsingTokensRegExp = /(\[[^[]*])|(\\)?(x|ss|s|mm|m|hh|h|do|dddd|ddd|dd|d|aa|a|ZZ|Z|YYYY|YY|X|Wo|WW|W|SSS|SS|S|Qo|Q|Mo|MMMM|MMM|MM|M|HH|H|GGGG|GG|E|Do|DDDo|DDDD|DDD|DD|D|A|.)/g;

  /**
   * @name parse
   * @category Common Helpers
   * @summary Parse the date.
   *
   * @description
   * Return the date parsed from string using the given format.
   *
   * Accepted format tokens:
   * | Unit                    | Priority | Token | Input examples                   |
   * |-------------------------|----------|-------|----------------------------------|
   * | Year                    | 10       | YY    | 00, 01, ..., 99                  |
   * |                         |          | YYYY  | 1900, 1901, ..., 2099            |
   * | ISO week-numbering year | 10       | GG    | 00, 01, ..., 99                  |
   * |                         |          | GGGG  | 1900, 1901, ..., 2099            |
   * | Quarter                 | 20       | Q     | 1, 2, 3, 4                       |
   * |                         |          | Qo    | 1st, 2nd, 3rd, 4th               |
   * | Month                   | 30       | M     | 1, 2, ..., 12                    |
   * |                         |          | Mo    | 1st, 2nd, ..., 12th              |
   * |                         |          | MM    | 01, 02, ..., 12                  |
   * |                         |          | MMM   | Jan, Feb, ..., Dec               |
   * |                         |          | MMMM  | January, February, ..., December |
   * | ISO week                | 40       | W     | 1, 2, ..., 53                    |
   * |                         |          | Wo    | 1st, 2nd, ..., 53rd              |
   * |                         |          | WW    | 01, 02, ..., 53                  |
   * | Day of week             | 50       | d     | 0, 1, ..., 6                     |
   * |                         |          | do    | 0th, 1st, ..., 6th               |
   * |                         |          | dd    | Su, Mo, ..., Sa                  |
   * |                         |          | ddd   | Sun, Mon, ..., Sat               |
   * |                         |          | dddd  | Sunday, Monday, ..., Saturday    |
   * | Day of ISO week         | 50       | E     | 1, 2, ..., 7                     |
   * | Day of month            | 50       | D     | 1, 2, ..., 31                    |
   * |                         |          | Do    | 1st, 2nd, ..., 31st              |
   * |                         |          | DD    | 01, 02, ..., 31                  |
   * | Day of year             | 50       | DDD   | 1, 2, ..., 366                   |
   * |                         |          | DDDo  | 1st, 2nd, ..., 366th             |
   * |                         |          | DDDD  | 001, 002, ..., 366               |
   * | Time of day             | 60       | A     | AM, PM                           |
   * |                         |          | a     | am, pm                           |
   * |                         |          | aa    | a.m., p.m.                       |
   * | Hour                    | 70       | H     | 0, 1, ... 23                     |
   * |                         |          | HH    | 00, 01, ... 23                   |
   * | Time of day hour        | 70       | h     | 1, 2, ..., 12                    |
   * |                         |          | hh    | 01, 02, ..., 12                  |
   * | Minute                  | 80       | m     | 0, 1, ..., 59                    |
   * |                         |          | mm    | 00, 01, ..., 59                  |
   * | Second                  | 90       | s     | 0, 1, ..., 59                    |
   * |                         |          | ss    | 00, 01, ..., 59                  |
   * | 1/10 of second          | 100      | S     | 0, 1, ..., 9                     |
   * | 1/100 of second         | 100      | SS    | 00, 01, ..., 99                  |
   * | Millisecond             | 100      | SSS   | 000, 001, ..., 999               |
   * | Timezone                | 110      | Z     | -01:00, +00:00, ... +12:00       |
   * |                         |          | ZZ    | -0100, +0000, ..., +1200         |
   * | Seconds timestamp       | 120      | X     | 512969520                        |
   * | Milliseconds timestamp  | 120      | x     | 512969520900                     |
   *
   * Values will be assigned to the date in the ascending order of its unit's priority.
   * Units of an equal priority overwrite each other in the order of appearance.
   *
   * If no values of higher priority are parsed (e.g. when parsing string 'January 1st' without a year),
   * the values will be taken from 3rd argument `baseDate` which works as a context of parsing.
   *
   * `baseDate` must be passed for correct work of the function.
   * If you're not sure which `baseDate` to supply, create a new instance of Date:
   * `parse('02/11/2014', 'MM/DD/YYYY', new Date())`
   * In this case parsing will be done in the context of the current date.
   * If `baseDate` is `Invalid Date` or a value not convertible to valid `Date`,
   * then `Invalid Date` will be returned.
   *
   * Also, `parse` unfolds long formats like those in [format]{@link https://date-fns.org/docs/format}:
   * | Token | Input examples                 |
   * |-------|--------------------------------|
   * | LT    | 05:30 a.m.                     |
   * | LTS   | 05:30:15 a.m.                  |
   * | L     | 07/02/1995                     |
   * | l     | 7/2/1995                       |
   * | LL    | July 2 1995                    |
   * | ll    | Jul 2 1995                     |
   * | LLL   | July 2 1995 05:30 a.m.         |
   * | lll   | Jul 2 1995 05:30 a.m.          |
   * | LLLL  | Sunday, July 2 1995 05:30 a.m. |
   * | llll  | Sun, Jul 2 1995 05:30 a.m.     |
   *
   * The characters wrapped in square brackets in the format string are escaped.
   *
   * The result may vary by locale.
   *
   * If `formatString` matches with `dateString` but does not provides tokens, `baseDate` will be returned.
   *
   * If parsing failed, `Invalid Date` will be returned.
   * Invalid Date is a Date, whose time value is NaN.
   * Time value of Date: http://es5.github.io/#x15.9.1.1
   *
   * @param {String} dateString - the string to parse
   * @param {String} formatString - the string of tokens
   * @param {Date|String|Number} baseDate - the date to took the missing higher priority values from
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
   * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
   * @returns {Date} the parsed date
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
   * @throws {RangeError} `options.locale` must contain `match` property
   * @throws {RangeError} `options.locale` must contain `formatLong` property
   *
   * @example
   * // Parse 11 February 2014 from middle-endian format:
   * var result = parse(
   *   '02/11/2014',
   *   'MM/DD/YYYY',
   *   new Date()
   * )
   * //=> Tue Feb 11 2014 00:00:00
   *
   * @example
   * // Parse 28th of February in English locale in the context of 2010 year:
   * import eoLocale from 'date-fns/locale/eo'
   * var result = parse(
   *   '28-a de februaro',
   *   'Do [de] MMMM',
   *   new Date(2010, 0, 1)
   *   {locale: eoLocale}
   * )
   * //=> Sun Feb 28 2010 00:00:00
   */
  function parse(dirtyDateString, dirtyFormatString, dirtyBaseDate, dirtyOptions) {
    var dateString = String(dirtyDateString);
    var options = dirtyOptions || {};

    var weekStartsOn = options.weekStartsOn === undefined ? 0 : Number(options.weekStartsOn);

    // Test if weekStartsOn is between 0 and 6 _and_ is not NaN
    if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
      throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
    }

    var locale = options.locale || _index6.default;
    var localeParsers = locale.parsers || {};
    var localeUnits = locale.units || {};

    if (!locale.match) {
      throw new RangeError('locale must contain match property');
    }

    if (!locale.formatLong) {
      throw new RangeError('locale must contain formatLong property');
    }

    var formatString = String(dirtyFormatString).replace(longFormattingTokensRegExp, function (substring) {
      if (substring[0] === '[') {
        return substring;
      }

      if (substring[0] === '\\') {
        return cleanEscapedString(substring);
      }

      return locale.formatLong(substring);
    });

    if (formatString === '') {
      if (dateString === '') {
        return (0, _index2.default)(dirtyBaseDate, options);
      } else {
        return new Date(NaN);
      }
    }

    var subFnOptions = (0, _index12.default)(options);
    subFnOptions.locale = locale;

    var tokens = formatString.match(locale.parsingTokensRegExp || defaultParsingTokensRegExp);
    var tokensLength = tokens.length;

    // If timezone isn't specified, it will be set to the system timezone
    var setters = [{
      priority: TIMEZONE_UNIT_PRIORITY,
      set: dateToSystemTimezone,
      index: 0
    }];

    var i;
    for (i = 0; i < tokensLength; i++) {
      var token = tokens[i];
      var parser = localeParsers[token] || _index8.default[token];
      if (parser) {
        var matchResult;

        if (parser.match instanceof RegExp) {
          matchResult = parser.match.exec(dateString);
        } else {
          matchResult = parser.match(dateString, subFnOptions);
        }

        if (!matchResult) {
          return new Date(NaN);
        }

        var unitName = parser.unit;
        var unit = localeUnits[unitName] || _index10.default[unitName];

        setters.push({
          priority: unit.priority,
          set: unit.set,
          value: parser.parse(matchResult, subFnOptions),
          index: setters.length
        });

        var substring = matchResult[0];
        dateString = dateString.slice(substring.length);
      } else {
        var head = tokens[i].match(/^\[.*]$/) ? tokens[i].replace(/^\[|]$/g, '') : tokens[i];
        if (dateString.indexOf(head) === 0) {
          dateString = dateString.slice(head.length);
        } else {
          return new Date(NaN);
        }
      }
    }

    var uniquePrioritySetters = setters.map(function (setter) {
      return setter.priority;
    }).sort(function (a, b) {
      return a - b;
    }).filter(function (priority, index, array) {
      return array.indexOf(priority) === index;
    }).map(function (priority) {
      return setters.filter(function (setter) {
        return setter.priority === priority;
      }).reverse();
    }).map(function (setterArray) {
      return setterArray[0];
    });

    var date = (0, _index2.default)(dirtyBaseDate, options);

    if (isNaN(date)) {
      return new Date(NaN);
    }

    // Convert the date in system timezone to the same date in UTC+00:00 timezone.
    // This ensures that when UTC functions will be implemented, locales will be compatible with them.
    // See an issue about UTC functions: https://github.com/date-fns/date-fns/issues/37
    var utcDate = (0, _index4.default)(date, date.getTimezoneOffset());

    var dateValues = { date: utcDate };

    var settersLength = uniquePrioritySetters.length;
    for (i = 0; i < settersLength; i++) {
      var setter = uniquePrioritySetters[i];
      dateValues = setter.set(dateValues, setter.value, subFnOptions);
    }

    return dateValues.date;
  }

  function dateToSystemTimezone(dateValues) {
    var date = dateValues.date;
    var time = date.getTime();

    // Get the system timezone offset at (moment of time - offset)
    var offset = date.getTimezoneOffset();

    // Get the system timezone offset at the exact moment of time
    offset = new Date(time + offset * MILLISECONDS_IN_MINUTE).getTimezoneOffset();

    // Convert date in timezone "UTC+00:00" to the system timezone
    dateValues.date = new Date(time + offset * MILLISECONDS_IN_MINUTE);

    return dateValues;
  }

  function cleanEscapedString(input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|]$/g, '');
    }
    return input.replace(/\\/g, '');
  }
  module.exports = exports['default'];
});

var dateParse = unwrapExports(index);

var index$57 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = getMonth;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name getMonth
   * @category Month Helpers
   * @summary Get the month of the given date.
   *
   * @description
   * Get the month of the given date.
   *
   * @param {Date|String|Number} date - the given date
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Number} the month
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Which month is 29 February 2012?
   * var result = getMonth(new Date(2012, 1, 29))
   * //=> 1
   */
  function getMonth(dirtyDate, dirtyOptions) {
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var month = date.getMonth();
    return month;
  }
  module.exports = exports['default'];
});

var getMonth = unwrapExports(index$57);

function meetsCriteria(actualValue, comparitor, requiredValue) {
  switch (comparitor) {
    case '<=':
      return actualValue <= requiredValue;
    case '<':
      return actualValue < requiredValue;
    case '>=':
      return actualValue >= requiredValue;
    case '>':
      return actualValue > requiredValue;
  }
}

function inRange(actualValue, min, max) {
  if (max) {
    return actualValue >= min && actualValue <= max;
  }
  return actualValue >= min;
}

function Record(data, options) {
  this.date = parseDate(data[options.dateField], options.dateFormat);
  this.volume = parseVolume(data[options.volumeField]);
}

Record.prototype = Object.create(Record.prototype);

Record.prototype.hasVolume = function () {
  return this.volume ? true : false; // eslint-disable-line no-unneeded-ternary
};

Record.prototype.meetsCriteria = function (property, comparitor, value) {
  return meetsCriteria(this[property], comparitor, value);
};

Record.prototype.isInMonth = function (monthIndex) {
  return monthIndex === getMonth(this.date);
};

Record.prototype.isInMonths = function (validMonths) {
  if (validMonths.indexOf(getMonth(this.date)) !== -1) return true;
  return false;
};

function parseDate(datestring, format) {
  return datestring !== '' ? dateParse(datestring, format, new Date()) : null;
}

function parseVolume(volume) {
  return checkProperty(volume) ? parseFloat(volume) : null;
}

function checkProperty(value) {
  return value === '' || value == null ? null : value;
}

var index$58 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isWithinInterval;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name isWithinInterval
   * @category Interval Helpers
   * @summary Is the given date within the interval?
   *
   * @description
   * Is the given date within the interval?
   *
   * @param {Date|String|Number} date - the date to check
   * @param {Interval} interval - the interval to check
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Boolean} the date is within the interval
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   * @throws {RangeError} The start of an interval cannot be after its end
   * @throws {RangeError} Date in interval cannot be `Invalid Date`
   *
   * @example
   * // For the date within the interval:
   * isWithinInterval(
   *   new Date(2014, 0, 3),
   *   {start: new Date(2014, 0, 1), end: new Date(2014, 0, 7)}
   * )
   * //=> true
   *
   * @example
   * // For the date outside of the interval:
   * isWithinInterval(
   *   new Date(2014, 0, 10),
   *   {start: new Date(2014, 0, 1), end: new Date(2014, 0, 7)}
   * )
   * //=> false
   */
  function isWithinInterval(dirtyDate, dirtyInterval, dirtyOptions) {
    var interval = dirtyInterval || {};
    var time = (0, _index2.default)(dirtyDate, dirtyOptions).getTime();
    var startTime = (0, _index2.default)(interval.start, dirtyOptions).getTime();
    var endTime = (0, _index2.default)(interval.end, dirtyOptions).getTime();

    // Throw an exception if start date is after end date or if any date is `Invalid Date`
    if (!(startTime <= endTime)) {
      throw new RangeError('Invalid interval');
    }

    return time >= startTime && time <= endTime;
  }
  module.exports = exports['default'];
});

var isWithinInterval = unwrapExports(index$58);

function RecordSubset(data, filterType, filter) {
  this.filterType = filterType;
  this.filter = filter;
  switch (filterType) {
    case 'months':
      this.records = _filterByMonths(data, filter);
      break;
    case 'dateRange':
      this.records = _filterByDateRange(data, filter);
      break;
    case 'percentageRange':
      this.records = _filterByPercentageRange(data, filter);
      break;
    case 'classification':
      this.records = data;
      break;
    case 'criteriaQuery':
      this.records = data;
      this.meetsAllRequirements = true;
  }
  return this;
}

RecordSubset.prototype = Object.create(RecordSet.prototype);
RecordSubset.prototype.constructor = RecordSubset;

function _filterByMonths(recordset, months) {
  var outRecords = [];
  recordset.forEach(function (record) {
    var monthIndex = record.date.getMonth();
    if (months.indexOf(monthIndex) !== -1) {
      outRecords.push(record);
    }
  });
  return outRecords;
}

function _filterByDateRange(recordset, dates) {
  var outRecords = [];
  recordset.forEach(function (record) {
    if (isWithinInterval(record.date, dates)) {
      outRecords.push(record);
    }
  });
  return outRecords;
}

function _filterByPercentageRange(recordset, percentageRange) {
  var length = recordset.length;
  var bottomIndex = length * (percentageRange.start / 100);
  var topIndex = length * (percentageRange.end / 100);
  return recordset.slice(Math.round(bottomIndex), Math.round(topIndex));
}

var index$62 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = startOfDay;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name startOfDay
   * @category Day Helpers
   * @summary Return the start of a day for the given date.
   *
   * @description
   * Return the start of a day for the given date.
   * The result will be in the local timezone.
   *
   * @param {Date|String|Number} date - the original date
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Date} the start of a day
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // The start of a day for 2 September 2014 11:55:00:
   * var result = startOfDay(new Date(2014, 8, 2, 11, 55, 0))
   * //=> Tue Sep 02 2014 00:00:00
   */
  function startOfDay(dirtyDate, dirtyOptions) {
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  module.exports = exports['default'];
});

var index$60 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = differenceInCalendarDays;

  var _index2 = _interopRequireDefault(index$62);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var MILLISECONDS_IN_MINUTE = 60000;
  var MILLISECONDS_IN_DAY = 86400000;

  /**
   * @name differenceInCalendarDays
   * @category Day Helpers
   * @summary Get the number of calendar days between the given dates.
   *
   * @description
   * Get the number of calendar days between the given dates.
   *
   * @param {Date|String|Number} dateLeft - the later date
   * @param {Date|String|Number} dateRight - the earlier date
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Number} the number of calendar days
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // How many calendar days are between
   * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
   * var result = differenceInCalendarDays(
   *   new Date(2012, 6, 2, 0, 0),
   *   new Date(2011, 6, 2, 23, 0)
   * )
   * //=> 366
   */
  function differenceInCalendarDays(dirtyDateLeft, dirtyDateRight, dirtyOptions) {
    var startOfDayLeft = (0, _index2.default)(dirtyDateLeft, dirtyOptions);
    var startOfDayRight = (0, _index2.default)(dirtyDateRight, dirtyOptions);

    var timestampLeft = startOfDayLeft.getTime() - startOfDayLeft.getTimezoneOffset() * MILLISECONDS_IN_MINUTE;
    var timestampRight = startOfDayRight.getTime() - startOfDayRight.getTimezoneOffset() * MILLISECONDS_IN_MINUTE;

    // Round the number of days to the nearest integer
    // because the number of milliseconds in a day is not constant
    // (e.g. it's different in the day of the daylight saving time clock shift)
    return Math.round((timestampLeft - timestampRight) / MILLISECONDS_IN_DAY);
  }
  module.exports = exports['default'];
});

var index$64 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = compareAsc;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name compareAsc
   * @category Common Helpers
   * @summary Compare the two dates and return -1, 0 or 1.
   *
   * @description
   * Compare the two dates and return 1 if the first date is after the second,
   * -1 if the first date is before the second or 0 if dates are equal.
   *
   * @param {Date|String|Number} dateLeft - the first date to compare
   * @param {Date|String|Number} dateRight - the second date to compare
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Number} the result of the comparison
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Compare 11 February 1987 and 10 July 1989:
   * var result = compareAsc(
   *   new Date(1987, 1, 11),
   *   new Date(1989, 6, 10)
   * )
   * //=> -1
   *
   * @example
   * // Sort the array of dates:
   * var result = [
   *   new Date(1995, 6, 2),
   *   new Date(1987, 1, 11),
   *   new Date(1989, 6, 10)
   * ].sort(compareAsc)
   * //=> [
   * //   Wed Feb 11 1987 00:00:00,
   * //   Mon Jul 10 1989 00:00:00,
   * //   Sun Jul 02 1995 00:00:00
   * // ]
   */
  function compareAsc(dirtyDateLeft, dirtyDateRight, dirtyOptions) {
    var dateLeft = (0, _index2.default)(dirtyDateLeft, dirtyOptions);
    var dateRight = (0, _index2.default)(dirtyDateRight, dirtyOptions);

    var diff = dateLeft.getTime() - dateRight.getTime();

    if (diff < 0) {
      return -1;
    } else if (diff > 0) {
      return 1;
      // Return 0 if diff is 0; return NaN if diff is NaN
    } else {
      return diff;
    }
  }
  module.exports = exports['default'];
});

var index$59 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = differenceInDays;

  var _index2 = _interopRequireDefault(index$1);

  var _index4 = _interopRequireDefault(index$60);

  var _index6 = _interopRequireDefault(index$64);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name differenceInDays
   * @category Day Helpers
   * @summary Get the number of full days between the given dates.
   *
   * @description
   * Get the number of full days between the given dates.
   *
   * @param {Date|String|Number} dateLeft - the later date
   * @param {Date|String|Number} dateRight - the earlier date
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Number} the number of full days
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // How many full days are between
   * // 2 July 2011 23:00:00 and 2 July 2012 00:00:00?
   * var result = differenceInDays(
   *   new Date(2012, 6, 2, 0, 0),
   *   new Date(2011, 6, 2, 23, 0)
   * )
   * //=> 365
   */
  function differenceInDays(dirtyDateLeft, dirtyDateRight, dirtyOptions) {
    var dateLeft = (0, _index2.default)(dirtyDateLeft, dirtyOptions);
    var dateRight = (0, _index2.default)(dirtyDateRight, dirtyOptions);

    var sign = (0, _index6.default)(dateLeft, dateRight, dirtyOptions);
    var difference = Math.abs((0, _index4.default)(dateLeft, dateRight, dirtyOptions));
    dateLeft.setDate(dateLeft.getDate() - sign * difference);

    // Math.abs(diff in full days - diff in calendar days) === 1 if last calendar day is not full
    // If so, result must be decreased by 1 in absolute value
    var isLastDayNotFull = (0, _index6.default)(dateLeft, dateRight, dirtyOptions) === -sign;
    return sign * (difference - isLastDayNotFull);
  }
  module.exports = exports['default'];
});

var differenceInDays = unwrapExports(index$59);

var index$67 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = differenceInCalendarYears;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name differenceInCalendarYears
   * @category Year Helpers
   * @summary Get the number of calendar years between the given dates.
   *
   * @description
   * Get the number of calendar years between the given dates.
   *
   * @param {Date|String|Number} dateLeft - the later date
   * @param {Date|String|Number} dateRight - the earlier date
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Number} the number of calendar years
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // How many calendar years are between 31 December 2013 and 11 February 2015?
   * var result = differenceInCalendarYears(
   *   new Date(2015, 1, 11),
   *   new Date(2013, 11, 31)
   * )
   * //=> 2
   */
  function differenceInCalendarYears(dirtyDateLeft, dirtyDateRight, dirtyOptions) {
    var dateLeft = (0, _index2.default)(dirtyDateLeft, dirtyOptions);
    var dateRight = (0, _index2.default)(dirtyDateRight, dirtyOptions);

    return dateLeft.getFullYear() - dateRight.getFullYear();
  }
  module.exports = exports['default'];
});

var index$66 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = differenceInYears;

  var _index2 = _interopRequireDefault(index$1);

  var _index4 = _interopRequireDefault(index$67);

  var _index6 = _interopRequireDefault(index$64);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name differenceInYears
   * @category Year Helpers
   * @summary Get the number of full years between the given dates.
   *
   * @description
   * Get the number of full years between the given dates.
   *
   * @param {Date|String|Number} dateLeft - the later date
   * @param {Date|String|Number} dateRight - the earlier date
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Number} the number of full years
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // How many full years are between 31 December 2013 and 11 February 2015?
   * var result = differenceInYears(
   *   new Date(2015, 1, 11),
   *   new Date(2013, 11, 31)
   * )
   * //=> 1
   */
  function differenceInYears(dirtyDateLeft, dirtyDateRight, dirtyOptions) {
    var dateLeft = (0, _index2.default)(dirtyDateLeft, dirtyOptions);
    var dateRight = (0, _index2.default)(dirtyDateRight, dirtyOptions);

    var sign = (0, _index6.default)(dateLeft, dateRight, dirtyOptions);
    var difference = Math.abs((0, _index4.default)(dateLeft, dateRight, dirtyOptions));
    dateLeft.setFullYear(dateLeft.getFullYear() - sign * difference);

    // Math.abs(diff in full years - diff in calendar years) === 1 if last calendar year is not full
    // If so, result must be decreased by 1 in absolute value
    var isLastYearNotFull = (0, _index6.default)(dateLeft, dateRight, dirtyOptions) === -sign;
    return sign * (difference - isLastYearNotFull);
  }
  module.exports = exports['default'];
});

var differenceInYears = unwrapExports(index$66);

var index$69 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isBefore;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name isBefore
   * @category Common Helpers
   * @summary Is the first date before the second one?
   *
   * @description
   * Is the first date before the second one?
   *
   * @param {Date|String|Number} date - the date that should be before the other one to return true
   * @param {Date|String|Number} dateToCompare - the date to compare with
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Boolean} the first date is before the second date
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Is 10 July 1989 before 11 February 1987?
   * var result = isBefore(new Date(1989, 6, 10), new Date(1987, 1, 11))
   * //=> false
   */
  function isBefore(dirtyDate, dirtyDateToCompare, dirtyOptions) {
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var dateToCompare = (0, _index2.default)(dirtyDateToCompare, dirtyOptions);
    return date.getTime() < dateToCompare.getTime();
  }
  module.exports = exports['default'];
});

var isBefore = unwrapExports(index$69);

var index$70 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isAfter;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name isAfter
   * @category Common Helpers
   * @summary Is the first date after the second one?
   *
   * @description
   * Is the first date after the second one?
   *
   * @param {Date|String|Number} date - the date that should be after the other one to return true
   * @param {Date|String|Number} dateToCompare - the date to compare with
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Boolean} the first date is after the second date
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // Is 10 July 1989 after 11 February 1987?
   * var result = isAfter(new Date(1989, 6, 10), new Date(1987, 1, 11))
   * //=> true
   */
  function isAfter(dirtyDate, dirtyDateToCompare, dirtyOptions) {
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var dateToCompare = (0, _index2.default)(dirtyDateToCompare, dirtyOptions);
    return date.getTime() > dateToCompare.getTime();
  }
  module.exports = exports['default'];
});

var isAfter = unwrapExports(index$70);

var index$72 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isValid;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  /**
   * @name isValid
   * @category Common Helpers
   * @summary Is the given date valid?
   *
   * @description
   * Returns false if argument is Invalid Date and true otherwise.
   * Argument is converted to Date using `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * Invalid Date is a Date, whose time value is NaN.
   *
   * Time value of Date: http://es5.github.io/#x15.9.1.1
   *
   * @param {Date|String|Number} date - the date to check
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @returns {Boolean} the date is valid
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   *
   * @example
   * // For the valid date:
   * var result = isValid(new Date(2014, 1, 31))
   * //=> true
   *
   * @example
   * // For the value, convertable into a date:
   * var result = isValid('2014-02-31')
   * //=> true
   *
   * @example
   * // For the invalid date:
   * var result = isValid(new Date(''))
   * //=> false
   */
  function isValid(dirtyDate, dirtyOptions) {
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    return !isNaN(date);
  }
  module.exports = exports['default'];
});

var index$76 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = getUTCDayOfYear;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var MILLISECONDS_IN_DAY = 86400000;

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function getUTCDayOfYear(dirtyDate, dirtyOptions) {
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var timestamp = date.getTime();
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
    var startOfYearTimestamp = date.getTime();
    var difference = timestamp - startOfYearTimestamp;
    return Math.floor(difference / MILLISECONDS_IN_DAY) + 1;
  }
  module.exports = exports['default'];
});

var index$74 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _index2 = _interopRequireDefault(index$76);

  var _index4 = _interopRequireDefault(index$45);

  var _index6 = _interopRequireDefault(index$51);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var formatters = {
    // Month: 1, 2, ..., 12
    'M': function M(date) {
      return date.getUTCMonth() + 1;
    },

    // Month: 1st, 2nd, ..., 12th
    'Mo': function Mo(date, options) {
      var month = date.getUTCMonth() + 1;
      return options.locale.localize.ordinalNumber(month, { unit: 'month' });
    },

    // Month: 01, 02, ..., 12
    'MM': function MM(date) {
      return addLeadingZeros(date.getUTCMonth() + 1, 2);
    },

    // Month: Jan, Feb, ..., Dec
    'MMM': function MMM(date, options) {
      return options.locale.localize.month(date.getUTCMonth(), { type: 'short' });
    },

    // Month: January, February, ..., December
    'MMMM': function MMMM(date, options) {
      return options.locale.localize.month(date.getUTCMonth(), { type: 'long' });
    },

    // Quarter: 1, 2, 3, 4
    'Q': function Q(date) {
      return Math.ceil((date.getUTCMonth() + 1) / 3);
    },

    // Quarter: 1st, 2nd, 3rd, 4th
    'Qo': function Qo(date, options) {
      var quarter = Math.ceil((date.getUTCMonth() + 1) / 3);
      return options.locale.localize.ordinalNumber(quarter, { unit: 'quarter' });
    },

    // Day of month: 1, 2, ..., 31
    'D': function D(date) {
      return date.getUTCDate();
    },

    // Day of month: 1st, 2nd, ..., 31st
    'Do': function Do(date, options) {
      return options.locale.localize.ordinalNumber(date.getUTCDate(), { unit: 'dayOfMonth' });
    },

    // Day of month: 01, 02, ..., 31
    'DD': function DD(date) {
      return addLeadingZeros(date.getUTCDate(), 2);
    },

    // Day of year: 1, 2, ..., 366
    'DDD': function DDD(date) {
      return (0, _index2.default)(date);
    },

    // Day of year: 1st, 2nd, ..., 366th
    'DDDo': function DDDo(date, options) {
      return options.locale.localize.ordinalNumber((0, _index2.default)(date), { unit: 'dayOfYear' });
    },

    // Day of year: 001, 002, ..., 366
    'DDDD': function DDDD(date) {
      return addLeadingZeros((0, _index2.default)(date), 3);
    },

    // Day of week: Su, Mo, ..., Sa
    'dd': function dd(date, options) {
      return options.locale.localize.weekday(date.getUTCDay(), { type: 'narrow' });
    },

    // Day of week: Sun, Mon, ..., Sat
    'ddd': function ddd(date, options) {
      return options.locale.localize.weekday(date.getUTCDay(), { type: 'short' });
    },

    // Day of week: Sunday, Monday, ..., Saturday
    'dddd': function dddd(date, options) {
      return options.locale.localize.weekday(date.getUTCDay(), { type: 'long' });
    },

    // Day of week: 0, 1, ..., 6
    'd': function d(date) {
      return date.getUTCDay();
    },

    // Day of week: 0th, 1st, 2nd, ..., 6th
    'do': function _do(date, options) {
      return options.locale.localize.ordinalNumber(date.getUTCDay(), { unit: 'dayOfWeek' });
    },

    // Day of ISO week: 1, 2, ..., 7
    'E': function E(date) {
      return date.getUTCDay() || 7;
    },

    // ISO week: 1, 2, ..., 53
    'W': function W(date) {
      return (0, _index4.default)(date);
    },

    // ISO week: 1st, 2nd, ..., 53th
    'Wo': function Wo(date, options) {
      return options.locale.localize.ordinalNumber((0, _index4.default)(date), { unit: 'isoWeek' });
    },

    // ISO week: 01, 02, ..., 53
    'WW': function WW(date) {
      return addLeadingZeros((0, _index4.default)(date), 2);
    },

    // Year: 00, 01, ..., 99
    'YY': function YY(date) {
      return addLeadingZeros(date.getUTCFullYear(), 4).substr(2);
    },

    // Year: 1900, 1901, ..., 2099
    'YYYY': function YYYY(date) {
      return addLeadingZeros(date.getUTCFullYear(), 4);
    },

    // ISO week-numbering year: 00, 01, ..., 99
    'GG': function GG(date) {
      return String((0, _index6.default)(date)).substr(2);
    },

    // ISO week-numbering year: 1900, 1901, ..., 2099
    'GGGG': function GGGG(date) {
      return (0, _index6.default)(date);
    },

    // Hour: 0, 1, ... 23
    'H': function H(date) {
      return date.getUTCHours();
    },

    // Hour: 00, 01, ..., 23
    'HH': function HH(date) {
      return addLeadingZeros(date.getUTCHours(), 2);
    },

    // Hour: 1, 2, ..., 12
    'h': function h(date) {
      var hours = date.getUTCHours();
      if (hours === 0) {
        return 12;
      } else if (hours > 12) {
        return hours % 12;
      } else {
        return hours;
      }
    },

    // Hour: 01, 02, ..., 12
    'hh': function hh(date) {
      return addLeadingZeros(formatters['h'](date), 2);
    },

    // Minute: 0, 1, ..., 59
    'm': function m(date) {
      return date.getUTCMinutes();
    },

    // Minute: 00, 01, ..., 59
    'mm': function mm(date) {
      return addLeadingZeros(date.getUTCMinutes(), 2);
    },

    // Second: 0, 1, ..., 59
    's': function s(date) {
      return date.getUTCSeconds();
    },

    // Second: 00, 01, ..., 59
    'ss': function ss(date) {
      return addLeadingZeros(date.getUTCSeconds(), 2);
    },

    // 1/10 of second: 0, 1, ..., 9
    'S': function S(date) {
      return Math.floor(date.getUTCMilliseconds() / 100);
    },

    // 1/100 of second: 00, 01, ..., 99
    'SS': function SS(date) {
      return addLeadingZeros(Math.floor(date.getUTCMilliseconds() / 10), 2);
    },

    // Millisecond: 000, 001, ..., 999
    'SSS': function SSS(date) {
      return addLeadingZeros(date.getUTCMilliseconds(), 3);
    },

    // Timezone: -01:00, +00:00, ... +12:00
    'Z': function Z(date, options) {
      var originalDate = options._originalDate || date;
      return formatTimezone(originalDate.getTimezoneOffset(), ':');
    },

    // Timezone: -0100, +0000, ... +1200
    'ZZ': function ZZ(date, options) {
      var originalDate = options._originalDate || date;
      return formatTimezone(originalDate.getTimezoneOffset());
    },

    // Seconds timestamp: 512969520
    'X': function X(date, options) {
      var originalDate = options._originalDate || date;
      return Math.floor(originalDate.getTime() / 1000);
    },

    // Milliseconds timestamp: 512969520900
    'x': function x(date, options) {
      var originalDate = options._originalDate || date;
      return originalDate.getTime();
    },

    // AM, PM
    'A': function A(date, options) {
      return options.locale.localize.timeOfDay(date.getUTCHours(), { type: 'uppercase' });
    },

    // am, pm
    'a': function a(date, options) {
      return options.locale.localize.timeOfDay(date.getUTCHours(), { type: 'lowercase' });
    },

    // a.m., p.m.
    'aa': function aa(date, options) {
      return options.locale.localize.timeOfDay(date.getUTCHours(), { type: 'long' });
    }
  };

  function formatTimezone(offset, delimeter) {
    delimeter = delimeter || '';
    var sign = offset > 0 ? '-' : '+';
    var absOffset = Math.abs(offset);
    var hours = Math.floor(absOffset / 60);
    var minutes = absOffset % 60;
    return sign + addLeadingZeros(hours, 2) + delimeter + addLeadingZeros(minutes, 2);
  }

  function addLeadingZeros(number, targetLength) {
    var output = Math.abs(number).toString();
    while (output.length < targetLength) {
      output = '0' + output;
    }
    return output;
  }

  exports.default = formatters;
  module.exports = exports['default'];
});

var index$78 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = addUTCMinutes;

  var _index2 = _interopRequireDefault(index$1);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  // This function will be a part of public API when UTC function will be implemented.
  // See issue: https://github.com/date-fns/date-fns/issues/376
  function addUTCMinutes(dirtyDate, dirtyAmount, dirtyOptions) {
    var date = (0, _index2.default)(dirtyDate, dirtyOptions);
    var amount = Number(dirtyAmount);
    date.setUTCMinutes(date.getUTCMinutes() + amount);
    return date;
  }
  module.exports = exports['default'];
});

var index$71 = createCommonjsModule(function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = format;

  var _index2 = _interopRequireDefault(index$1);

  var _index4 = _interopRequireDefault(index$72);

  var _index6 = _interopRequireDefault(index$9);

  var _index8 = _interopRequireDefault(index$74);

  var _index10 = _interopRequireDefault(index$55);

  var _index12 = _interopRequireDefault(index$78);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var longFormattingTokensRegExp = /(\[[^[]*])|(\\)?(LTS|LT|LLLL|LLL|LL|L|llll|lll|ll|l)/g;
  var defaultFormattingTokensRegExp = /(\[[^[]*])|(\\)?(x|ss|s|mm|m|hh|h|do|dddd|ddd|dd|d|aa|a|ZZ|Z|YYYY|YY|X|Wo|WW|W|SSS|SS|S|Qo|Q|Mo|MMMM|MMM|MM|M|HH|H|GGGG|GG|E|Do|DDDo|DDDD|DDD|DD|D|A|.)/g;

  /**
   * @name format
   * @category Common Helpers
   * @summary Format the date.
   *
   * @description
   * Return the formatted date string in the given format.
   *
   * Accepted tokens:
   * | Unit                    | Token | Result examples                  |
   * |-------------------------|-------|----------------------------------|
   * | Month                   | M     | 1, 2, ..., 12                    |
   * |                         | Mo    | 1st, 2nd, ..., 12th              |
   * |                         | MM    | 01, 02, ..., 12                  |
   * |                         | MMM   | Jan, Feb, ..., Dec               |
   * |                         | MMMM  | January, February, ..., December |
   * | Quarter                 | Q     | 1, 2, 3, 4                       |
   * |                         | Qo    | 1st, 2nd, 3rd, 4th               |
   * | Day of month            | D     | 1, 2, ..., 31                    |
   * |                         | Do    | 1st, 2nd, ..., 31st              |
   * |                         | DD    | 01, 02, ..., 31                  |
   * | Day of year             | DDD   | 1, 2, ..., 366                   |
   * |                         | DDDo  | 1st, 2nd, ..., 366th             |
   * |                         | DDDD  | 001, 002, ..., 366               |
   * | Day of week             | d     | 0, 1, ..., 6                     |
   * |                         | do    | 0th, 1st, ..., 6th               |
   * |                         | dd    | Su, Mo, ..., Sa                  |
   * |                         | ddd   | Sun, Mon, ..., Sat               |
   * |                         | dddd  | Sunday, Monday, ..., Saturday    |
   * | Day of ISO week         | E     | 1, 2, ..., 7                     |
   * | ISO week                | W     | 1, 2, ..., 53                    |
   * |                         | Wo    | 1st, 2nd, ..., 53rd              |
   * |                         | WW    | 01, 02, ..., 53                  |
   * | Year                    | YY    | 00, 01, ..., 99                  |
   * |                         | YYYY  | 1900, 1901, ..., 2099            |
   * | ISO week-numbering year | GG    | 00, 01, ..., 99                  |
   * |                         | GGGG  | 1900, 1901, ..., 2099            |
   * | AM/PM                   | A     | AM, PM                           |
   * |                         | a     | am, pm                           |
   * |                         | aa    | a.m., p.m.                       |
   * | Hour                    | H     | 0, 1, ... 23                     |
   * |                         | HH    | 00, 01, ... 23                   |
   * |                         | h     | 1, 2, ..., 12                    |
   * |                         | hh    | 01, 02, ..., 12                  |
   * | Minute                  | m     | 0, 1, ..., 59                    |
   * |                         | mm    | 00, 01, ..., 59                  |
   * | Second                  | s     | 0, 1, ..., 59                    |
   * |                         | ss    | 00, 01, ..., 59                  |
   * | 1/10 of second          | S     | 0, 1, ..., 9                     |
   * | 1/100 of second         | SS    | 00, 01, ..., 99                  |
   * | Millisecond             | SSS   | 000, 001, ..., 999               |
   * | Timezone                | Z     | -01:00, +00:00, ... +12:00       |
   * |                         | ZZ    | -0100, +0000, ..., +1200         |
   * | Seconds timestamp       | X     | 512969520                        |
   * | Milliseconds timestamp  | x     | 512969520900                     |
   * | Long format             | LT    | 05:30 a.m.                       |
   * |                         | LTS   | 05:30:15 a.m.                    |
   * |                         | L     | 07/02/1995                       |
   * |                         | l     | 7/2/1995                         |
   * |                         | LL    | July 2 1995                      |
   * |                         | ll    | Jul 2 1995                       |
   * |                         | LLL   | July 2 1995 05:30 a.m.           |
   * |                         | lll   | Jul 2 1995 05:30 a.m.            |
   * |                         | LLLL  | Sunday, July 2 1995 05:30 a.m.   |
   * |                         | llll  | Sun, Jul 2 1995 05:30 a.m.       |
   *
   * The characters wrapped in square brackets are escaped.
   *
   * The result may vary by locale.
   *
   * @param {Date|String|Number} date - the original date
   * @param {String} format - the string of tokens
   * @param {Options} [options] - the object with options. See [Options]{@link https://date-fns.org/docs/Options}
   * @param {0|1|2} [options.additionalDigits=2] - passed to `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
   * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
   * @returns {String} the formatted date string
   * @throws {RangeError} `options.additionalDigits` must be 0, 1 or 2
   * @throws {RangeError} `options.locale` must contain `localize` property
   * @throws {RangeError} `options.locale` must contain `formatLong` property
   *
   * @example
   * // Represent 11 February 2014 in middle-endian format:
   * var result = format(
   *   new Date(2014, 1, 11),
   *   'MM/DD/YYYY'
   * )
   * //=> '02/11/2014'
   *
   * @example
   * // Represent 2 July 2014 in Esperanto:
   * import { eoLocale } from 'date-fns/locale/eo'
   * var result = format(
   *   new Date(2014, 6, 2),
   *   'Do [de] MMMM YYYY',
   *   {locale: eoLocale}
   * )
   * //=> '2-a de julio 2014'
   */
  function format(dirtyDate, dirtyFormatStr, dirtyOptions) {
    var formatStr = String(dirtyFormatStr);
    var options = dirtyOptions || {};

    var locale = options.locale || _index6.default;

    if (!locale.localize) {
      throw new RangeError('locale must contain localize property');
    }

    if (!locale.formatLong) {
      throw new RangeError('locale must contain formatLong property');
    }

    var localeFormatters = locale.formatters || {};
    var formattingTokensRegExp = locale.formattingTokensRegExp || defaultFormattingTokensRegExp;
    var formatLong = locale.formatLong;

    var originalDate = (0, _index2.default)(dirtyDate, options);

    if (!(0, _index4.default)(originalDate, options)) {
      return 'Invalid Date';
    }

    // Convert the date in system timezone to the same date in UTC+00:00 timezone.
    // This ensures that when UTC functions will be implemented, locales will be compatible with them.
    // See an issue about UTC functions: https://github.com/date-fns/date-fns/issues/376
    var timezoneOffset = originalDate.getTimezoneOffset();
    var utcDate = (0, _index12.default)(originalDate, -timezoneOffset, options);

    var formatterOptions = (0, _index10.default)(options);
    formatterOptions.locale = locale;
    formatterOptions.formatters = _index8.default;

    // When UTC functions will be implemented, options._originalDate will likely be a part of public API.
    // Right now, please don't use it in locales. If you have to use an original date,
    // please restore it from `date`, adding a timezone offset to it.
    formatterOptions._originalDate = originalDate;

    var result = formatStr.replace(longFormattingTokensRegExp, function (substring) {
      if (substring[0] === '[') {
        return substring;
      }

      if (substring[0] === '\\') {
        return cleanEscapedString(substring);
      }

      return formatLong(substring);
    }).replace(formattingTokensRegExp, function (substring) {
      var formatter = localeFormatters[substring] || _index8.default[substring];

      if (formatter) {
        return formatter(utcDate, formatterOptions);
      } else {
        return cleanEscapedString(substring);
      }
    });

    return result;
  }

  function cleanEscapedString(input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|]$/g, '');
    }
    return input.replace(/\\/g, '');
  }
  module.exports = exports['default'];
});

var hookCallback;

function hooks() {
    return hookCallback.apply(null, arguments);
}

// This is done to register the method called with moment()
// without creating circular dependencies.
function setHookCallback(callback) {
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
    var k;
    for (k in obj) {
        // even if its not own property I'd still call it non-empty
        return false;
    }
    return true;
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
    var res = [],
        i;
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

function createUTC(input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, true).utc();
}

function defaultParsingFlags() {
    // We need to deep clone this object.
    return {
        empty: false,
        unusedTokens: [],
        unusedInput: [],
        overflow: -2,
        charsLeftOver: 0,
        nullInput: false,
        invalidMonth: null,
        invalidFormat: false,
        userInvalidated: false,
        iso: false,
        parsedDateParts: [],
        meridiem: null,
        rfc2822: false,
        weekdayMismatch: false
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
    some = function some(fun) {
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
        var isNowValid = !isNaN(m._d.getTime()) && flags.overflow < 0 && !flags.empty && !flags.invalidMonth && !flags.invalidWeekday && !flags.nullInput && !flags.invalidFormat && !flags.userInvalidated && (!flags.meridiem || flags.meridiem && parsedParts);

        if (m._strict) {
            isNowValid = isNowValid && flags.charsLeftOver === 0 && flags.unusedTokens.length === 0 && flags.bigHour === undefined;
        }

        if (Object.isFrozen == null || !Object.isFrozen(m)) {
            m._isValid = isNowValid;
        } else {
            return isNowValid;
        }
    }
    return m._isValid;
}

function createInvalid(flags) {
    var m = createUTC(NaN);
    if (flags != null) {
        extend(getParsingFlags(m), flags);
    } else {
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

function isMoment(obj) {
    return obj instanceof Moment || obj != null && obj._isAMomentObject != null;
}

function absFloor(number) {
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
        if (dontConvert && array1[i] !== array2[i] || !dontConvert && toInt(array1[i]) !== toInt(array2[i])) {
            diffs++;
        }
    }
    return diffs + lengthDiff;
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

function warn(msg) {
    if (hooks.suppressDeprecationWarnings === false && typeof console !== 'undefined' && console.warn) {
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
                if (_typeof(arguments[i]) === 'object') {
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
            warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + new Error().stack);
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

function set$1(config) {
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
    this._dayOfMonthOrdinalParseLenient = new RegExp((this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) + '|' + /\d{1,2}/.source);
}

function mergeConfigs(parentConfig, childConfig) {
    var res = extend({}, parentConfig),
        prop;
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
        if (hasOwnProp(parentConfig, prop) && !hasOwnProp(childConfig, prop) && isObject(parentConfig[prop])) {
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
    keys = function keys(obj) {
        var i,
            res = [];
        for (i in obj) {
            if (hasOwnProp(obj, i)) {
                res.push(i);
            }
        }
        return res;
    };
}

var defaultCalendar = {
    sameDay: '[Today at] LT',
    nextDay: '[Tomorrow at] LT',
    nextWeek: 'dddd [at] LT',
    lastDay: '[Yesterday at] LT',
    lastWeek: '[Last] dddd [at] LT',
    sameElse: 'L'
};

function calendar(key, mom, now) {
    var output = this._calendar[key] || this._calendar['sameElse'];
    return isFunction(output) ? output.call(mom, now) : output;
}

var defaultLongDateFormat = {
    LTS: 'h:mm:ss A',
    LT: 'h:mm A',
    L: 'MM/DD/YYYY',
    LL: 'MMMM D, YYYY',
    LLL: 'MMMM D, YYYY h:mm A',
    LLLL: 'dddd, MMMM D, YYYY h:mm A'
};

function longDateFormat(key) {
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

function invalidDate() {
    return this._invalidDate;
}

var defaultOrdinal = '%d';
var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

function ordinal(number) {
    return this._ordinal.replace('%d', number);
}

var defaultRelativeTime = {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    ss: '%d seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years'
};

function relativeTime(number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return isFunction(output) ? output(number, withoutSuffix, string, isFuture) : output.replace(/%d/i, number);
}

function pastFuture(diff, output) {
    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
}

var aliases = {};

function addUnitAlias(unit, shorthand) {
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
        units.push({ unit: u, priority: priorities[u] });
    }
    units.sort(function (a, b) {
        return a.priority - b.priority;
    });
    return units;
}

function makeGetSet(unit, keepTime) {
    return function (value) {
        if (value != null) {
            set$2(this, unit, value);
            hooks.updateOffset(this, keepTime);
            return this;
        } else {
            return get$1(this, unit);
        }
    };
}

function get$1(mom, unit) {
    return mom.isValid() ? mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
}

function set$2(mom, unit, value) {
    if (mom.isValid()) {
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    }
}

// MOMENTS

function stringGet(units) {
    units = normalizeUnits(units);
    if (isFunction(this[units])) {
        return this[units]();
    }
    return this;
}

function stringSet(units, value) {
    if ((typeof units === 'undefined' ? 'undefined' : _typeof(units)) === 'object') {
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

function zeroFill(number, targetLength, forceSign) {
    var absNumber = '' + Math.abs(number),
        zerosToFill = targetLength - absNumber.length,
        sign = number >= 0;
    return (sign ? forceSign ? '+' : '' : '-') + Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
}

var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

var formatFunctions = {};

var formatTokenFunctions = {};

// token:    'M'
// padded:   ['MM', 2]
// ordinal:  'Mo'
// callback: function () { this.month() + 1 }
function addFormatToken(token, padded, ordinal, callback) {
    var func = callback;
    if (typeof callback === 'string') {
        func = function func() {
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
    var array = format.match(formattingTokens),
        i,
        length;

    for (i = 0, length = array.length; i < length; i++) {
        if (formatTokenFunctions[array[i]]) {
            array[i] = formatTokenFunctions[array[i]];
        } else {
            array[i] = removeFormattingTokens(array[i]);
        }
    }

    return function (mom) {
        var output = '',
            i;
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

var match1 = /\d/; //       0 - 9
var match2 = /\d\d/; //      00 - 99
var match3 = /\d{3}/; //     000 - 999
var match4 = /\d{4}/; //    0000 - 9999
var match6 = /[+-]?\d{6}/; // -999999 - 999999
var match1to2 = /\d\d?/; //       0 - 99
var match3to4 = /\d\d\d\d?/; //     999 - 9999
var match5to6 = /\d\d\d\d\d\d?/; //   99999 - 999999
var match1to3 = /\d{1,3}/; //       0 - 999
var match1to4 = /\d{1,4}/; //       0 - 9999
var match1to6 = /[+-]?\d{1,6}/; // -999999 - 999999

var matchUnsigned = /\d+/; //       0 - inf
var matchSigned = /[+-]?\d+/; //    -inf - inf

var matchOffset = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

// any word (or two) characters or numbers including two/three word month in arabic.
// includes scottish gaelic two word and hyphenated months
var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;

var regexes = {};

function addRegexToken(token, regex, strictRegex) {
    regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
        return isStrict && strictRegex ? strictRegex : regex;
    };
}

function getParseRegexForToken(token, config) {
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

function addParseToken(token, callback) {
    var i,
        func = callback;
    if (typeof token === 'string') {
        token = [token];
    }
    if (isNumber(callback)) {
        func = function func(input, array) {
            array[callback] = toInt(input);
        };
    }
    for (i = 0; i < token.length; i++) {
        tokens[token[i]] = func;
    }
}

function addWeekParseToken(token, callback) {
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

var indexOf;

if (Array.prototype.indexOf) {
    indexOf = Array.prototype.indexOf;
} else {
    indexOf = function indexOf(o) {
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
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
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

addRegexToken('M', match1to2);
addRegexToken('MM', match1to2, match2);
addRegexToken('MMM', function (isStrict, locale) {
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
function localeMonths(m, format) {
    if (!m) {
        return isArray(this._months) ? this._months : this._months['standalone'];
    }
    return isArray(this._months) ? this._months[m.month()] : this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
}

var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
function localeMonthsShort(m, format) {
    if (!m) {
        return isArray(this._monthsShort) ? this._monthsShort : this._monthsShort['standalone'];
    }
    return isArray(this._monthsShort) ? this._monthsShort[m.month()] : this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
}

function handleStrictParse(monthName, format, strict) {
    var i,
        ii,
        mom,
        llc = monthName.toLocaleLowerCase();
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

function localeMonthsParse(monthName, format, strict) {
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

function setMonth(mom, value) {
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

function getSetMonth(value) {
    if (value != null) {
        setMonth(this, value);
        hooks.updateOffset(this, true);
        return this;
    } else {
        return get$1(this, 'Month');
    }
}

function getDaysInMonth() {
    return daysInMonth(this.year(), this.month());
}

var defaultMonthsShortRegex = matchWord;
function monthsShortRegex(isStrict) {
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
        return this._monthsShortStrictRegex && isStrict ? this._monthsShortStrictRegex : this._monthsShortRegex;
    }
}

var defaultMonthsRegex = matchWord;
function monthsRegex(isStrict) {
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
        return this._monthsStrictRegex && isStrict ? this._monthsStrictRegex : this._monthsRegex;
    }
}

function computeMonthsParse() {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var shortPieces = [],
        longPieces = [],
        mixedPieces = [],
        i,
        mom;
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

// FORMATTING

addFormatToken('Y', 0, 0, function () {
    var y = this.year();
    return y <= 9999 ? '' + y : '+' + y;
});

addFormatToken(0, ['YY', 2], 0, function () {
    return this.year() % 100;
});

addFormatToken(0, ['YYYY', 4], 0, 'year');
addFormatToken(0, ['YYYYY', 5], 0, 'year');
addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

// ALIASES

addUnitAlias('year', 'y');

// PRIORITIES

addUnitPriority('year', 1);

// PARSING

addRegexToken('Y', matchSigned);
addRegexToken('YY', match1to2, match2);
addRegexToken('YYYY', match1to4, match4);
addRegexToken('YYYYY', match1to6, match6);
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
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}

// HOOKS

hooks.parseTwoDigitYear = function (input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
};

// MOMENTS

var getSetYear = makeGetSet('FullYear', true);

function getIsLeapYear() {
    return isLeapYear(this.year());
}

function createDate(y, m, d, h, M, s, ms) {
    // can't just apply() to create a date:
    // https://stackoverflow.com/q/181348
    var date = new Date(y, m, d, h, M, s, ms);

    // the date constructor remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
        date.setFullYear(y);
    }
    return date;
}

function createUTCDate(y) {
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
        resYear,
        resDayOfYear;

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
        resWeek,
        resYear;

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

addRegexToken('w', match1to2);
addRegexToken('ww', match1to2, match2);
addRegexToken('W', match1to2);
addRegexToken('WW', match1to2, match2);

addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
    week[token.substr(0, 1)] = toInt(input);
});

// HELPERS

// LOCALES

function localeWeek(mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
}

var defaultLocaleWeek = {
    dow: 0, // Sunday is the first day of the week.
    doy: 6 // The week that contains Jan 1st is the first week of the year.
};

function localeFirstDayOfWeek() {
    return this._week.dow;
}

function localeFirstDayOfYear() {
    return this._week.doy;
}

// MOMENTS

function getSetWeek(input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, 'd');
}

function getSetISOWeek(input) {
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

addRegexToken('d', match1to2);
addRegexToken('e', match1to2);
addRegexToken('E', match1to2);
addRegexToken('dd', function (isStrict, locale) {
    return locale.weekdaysMinRegex(isStrict);
});
addRegexToken('ddd', function (isStrict, locale) {
    return locale.weekdaysShortRegex(isStrict);
});
addRegexToken('dddd', function (isStrict, locale) {
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
function localeWeekdays(m, format) {
    if (!m) {
        return isArray(this._weekdays) ? this._weekdays : this._weekdays['standalone'];
    }
    return isArray(this._weekdays) ? this._weekdays[m.day()] : this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
}

var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
function localeWeekdaysShort(m) {
    return m ? this._weekdaysShort[m.day()] : this._weekdaysShort;
}

var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
function localeWeekdaysMin(m) {
    return m ? this._weekdaysMin[m.day()] : this._weekdaysMin;
}

function handleStrictParse$1(weekdayName, format, strict) {
    var i,
        ii,
        mom,
        llc = weekdayName.toLocaleLowerCase();
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

function localeWeekdaysParse(weekdayName, format, strict) {
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
            this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
            this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
            this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
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

function getSetDayOfWeek(input) {
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

function getSetLocaleDayOfWeek(input) {
    if (!this.isValid()) {
        return input != null ? this : NaN;
    }
    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, 'd');
}

function getSetISODayOfWeek(input) {
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
function weekdaysRegex(isStrict) {
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
        return this._weekdaysStrictRegex && isStrict ? this._weekdaysStrictRegex : this._weekdaysRegex;
    }
}

var defaultWeekdaysShortRegex = matchWord;
function weekdaysShortRegex(isStrict) {
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
        return this._weekdaysShortStrictRegex && isStrict ? this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
    }
}

var defaultWeekdaysMinRegex = matchWord;
function weekdaysMinRegex(isStrict) {
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
        return this._weekdaysMinStrictRegex && isStrict ? this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
    }
}

function computeWeekdaysParse() {
    function cmpLenRev(a, b) {
        return b.length - a.length;
    }

    var minPieces = [],
        shortPieces = [],
        longPieces = [],
        mixedPieces = [],
        i,
        mom,
        minp,
        shortp,
        longp;
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
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2);
});

addFormatToken('Hmm', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2);
});

addFormatToken('Hmmss', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2) + zeroFill(this.seconds(), 2);
});

function meridiem(token, lowercase) {
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

function matchMeridiem(isStrict, locale) {
    return locale._meridiemParse;
}

addRegexToken('a', matchMeridiem);
addRegexToken('A', matchMeridiem);
addRegexToken('H', match1to2);
addRegexToken('h', match1to2);
addRegexToken('k', match1to2);
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

function localeIsPM(input) {
    // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
    // Using charAt should be more compatible.
    return (input + '').toLowerCase().charAt(0) === 'p';
}

var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
function localeMeridiem(hours, minutes, isLower) {
    if (hours > 11) {
        return isLower ? 'pm' : 'PM';
    } else {
        return isLower ? 'am' : 'AM';
    }
}

// MOMENTS

// Setting the hour should keep the time, because the user explicitly
// specified which hour he wants. So trying to maintain the same hour (in
// a new timezone) makes sense. Adding/subtracting hours does not follow
// this rule.
var getSetHour = makeGetSet('Hours', true);

// months
// week
// weekdays
// meridiem
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
    var i = 0,
        j,
        next,
        locale,
        split;

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
    return null;
}

function loadLocale(name) {
    var oldLocale = null;
    // TODO: Find a better way to register and load all the locales in Node
    if (!locales[name] && typeof module !== 'undefined' && module && module.exports) {
        try {
            oldLocale = globalLocale._abbr;
            require('./locale/' + name);
            // because defineLocale currently also sets the global locale, we
            // want to undo that for lazy loaded locales
            getSetGlobalLocale(oldLocale);
        } catch (e) {}
    }
    return locales[name];
}

// This function will load locale and then set the global locale.  If
// no arguments are passed in, it will simply return the current global
// locale key.
function getSetGlobalLocale(key, values) {
    var data;
    if (key) {
        if (isUndefined(values)) {
            data = getLocale(key);
        } else {
            data = defineLocale(key, values);
        }

        if (data) {
            // moment.duration._locale = moment._locale = data;
            globalLocale = data;
        }
    }

    return globalLocale._abbr;
}

function defineLocale(name, config) {
    if (config !== null) {
        var parentConfig = baseConfig;
        config.abbr = name;
        if (locales[name] != null) {
            deprecateSimple('defineLocaleOverride', 'use moment.updateLocale(localeName, config) to change ' + 'an existing locale. moment.defineLocale(localeName, ' + 'config) should only be used for creating a new locale ' + 'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
            parentConfig = locales[name]._config;
        } else if (config.parentLocale != null) {
            if (locales[config.parentLocale] != null) {
                parentConfig = locales[config.parentLocale]._config;
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
        var locale,
            parentConfig = baseConfig;
        // MERGE
        if (locales[name] != null) {
            parentConfig = locales[name]._config;
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
function getLocale(key) {
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

function checkOverflow(m) {
    var overflow;
    var a = m._a;

    if (a && getParsingFlags(m).overflow === -2) {
        overflow = a[MONTH] < 0 || a[MONTH] > 11 ? MONTH : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH]) ? DATE : a[HOUR] < 0 || a[HOUR] > 24 || a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0) ? HOUR : a[MINUTE] < 0 || a[MINUTE] > 59 ? MINUTE : a[SECOND] < 0 || a[SECOND] > 59 ? SECOND : a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND : -1;

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

// iso 8601 regex
// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

var isoDates = [['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/], ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/], ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/], ['GGGG-[W]WW', /\d{4}-W\d\d/, false], ['YYYY-DDD', /\d{4}-\d{3}/], ['YYYY-MM', /\d{4}-\d\d/, false], ['YYYYYYMMDD', /[+-]\d{10}/], ['YYYYMMDD', /\d{8}/],
// YYYYMM is NOT allowed by the standard
['GGGG[W]WWE', /\d{4}W\d{3}/], ['GGGG[W]WW', /\d{4}W\d{2}/, false], ['YYYYDDD', /\d{7}/]];

// iso time formats and regexes
var isoTimes = [['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/], ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/], ['HH:mm:ss', /\d\d:\d\d:\d\d/], ['HH:mm', /\d\d:\d\d/], ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/], ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/], ['HHmmss', /\d\d\d\d\d\d/], ['HHmm', /\d\d\d\d/], ['HH', /\d\d/]];

var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

// date from iso format
function configFromISO(config) {
    var i,
        l,
        string = config._i,
        match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
        allowTime,
        dateFormat,
        timeFormat,
        tzFormat;

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
var basicRfcRegex = /^((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d?\d\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(?:\d\d)?\d\d\s)(\d\d:\d\d)(\:\d\d)?(\s(?:UT|GMT|[ECMP][SD]T|[A-IK-Za-ik-z]|[+-]\d{4}))$/;

// date and time from ref 2822 format
function configFromRFC2822(config) {
    var string, match, dayFormat, dateFormat, timeFormat, tzFormat;
    var timezones = {
        ' GMT': ' +0000',
        ' EDT': ' -0400',
        ' EST': ' -0500',
        ' CDT': ' -0500',
        ' CST': ' -0600',
        ' MDT': ' -0600',
        ' MST': ' -0700',
        ' PDT': ' -0700',
        ' PST': ' -0800'
    };
    var military = 'YXWVUTSRQPONZABCDEFGHIKLM';
    var timezone, timezoneIndex;

    string = config._i.replace(/\([^\)]*\)|[\n\t]/g, ' ') // Remove comments and folding whitespace
    .replace(/(\s\s+)/g, ' ') // Replace multiple-spaces with a single space
    .replace(/^\s|\s$/g, ''); // Remove leading and trailing spaces
    match = basicRfcRegex.exec(string);

    if (match) {
        dayFormat = match[1] ? 'ddd' + (match[1].length === 5 ? ', ' : ' ') : '';
        dateFormat = 'D MMM ' + (match[2].length > 10 ? 'YYYY ' : 'YY ');
        timeFormat = 'HH:mm' + (match[4] ? ':ss' : '');

        // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
        if (match[1]) {
            // day of week given
            var momentDate = new Date(match[2]);
            var momentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][momentDate.getDay()];

            if (match[1].substr(0, 3) !== momentDay) {
                getParsingFlags(config).weekdayMismatch = true;
                config._isValid = false;
                return;
            }
        }

        switch (match[5].length) {
            case 2:
                // military
                if (timezoneIndex === 0) {
                    timezone = ' +0000';
                } else {
                    timezoneIndex = military.indexOf(match[5][1].toUpperCase()) - 12;
                    timezone = (timezoneIndex < 0 ? ' -' : ' +') + ('' + timezoneIndex).replace(/^-?/, '0').match(/..$/)[0] + '00';
                }
                break;
            case 4:
                // Zone
                timezone = timezones[match[5]];
                break;
            default:
                // UT or +/-9999
                timezone = timezones[' GMT'];
        }
        match[5] = timezone;
        config._i = match.splice(1).join('');
        tzFormat = ' ZZ';
        config._f = dayFormat + dateFormat + timeFormat + tzFormat;
        configFromStringAndFormat(config);
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

hooks.createFromInputFallback = deprecate('value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' + 'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' + 'discouraged and will be removed in an upcoming major release. Please refer to ' + 'http://momentjs.com/guides/#/warnings/js-date/ for more info.', function (config) {
    config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
});

// Pick the first defined of two or three arguments.
function defaults$1(a, b, c) {
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
function configFromArray(config) {
    var i,
        date,
        input = [],
        currentDate,
        yearToUse;

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
        yearToUse = defaults$1(config._a[YEAR], currentDate[YEAR]);

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
        config._a[i] = input[i] = config._a[i] == null ? i === 2 ? 1 : 0 : config._a[i];
    }

    // Check for 24:00:00.000
    if (config._a[HOUR] === 24 && config._a[MINUTE] === 0 && config._a[SECOND] === 0 && config._a[MILLISECOND] === 0) {
        config._nextDay = true;
        config._a[HOUR] = 0;
    }

    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
    // Apply timezone offset from input. The actual utcOffset can be changed
    // with parseZone.
    if (config._tzm != null) {
        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }

    if (config._nextDay) {
        config._a[HOUR] = 24;
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
        weekYear = defaults$1(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
        week = defaults$1(w.W, 1);
        weekday = defaults$1(w.E, 1);
        if (weekday < 1 || weekday > 7) {
            weekdayOverflow = true;
        }
    } else {
        dow = config._locale._week.dow;
        doy = config._locale._week.doy;

        var curWeek = weekOfYear(createLocal(), dow, doy);

        weekYear = defaults$1(w.gg, config._a[YEAR], curWeek.year);

        // Default to current week.
        week = defaults$1(w.w, curWeek.week);

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
        i,
        parsedInput,
        tokens,
        token,
        skipped,
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
            } else {
                getParsingFlags(config).unusedTokens.push(token);
            }
            addTimeToArrayFromToken(token, parsedInput, config);
        } else if (config._strict && !parsedInput) {
            getParsingFlags(config).unusedTokens.push(token);
        }
    }

    // add remaining unparsed input length to the string
    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
        getParsingFlags(config).unusedInput.push(string);
    }

    // clear _12h flag if hour is <= 12
    if (config._a[HOUR] <= 12 && getParsingFlags(config).bigHour === true && config._a[HOUR] > 0) {
        getParsingFlags(config).bigHour = undefined;
    }

    getParsingFlags(config).parsedDateParts = config._a.slice(0);
    getParsingFlags(config).meridiem = config._meridiem;
    // handle meridiem
    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

    configFromArray(config);
    checkOverflow(config);
}

function meridiemFixWrap(locale, hour, meridiem) {
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
    var tempConfig, bestMoment, scoreToBeat, i, currentScore;

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

function createFromConfig(config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));
    if (res._nextDay) {
        // Adding is smart enough around DST
        res.add(1, 'd');
        res._nextDay = undefined;
    }

    return res;
}

function prepareConfig(config) {
    var input = config._i,
        format = config._f;

    config._locale = config._locale || getLocale(config._l);

    if (input === null || format === undefined && input === '') {
        return createInvalid({ nullInput: true });
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
    } else {
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

function createLocalOrUTC(input, format, locale, strict, isUTC) {
    var c = {};

    if (locale === true || locale === false) {
        strict = locale;
        locale = undefined;
    }

    if (isObject(input) && isObjectEmpty(input) || isArray(input) && input.length === 0) {
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

function createLocal(input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, false);
}

var prototypeMin = deprecate('moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/', function () {
    var other = createLocal.apply(null, arguments);
    if (this.isValid() && other.isValid()) {
        return other < this ? this : other;
    } else {
        return createInvalid();
    }
});

var prototypeMax = deprecate('moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/', function () {
    var other = createLocal.apply(null, arguments);
    if (this.isValid() && other.isValid()) {
        return other > this ? this : other;
    } else {
        return createInvalid();
    }
});

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
function min() {
    var args = [].slice.call(arguments, 0);

    return pickBy('isBefore', args);
}

function max() {
    var args = [].slice.call(arguments, 0);

    return pickBy('isAfter', args);
}

var now = function now() {
    return Date.now ? Date.now() : +new Date();
};

var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

function isDurationValid(m) {
    for (var key in m) {
        if (!(ordering.indexOf(key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
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

function Duration(duration) {
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
    this._milliseconds = +milliseconds + seconds * 1e3 + // 1000
    minutes * 6e4 + // 1000 * 60
    hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days + weeks * 7;
    // It is impossible translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months + quarters * 3 + years * 12;

    this._data = {};

    this._locale = getLocale();

    this._bubble();
}

function isDuration(obj) {
    return obj instanceof Duration;
}

function absRound(number) {
    if (number < 0) {
        return Math.round(-1 * number) * -1;
    } else {
        return Math.round(number);
    }
}

// FORMATTING

function offset(token, separator) {
    addFormatToken(token, 0, 0, function () {
        var offset = this.utcOffset();
        var sign = '+';
        if (offset < 0) {
            offset = -offset;
            sign = '-';
        }
        return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~offset % 60, 2);
    });
}

offset('Z', ':');
offset('ZZ', '');

// PARSING

addRegexToken('Z', matchShortOffset);
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

    var chunk = matches[matches.length - 1] || [];
    var parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    var minutes = +(parts[1] * 60) + toInt(parts[2]);

    return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
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

function getDateOffset(m) {
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
function getSetOffset(input, keepLocalTime, keepMinutes) {
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

function getSetZone(input, keepLocalTime) {
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

function setOffsetToUTC(keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
}

function setOffsetToLocal(keepLocalTime) {
    if (this._isUTC) {
        this.utcOffset(0, keepLocalTime);
        this._isUTC = false;

        if (keepLocalTime) {
            this.subtract(getDateOffset(this), 'm');
        }
    }
    return this;
}

function setOffsetToParsedOffset() {
    if (this._tzm != null) {
        this.utcOffset(this._tzm, false, true);
    } else if (typeof this._i === 'string') {
        var tZone = offsetFromString(matchOffset, this._i);
        if (tZone != null) {
            this.utcOffset(tZone);
        } else {
            this.utcOffset(0, true);
        }
    }
    return this;
}

function hasAlignedHourOffset(input) {
    if (!this.isValid()) {
        return false;
    }
    input = input ? createLocal(input).utcOffset() : 0;

    return (this.utcOffset() - input) % 60 === 0;
}

function isDaylightSavingTime() {
    return this.utcOffset() > this.clone().month(0).utcOffset() || this.utcOffset() > this.clone().month(5).utcOffset();
}

function isDaylightSavingTimeShifted() {
    if (!isUndefined(this._isDSTShifted)) {
        return this._isDSTShifted;
    }

    var c = {};

    copyConfig(c, this);
    c = prepareConfig(c);

    if (c._a) {
        var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
        this._isDSTShifted = this.isValid() && compareArrays(c._a, other.toArray()) > 0;
    } else {
        this._isDSTShifted = false;
    }

    return this._isDSTShifted;
}

function isLocal() {
    return this.isValid() ? !this._isUTC : false;
}

function isUtcOffset() {
    return this.isValid() ? this._isUTC : false;
}

function isUtc() {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
}

// ASP.NET json date format regex
var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

// from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
// somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
// and further modified to allow for strings containing both week and day
var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

function createDuration(input, key) {
    var duration = input,

    // matching against regexp is expensive, do it on demand
    match = null,
        sign,
        ret,
        diffRes;

    if (isDuration(input)) {
        duration = {
            ms: input._milliseconds,
            d: input._days,
            M: input._months
        };
    } else if (isNumber(input)) {
        duration = {};
        if (key) {
            duration[key] = input;
        } else {
            duration.milliseconds = input;
        }
    } else if (!!(match = aspNetRegex.exec(input))) {
        sign = match[1] === '-' ? -1 : 1;
        duration = {
            y: 0,
            d: toInt(match[DATE]) * sign,
            h: toInt(match[HOUR]) * sign,
            m: toInt(match[MINUTE]) * sign,
            s: toInt(match[SECOND]) * sign,
            ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
        };
    } else if (!!(match = isoRegex.exec(input))) {
        sign = match[1] === '-' ? -1 : 1;
        duration = {
            y: parseIso(match[2], sign),
            M: parseIso(match[3], sign),
            w: parseIso(match[4], sign),
            d: parseIso(match[5], sign),
            h: parseIso(match[6], sign),
            m: parseIso(match[7], sign),
            s: parseIso(match[8], sign)
        };
    } else if (duration == null) {
        // checks for null or undefined
        duration = {};
    } else if ((typeof duration === 'undefined' ? 'undefined' : _typeof(duration)) === 'object' && ('from' in duration || 'to' in duration)) {
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

function parseIso(inp, sign) {
    // We'd normally use ~~inp for this, but unfortunately it also
    // converts floats to ints.
    // inp may be undefined, so careful calling replace on it.
    var res = inp && parseFloat(inp.replace(',', '.'));
    // apply sign while we're at it
    return (isNaN(res) ? 0 : res) * sign;
}

function positiveMomentsDifference(base, other) {
    var res = { milliseconds: 0, months: 0 };

    res.months = other.month() - base.month() + (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, 'M').isAfter(other)) {
        --res.months;
    }

    res.milliseconds = +other - +base.clone().add(res.months, 'M');

    return res;
}

function momentsDifference(base, other) {
    var res;
    if (!(base.isValid() && other.isValid())) {
        return { milliseconds: 0, months: 0 };
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
            deprecateSimple(name, 'moment().' + name + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' + 'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
            tmp = val;val = period;period = tmp;
        }

        val = typeof val === 'string' ? +val : val;
        dur = createDuration(val, period);
        addSubtract(this, dur, direction);
        return this;
    };
}

function addSubtract(mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds,
        days = absRound(duration._days),
        months = absRound(duration._months);

    if (!mom.isValid()) {
        // No op
        return;
    }

    updateOffset = updateOffset == null ? true : updateOffset;

    if (milliseconds) {
        mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
    }
    if (days) {
        set$2(mom, 'Date', get$1(mom, 'Date') + days * isAdding);
    }
    if (months) {
        setMonth(mom, get$1(mom, 'Month') + months * isAdding);
    }
    if (updateOffset) {
        hooks.updateOffset(mom, days || months);
    }
}

var add = createAdder(1, 'add');
var subtract = createAdder(-1, 'subtract');

function getCalendarFormat(myMoment, now) {
    var diff = myMoment.diff(now, 'days', true);
    return diff < -6 ? 'sameElse' : diff < -1 ? 'lastWeek' : diff < 0 ? 'lastDay' : diff < 1 ? 'sameDay' : diff < 2 ? 'nextDay' : diff < 7 ? 'nextWeek' : 'sameElse';
}

function calendar$1(time, formats) {
    // We want to compare the start of today, vs this.
    // Getting start-of-today depends on whether we're local/utc/offset or not.
    var now = time || createLocal(),
        sod = cloneWithOffset(now, this).startOf('day'),
        format = hooks.calendarFormat(this, sod) || 'sameElse';

    var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

    return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
}

function clone() {
    return new Moment(this);
}

function isAfter$1(input, units) {
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

function isBefore$1(input, units) {
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

function isBetween(from, to, units, inclusivity) {
    inclusivity = inclusivity || '()';
    return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) && (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
}

function isSame(input, units) {
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

function isSameOrAfter(input, units) {
    return this.isSame(input, units) || this.isAfter(input, units);
}

function isSameOrBefore(input, units) {
    return this.isSame(input, units) || this.isBefore(input, units);
}

function diff(input, units, asFloat) {
    var that, zoneDelta, delta, output;

    if (!this.isValid()) {
        return NaN;
    }

    that = cloneWithOffset(input, this);

    if (!that.isValid()) {
        return NaN;
    }

    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

    units = normalizeUnits(units);

    if (units === 'year' || units === 'month' || units === 'quarter') {
        output = monthDiff(this, that);
        if (units === 'quarter') {
            output = output / 3;
        } else if (units === 'year') {
            output = output / 12;
        }
    } else {
        delta = this - that;
        output = units === 'second' ? delta / 1e3 : // 1000
        units === 'minute' ? delta / 6e4 : // 1000 * 60
        units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
        units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
        units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
        delta;
    }
    return asFloat ? output : absFloor(output);
}

function monthDiff(a, b) {
    // difference in months
    var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),

    // b is in (anchor - 1 month, anchor + 1 month)
    anchor = a.clone().add(wholeMonthDiff, 'months'),
        anchor2,
        adjust;

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

function toString() {
    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
}

function toISOString() {
    if (!this.isValid()) {
        return null;
    }
    var m = this.clone().utc();
    if (m.year() < 0 || m.year() > 9999) {
        return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    }
    if (isFunction(Date.prototype.toISOString)) {
        // native implementation is ~50x faster, use it when we can
        return this.toDate().toISOString();
    }
    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
}

/**
 * Return a human readable representation of a moment that can
 * also be evaluated to get a new moment which is the same
 *
 * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
 */
function inspect() {
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
    var year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
    var datetime = '-MM-DD[T]HH:mm:ss.SSS';
    var suffix = zone + '[")]';

    return this.format(prefix + year + datetime + suffix);
}

function format(inputString) {
    if (!inputString) {
        inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
    }
    var output = formatMoment(this, inputString);
    return this.localeData().postformat(output);
}

function from(time, withoutSuffix) {
    if (this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid())) {
        return createDuration({ to: this, from: time }).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function fromNow(withoutSuffix) {
    return this.from(createLocal(), withoutSuffix);
}

function to(time, withoutSuffix) {
    if (this.isValid() && (isMoment(time) && time.isValid() || createLocal(time).isValid())) {
        return createDuration({ from: this, to: time }).locale(this.locale()).humanize(!withoutSuffix);
    } else {
        return this.localeData().invalidDate();
    }
}

function toNow(withoutSuffix) {
    return this.to(createLocal(), withoutSuffix);
}

// If passed a locale key, it will set the locale for this
// instance.  Otherwise, it will return the locale configuration
// variables for this instance.
function locale(key) {
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

var lang = deprecate('moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.', function (key) {
    if (key === undefined) {
        return this.localeData();
    } else {
        return this.locale(key);
    }
});

function localeData() {
    return this._locale;
}

function startOf(units) {
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

function endOf(units) {
    units = normalizeUnits(units);
    if (units === undefined || units === 'millisecond') {
        return this;
    }

    // 'date' is an alias for 'day', so it should be considered as such.
    if (units === 'date') {
        units = 'day';
    }

    return this.startOf(units).add(1, units === 'isoWeek' ? 'week' : units).subtract(1, 'ms');
}

function valueOf() {
    return this._d.valueOf() - (this._offset || 0) * 60000;
}

function unix() {
    return Math.floor(this.valueOf() / 1000);
}

function toDate() {
    return new Date(this.valueOf());
}

function toArray$1() {
    var m = this;
    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
}

function toObject() {
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

function toJSON() {
    // new Date(NaN).toJSON() === null
    return this.isValid() ? this.toISOString() : null;
}

function isValid$2() {
    return isValid(this);
}

function parsingFlags() {
    return extend({}, getParsingFlags(this));
}

function invalidAt() {
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

function addWeekYearFormatToken(token, getter) {
    addFormatToken(0, [token, token.length], 0, getter);
}

addWeekYearFormatToken('gggg', 'weekYear');
addWeekYearFormatToken('ggggg', 'weekYear');
addWeekYearFormatToken('GGGG', 'isoWeekYear');
addWeekYearFormatToken('GGGGG', 'isoWeekYear');

// ALIASES

addUnitAlias('weekYear', 'gg');
addUnitAlias('isoWeekYear', 'GG');

// PRIORITY

addUnitPriority('weekYear', 1);
addUnitPriority('isoWeekYear', 1);

// PARSING

addRegexToken('G', matchSigned);
addRegexToken('g', matchSigned);
addRegexToken('GG', match1to2, match2);
addRegexToken('gg', match1to2, match2);
addRegexToken('GGGG', match1to4, match4);
addRegexToken('gggg', match1to4, match4);
addRegexToken('GGGGG', match1to6, match6);
addRegexToken('ggggg', match1to6, match6);

addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
    week[token.substr(0, 2)] = toInt(input);
});

addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
    week[token] = hooks.parseTwoDigitYear(input);
});

// MOMENTS

function getSetWeekYear(input) {
    return getSetWeekYearHelper.call(this, input, this.week(), this.weekday(), this.localeData()._week.dow, this.localeData()._week.doy);
}

function getSetISOWeekYear(input) {
    return getSetWeekYearHelper.call(this, input, this.isoWeek(), this.isoWeekday(), 1, 4);
}

function getISOWeeksInYear() {
    return weeksInYear(this.year(), 1, 4);
}

function getWeeksInYear() {
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

function getSetQuarter(input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
}

// FORMATTING

addFormatToken('D', ['DD', 2], 'Do', 'date');

// ALIASES

addUnitAlias('date', 'D');

// PRIOROITY
addUnitPriority('date', 9);

// PARSING

addRegexToken('D', match1to2);
addRegexToken('DD', match1to2, match2);
addRegexToken('Do', function (isStrict, locale) {
    // TODO: Remove "ordinalParse" fallback in next major release.
    return isStrict ? locale._dayOfMonthOrdinalParse || locale._ordinalParse : locale._dayOfMonthOrdinalParseLenient;
});

addParseToken(['D', 'DD'], DATE);
addParseToken('Do', function (input, array) {
    array[DATE] = toInt(input.match(match1to2)[0], 10);
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

addRegexToken('DDD', match1to3);
addRegexToken('DDDD', match3);
addParseToken(['DDD', 'DDDD'], function (input, array, config) {
    config._dayOfYear = toInt(input);
});

// HELPERS

// MOMENTS

function getSetDayOfYear(input) {
    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
    return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
}

// FORMATTING

addFormatToken('m', ['mm', 2], 0, 'minute');

// ALIASES

addUnitAlias('minute', 'm');

// PRIORITY

addUnitPriority('minute', 14);

// PARSING

addRegexToken('m', match1to2);
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

addRegexToken('s', match1to2);
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

addRegexToken('S', match1to3, match1);
addRegexToken('SS', match1to3, match2);
addRegexToken('SSS', match1to3, match3);

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

addFormatToken('z', 0, 0, 'zoneAbbr');
addFormatToken('zz', 0, 0, 'zoneName');

// MOMENTS

function getZoneAbbr() {
    return this._isUTC ? 'UTC' : '';
}

function getZoneName() {
    return this._isUTC ? 'Coordinated Universal Time' : '';
}

var proto = Moment.prototype;

proto.add = add;
proto.calendar = calendar$1;
proto.clone = clone;
proto.diff = diff;
proto.endOf = endOf;
proto.format = format;
proto.from = from;
proto.fromNow = fromNow;
proto.to = to;
proto.toNow = toNow;
proto.get = stringGet;
proto.invalidAt = invalidAt;
proto.isAfter = isAfter$1;
proto.isBefore = isBefore$1;
proto.isBetween = isBetween;
proto.isSame = isSame;
proto.isSameOrAfter = isSameOrAfter;
proto.isSameOrBefore = isSameOrBefore;
proto.isValid = isValid$2;
proto.lang = lang;
proto.locale = locale;
proto.localeData = localeData;
proto.max = prototypeMax;
proto.min = prototypeMin;
proto.parsingFlags = parsingFlags;
proto.set = stringSet;
proto.startOf = startOf;
proto.subtract = subtract;
proto.toArray = toArray$1;
proto.toObject = toObject;
proto.toDate = toDate;
proto.toISOString = toISOString;
proto.inspect = inspect;
proto.toJSON = toJSON;
proto.toString = toString;
proto.unix = unix;
proto.valueOf = valueOf;
proto.creationData = creationData;

// Year
proto.year = getSetYear;
proto.isLeapYear = getIsLeapYear;

// Week Year
proto.weekYear = getSetWeekYear;
proto.isoWeekYear = getSetISOWeekYear;

// Quarter
proto.quarter = proto.quarters = getSetQuarter;

// Month
proto.month = getSetMonth;
proto.daysInMonth = getDaysInMonth;

// Week
proto.week = proto.weeks = getSetWeek;
proto.isoWeek = proto.isoWeeks = getSetISOWeek;
proto.weeksInYear = getWeeksInYear;
proto.isoWeeksInYear = getISOWeeksInYear;

// Day
proto.date = getSetDayOfMonth;
proto.day = proto.days = getSetDayOfWeek;
proto.weekday = getSetLocaleDayOfWeek;
proto.isoWeekday = getSetISODayOfWeek;
proto.dayOfYear = getSetDayOfYear;

// Hour
proto.hour = proto.hours = getSetHour;

// Minute
proto.minute = proto.minutes = getSetMinute;

// Second
proto.second = proto.seconds = getSetSecond;

// Millisecond
proto.millisecond = proto.milliseconds = getSetMillisecond;

// Offset
proto.utcOffset = getSetOffset;
proto.utc = setOffsetToUTC;
proto.local = setOffsetToLocal;
proto.parseZone = setOffsetToParsedOffset;
proto.hasAlignedHourOffset = hasAlignedHourOffset;
proto.isDST = isDaylightSavingTime;
proto.isLocal = isLocal;
proto.isUtcOffset = isUtcOffset;
proto.isUtc = isUtc;
proto.isUTC = isUtc;

// Timezone
proto.zoneAbbr = getZoneAbbr;
proto.zoneName = getZoneName;

// Deprecations
proto.dates = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
proto.years = deprecate('years accessor is deprecated. Use year instead', getSetYear);
proto.zone = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

function createUnix(input) {
    return createLocal(input * 1000);
}

function createInZone() {
    return createLocal.apply(null, arguments).parseZone();
}

function preParsePostFormat(string) {
    return string;
}

var proto$1 = Locale.prototype;

proto$1.calendar = calendar;
proto$1.longDateFormat = longDateFormat;
proto$1.invalidDate = invalidDate;
proto$1.ordinal = ordinal;
proto$1.preparse = preParsePostFormat;
proto$1.postformat = preParsePostFormat;
proto$1.relativeTime = relativeTime;
proto$1.pastFuture = pastFuture;
proto$1.set = set$1;

// Month
proto$1.months = localeMonths;
proto$1.monthsShort = localeMonthsShort;
proto$1.monthsParse = localeMonthsParse;
proto$1.monthsRegex = monthsRegex;
proto$1.monthsShortRegex = monthsShortRegex;

// Week
proto$1.week = localeWeek;
proto$1.firstDayOfYear = localeFirstDayOfYear;
proto$1.firstDayOfWeek = localeFirstDayOfWeek;

// Day of Week
proto$1.weekdays = localeWeekdays;
proto$1.weekdaysMin = localeWeekdaysMin;
proto$1.weekdaysShort = localeWeekdaysShort;
proto$1.weekdaysParse = localeWeekdaysParse;

proto$1.weekdaysRegex = weekdaysRegex;
proto$1.weekdaysShortRegex = weekdaysShortRegex;
proto$1.weekdaysMinRegex = weekdaysMinRegex;

// Hours
proto$1.isPM = localeIsPM;
proto$1.meridiem = localeMeridiem;

function get$2(format, index, field, setter) {
    var locale = getLocale();
    var utc = createUTC().set(setter, index);
    return locale[field](utc, format);
}

function listMonthsImpl(format, index, field) {
    if (isNumber(format)) {
        index = format;
        format = undefined;
    }

    format = format || '';

    if (index != null) {
        return get$2(format, index, field, 'month');
    }

    var i;
    var out = [];
    for (i = 0; i < 12; i++) {
        out[i] = get$2(format, i, field, 'month');
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
function listWeekdaysImpl(localeSorted, format, index, field) {
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
        return get$2(format, (index + shift) % 7, field, 'day');
    }

    var i;
    var out = [];
    for (i = 0; i < 7; i++) {
        out[i] = get$2(format, (i + shift) % 7, field, 'day');
    }
    return out;
}

function listMonths(format, index) {
    return listMonthsImpl(format, index, 'months');
}

function listMonthsShort(format, index) {
    return listMonthsImpl(format, index, 'monthsShort');
}

function listWeekdays(localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
}

function listWeekdaysShort(localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
}

function listWeekdaysMin(localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
}

getSetGlobalLocale('en', {
    dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal: function ordinal(number) {
        var b = number % 10,
            output = toInt(number % 100 / 10) === 1 ? 'th' : b === 1 ? 'st' : b === 2 ? 'nd' : b === 3 ? 'rd' : 'th';
        return number + output;
    }
});

// Side effect imports
hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

var mathAbs = Math.abs;

function abs() {
    var data = this._data;

    this._milliseconds = mathAbs(this._milliseconds);
    this._days = mathAbs(this._days);
    this._months = mathAbs(this._months);

    data.milliseconds = mathAbs(data.milliseconds);
    data.seconds = mathAbs(data.seconds);
    data.minutes = mathAbs(data.minutes);
    data.hours = mathAbs(data.hours);
    data.months = mathAbs(data.months);
    data.years = mathAbs(data.years);

    return this;
}

function addSubtract$1(duration, input, value, direction) {
    var other = createDuration(input, value);

    duration._milliseconds += direction * other._milliseconds;
    duration._days += direction * other._days;
    duration._months += direction * other._months;

    return duration._bubble();
}

// supports only 2.0-style add(1, 's') or add(duration)
function add$1(input, value) {
    return addSubtract$1(this, input, value, 1);
}

// supports only 2.0-style subtract(1, 's') or subtract(duration)
function subtract$1(input, value) {
    return addSubtract$1(this, input, value, -1);
}

function absCeil(number) {
    if (number < 0) {
        return Math.floor(number);
    } else {
        return Math.ceil(number);
    }
}

function bubble() {
    var milliseconds = this._milliseconds;
    var days = this._days;
    var months = this._months;
    var data = this._data;
    var seconds, minutes, hours, years, monthsFromDays;

    // if we have a mix of positive and negative values, bubble down first
    // check: https://github.com/moment/moment/issues/2166
    if (!(milliseconds >= 0 && days >= 0 && months >= 0 || milliseconds <= 0 && days <= 0 && months <= 0)) {
        milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
        days = 0;
        months = 0;
    }

    // The following code bubbles up values, see the tests for
    // examples of what that means.
    data.milliseconds = milliseconds % 1000;

    seconds = absFloor(milliseconds / 1000);
    data.seconds = seconds % 60;

    minutes = absFloor(seconds / 60);
    data.minutes = minutes % 60;

    hours = absFloor(minutes / 60);
    data.hours = hours % 24;

    days += absFloor(hours / 24);

    // convert days to months
    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays));

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;

    data.days = days;
    data.months = months;
    data.years = years;

    return this;
}

function daysToMonths(days) {
    // 400 years have 146097 days (taking into account leap year rules)
    // 400 years have 12 months === 4800
    return days * 4800 / 146097;
}

function monthsToDays(months) {
    // the reverse of daysToMonths
    return months * 146097 / 4800;
}

function as(units) {
    if (!this.isValid()) {
        return NaN;
    }
    var days;
    var months;
    var milliseconds = this._milliseconds;

    units = normalizeUnits(units);

    if (units === 'month' || units === 'year') {
        days = this._days + milliseconds / 864e5;
        months = this._months + daysToMonths(days);
        return units === 'month' ? months : months / 12;
    } else {
        // handle milliseconds separately because of floating point math errors (issue #1867)
        days = this._days + Math.round(monthsToDays(this._months));
        switch (units) {
            case 'week':
                return days / 7 + milliseconds / 6048e5;
            case 'day':
                return days + milliseconds / 864e5;
            case 'hour':
                return days * 24 + milliseconds / 36e5;
            case 'minute':
                return days * 1440 + milliseconds / 6e4;
            case 'second':
                return days * 86400 + milliseconds / 1000;
            // Math.floor prevents floating point math errors here
            case 'millisecond':
                return Math.floor(days * 864e5) + milliseconds;
            default:
                throw new Error('Unknown unit ' + units);
        }
    }
}

// TODO: Use this.as('ms')?
function valueOf$1() {
    if (!this.isValid()) {
        return NaN;
    }
    return this._milliseconds + this._days * 864e5 + this._months % 12 * 2592e6 + toInt(this._months / 12) * 31536e6;
}

function makeAs(alias) {
    return function () {
        return this.as(alias);
    };
}

var asMilliseconds = makeAs('ms');
var asSeconds = makeAs('s');
var asMinutes = makeAs('m');
var asHours = makeAs('h');
var asDays = makeAs('d');
var asWeeks = makeAs('w');
var asMonths = makeAs('M');
var asYears = makeAs('y');

function get$3(units) {
    units = normalizeUnits(units);
    return this.isValid() ? this[units + 's']() : NaN;
}

function makeGetter(name) {
    return function () {
        return this.isValid() ? this._data[name] : NaN;
    };
}

var milliseconds = makeGetter('milliseconds');
var seconds = makeGetter('seconds');
var minutes = makeGetter('minutes');
var hours = makeGetter('hours');
var days = makeGetter('days');
var months = makeGetter('months');
var years = makeGetter('years');

function weeks() {
    return absFloor(this.days() / 7);
}

var round = Math.round;
var thresholds = {
    ss: 44, // a few seconds to seconds
    s: 45, // seconds to minute
    m: 45, // minutes to hour
    h: 22, // hours to day
    d: 26, // days to month
    M: 11 // months to year
};

// helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
}

function relativeTime$1(posNegDuration, withoutSuffix, locale) {
    var duration = createDuration(posNegDuration).abs();
    var seconds = round(duration.as('s'));
    var minutes = round(duration.as('m'));
    var hours = round(duration.as('h'));
    var days = round(duration.as('d'));
    var months = round(duration.as('M'));
    var years = round(duration.as('y'));

    var a = seconds <= thresholds.ss && ['s', seconds] || seconds < thresholds.s && ['ss', seconds] || minutes <= 1 && ['m'] || minutes < thresholds.m && ['mm', minutes] || hours <= 1 && ['h'] || hours < thresholds.h && ['hh', hours] || days <= 1 && ['d'] || days < thresholds.d && ['dd', days] || months <= 1 && ['M'] || months < thresholds.M && ['MM', months] || years <= 1 && ['y'] || ['yy', years];

    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale;
    return substituteTimeAgo.apply(null, a);
}

// This function allows you to set the rounding function for relative time strings
function getSetRelativeTimeRounding(roundingFunction) {
    if (roundingFunction === undefined) {
        return round;
    }
    if (typeof roundingFunction === 'function') {
        round = roundingFunction;
        return true;
    }
    return false;
}

// This function allows you to set a threshold for relative time strings
function getSetRelativeTimeThreshold(threshold, limit) {
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

function humanize(withSuffix) {
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
    var days = abs$1(this._days);
    var months = abs$1(this._months);
    var minutes, hours, years;

    // 3600 seconds -> 60 minutes -> 1 hour
    minutes = absFloor(seconds / 60);
    hours = absFloor(minutes / 60);
    seconds %= 60;
    minutes %= 60;

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;

    // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
    var Y = years;
    var M = months;
    var D = days;
    var h = hours;
    var m = minutes;
    var s = seconds;
    var total = this.asSeconds();

    if (!total) {
        // this is the same as C#'s (Noda) and python (isodate)...
        // but not other JS (goog.date)
        return 'P0D';
    }

    return (total < 0 ? '-' : '') + 'P' + (Y ? Y + 'Y' : '') + (M ? M + 'M' : '') + (D ? D + 'D' : '') + (h || m || s ? 'T' : '') + (h ? h + 'H' : '') + (m ? m + 'M' : '') + (s ? s + 'S' : '');
}

var proto$2 = Duration.prototype;

proto$2.isValid = isValid$1;
proto$2.abs = abs;
proto$2.add = add$1;
proto$2.subtract = subtract$1;
proto$2.as = as;
proto$2.asMilliseconds = asMilliseconds;
proto$2.asSeconds = asSeconds;
proto$2.asMinutes = asMinutes;
proto$2.asHours = asHours;
proto$2.asDays = asDays;
proto$2.asWeeks = asWeeks;
proto$2.asMonths = asMonths;
proto$2.asYears = asYears;
proto$2.valueOf = valueOf$1;
proto$2._bubble = bubble;
proto$2.get = get$3;
proto$2.milliseconds = milliseconds;
proto$2.seconds = seconds;
proto$2.minutes = minutes;
proto$2.hours = hours;
proto$2.days = days;
proto$2.weeks = weeks;
proto$2.months = months;
proto$2.years = years;
proto$2.humanize = humanize;
proto$2.toISOString = toISOString$1;
proto$2.toString = toISOString$1;
proto$2.toJSON = toISOString$1;
proto$2.locale = locale;
proto$2.localeData = localeData;

// Deprecations
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

//! moment.js
//! version : 2.18.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

hooks.version = '2.18.1';

setHookCallback(createLocal);

hooks.fn = proto;
hooks.min = min;
hooks.max = max;
hooks.now = now;
hooks.utc = createUTC;
hooks.unix = createUnix;
hooks.months = listMonths;
hooks.isDate = isDate;
hooks.locale = getSetGlobalLocale;
hooks.invalid = createInvalid;
hooks.duration = createDuration;
hooks.isMoment = isMoment;
hooks.weekdays = listWeekdays;
hooks.parseZone = createInZone;
hooks.localeData = getLocale;
hooks.isDuration = isDuration;
hooks.monthsShort = listMonthsShort;
hooks.weekdaysMin = listWeekdaysMin;
hooks.defineLocale = defineLocale;
hooks.updateLocale = updateLocale;
hooks.locales = listLocales;
hooks.weekdaysShort = listWeekdaysShort;
hooks.normalizeUnits = normalizeUnits;
hooks.relativeTimeRounding = getSetRelativeTimeRounding;
hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
hooks.calendarFormat = getCalendarFormat;
hooks.prototype = proto;



var moment$1 = Object.freeze({
	default: hooks
});

var moment$2 = ( moment$1 && hooks ) || moment$1;

var fiscalYear$1 = createCommonjsModule(function (module, exports) {
    "use strict";

    exports.__esModule = true;

    var JANUARY = 0;
    var NON_LEAP_YEAR = 2015;
    var monthYearFormat = function monthYearFormat(date) {
        return date.format('YYYY-MM-01');
    };
    var FiscalYear = function FiscalYear(fiscalYearStart) {
        function getFiscalMonths(fiscalYear) {
            var startTaxYear = fiscalYear;
            if (!isCalendarYearStart()) {
                --startTaxYear;
            }
            var startMonth = moment$2.utc({ year: startTaxYear,
                month: fiscalYearStart.month, day: fiscalYearStart.day });
            var ranges = [monthYearFormat(startMonth)];
            var REST_OF_MONTHS = 11;
            for (var i = 0; i < REST_OF_MONTHS; i++) {
                var month = startMonth.add(1, 'month');
                ranges.push(monthYearFormat(month));
            }
            return ranges;
        }
        function getFiscalMonth(inputDate) {
            var inputDateMonth = moment$2.utc(inputDate).month();
            var fiscalMonths = getPivotFiscalMonths();
            return fiscalMonths.indexOf(inputDateMonth);
        }
        function getFiscalQuarter(inputDate) {
            var fiscalMonth = getFiscalMonth(inputDate);
            return Math.floor(fiscalMonth / 3 + 1);
        }
        function getFiscalYear(inputDate) {
            var inputDateYear = moment$2.utc(inputDate).year();
            if (isCalendarYearStart()) {
                return inputDateYear;
            }
            var pivotFiscalDate = getPivotFiscalDate(inputDateYear);
            if (moment$2.utc(inputDate).isBefore(pivotFiscalDate)) {
                return inputDateYear;
            }
            return inputDateYear + 1;
        }
        function getPivotFiscalDate(inputDateYear) {
            return moment$2.utc({
                years: inputDateYear,
                months: fiscalYearStart.month,
                dates: fiscalYearStart.day,
                hours: 0,
                minutes: 0,
                seconds: 0,
                milliseconds: 0
            });
        }
        function getPivotFiscalMonths() {
            var MAX_MONTHS = 12;
            var pivots = [];
            if (isCalendarYearStart()) {
                for (var i = 0; i < MAX_MONTHS; i++) {
                    pivots.push(i);
                }
                return pivots;
            }
            for (var i = fiscalYearStart.month; i < MAX_MONTHS; i++) {
                pivots.push(i);
            }
            for (var i = 0; i < fiscalYearStart.month; i++) {
                pivots.push(i);
            }
            return pivots;
        }
        function isCalendarYearStart() {
            return fiscalYearStart.month === JANUARY && fiscalYearStart.day === 1;
        }
        return {
            getFiscalMonths: getFiscalMonths,
            getFiscalYear: getFiscalYear,
            getFiscalMonth: getFiscalMonth,
            getFiscalQuarter: getFiscalQuarter
        };
    };
    exports["default"] = FiscalYear;
});

var index$80 = createCommonjsModule(function (module, exports) {
    "use strict";

    function __export(m) {
        for (var p in m) {
            if (!exports.hasOwnProperty(p)) exports[p] = m[p];
        }
    }
    exports.__esModule = true;
    __export(fiscalYear$1);
});

var fy = unwrapExports(index$80);

function getDifferenceInYears(date1, date2) {
  return differenceInYears(date1, date2);
}

function checkIfBefore(date1, date2) {
  return isBefore(date1, date2);
}

function checkIfAfter(date1, date2) {
  return isAfter(date1, date2);
}

function getDifferenceInDays(date1, date2) {
  return differenceInDays(date1, date2);
}



var JUL_1 = { month: 6, day: 1 };
var fiscalYear = fy(JUL_1);

function getFiscalYear(date) {
  var year = fiscalYear.getFiscalYear(date);
  return year + '/' + (year + 1);
}

function getMonthsBasedOnRange(minMonth, maxMonth) {
  var crossCalenderYear = false;

  if (typeof minMonth === 'string') {
    minMonth = getMonthIndexByName(minMonth);
    maxMonth = getMonthIndexByName(maxMonth);
  }

  if (maxMonth < minMonth) {
    crossCalenderYear = true;
  }

  var outMonths = [];

  monthNames.forEach(function (month) {
    if (month.index >= minMonth) {
      outMonths.push(month.index);
    } else {
      if (!crossCalenderYear && month.index <= maxMonth && month.index >= minMonth) {
        outMonths.push(month.index);
      } else if (crossCalenderYear && month.index <= maxMonth && month.index >= 0) {
        outMonths.push(month.index);
      }
    }
  });
  return outMonths;
}

function getMonthIndexByName(name) {
  var index = null;
  monthNames.forEach(function (month) {
    if (month.name === name) index = month.index;
  });
  return index;
}

var monthNames = [{
  index: 0,
  name: 'January'
}, {
  index: 1,
  name: 'February'
}, {
  index: 2,
  name: 'March'
}, {
  index: 3,
  name: 'April'
}, {
  index: 4,
  name: 'May'
}, {
  index: 5,
  name: 'June'
}, {
  index: 6,
  name: 'July'
}, {
  index: 7,
  name: 'August'
}, {
  index: 8,
  name: 'September'
}, {
  index: 9,
  name: 'October'
}, {
  index: 10,
  name: 'November'
}, {
  index: 11,
  name: 'December'
}];

/* @flow */

/**
 * [Simple linear regression](http://en.wikipedia.org/wiki/Simple_linear_regression)
 * is a simple way to find a fitted line
 * between a set of coordinates. This algorithm finds the slope and y-intercept of a regression line
 * using the least sum of squares.
 *
 * @param {Array<Array<number>>} data an array of two-element of arrays,
 * like `[[0, 1], [2, 3]]`
 * @returns {Object} object containing slope and intersect of regression line
 * @example
 * linearRegression([[0, 0], [1, 1]]); // => { m: 1, b: 0 }
 */

function linearRegression$1(data /*: Array<Array<number>> */) /*: { m: number, b: number } */{

    var m, b;

    // Store data length in a local variable to reduce
    // repeated object property lookups
    var dataLength = data.length;

    //if there's only one point, arbitrarily choose a slope of 0
    //and a y-intercept of whatever the y of the initial point is
    if (dataLength === 1) {
        m = 0;
        b = data[0][1];
    } else {
        // Initialize our sums and scope the `m` and `b`
        // variables that define the line.
        var sumX = 0,
            sumY = 0,
            sumXX = 0,
            sumXY = 0;

        // Use local variables to grab point values
        // with minimal object property lookups
        var point, x, y;

        // Gather the sum of all x values, the sum of all
        // y values, and the sum of x^2 and (x*y) for each
        // value.
        //
        // In math notation, these would be SS_x, SS_y, SS_xx, and SS_xy
        for (var i = 0; i < dataLength; i++) {
            point = data[i];
            x = point[0];
            y = point[1];

            sumX += x;
            sumY += y;

            sumXX += x * x;
            sumXY += x * y;
        }

        // `m` is the slope of the regression line
        m = (dataLength * sumXY - sumX * sumY) / (dataLength * sumXX - sumX * sumX);

        // `b` is the y-intercept of the line.
        b = sumY / dataLength - m * sumX / dataLength;
    }

    // Return both values as an object.
    return {
        m: m,
        b: b
    };
}

var linear_regression = linearRegression$1;

/* @flow */

/**
 * Given the output of `linearRegression`: an object
 * with `m` and `b` values indicating slope and intercept,
 * respectively, generate a line function that translates
 * x values into y values.
 *
 * @param {Object} mb object with `m` and `b` members, representing
 * slope and intersect of desired line
 * @returns {Function} method that computes y-value at any given
 * x-value on the line.
 * @example
 * var l = linearRegressionLine(linearRegression([[0, 0], [1, 1]]));
 * l(0) // = 0
 * l(2) // = 2
 * linearRegressionLine({ b: 0, m: 1 })(1); // => 1
 * linearRegressionLine({ b: 1, m: 1 })(1); // => 2
 */

function linearRegressionLine(mb /*: { b: number, m: number }*/) /*: Function */{
    // Return a function that computes a `y` value for each
    // x value it is given, based on the values of `b` and `a`
    // that we just computed.
    return function (x) {
        return mb.b + mb.m * x;
    };
}

var linear_regression_line = linearRegressionLine;

/* @flow */

/**
 * Our default sum is the [Kahan-Babuska algorithm](https://pdfs.semanticscholar.org/1760/7d467cda1d0277ad272deb2113533131dc09.pdf).
 * This method is an improvement over the classical
 * [Kahan summation algorithm](https://en.wikipedia.org/wiki/Kahan_summation_algorithm).
 * It aims at computing the sum of a list of numbers while correcting for
 * floating-point errors. Traditionally, sums are calculated as many
 * successive additions, each one with its own floating-point roundoff. These
 * losses in precision add up as the number of numbers increases. This alternative
 * algorithm is more accurate than the simple way of calculating sums by simple
 * addition.
 *
 * This runs on `O(n)`, linear time in respect to the array.
 *
 * @param {Array<number>} x input
 * @return {number} sum of all input numbers
 * @example
 * sum([1, 2, 3]); // => 6
 */

function sum$1(x /*: Array<number> */) /*: number */{

    // If the array is empty, we needn't bother computing its sum
    if (x.length === 0) {
        return 0;
    }

    // Initializing the sum as the first number in the array
    var sum = x[0];

    // Keeping track of the floating-point error correction
    var correction = 0;

    var transition;

    for (var i = 1; i < x.length; i++) {
        transition = sum + x[i];

        // Here we need to update the correction in a different fashion
        // if the new absolute value is greater than the absolute sum
        if (Math.abs(sum) >= Math.abs(x[i])) {
            correction += sum - transition + x[i];
        } else {
            correction += x[i] - transition + sum;
        }

        sum = transition;
    }

    // Returning the corrected sum
    return sum + correction;
}

var sum_1 = sum$1;

/* @flow */

/**
 * The mean, _also known as average_,
 * is the sum of all values over the number of values.
 * This is a [measure of central tendency](https://en.wikipedia.org/wiki/Central_tendency):
 * a method of finding a typical or central value of a set of numbers.
 *
 * This runs on `O(n)`, linear time in respect to the array
 *
 * @param {Array<number>} x sample of one or more data points
 * @throws {Error} if the the length of x is less than one
 * @returns {number} mean
 * @example
 * mean([0, 10]); // => 5
 */
function mean$1(x /*: Array<number> */) /*:number*/{
    // The mean of no numbers is null
    if (x.length === 0) {
        throw new Error('mean requires at least one data point');
    }

    return sum_1(x) / x.length;
}

var mean_1 = mean$1;

/* @flow */

/**
 * The sum of deviations to the Nth power.
 * When n=2 it's the sum of squared deviations.
 * When n=3 it's the sum of cubed deviations.
 *
 * @param {Array<number>} x
 * @param {number} n power
 * @returns {number} sum of nth power deviations
 * @example
 * var input = [1, 2, 3];
 * // since the variance of a set is the mean squared
 * // deviations, we can calculate that with sumNthPowerDeviations:
 * var variance = sumNthPowerDeviations(input) / input.length;
 */
function sumNthPowerDeviations(x /*: Array<number> */, n /*: number */) /*:number*/{
    var meanValue = mean_1(x),
        sum = 0,
        tempValue,
        i;

    // This is an optimization: when n is 2 (we're computing a number squared),
    // multiplying the number by itself is significantly faster than using
    // the Math.pow method.
    if (n === 2) {
        for (i = 0; i < x.length; i++) {
            tempValue = x[i] - meanValue;
            sum += tempValue * tempValue;
        }
    } else {
        for (i = 0; i < x.length; i++) {
            sum += Math.pow(x[i] - meanValue, n);
        }
    }

    return sum;
}

var sum_nth_power_deviations = sumNthPowerDeviations;

/* @flow */

/**
 * The [variance](http://en.wikipedia.org/wiki/Variance)
 * is the sum of squared deviations from the mean.
 *
 * This is an implementation of variance, not sample variance:
 * see the `sampleVariance` method if you want a sample measure.
 *
 * @param {Array<number>} x a population of one or more data points
 * @returns {number} variance: a value greater than or equal to zero.
 * zero indicates that all values are identical.
 * @throws {Error} if x's length is 0
 * @example
 * variance([1, 2, 3, 4, 5, 6]); // => 2.9166666666666665
 */
function variance(x /*: Array<number> */) /*:number*/{
    // The variance of no numbers is null
    if (x.length === 0) {
        throw new Error('variance requires at least one data point');
    }

    // Find the mean of squared deviations between the
    // mean value and each value.
    return sum_nth_power_deviations(x, 2) / x.length;
}

var variance_1 = variance;

/* @flow */

/**
 * The [standard deviation](http://en.wikipedia.org/wiki/Standard_deviation)
 * is the square root of the variance. This is also known as the population
 * standard deviation. It's useful for measuring the amount
 * of variation or dispersion in a set of values.
 *
 * Standard deviation is only appropriate for full-population knowledge: for
 * samples of a population, {@link sampleStandardDeviation} is
 * more appropriate.
 *
 * @param {Array<number>} x input
 * @returns {number} standard deviation
 * @example
 * variance([2, 4, 4, 4, 5, 5, 7, 9]); // => 4
 * standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]); // => 2
 */
function standardDeviation(x /*: Array<number> */) /*:number*/{
    if (x.length === 1) {
        return 0;
    }
    var v = variance_1(x);
    return Math.sqrt(v);
}

var standard_deviation = standardDeviation;

/* @flow */

/**
 * The [R Squared](http://en.wikipedia.org/wiki/Coefficient_of_determination)
 * value of data compared with a function `f`
 * is the sum of the squared differences between the prediction
 * and the actual value.
 *
 * @param {Array<Array<number>>} x input data: this should be doubly-nested
 * @param {Function} func function called on `[i][0]` values within the dataset
 * @returns {number} r-squared value
 * @example
 * var samples = [[0, 0], [1, 1]];
 * var regressionLine = linearRegressionLine(linearRegression(samples));
 * rSquared(samples, regressionLine); // = 1 this line is a perfect fit
 */

function rSquared(x /*: Array<Array<number>> */, func /*: Function */) /*: number */{
    if (x.length < 2) {
        return 1;
    }

    // Compute the average y value for the actual
    // data set in order to compute the
    // _total sum of squares_
    var sum = 0,
        average;
    for (var i = 0; i < x.length; i++) {
        sum += x[i][1];
    }
    average = sum / x.length;

    // Compute the total sum of squares - the
    // squared difference between each point
    // and the average of all points.
    var sumOfSquares = 0;
    for (var j = 0; j < x.length; j++) {
        sumOfSquares += Math.pow(average - x[j][1], 2);
    }

    // Finally estimate the error: the squared
    // difference between the estimate and the actual data
    // value at each point.
    var err = 0;
    for (var k = 0; k < x.length; k++) {
        err += Math.pow(x[k][1] - func(x[k][0]), 2);
    }

    // As the error grows larger, its ratio to the
    // sum of squares increases and the r squared
    // value grows lower.
    return 1 - err / sumOfSquares;
}

var r_squared = rSquared;

/* @flow */

/**
 * Sort an array of numbers by their numeric value, ensuring that the
 * array is not changed in place.
 *
 * This is necessary because the default behavior of .sort
 * in JavaScript is to sort arrays as string values
 *
 *     [1, 10, 12, 102, 20].sort()
 *     // output
 *     [1, 10, 102, 12, 20]
 *
 * @param {Array<number>} x input array
 * @return {Array<number>} sorted array
 * @private
 * @example
 * numericSort([3, 2, 1]) // => [1, 2, 3]
 */

function numericSort(x /*: Array<number> */) /*: Array<number> */{
    return x
    // ensure the array is not changed in-place
    .slice()
    // comparator function that treats input as numeric
    .sort(function (a, b) {
        return a - b;
    });
}

var numeric_sort = numericSort;

/* @flow */

/**
 * The [mode](http://bit.ly/W5K4Yt) is the number that appears in a list the highest number of times.
 * There can be multiple modes in a list: in the event of a tie, this
 * algorithm will return the most recently seen mode.
 *
 * This is a [measure of central tendency](https://en.wikipedia.org/wiki/Central_tendency):
 * a method of finding a typical or central value of a set of numbers.
 *
 * This runs in `O(n)` because the input is sorted.
 *
 * @param {Array<number>} sorted a sample of one or more data points
 * @returns {number} mode
 * @throws {Error} if sorted is empty
 * @example
 * modeSorted([0, 0, 1]); // => 0
 */

function modeSorted(sorted /*: Array<number> */) /*:number*/{

    // Handle edge cases:
    // The mode of an empty list is undefined
    if (sorted.length === 0) {
        throw new Error('mode requires at least one data point');
    } else if (sorted.length === 1) {
        return sorted[0];
    }

    // This assumes it is dealing with an array of size > 1, since size
    // 0 and 1 are handled immediately. Hence it starts at index 1 in the
    // array.
    var last = sorted[0],

    // store the mode as we find new modes
    value = NaN,

    // store how many times we've seen the mode
    maxSeen = 0,

    // how many times the current candidate for the mode
    // has been seen
    seenThis = 1;

    // end at sorted.length + 1 to fix the case in which the mode is
    // the highest number that occurs in the sequence. the last iteration
    // compares sorted[i], which is undefined, to the highest number
    // in the series
    for (var i = 1; i < sorted.length + 1; i++) {
        // we're seeing a new number pass by
        if (sorted[i] !== last) {
            // the last number is the new mode since we saw it more
            // often than the old one
            if (seenThis > maxSeen) {
                maxSeen = seenThis;
                value = last;
            }
            seenThis = 1;
            last = sorted[i];
            // if this isn't a new number, it's one more occurrence of
            // the potential mode
        } else {
            seenThis++;
        }
    }
    return value;
}

var mode_sorted = modeSorted;

/* @flow */

/**
 * The [mode](http://bit.ly/W5K4Yt) is the number that appears in a list the highest number of times.
 * There can be multiple modes in a list: in the event of a tie, this
 * algorithm will return the most recently seen mode.
 *
 * This is a [measure of central tendency](https://en.wikipedia.org/wiki/Central_tendency):
 * a method of finding a typical or central value of a set of numbers.
 *
 * This runs on `O(nlog(n))` because it needs to sort the array internally
 * before running an `O(n)` search to find the mode.
 *
 * @param {Array<number>} x input
 * @returns {number} mode
 * @example
 * mode([0, 0, 1]); // => 0
 */
function mode(x /*: Array<number> */) /*:number*/{
  // Sorting the array lets us iterate through it below and be sure
  // that every time we see a new number it's new and we'll never
  // see the same number twice
  return mode_sorted(numeric_sort(x));
}

var mode_1 = mode;

/* @flow */
/* globals Map: false */

/**
 * The [mode](http://bit.ly/W5K4Yt) is the number that appears in a list the highest number of times.
 * There can be multiple modes in a list: in the event of a tie, this
 * algorithm will return the most recently seen mode.
 *
 * modeFast uses a Map object to keep track of the mode, instead of the approach
 * used with `mode`, a sorted array. As a result, it is faster
 * than `mode` and supports any data type that can be compared with `==`.
 * It also requires a
 * [JavaScript environment with support for Map](https://kangax.github.io/compat-table/es6/#test-Map),
 * and will throw an error if Map is not available.
 *
 * This is a [measure of central tendency](https://en.wikipedia.org/wiki/Central_tendency):
 * a method of finding a typical or central value of a set of numbers.
 *
 * @param {Array<*>} x a sample of one or more data points
 * @returns {?*} mode
 * @throws {ReferenceError} if the JavaScript environment doesn't support Map
 * @throws {Error} if x is empty
 * @example
 * modeFast(['rabbits', 'rabbits', 'squirrels']); // => 'rabbits'
 */

function modeFast /*::<T>*/(x /*: Array<T> */) /*: ?T */{

    // This index will reflect the incidence of different values, indexing
    // them like
    // { value: count }
    var index = new Map();

    // A running `mode` and the number of times it has been encountered.
    var mode;
    var modeCount = 0;

    for (var i = 0; i < x.length; i++) {
        var newCount = index.get(x[i]);
        if (newCount === undefined) {
            newCount = 1;
        } else {
            newCount++;
        }
        if (newCount > modeCount) {
            mode = x[i];
            modeCount = newCount;
        }
        index.set(x[i], newCount);
    }

    if (modeCount === 0) {
        throw new Error('mode requires at last one data point');
    }

    return mode;
}

var mode_fast = modeFast;

/* @flow */

/**
 * The min is the lowest number in the array. This runs on `O(n)`, linear time in respect to the array
 *
 * @param {Array<number>} x sample of one or more data points
 * @throws {Error} if the the length of x is less than one
 * @returns {number} minimum value
 * @example
 * min([1, 5, -10, 100, 2]); // => -10
 */

function min$2(x /*: Array<number> */) /*:number*/{

    if (x.length === 0) {
        throw new Error('min requires at least one data point');
    }

    var value = x[0];
    for (var i = 1; i < x.length; i++) {
        // On the first iteration of this loop, min is
        // undefined and is thus made the minimum element in the array
        if (x[i] < value) {
            value = x[i];
        }
    }
    return value;
}

var min_1 = min$2;

/* @flow */

/**
 * This computes the maximum number in an array.
 *
 * This runs on `O(n)`, linear time in respect to the array
 *
 * @param {Array<number>} x sample of one or more data points
 * @returns {number} maximum value
 * @throws {Error} if the the length of x is less than one
 * @example
 * max([1, 2, 3, 4]);
 * // => 4
 */

function max$2(x /*: Array<number> */) /*:number*/{

    if (x.length === 0) {
        throw new Error('max requires at least one data point');
    }

    var value = x[0];
    for (var i = 1; i < x.length; i++) {
        // On the first iteration of this loop, max is
        // undefined and is thus made the maximum element in the array
        if (x[i] > value) {
            value = x[i];
        }
    }
    return value;
}

var max_1 = max$2;

/* @flow */

/**
 * The minimum is the lowest number in the array. With a sorted array,
 * the first element in the array is always the smallest, so this calculation
 * can be done in one step, or constant time.
 *
 * @param {Array<number>} x input
 * @returns {number} minimum value
 * @example
 * minSorted([-100, -10, 1, 2, 5]); // => -100
 */

function minSorted(x /*: Array<number> */) /*:number*/{
  return x[0];
}

var min_sorted = minSorted;

/* @flow */

/**
 * The maximum is the highest number in the array. With a sorted array,
 * the last element in the array is always the largest, so this calculation
 * can be done in one step, or constant time.
 *
 * @param {Array<number>} x input
 * @returns {number} maximum value
 * @example
 * maxSorted([-100, -10, 1, 2, 5]); // => 5
 */

function maxSorted(x /*: Array<number> */) /*:number*/{
  return x[x.length - 1];
}

var max_sorted = maxSorted;

/* @flow */

/**
 * The simple [sum](https://en.wikipedia.org/wiki/Summation) of an array
 * is the result of adding all numbers together, starting from zero.
 *
 * This runs on `O(n)`, linear time in respect to the array
 *
 * @param {Array<number>} x input
 * @return {number} sum of all input numbers
 * @example
 * sumSimple([1, 2, 3]); // => 6
 */

function sumSimple(x /*: Array<number> */) /*: number */{
    var value = 0;
    for (var i = 0; i < x.length; i++) {
        value += x[i];
    }
    return value;
}

var sum_simple = sumSimple;

/* @flow */

/**
 * The [product](https://en.wikipedia.org/wiki/Product_(mathematics)) of an array
 * is the result of multiplying all numbers together, starting using one as the multiplicative identity.
 *
 * This runs on `O(n)`, linear time in respect to the array
 *
 * @param {Array<number>} x input
 * @return {number} product of all input numbers
 * @example
 * product([1, 2, 3, 4]); // => 24
 */

function product(x /*: Array<number> */) /*: number */{
    var value = 1;
    for (var i = 0; i < x.length; i++) {
        value *= x[i];
    }
    return value;
}

var product_1 = product;

/* @flow */

/**
 * This is the internal implementation of quantiles: when you know
 * that the order is sorted, you don't need to re-sort it, and the computations
 * are faster.
 *
 * @param {Array<number>} x sample of one or more data points
 * @param {number} p desired quantile: a number between 0 to 1, inclusive
 * @returns {number} quantile value
 * @throws {Error} if p ix outside of the range from 0 to 1
 * @throws {Error} if x is empty
 * @example
 * quantileSorted([3, 6, 7, 8, 8, 9, 10, 13, 15, 16, 20], 0.5); // => 9
 */

function quantileSorted(x /*: Array<number> */, p /*: number */) /*:number*/{
    var idx = x.length * p;
    if (x.length === 0) {
        throw new Error('quantile requires at least one data point.');
    } else if (p < 0 || p > 1) {
        throw new Error('quantiles must be between 0 and 1');
    } else if (p === 1) {
        // If p is 1, directly return the last element
        return x[x.length - 1];
    } else if (p === 0) {
        // If p is 0, directly return the first element
        return x[0];
    } else if (idx % 1 !== 0) {
        // If p is not integer, return the next element in array
        return x[Math.ceil(idx) - 1];
    } else if (x.length % 2 === 0) {
        // If the list has even-length, we'll take the average of this number
        // and the next value, if there is one
        return (x[idx - 1] + x[idx]) / 2;
    } else {
        // Finally, in the simple case of an integer value
        // with an odd-length list, return the x value at the index.
        return x[idx];
    }
}

var quantile_sorted = quantileSorted;

/* @flow */

var quickselect_1 = quickselect;

/**
 * Rearrange items in `arr` so that all items in `[left, k]` range are the smallest.
 * The `k`-th element will have the `(k - left + 1)`-th smallest value in `[left, right]`.
 *
 * Implements Floyd-Rivest selection algorithm https://en.wikipedia.org/wiki/Floyd-Rivest_algorithm
 *
 * @private
 * @param {Array<number>} arr input array
 * @param {number} k pivot index
 * @param {number} left left index
 * @param {number} right right index
 * @returns {undefined}
 * @example
 * var arr = [65, 28, 59, 33, 21, 56, 22, 95, 50, 12, 90, 53, 28, 77, 39];
 * quickselect(arr, 8);
 * // = [39, 28, 28, 33, 21, 12, 22, 50, 53, 56, 59, 65, 90, 77, 95]
 */
function quickselect(arr /*: Array<number> */, k /*: number */, left /*: number */, right /*: number */) {
    left = left || 0;
    right = right || arr.length - 1;

    while (right > left) {
        // 600 and 0.5 are arbitrary constants chosen in the original paper to minimize execution time
        if (right - left > 600) {
            var n = right - left + 1;
            var m = k - left + 1;
            var z = Math.log(n);
            var s = 0.5 * Math.exp(2 * z / 3);
            var sd = 0.5 * Math.sqrt(z * s * (n - s) / n);
            if (m - n / 2 < 0) sd *= -1;
            var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
            var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
            quickselect(arr, k, newLeft, newRight);
        }

        var t = arr[k];
        var i = left;
        var j = right;

        swap(arr, left, k);
        if (arr[right] > t) swap(arr, left, right);

        while (i < j) {
            swap(arr, i, j);
            i++;
            j--;
            while (arr[i] < t) {
                i++;
            }while (arr[j] > t) {
                j--;
            }
        }

        if (arr[left] === t) swap(arr, left, j);else {
            j++;
            swap(arr, j, right);
        }

        if (j <= k) left = j + 1;
        if (k <= j) right = j - 1;
    }
}

function swap(arr, i, j) {
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}

/* @flow */

/**
 * The [quantile](https://en.wikipedia.org/wiki/Quantile):
 * this is a population quantile, since we assume to know the entire
 * dataset in this library. This is an implementation of the
 * [Quantiles of a Population](http://en.wikipedia.org/wiki/Quantile#Quantiles_of_a_population)
 * algorithm from wikipedia.
 *
 * Sample is a one-dimensional array of numbers,
 * and p is either a decimal number from 0 to 1 or an array of decimal
 * numbers from 0 to 1.
 * In terms of a k/q quantile, p = k/q - it's just dealing with fractions or dealing
 * with decimal values.
 * When p is an array, the result of the function is also an array containing the appropriate
 * quantiles in input order
 *
 * @param {Array<number>} x sample of one or more numbers
 * @param {number} p the desired quantile, as a number between 0 and 1
 * @returns {number} quantile
 * @example
 * quantile([3, 6, 7, 8, 8, 9, 10, 13, 15, 16, 20], 0.5); // => 9
 */
function quantile$1(x /*: Array<number> */, p /*: Array<number> | number */) {
    var copy = x.slice();

    if (Array.isArray(p)) {
        // rearrange elements so that each element corresponding to a requested
        // quantile is on a place it would be if the array was fully sorted
        multiQuantileSelect(copy, p);
        // Initialize the result array
        var results = [];
        // For each requested quantile
        for (var i = 0; i < p.length; i++) {
            results[i] = quantile_sorted(copy, p[i]);
        }
        return results;
    } else {
        var idx = quantileIndex(copy.length, p);
        quantileSelect(copy, idx, 0, copy.length - 1);
        return quantile_sorted(copy, p);
    }
}

function quantileSelect(arr, k, left, right) {
    if (k % 1 === 0) {
        quickselect_1(arr, k, left, right);
    } else {
        k = Math.floor(k);
        quickselect_1(arr, k, left, right);
        quickselect_1(arr, k + 1, k + 1, right);
    }
}

function multiQuantileSelect(arr, p) {
    var indices = [0];
    for (var i = 0; i < p.length; i++) {
        indices.push(quantileIndex(arr.length, p[i]));
    }
    indices.push(arr.length - 1);
    indices.sort(compare);

    var stack = [0, indices.length - 1];

    while (stack.length) {
        var r = Math.ceil(stack.pop());
        var l = Math.floor(stack.pop());
        if (r - l <= 1) continue;

        var m = Math.floor((l + r) / 2);
        quantileSelect(arr, indices[m], indices[l], indices[r]);

        stack.push(l, m, m, r);
    }
}

function compare(a, b) {
    return a - b;
}

function quantileIndex(len /*: number */, p /*: number */) /*:number*/{
    var idx = len * p;
    if (p === 1) {
        // If p is 1, directly return the last index
        return len - 1;
    } else if (p === 0) {
        // If p is 0, directly return the first index
        return 0;
    } else if (idx % 1 !== 0) {
        // If index is not integer, return the next index in array
        return Math.ceil(idx) - 1;
    } else if (len % 2 === 0) {
        // If the list has even-length, we'll return the middle of two indices
        // around quantile to indicate that we need an average value of the two
        return idx - 0.5;
    } else {
        // Finally, in the simple case of an integer index
        // with an odd-length list, return the index
        return idx;
    }
}

var quantile_1 = quantile$1;

/* @flow */

/**
 * The [Interquartile range](http://en.wikipedia.org/wiki/Interquartile_range) is
 * a measure of statistical dispersion, or how scattered, spread, or
 * concentrated a distribution is. It's computed as the difference between
 * the third quartile and first quartile.
 *
 * @param {Array<number>} x sample of one or more numbers
 * @returns {number} interquartile range: the span between lower and upper quartile,
 * 0.25 and 0.75
 * @example
 * interquartileRange([0, 1, 2, 3]); // => 2
 */
function interquartileRange$1(x /*: Array<number> */) {
    // Interquartile range is the span between the upper quartile,
    // at `0.75`, and lower quartile, `0.25`
    var q1 = quantile_1(x, 0.75),
        q2 = quantile_1(x, 0.25);

    if (typeof q1 === 'number' && typeof q2 === 'number') {
        return q1 - q2;
    }
}

var interquartile_range = interquartileRange$1;

/* @flow */

/**
 * The [median](http://en.wikipedia.org/wiki/Median) is
 * the middle number of a list. This is often a good indicator of 'the middle'
 * when there are outliers that skew the `mean()` value.
 * This is a [measure of central tendency](https://en.wikipedia.org/wiki/Central_tendency):
 * a method of finding a typical or central value of a set of numbers.
 *
 * The median isn't necessarily one of the elements in the list: the value
 * can be the average of two elements if the list has an even length
 * and the two central values are different.
 *
 * @param {Array<number>} x input
 * @returns {number} median value
 * @example
 * median([10, 2, 5, 100, 2, 1]); // => 3.5
 */
function median$1(x /*: Array<number> */) /*:number*/{
  return +quantile_1(x, 0.5);
}

var median_1 = median$1;

/* @flow */

/**
 * The [Median Absolute Deviation](http://en.wikipedia.org/wiki/Median_absolute_deviation) is
 * a robust measure of statistical
 * dispersion. It is more resilient to outliers than the standard deviation.
 *
 * @param {Array<number>} x input array
 * @returns {number} median absolute deviation
 * @example
 * medianAbsoluteDeviation([1, 1, 2, 2, 4, 6, 9]); // => 1
 */
function medianAbsoluteDeviation(x /*: Array<number> */) {
    // The mad of nothing is null
    var medianValue = median_1(x),
        medianAbsoluteDeviations = [];

    // Make a list of absolute deviations from the median
    for (var i = 0; i < x.length; i++) {
        medianAbsoluteDeviations.push(Math.abs(x[i] - medianValue));
    }

    // Find the median value of that list
    return median_1(medianAbsoluteDeviations);
}

var median_absolute_deviation = medianAbsoluteDeviation;

/* @flow */

/**
 * Split an array into chunks of a specified size. This function
 * has the same behavior as [PHP's array_chunk](http://php.net/manual/en/function.array-chunk.php)
 * function, and thus will insert smaller-sized chunks at the end if
 * the input size is not divisible by the chunk size.
 *
 * `x` is expected to be an array, and `chunkSize` a number.
 * The `x` array can contain any kind of data.
 *
 * @param {Array} x a sample
 * @param {number} chunkSize size of each output array. must be a positive integer
 * @returns {Array<Array>} a chunked array
 * @throws {Error} if chunk size is less than 1 or not an integer
 * @example
 * chunk([1, 2, 3, 4, 5, 6], 2);
 * // => [[1, 2], [3, 4], [5, 6]]
 */

function chunk(x /*:Array<any>*/, chunkSize /*:number*/) /*:?Array<Array<any>>*/{

    // a list of result chunks, as arrays in an array
    var output = [];

    // `chunkSize` must be zero or higher - otherwise the loop below,
    // in which we call `start += chunkSize`, will loop infinitely.
    // So, we'll detect and throw in that case to indicate
    // invalid input.
    if (chunkSize < 1) {
        throw new Error('chunk size must be a positive number');
    }

    if (Math.floor(chunkSize) !== chunkSize) {
        throw new Error('chunk size must be an integer');
    }

    // `start` is the index at which `.slice` will start selecting
    // new array elements
    for (var start = 0; start < x.length; start += chunkSize) {

        // for each chunk, slice that part of the array and add it
        // to the output. The `.slice` function does not change
        // the original array.
        output.push(x.slice(start, start + chunkSize));
    }
    return output;
}

var chunk_1 = chunk;

/* @flow */

/**
 * Sampling with replacement is a type of sampling that allows the same
 * item to be picked out of a population more than once.
 *
 * @param {Array<*>} x an array of any kind of value
 * @param {number} n count of how many elements to take
 * @param {Function} [randomSource=Math.random] an optional entropy source that
 * returns numbers between 0 inclusive and 1 exclusive: the range [0, 1)
 * @return {Array} n sampled items from the population
 * @example
 * var sample = sampleWithReplacement([1, 2, 3, 4], 2);
 * sampleWithReplacement; // = [2, 4] or any other random sample of 2 items
 */

function sampleWithReplacement /*::<T>*/(x /*:Array<T>*/
, n /*: number */
, randomSource /*:Function*/) {

    if (x.length === 0) {
        return [];
    }

    // a custom random number source can be provided if you want to use
    // a fixed seed or another random number generator, like
    // [random-js](https://www.npmjs.org/package/random-js)
    randomSource = randomSource || Math.random;

    var length = x.length;
    var sample = [];

    for (var i = 0; i < n; i++) {
        var index = Math.floor(randomSource() * length);

        sample.push(x[index]);
    }

    return sample;
}

var sample_with_replacement = sampleWithReplacement;

/* @flow */

/**
 * A [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
 * in-place - which means that it **will change the order of the original
 * array by reference**.
 *
 * This is an algorithm that generates a random [permutation](https://en.wikipedia.org/wiki/Permutation)
 * of a set.
 *
 * @param {Array} x sample of one or more numbers
 * @param {Function} [randomSource=Math.random] an optional entropy source that
 * returns numbers between 0 inclusive and 1 exclusive: the range [0, 1)
 * @returns {Array} x
 * @example
 * var x = [1, 2, 3, 4];
 * shuffleInPlace(x);
 * // x is shuffled to a value like [2, 1, 4, 3]
 */

function shuffleInPlace(x /*:Array<any>*/, randomSource /*:Function*/) /*:Array<any>*/{

    // a custom random number source can be provided if you want to use
    // a fixed seed or another random number generator, like
    // [random-js](https://www.npmjs.org/package/random-js)
    randomSource = randomSource || Math.random;

    // store the current length of the x to determine
    // when no elements remain to shuffle.
    var length = x.length;

    // temporary is used to hold an item when it is being
    // swapped between indices.
    var temporary;

    // The index to swap at each stage.
    var index;

    // While there are still items to shuffle
    while (length > 0) {
        // chose a random index within the subset of the array
        // that is not yet shuffled
        index = Math.floor(randomSource() * length--);

        // store the value that we'll move temporarily
        temporary = x[length];

        // swap the value at `x[length]` with `x[index]`
        x[length] = x[index];
        x[index] = temporary;
    }

    return x;
}

var shuffle_in_place = shuffleInPlace;

/* @flow */

/**
 * A [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
 * is a fast way to create a random permutation of a finite set. This is
 * a function around `shuffle_in_place` that adds the guarantee that
 * it will not modify its input.
 *
 * @param {Array} x sample of 0 or more numbers
 * @param {Function} [randomSource=Math.random] an optional entropy source that
 * returns numbers between 0 inclusive and 1 exclusive: the range [0, 1)
 * @return {Array} shuffled version of input
 * @example
 * var shuffled = shuffle([1, 2, 3, 4]);
 * shuffled; // = [2, 3, 1, 4] or any other random permutation
 */
function shuffle /*::<T>*/(x /*:Array<T>*/, randomSource /*:Function*/) {
  // slice the original array so that it is not modified
  var sample = x.slice();

  // and then shuffle that shallow-copied array, in place
  return shuffle_in_place(sample.slice(), randomSource);
}

var shuffle_1 = shuffle;

/* @flow */

/**
 * Create a [simple random sample](http://en.wikipedia.org/wiki/Simple_random_sample)
 * from a given array of `n` elements.
 *
 * The sampled values will be in any order, not necessarily the order
 * they appear in the input.
 *
 * @param {Array<any>} x input array. can contain any type
 * @param {number} n count of how many elements to take
 * @param {Function} [randomSource=Math.random] an optional entropy source that
 * returns numbers between 0 inclusive and 1 exclusive: the range [0, 1)
 * @return {Array} subset of n elements in original array
 * @example
 * var values = [1, 2, 4, 5, 6, 7, 8, 9];
 * sample(values, 3); // returns 3 random values, like [2, 5, 8];
 */
function sample /*:: <T> */(x /*: Array<T> */
, n /*: number */
, randomSource /*: Function */) /*: Array<T> */{
  // shuffle the original array using a fisher-yates shuffle
  var shuffled = shuffle_1(x, randomSource);

  // and then return a subset of it - the first `n` elements.
  return shuffled.slice(0, n);
}

var sample_1 = sample;

/* @flow */

/**
 * For a sorted input, counting the number of unique values
 * is possible in constant time and constant memory. This is
 * a simple implementation of the algorithm.
 *
 * Values are compared with `===`, so objects and non-primitive objects
 * are not handled in any special way.
 *
 * @param {Array<*>} x an array of any kind of value
 * @returns {number} count of unique values
 * @example
 * uniqueCountSorted([1, 2, 3]); // => 3
 * uniqueCountSorted([1, 1, 1]); // => 1
 */

function uniqueCountSorted(x /*: Array<any>*/) /*: number */{
    var uniqueValueCount = 0,
        lastSeenValue;
    for (var i = 0; i < x.length; i++) {
        if (i === 0 || x[i] !== lastSeenValue) {
            lastSeenValue = x[i];
            uniqueValueCount++;
        }
    }
    return uniqueValueCount;
}

var unique_count_sorted = uniqueCountSorted;

/* @flow */

/**
 * Create a new column x row matrix.
 *
 * @private
 * @param {number} columns
 * @param {number} rows
 * @return {Array<Array<number>>} matrix
 * @example
 * makeMatrix(10, 10);
 */
function makeMatrix(columns, rows) {
    var matrix = [];
    for (var i = 0; i < columns; i++) {
        var column = [];
        for (var j = 0; j < rows; j++) {
            column.push(0);
        }
        matrix.push(column);
    }
    return matrix;
}

/**
 * Generates incrementally computed values based on the sums and sums of
 * squares for the data array
 *
 * @private
 * @param {number} j
 * @param {number} i
 * @param {Array<number>} sums
 * @param {Array<number>} sumsOfSquares
 * @return {number}
 * @example
 * ssq(0, 1, [-1, 0, 2], [1, 1, 5]);
 */
function ssq(j, i, sums, sumsOfSquares) {
    var sji; // s(j, i)
    if (j > 0) {
        var muji = (sums[i] - sums[j - 1]) / (i - j + 1); // mu(j, i)
        sji = sumsOfSquares[i] - sumsOfSquares[j - 1] - (i - j + 1) * muji * muji;
    } else {
        sji = sumsOfSquares[i] - sums[i] * sums[i] / (i + 1);
    }
    if (sji < 0) {
        return 0;
    }
    return sji;
}

/**
 * Function that recursively divides and conquers computations
 * for cluster j
 *
 * @private
 * @param {number} iMin Minimum index in cluster to be computed
 * @param {number} iMax Maximum index in cluster to be computed
 * @param {number} cluster Index of the cluster currently being computed
 * @param {Array<Array<number>>} matrix
 * @param {Array<Array<number>>} backtrackMatrix
 * @param {Array<number>} sums
 * @param {Array<number>} sumsOfSquares
 */
function fillMatrixColumn(iMin, iMax, cluster, matrix, backtrackMatrix, sums, sumsOfSquares) {
    if (iMin > iMax) {
        return;
    }

    // Start at midpoint between iMin and iMax
    var i = Math.floor((iMin + iMax) / 2);

    matrix[cluster][i] = matrix[cluster - 1][i - 1];
    backtrackMatrix[cluster][i] = i;

    var jlow = cluster; // the lower end for j

    if (iMin > cluster) {
        jlow = Math.max(jlow, backtrackMatrix[cluster][iMin - 1] || 0);
    }
    jlow = Math.max(jlow, backtrackMatrix[cluster - 1][i] || 0);

    var jhigh = i - 1; // the upper end for j
    if (iMax < matrix.length - 1) {
        jhigh = Math.min(jhigh, backtrackMatrix[cluster][iMax + 1] || 0);
    }

    var sji;
    var sjlowi;
    var ssqjlow;
    var ssqj;
    for (var j = jhigh; j >= jlow; --j) {
        sji = ssq(j, i, sums, sumsOfSquares);

        if (sji + matrix[cluster - 1][jlow - 1] >= matrix[cluster][i]) {
            break;
        }

        // Examine the lower bound of the cluster border
        sjlowi = ssq(jlow, i, sums, sumsOfSquares);

        ssqjlow = sjlowi + matrix[cluster - 1][jlow - 1];

        if (ssqjlow < matrix[cluster][i]) {
            // Shrink the lower bound
            matrix[cluster][i] = ssqjlow;
            backtrackMatrix[cluster][i] = jlow;
        }
        jlow++;

        ssqj = sji + matrix[cluster - 1][j - 1];
        if (ssqj < matrix[cluster][i]) {
            matrix[cluster][i] = ssqj;
            backtrackMatrix[cluster][i] = j;
        }
    }

    fillMatrixColumn(iMin, i - 1, cluster, matrix, backtrackMatrix, sums, sumsOfSquares);
    fillMatrixColumn(i + 1, iMax, cluster, matrix, backtrackMatrix, sums, sumsOfSquares);
}

/**
 * Initializes the main matrices used in Ckmeans and kicks
 * off the divide and conquer cluster computation strategy
 *
 * @private
 * @param {Array<number>} data sorted array of values
 * @param {Array<Array<number>>} matrix
 * @param {Array<Array<number>>} backtrackMatrix
 */
function fillMatrices(data, matrix, backtrackMatrix) {
    var nValues = matrix[0].length;

    // Shift values by the median to improve numeric stability
    var shift = data[Math.floor(nValues / 2)];

    // Cumulative sum and cumulative sum of squares for all values in data array
    var sums = [];
    var sumsOfSquares = [];

    // Initialize first column in matrix & backtrackMatrix
    for (var i = 0, shiftedValue; i < nValues; ++i) {
        shiftedValue = data[i] - shift;
        if (i === 0) {
            sums.push(shiftedValue);
            sumsOfSquares.push(shiftedValue * shiftedValue);
        } else {
            sums.push(sums[i - 1] + shiftedValue);
            sumsOfSquares.push(sumsOfSquares[i - 1] + shiftedValue * shiftedValue);
        }

        // Initialize for cluster = 0
        matrix[0][i] = ssq(0, i, sums, sumsOfSquares);
        backtrackMatrix[0][i] = 0;
    }

    // Initialize the rest of the columns
    var iMin;
    for (var cluster = 1; cluster < matrix.length; ++cluster) {
        if (cluster < matrix.length - 1) {
            iMin = cluster;
        } else {
            // No need to compute matrix[K-1][0] ... matrix[K-1][N-2]
            iMin = nValues - 1;
        }

        fillMatrixColumn(iMin, nValues - 1, cluster, matrix, backtrackMatrix, sums, sumsOfSquares);
    }
}

/**
 * Ckmeans clustering is an improvement on heuristic-based clustering
 * approaches like Jenks. The algorithm was developed in
 * [Haizhou Wang and Mingzhou Song](http://journal.r-project.org/archive/2011-2/RJournal_2011-2_Wang+Song.pdf)
 * as a [dynamic programming](https://en.wikipedia.org/wiki/Dynamic_programming) approach
 * to the problem of clustering numeric data into groups with the least
 * within-group sum-of-squared-deviations.
 *
 * Minimizing the difference within groups - what Wang & Song refer to as
 * `withinss`, or within sum-of-squares, means that groups are optimally
 * homogenous within and the data is split into representative groups.
 * This is very useful for visualization, where you may want to represent
 * a continuous variable in discrete color or style groups. This function
 * can provide groups that emphasize differences between data.
 *
 * Being a dynamic approach, this algorithm is based on two matrices that
 * store incrementally-computed values for squared deviations and backtracking
 * indexes.
 *
 * This implementation is based on Ckmeans 3.4.6, which introduced a new divide
 * and conquer approach that improved runtime from O(kn^2) to O(kn log(n)).
 *
 * Unlike the [original implementation](https://cran.r-project.org/web/packages/Ckmeans.1d.dp/index.html),
 * this implementation does not include any code to automatically determine
 * the optimal number of clusters: this information needs to be explicitly
 * provided.
 *
 * ### References
 * _Ckmeans.1d.dp: Optimal k-means Clustering in One Dimension by Dynamic
 * Programming_ Haizhou Wang and Mingzhou Song ISSN 2073-4859
 *
 * from The R Journal Vol. 3/2, December 2011
 * @param {Array<number>} x input data, as an array of number values
 * @param {number} nClusters number of desired classes. This cannot be
 * greater than the number of values in the data array.
 * @returns {Array<Array<number>>} clustered input
 * @throws {Error} if the number of requested clusters is higher than the size of the data
 * @example
 * ckmeans([-1, 2, -1, 2, 4, 5, 6, -1, 2, -1], 3);
 * // The input, clustered into groups of similar numbers.
 * //= [[-1, -1, -1, -1], [2, 2, 2], [4, 5, 6]]);
 */
function ckmeans(x /*: Array<number> */, nClusters /*: number */) /*: Array<Array<number>> */{

    if (nClusters > x.length) {
        throw new Error('cannot generate more classes than there are data values');
    }

    var sorted = numeric_sort(x),

    // we'll use this as the maximum number of clusters
    uniqueCount = unique_count_sorted(sorted);

    // if all of the input values are identical, there's one cluster
    // with all of the input in it.
    if (uniqueCount === 1) {
        return [sorted];
    }

    // named 'S' originally
    var matrix = makeMatrix(nClusters, sorted.length),

    // named 'J' originally
    backtrackMatrix = makeMatrix(nClusters, sorted.length);

    // This is a dynamic programming way to solve the problem of minimizing
    // within-cluster sum of squares. It's similar to linear regression
    // in this way, and this calculation incrementally computes the
    // sum of squares that are later read.
    fillMatrices(sorted, matrix, backtrackMatrix);

    // The real work of Ckmeans clustering happens in the matrix generation:
    // the generated matrices encode all possible clustering combinations, and
    // once they're generated we can solve for the best clustering groups
    // very quickly.
    var clusters = [],
        clusterRight = backtrackMatrix[0].length - 1;

    // Backtrack the clusters from the dynamic programming matrix. This
    // starts at the bottom-right corner of the matrix (if the top-left is 0, 0),
    // and moves the cluster target with the loop.
    for (var cluster = backtrackMatrix.length - 1; cluster >= 0; cluster--) {

        var clusterLeft = backtrackMatrix[cluster][clusterRight];

        // fill the cluster from the sorted input by taking a slice of the
        // array. the backtrack matrix makes this easy - it stores the
        // indexes where the cluster should start and end.
        clusters[cluster] = sorted.slice(clusterLeft, clusterRight + 1);

        if (cluster > 0) {
            clusterRight = clusterLeft - 1;
        }
    }

    return clusters;
}

var ckmeans_1 = ckmeans;

/* @flow */

/**
 * Given an array of x, this will find the extent of the
 * x and return an array of breaks that can be used
 * to categorize the x into a number of classes. The
 * returned array will always be 1 longer than the number of
 * classes because it includes the minimum value.
 *
 * @param {Array<number>} x an array of number values
 * @param {number} nClasses number of desired classes
 * @returns {Array<number>} array of class break positions
 * @example
 * equalIntervalBreaks([1, 2, 3, 4, 5, 6], 4); //= [1, 2.25, 3.5, 4.75, 6]
 */
function equalIntervalBreaks(x /*: Array<number> */, nClasses /*:number*/) /*: Array<number> */{

    if (x.length < 2) {
        return x;
    }

    var theMin = min_1(x),
        theMax = max_1(x);

    // the first break will always be the minimum value
    // in the xset
    var breaks = [theMin];

    // The size of each break is the full range of the x
    // divided by the number of classes requested
    var breakSize = (theMax - theMin) / nClasses;

    // In the case of nClasses = 1, this loop won't run
    // and the returned breaks will be [min, max]
    for (var i = 1; i < nClasses; i++) {
        breaks.push(breaks[0] + breakSize * i);
    }

    // the last break will always be the
    // maximum.
    breaks.push(theMax);

    return breaks;
}

var equal_interval_breaks = equalIntervalBreaks;

/* @flow */

/**
 * [Sample covariance](https://en.wikipedia.org/wiki/Sample_mean_and_sampleCovariance) of two datasets:
 * how much do the two datasets move together?
 * x and y are two datasets, represented as arrays of numbers.
 *
 * @param {Array<number>} x a sample of two or more data points
 * @param {Array<number>} y a sample of two or more data points
 * @throws {Error} if x and y do not have equal lengths
 * @throws {Error} if x or y have length of one or less
 * @returns {number} sample covariance
 * @example
 * sampleCovariance([1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1]); // => -3.5
 */
function sampleCovariance(x /*:Array<number>*/, y /*:Array<number>*/) /*:number*/{

    // The two datasets must have the same length which must be more than 1
    if (x.length !== y.length) {
        throw new Error('sampleCovariance requires samples with equal lengths');
    }

    if (x.length < 2) {
        throw new Error('sampleCovariance requires at least two data points in each sample');
    }

    // determine the mean of each dataset so that we can judge each
    // value of the dataset fairly as the difference from the mean. this
    // way, if one dataset is [1, 2, 3] and [2, 3, 4], their covariance
    // does not suffer because of the difference in absolute values
    var xmean = mean_1(x),
        ymean = mean_1(y),
        sum = 0;

    // for each pair of values, the covariance increases when their
    // difference from the mean is associated - if both are well above
    // or if both are well below
    // the mean, the covariance increases significantly.
    for (var i = 0; i < x.length; i++) {
        sum += (x[i] - xmean) * (y[i] - ymean);
    }

    // this is Bessels' Correction: an adjustment made to sample statistics
    // that allows for the reduced degree of freedom entailed in calculating
    // values from samples rather than complete populations.
    var besselsCorrection = x.length - 1;

    // the covariance is weighted by the length of the datasets.
    return sum / besselsCorrection;
}

var sample_covariance = sampleCovariance;

/* @flow */

/**
 * The [sample variance](https://en.wikipedia.org/wiki/Variance#Sample_variance)
 * is the sum of squared deviations from the mean. The sample variance
 * is distinguished from the variance by the usage of [Bessel's Correction](https://en.wikipedia.org/wiki/Bessel's_correction):
 * instead of dividing the sum of squared deviations by the length of the input,
 * it is divided by the length minus one. This corrects the bias in estimating
 * a value from a set that you don't know if full.
 *
 * References:
 * * [Wolfram MathWorld on Sample Variance](http://mathworld.wolfram.com/SampleVariance.html)
 *
 * @param {Array<number>} x a sample of two or more data points
 * @throws {Error} if the length of x is less than 2
 * @return {number} sample variance
 * @example
 * sampleVariance([1, 2, 3, 4, 5]); // => 2.5
 */
function sampleVariance(x /*: Array<number> */) /*:number*/{
    // The variance of no numbers is null
    if (x.length < 2) {
        throw new Error('sampleVariance requires at least two data points');
    }

    var sumSquaredDeviationsValue = sum_nth_power_deviations(x, 2);

    // this is Bessels' Correction: an adjustment made to sample statistics
    // that allows for the reduced degree of freedom entailed in calculating
    // values from samples rather than complete populations.
    var besselsCorrection = x.length - 1;

    // Find the mean value of that list
    return sumSquaredDeviationsValue / besselsCorrection;
}

var sample_variance = sampleVariance;

/* @flow */

/**
 * The [standard deviation](http://en.wikipedia.org/wiki/Standard_deviation)
 * is the square root of the variance.
 *
 * @param {Array<number>} x input array
 * @returns {number} sample standard deviation
 * @example
 * sampleStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9]).toFixed(2);
 * // => '2.14'
 */
function sampleStandardDeviation(x /*:Array<number>*/) /*:number*/{
  // The standard deviation of no numbers is null
  var sampleVarianceX = sample_variance(x);
  return Math.sqrt(sampleVarianceX);
}

var sample_standard_deviation = sampleStandardDeviation;

/* @flow */

/**
 * The [correlation](http://en.wikipedia.org/wiki/Correlation_and_dependence) is
 * a measure of how correlated two datasets are, between -1 and 1
 *
 * @param {Array<number>} x first input
 * @param {Array<number>} y second input
 * @returns {number} sample correlation
 * @example
 * sampleCorrelation([1, 2, 3, 4, 5, 6], [2, 2, 3, 4, 5, 60]).toFixed(2);
 * // => '0.69'
 */
function sampleCorrelation(x /*: Array<number> */, y /*: Array<number> */) /*:number*/{
    var cov = sample_covariance(x, y),
        xstd = sample_standard_deviation(x),
        ystd = sample_standard_deviation(y);

    return cov / xstd / ystd;
}

var sample_correlation = sampleCorrelation;

/* @flow */

/**
 * [Skewness](http://en.wikipedia.org/wiki/Skewness) is
 * a measure of the extent to which a probability distribution of a
 * real-valued random variable "leans" to one side of the mean.
 * The skewness value can be positive or negative, or even undefined.
 *
 * Implementation is based on the adjusted Fisher-Pearson standardized
 * moment coefficient, which is the version found in Excel and several
 * statistical packages including Minitab, SAS and SPSS.
 *
 * @since 4.1.0
 * @param {Array<number>} x a sample of 3 or more data points
 * @returns {number} sample skewness
 * @throws {Error} if x has length less than 3
 * @example
 * sampleSkewness([2, 4, 6, 3, 1]); // => 0.590128656384365
 */
function sampleSkewness(x /*: Array<number> */) /*:number*/{

    if (x.length < 3) {
        throw new Error('sampleSkewness requires at least three data points');
    }

    var meanValue = mean_1(x);
    var tempValue;
    var sumSquaredDeviations = 0;
    var sumCubedDeviations = 0;

    for (var i = 0; i < x.length; i++) {
        tempValue = x[i] - meanValue;
        sumSquaredDeviations += tempValue * tempValue;
        sumCubedDeviations += tempValue * tempValue * tempValue;
    }

    // this is Bessels' Correction: an adjustment made to sample statistics
    // that allows for the reduced degree of freedom entailed in calculating
    // values from samples rather than complete populations.
    var besselsCorrection = x.length - 1;

    // Find the mean value of that list
    var theSampleStandardDeviation = Math.sqrt(sumSquaredDeviations / besselsCorrection);

    var n = x.length,
        cubedS = Math.pow(theSampleStandardDeviation, 3);

    return n * sumCubedDeviations / ((n - 1) * (n - 2) * cubedS);
}

var sample_skewness = sampleSkewness;

/* @flow */

/**
 * [Kurtosis](http://en.wikipedia.org/wiki/Kurtosis) is
 * a measure of the heaviness of a distribution's tails relative to its
 * variance. The kurtosis value can be positive or negative, or even undefined.
 *
 * Implementation is based on Fisher's excess kurtosis definition and uses 
 * unbiased moment estimators. This is the version found in Excel and available 
 * in several statistical packages, including SAS and SciPy.
 *
 * @param {Array<number>} x a sample of 4 or more data points
 * @returns {number} sample kurtosis
 * @throws {Error} if x has length less than 4
 * @example
 * sampleKurtosis([1, 2, 2, 3, 5]); // => 1.4555765595463122
 */
function sampleKurtosis(x /*: Array<number> */) /*:number*/{

    var n = x.length;

    if (n < 4) {
        throw new Error('sampleKurtosis requires at least four data points');
    }

    var meanValue = mean_1(x);
    var tempValue;
    var secondCentralMoment = 0;
    var fourthCentralMoment = 0;

    for (var i = 0; i < n; i++) {
        tempValue = x[i] - meanValue;
        secondCentralMoment += tempValue * tempValue;
        fourthCentralMoment += tempValue * tempValue * tempValue * tempValue;
    }

    return (n - 1) / ((n - 2) * (n - 3)) * (n * (n + 1) * fourthCentralMoment / (secondCentralMoment * secondCentralMoment) - 3 * (n - 1));
}

var sample_kurtosis = sampleKurtosis;

/* @flow */

/**
 * Implementation of [Heap's Algorithm](https://en.wikipedia.org/wiki/Heap%27s_algorithm)
 * for generating permutations.
 *
 * @param {Array} elements any type of data
 * @returns {Array<Array>} array of permutations
 */

function permutationsHeap /*:: <T> */(elements /*: Array<T> */) /*: Array<Array<T>> */{
    var indexes = new Array(elements.length);
    var permutations = [elements.slice()];

    for (var i = 0; i < elements.length; i++) {
        indexes[i] = 0;
    }

    for (i = 0; i < elements.length;) {
        if (indexes[i] < i) {

            // At odd indexes, swap from indexes[i] instead
            // of from the beginning of the array
            var swapFrom = 0;
            if (i % 2 !== 0) {
                swapFrom = indexes[i];
            }

            // swap between swapFrom and i, using
            // a temporary variable as storage.
            var temp = elements[swapFrom];
            elements[swapFrom] = elements[i];
            elements[i] = temp;

            permutations.push(elements.slice());
            indexes[i]++;
            i = 0;
        } else {
            indexes[i] = 0;
            i++;
        }
    }

    return permutations;
}

var permutations_heap = permutationsHeap;

/* @flow */
/**
 * Implementation of Combinations
 * Combinations are unique subsets of a collection - in this case, k x from a collection at a time.
 * https://en.wikipedia.org/wiki/Combination
 * @param {Array} x any type of data
 * @param {int} k the number of objects in each group (without replacement)
 * @returns {Array<Array>} array of permutations
 * @example
 * combinations([1, 2, 3], 2); // => [[1,2], [1,3], [2,3]]
 */

function combinations(x /*: Array<any> */, k /*: number */) {
    var i;
    var subI;
    var combinationList = [];
    var subsetCombinations;
    var next;

    for (i = 0; i < x.length; i++) {
        if (k === 1) {
            combinationList.push([x[i]]);
        } else {
            subsetCombinations = combinations(x.slice(i + 1, x.length), k - 1);
            for (subI = 0; subI < subsetCombinations.length; subI++) {
                next = subsetCombinations[subI];
                next.unshift(x[i]);
                combinationList.push(next);
            }
        }
    }
    return combinationList;
}

var combinations_1 = combinations;

/* @flow */
/**
 * Implementation of [Combinations](https://en.wikipedia.org/wiki/Combination) with replacement
 * Combinations are unique subsets of a collection - in this case, k x from a collection at a time.
 * 'With replacement' means that a given element can be chosen multiple times.
 * Unlike permutation, order doesn't matter for combinations.
 * 
 * @param {Array} x any type of data
 * @param {int} k the number of objects in each group (without replacement)
 * @returns {Array<Array>} array of permutations
 * @example
 * combinationsReplacement([1, 2], 2); // => [[1, 1], [1, 2], [2, 2]]
 */

function combinationsReplacement(x /*: Array<any> */
, k /*: number */) {

    var combinationList = [];

    for (var i = 0; i < x.length; i++) {
        if (k === 1) {
            // If we're requested to find only one element, we don't need
            // to recurse: just push `x[i]` onto the list of combinations.
            combinationList.push([x[i]]);
        } else {
            // Otherwise, recursively find combinations, given `k - 1`. Note that
            // we request `k - 1`, so if you were looking for k=3 combinations, we're
            // requesting k=2. This -1 gets reversed in the for loop right after this
            // code, since we concatenate `x[i]` onto the selected combinations,
            // bringing `k` back up to your requested level.
            // This recursion may go many levels deep, since it only stops once
            // k=1.
            var subsetCombinations = combinationsReplacement(x.slice(i, x.length), k - 1);

            for (var j = 0; j < subsetCombinations.length; j++) {
                combinationList.push([x[i]].concat(subsetCombinations[j]));
            }
        }
    }

    return combinationList;
}

var combinations_replacement = combinationsReplacement;

/* @flow */

/**
 * When adding a new value to a list, one does not have to necessary
 * recompute the mean of the list in linear time. They can instead use
 * this function to compute the new mean by providing the current mean,
 * the number of elements in the list that produced it and the new
 * value to add.
 *
 * @since 2.5.0
 * @param {number} mean current mean
 * @param {number} n number of items in the list
 * @param {number} newValue the added value
 * @returns {number} the new mean
 *
 * @example
 * addToMean(14, 5, 53); // => 20.5
 */

function addToMean(mean /*: number*/, n /*: number */, newValue /*: number */) /*: number */{
  return mean + (newValue - mean) / (n + 1);
}

var add_to_mean = addToMean;

/* @flow */

/**
 * When combining two lists of values for which one already knows the means,
 * one does not have to necessary recompute the mean of the combined lists in
 * linear time. They can instead use this function to compute the combined
 * mean by providing the mean & number of values of the first list and the mean
 * & number of values of the second list.
 *
 * @since 3.0.0
 * @param {number} mean1 mean of the first list
 * @param {number} n1 number of items in the first list
 * @param {number} mean2 mean of the second list
 * @param {number} n2 number of items in the second list
 * @returns {number} the combined mean
 *
 * @example
 * combineMeans(5, 3, 4, 3); // => 4.5
 */

function combineMeans(mean1 /*: number*/, n1 /*: number */, mean2 /*: number*/, n2 /*: number */) /*: number */{
  return (mean1 * n1 + mean2 * n2) / (n1 + n2);
}

var combine_means = combineMeans;

/* @flow */

/**
 * When combining two lists of values for which one already knows the variances,
 * one does not have to necessary recompute the variance of the combined lists
 * in linear time. They can instead use this function to compute the combined
 * variance by providing the variance, mean & number of values of the first list
 * and the variance, mean & number of values of the second list.
 *
 * @since 3.0.0
 * @param {number} variance1 variance of the first list
 * @param {number} mean1 mean of the first list
 * @param {number} n1 number of items in the first list
 * @param {number} variance2 variance of the second list
 * @param {number} mean2 mean of the second list
 * @param {number} n2 number of items in the second list
 * @returns {number} the combined mean
 *
 * @example
 * combineVariances(14 / 3, 5, 3, 8 / 3, 4, 3); // => 47 / 12
 */
function combineVariances(variance1 /*: number*/
, mean1 /*: number*/
, n1 /*: number */
, variance2 /*: number*/
, mean2 /*: number*/
, n2 /*: number */) /*: number */{

  var newMean = combine_means(mean1, n1, mean2, n2);

  return (n1 * (variance1 + Math.pow(mean1 - newMean, 2)) + n2 * (variance2 + Math.pow(mean2 - newMean, 2))) / (n1 + n2);
}

var combine_variances = combineVariances;

/* @flow */

/**
 * The [Geometric Mean](https://en.wikipedia.org/wiki/Geometric_mean) is
 * a mean function that is more useful for numbers in different
 * ranges.
 *
 * This is the nth root of the input numbers multiplied by each other.
 *
 * The geometric mean is often useful for
 * **[proportional growth](https://en.wikipedia.org/wiki/Geometric_mean#Proportional_growth)**: given
 * growth rates for multiple years, like _80%, 16.66% and 42.85%_, a simple
 * mean will incorrectly estimate an average growth rate, whereas a geometric
 * mean will correctly estimate a growth rate that, over those years,
 * will yield the same end value.
 *
 * This runs on `O(n)`, linear time in respect to the array
 *
 * @param {Array<number>} x sample of one or more data points
 * @returns {number} geometric mean
 * @throws {Error} if x is empty
 * @throws {Error} if x contains a negative number
 * @example
 * var growthRates = [1.80, 1.166666, 1.428571];
 * var averageGrowth = geometricMean(growthRates);
 * var averageGrowthRates = [averageGrowth, averageGrowth, averageGrowth];
 * var startingValue = 10;
 * var startingValueMean = 10;
 * growthRates.forEach(function(rate) {
 *   startingValue *= rate;
 * });
 * averageGrowthRates.forEach(function(rate) {
 *   startingValueMean *= rate;
 * });
 * startingValueMean === startingValue;
 */

function geometricMean(x /*: Array<number> */) {
    // The mean of no numbers is null
    if (x.length === 0) {
        throw new Error('geometricMean requires at least one data point');
    }

    // the starting value.
    var value = 1;

    for (var i = 0; i < x.length; i++) {
        // the geometric mean is only valid for positive numbers
        if (x[i] <= 0) {
            throw new Error('geometricMean requires only positive numbers as input');
        }

        // repeatedly multiply the value by each number
        value *= x[i];
    }

    return Math.pow(value, 1 / x.length);
}

var geometric_mean = geometricMean;

/* @flow */

/**
 * The [Harmonic Mean](https://en.wikipedia.org/wiki/Harmonic_mean) is
 * a mean function typically used to find the average of rates.
 * This mean is calculated by taking the reciprocal of the arithmetic mean
 * of the reciprocals of the input numbers.
 *
 * This is a [measure of central tendency](https://en.wikipedia.org/wiki/Central_tendency):
 * a method of finding a typical or central value of a set of numbers.
 *
 * This runs on `O(n)`, linear time in respect to the array.
 *
 * @param {Array<number>} x sample of one or more data points
 * @returns {number} harmonic mean
 * @throws {Error} if x is empty
 * @throws {Error} if x contains a negative number
 * @example
 * harmonicMean([2, 3]).toFixed(2) // => '2.40'
 */

function harmonicMean(x /*: Array<number> */) {
    // The mean of no numbers is null
    if (x.length === 0) {
        throw new Error('harmonicMean requires at least one data point');
    }

    var reciprocalSum = 0;

    for (var i = 0; i < x.length; i++) {
        // the harmonic mean is only valid for positive numbers
        if (x[i] <= 0) {
            throw new Error('harmonicMean requires only positive numbers as input');
        }

        reciprocalSum += 1 / x[i];
    }

    // divide n by the the reciprocal sum
    return x.length / reciprocalSum;
}

var harmonic_mean = harmonicMean;

/* @flow */

/**
 * The [median](http://en.wikipedia.org/wiki/Median) is
 * the middle number of a list. This is often a good indicator of 'the middle'
 * when there are outliers that skew the `mean()` value.
 * This is a [measure of central tendency](https://en.wikipedia.org/wiki/Central_tendency):
 * a method of finding a typical or central value of a set of numbers.
 *
 * The median isn't necessarily one of the elements in the list: the value
 * can be the average of two elements if the list has an even length
 * and the two central values are different.
 *
 * @param {Array<number>} sorted input
 * @returns {number} median value
 * @example
 * medianSorted([10, 2, 5, 100, 2, 1]); // => 52.5
 */
function medianSorted(sorted /*: Array<number> */) /*:number*/{
  return quantile_sorted(sorted, 0.5);
}

var median_sorted = medianSorted;

/* @flow */

/**
 * When removing a value from a list, one does not have to necessary
 * recompute the mean of the list in linear time. They can instead use
 * this function to compute the new mean by providing the current mean,
 * the number of elements in the list that produced it and the value to remove.
 *
 * @since 3.0.0
 * @param {number} mean current mean
 * @param {number} n number of items in the list
 * @param {number} value the value to remove
 * @returns {number} the new mean
 *
 * @example
 * subtractFromMean(20.5, 6, 53); // => 14
 */

function subtractFromMean(mean /*: number*/, n /*: number */, value /*: number */) /*: number */{
  return (mean * n - value) / (n - 1);
}

var subtract_from_mean = subtractFromMean;

/* @flow */

/**
 * The Root Mean Square (RMS) is
 * a mean function used as a measure of the magnitude of a set
 * of numbers, regardless of their sign.
 * This is the square root of the mean of the squares of the
 * input numbers.
 * This runs on `O(n)`, linear time in respect to the array
 *
 * @param {Array<number>} x a sample of one or more data points
 * @returns {number} root mean square
 * @throws {Error} if x is empty
 * @example
 * rootMeanSquare([-1, 1, -1, 1]); // => 1
 */

function rootMeanSquare(x /*: Array<number> */) /*:number*/{
    if (x.length === 0) {
        throw new Error('rootMeanSquare requires at least one data point');
    }

    var sumOfSquares = 0;
    for (var i = 0; i < x.length; i++) {
        sumOfSquares += Math.pow(x[i], 2);
    }

    return Math.sqrt(sumOfSquares / x.length);
}

var root_mean_square = rootMeanSquare;

/* @flow */

/**
 * This is to compute [a one-sample t-test](https://en.wikipedia.org/wiki/Student%27s_t-test#One-sample_t-test), comparing the mean
 * of a sample to a known value, x.
 *
 * in this case, we're trying to determine whether the
 * population mean is equal to the value that we know, which is `x`
 * here. usually the results here are used to look up a
 * [p-value](http://en.wikipedia.org/wiki/P-value), which, for
 * a certain level of significance, will let you determine that the
 * null hypothesis can or cannot be rejected.
 *
 * @param {Array<number>} x sample of one or more numbers
 * @param {number} expectedValue expected value of the population mean
 * @returns {number} value
 * @example
 * tTest([1, 2, 3, 4, 5, 6], 3.385).toFixed(2); // => '0.16'
 */
function tTest(x /*: Array<number> */, expectedValue /*: number */) /*:number*/{
  // The mean of the sample
  var sampleMean = mean_1(x);

  // The standard deviation of the sample
  var sd = standard_deviation(x);

  // Square root the length of the sample
  var rootN = Math.sqrt(x.length);

  // returning the t value
  return (sampleMean - expectedValue) / (sd / rootN);
}

var t_test = tTest;

/* @flow */

/**
 * This is to compute [two sample t-test](http://en.wikipedia.org/wiki/Student's_t-test).
 * Tests whether "mean(X)-mean(Y) = difference", (
 * in the most common case, we often have `difference == 0` to test if two samples
 * are likely to be taken from populations with the same mean value) with
 * no prior knowledge on standard deviations of both samples
 * other than the fact that they have the same standard deviation.
 *
 * Usually the results here are used to look up a
 * [p-value](http://en.wikipedia.org/wiki/P-value), which, for
 * a certain level of significance, will let you determine that the
 * null hypothesis can or cannot be rejected.
 *
 * `diff` can be omitted if it equals 0.
 *
 * [This is used to confirm or deny](http://www.monarchlab.org/Lab/Research/Stats/2SampleT.aspx)
 * a null hypothesis that the two populations that have been sampled into
 * `sampleX` and `sampleY` are equal to each other.
 *
 * @param {Array<number>} sampleX a sample as an array of numbers
 * @param {Array<number>} sampleY a sample as an array of numbers
 * @param {number} [difference=0]
 * @returns {number} test result
 * @example
 * ss.tTestTwoSample([1, 2, 3, 4], [3, 4, 5, 6], 0); //= -2.1908902300206643
 */
function tTestTwoSample(sampleX /*: Array<number> */
, sampleY /*: Array<number> */
, difference /*: number */) {
    var n = sampleX.length,
        m = sampleY.length;

    // If either sample doesn't actually have any values, we can't
    // compute this at all, so we return `null`.
    if (!n || !m) {
        return null;
    }

    // default difference (mu) is zero
    if (!difference) {
        difference = 0;
    }

    var meanX = mean_1(sampleX),
        meanY = mean_1(sampleY),
        sampleVarianceX = sample_variance(sampleX),
        sampleVarianceY = sample_variance(sampleY);

    if (typeof meanX === 'number' && typeof meanY === 'number' && typeof sampleVarianceX === 'number' && typeof sampleVarianceY === 'number') {
        var weightedVariance = ((n - 1) * sampleVarianceX + (m - 1) * sampleVarianceY) / (n + m - 2);

        return (meanX - meanY - difference) / Math.sqrt(weightedVariance * (1 / n + 1 / m));
    }
}

var t_test_two_sample = tTestTwoSample;

/* @flow */

/**
 * [Bayesian Classifier](http://en.wikipedia.org/wiki/Naive_Bayes_classifier)
 *
 * This is a naïve bayesian classifier that takes
 * singly-nested objects.
 *
 * @class
 * @example
 * var bayes = new BayesianClassifier();
 * bayes.train({
 *   species: 'Cat'
 * }, 'animal');
 * var result = bayes.score({
 *   species: 'Cat'
 * })
 * // result
 * // {
 * //   animal: 1
 * // }
 */

function BayesianClassifier() {
    // The number of items that are currently
    // classified in the model
    this.totalCount = 0;
    // Every item classified in the model
    this.data = {};
}

/**
 * Train the classifier with a new item, which has a single
 * dimension of Javascript literal keys and values.
 *
 * @param {Object} item an object with singly-deep properties
 * @param {string} category the category this item belongs to
 * @return {undefined} adds the item to the classifier
 */
BayesianClassifier.prototype.train = function (item, category) {
    // If the data object doesn't have any values
    // for this category, create a new object for it.
    if (!this.data[category]) {
        this.data[category] = {};
    }

    // Iterate through each key in the item.
    for (var k in item) {
        var v = item[k];
        // Initialize the nested object `data[category][k][item[k]]`
        // with an object of keys that equal 0.
        if (this.data[category][k] === undefined) {
            this.data[category][k] = {};
        }
        if (this.data[category][k][v] === undefined) {
            this.data[category][k][v] = 0;
        }

        // And increment the key for this key/value combination.
        this.data[category][k][v]++;
    }

    // Increment the number of items classified
    this.totalCount++;
};

/**
 * Generate a score of how well this item matches all
 * possible categories based on its attributes
 *
 * @param {Object} item an item in the same format as with train
 * @returns {Object} of probabilities that this item belongs to a
 * given category.
 */
BayesianClassifier.prototype.score = function (item) {
    // Initialize an empty array of odds per category.
    var odds = {},
        category;
    // Iterate through each key in the item,
    // then iterate through each category that has been used
    // in previous calls to `.train()`
    for (var k in item) {
        var v = item[k];
        for (category in this.data) {
            // Create an empty object for storing key - value combinations
            // for this category.
            odds[category] = {};

            // If this item doesn't even have a property, it counts for nothing,
            // but if it does have the property that we're looking for from
            // the item to categorize, it counts based on how popular it is
            // versus the whole population.
            if (this.data[category][k]) {
                odds[category][k + '_' + v] = (this.data[category][k][v] || 0) / this.totalCount;
            } else {
                odds[category][k + '_' + v] = 0;
            }
        }
    }

    // Set up a new object that will contain sums of these odds by category
    var oddsSums = {};

    for (category in odds) {
        // Tally all of the odds for each category-combination pair -
        // the non-existence of a category does not add anything to the
        // score.
        oddsSums[category] = 0;
        for (var combination in odds[category]) {
            oddsSums[category] += odds[category][combination];
        }
    }

    return oddsSums;
};

var bayesian_classifier = BayesianClassifier;

/* @flow */

/**
 * This is a single-layer [Perceptron Classifier](http://en.wikipedia.org/wiki/Perceptron) that takes
 * arrays of numbers and predicts whether they should be classified
 * as either 0 or 1 (negative or positive examples).
 * @class
 * @example
 * // Create the model
 * var p = new PerceptronModel();
 * // Train the model with input with a diagonal boundary.
 * for (var i = 0; i < 5; i++) {
 *     p.train([1, 1], 1);
 *     p.train([0, 1], 0);
 *     p.train([1, 0], 0);
 *     p.train([0, 0], 0);
 * }
 * p.predict([0, 0]); // 0
 * p.predict([0, 1]); // 0
 * p.predict([1, 0]); // 0
 * p.predict([1, 1]); // 1
 */

function PerceptronModel() {
    // The weights, or coefficients of the model;
    // weights are only populated when training with data.
    this.weights = [];
    // The bias term, or intercept; it is also a weight but
    // it's stored separately for convenience as it is always
    // multiplied by one.
    this.bias = 0;
}

/**
 * **Predict**: Use an array of features with the weight array and bias
 * to predict whether an example is labeled 0 or 1.
 *
 * @param {Array<number>} features an array of features as numbers
 * @returns {number} 1 if the score is over 0, otherwise 0
 */
PerceptronModel.prototype.predict = function (features) {

    // Only predict if previously trained
    // on the same size feature array(s).
    if (features.length !== this.weights.length) {
        return null;
    }

    // Calculate the sum of features times weights,
    // with the bias added (implicitly times one).
    var score = 0;
    for (var i = 0; i < this.weights.length; i++) {
        score += this.weights[i] * features[i];
    }
    score += this.bias;

    // Classify as 1 if the score is over 0, otherwise 0.
    if (score > 0) {
        return 1;
    } else {
        return 0;
    }
};

/**
 * **Train** the classifier with a new example, which is
 * a numeric array of features and a 0 or 1 label.
 *
 * @param {Array<number>} features an array of features as numbers
 * @param {number} label either 0 or 1
 * @returns {PerceptronModel} this
 */
PerceptronModel.prototype.train = function (features, label) {
    // Require that only labels of 0 or 1 are considered.
    if (label !== 0 && label !== 1) {
        return null;
    }
    // The length of the feature array determines
    // the length of the weight array.
    // The perceptron will continue learning as long as
    // it keeps seeing feature arrays of the same length.
    // When it sees a new data shape, it initializes.
    if (features.length !== this.weights.length) {
        this.weights = features;
        this.bias = 1;
    }
    // Make a prediction based on current weights.
    var prediction = this.predict(features);
    // Update the weights if the prediction is wrong.
    if (prediction !== label) {
        var gradient = label - prediction;
        for (var i = 0; i < this.weights.length; i++) {
            this.weights[i] += gradient * features[i];
        }
        this.bias += gradient;
    }
    return this;
};

var perceptron = PerceptronModel;

/* @flow */

/**
 * We use `ε`, epsilon, as a stopping criterion when we want to iterate
 * until we're "close enough". Epsilon is a very small number: for
 * simple statistics, that number is **0.0001**
 *
 * This is used in calculations like the binomialDistribution, in which
 * the process of finding a value is [iterative](https://en.wikipedia.org/wiki/Iterative_method):
 * it progresses until it is close enough.
 *
 * Below is an example of using epsilon in [gradient descent](https://en.wikipedia.org/wiki/Gradient_descent),
 * where we're trying to find a local minimum of a function's derivative,
 * given by the `fDerivative` method.
 *
 * @example
 * // From calculation, we expect that the local minimum occurs at x=9/4
 * var x_old = 0;
 * // The algorithm starts at x=6
 * var x_new = 6;
 * var stepSize = 0.01;
 *
 * function fDerivative(x) {
 *   return 4 * Math.pow(x, 3) - 9 * Math.pow(x, 2);
 * }
 *
 * // The loop runs until the difference between the previous
 * // value and the current value is smaller than epsilon - a rough
 * // meaure of 'close enough'
 * while (Math.abs(x_new - x_old) > ss.epsilon) {
 *   x_old = x_new;
 *   x_new = x_old - stepSize * fDerivative(x_old);
 * }
 *
 * console.log('Local minimum occurs at', x_new);
 */

var epsilon = 0.0001;

var epsilon_1 = epsilon;

/* @flow */

/**
 * A [Factorial](https://en.wikipedia.org/wiki/Factorial), usually written n!, is the product of all positive
 * integers less than or equal to n. Often factorial is implemented
 * recursively, but this iterative approach is significantly faster
 * and simpler.
 *
 * @param {number} n input, must be an integer number 1 or greater
 * @returns {number} factorial: n!
 * @throws {Error} if n is less than 0 or not an integer
 * @example
 * factorial(5); // => 120
 */

function factorial(n /*: number */) /*: number */{

    // factorial is mathematically undefined for negative numbers
    if (n < 0) {
        throw new Error('factorial requires a non-negative value');
    }

    if (Math.floor(n) !== n) {
        throw new Error('factorial requires an integer input');
    }

    // typically you'll expand the factorial function going down, like
    // 5! = 5 * 4 * 3 * 2 * 1. This is going in the opposite direction,
    // counting from 2 up to the number in question, and since anything
    // multiplied by 1 is itself, the loop only needs to start at 2.
    var accumulator = 1;
    for (var i = 2; i <= n; i++) {
        // for each number up to and including the number `n`, multiply
        // the accumulator my that number.
        accumulator *= i;
    }
    return accumulator;
}

var factorial_1 = factorial;

/* @flow */

/**
 * The [Bernoulli distribution](http://en.wikipedia.org/wiki/Bernoulli_distribution)
 * is the probability discrete
 * distribution of a random variable which takes value 1 with success
 * probability `p` and value 0 with failure
 * probability `q` = 1 - `p`. It can be used, for example, to represent the
 * toss of a coin, where "1" is defined to mean "heads" and "0" is defined
 * to mean "tails" (or vice versa). It is
 * a special case of a Binomial Distribution
 * where `n` = 1.
 *
 * @param {number} p input value, between 0 and 1 inclusive
 * @returns {number[]} values of bernoulli distribution at this point
 * @throws {Error} if p is outside 0 and 1
 * @example
 * bernoulliDistribution(0.3); // => [0.7, 0.3]
 */

function bernoulliDistribution(p /*: number */) /*: number[] */{
    // Check that `p` is a valid probability (0 ≤ p ≤ 1)
    if (p < 0 || p > 1) {
        throw new Error('bernoulliDistribution requires probability to be between 0 and 1 inclusive');
    }

    return [1 - p, p];
}

var bernoulli_distribution = bernoulliDistribution;

/* @flow */

/**
 * The [Binomial Distribution](http://en.wikipedia.org/wiki/Binomial_distribution) is the discrete probability
 * distribution of the number of successes in a sequence of n independent yes/no experiments, each of which yields
 * success with probability `probability`. Such a success/failure experiment is also called a Bernoulli experiment or
 * Bernoulli trial; when trials = 1, the Binomial Distribution is a Bernoulli Distribution.
 *
 * @param {number} trials number of trials to simulate
 * @param {number} probability
 * @returns {number[]} output
 */
function binomialDistribution(trials /*: number */
, probability /*: number */) /*: ?number[] */{
    // Check that `p` is a valid probability (0 ≤ p ≤ 1),
    // that `n` is an integer, strictly positive.
    if (probability < 0 || probability > 1 || trials <= 0 || trials % 1 !== 0) {
        return undefined;
    }

    // We initialize `x`, the random variable, and `accumulator`, an accumulator
    // for the cumulative distribution function to 0. `distribution_functions`
    // is the object we'll return with the `probability_of_x` and the
    // `cumulativeProbability_of_x`, as well as the calculated mean &
    // variance. We iterate until the `cumulativeProbability_of_x` is
    // within `epsilon` of 1.0.
    var x = 0,
        cumulativeProbability = 0,
        cells = [],
        binomialCoefficient = 1;

    // This algorithm iterates through each potential outcome,
    // until the `cumulativeProbability` is very close to 1, at
    // which point we've defined the vast majority of outcomes
    do {
        // a [probability mass function](https://en.wikipedia.org/wiki/Probability_mass_function)
        cells[x] = binomialCoefficient * Math.pow(probability, x) * Math.pow(1 - probability, trials - x);
        cumulativeProbability += cells[x];
        x++;
        binomialCoefficient = binomialCoefficient * (trials - x + 1) / x;
        // when the cumulativeProbability is nearly 1, we've calculated
        // the useful range of this distribution
    } while (cumulativeProbability < 1 - epsilon_1);

    return cells;
}

var binomial_distribution = binomialDistribution;

/* @flow */

/**
 * The [Poisson Distribution](http://en.wikipedia.org/wiki/Poisson_distribution)
 * is a discrete probability distribution that expresses the probability
 * of a given number of events occurring in a fixed interval of time
 * and/or space if these events occur with a known average rate and
 * independently of the time since the last event.
 *
 * The Poisson Distribution is characterized by the strictly positive
 * mean arrival or occurrence rate, `λ`.
 *
 * @param {number} lambda location poisson distribution
 * @returns {number[]} values of poisson distribution at that point
 */
function poissonDistribution(lambda /*: number */) /*: ?number[] */{
    // Check that lambda is strictly positive
    if (lambda <= 0) {
        return undefined;
    }

    // our current place in the distribution
    var x = 0,

    // and we keep track of the current cumulative probability, in
    // order to know when to stop calculating chances.
    cumulativeProbability = 0,

    // the calculated cells to be returned
    cells = [],
        factorialX = 1;

    // This algorithm iterates through each potential outcome,
    // until the `cumulativeProbability` is very close to 1, at
    // which point we've defined the vast majority of outcomes
    do {
        // a [probability mass function](https://en.wikipedia.org/wiki/Probability_mass_function)
        cells[x] = Math.exp(-lambda) * Math.pow(lambda, x) / factorialX;
        cumulativeProbability += cells[x];
        x++;
        factorialX *= x;
        // when the cumulativeProbability is nearly 1, we've calculated
        // the useful range of this distribution
    } while (cumulativeProbability < 1 - epsilon_1);

    return cells;
}

var poisson_distribution = poissonDistribution;

/* @flow */

/**
 * **Percentage Points of the χ2 (Chi-Squared) Distribution**
 *
 * The [χ2 (Chi-Squared) Distribution](http://en.wikipedia.org/wiki/Chi-squared_distribution) is used in the common
 * chi-squared tests for goodness of fit of an observed distribution to a theoretical one, the independence of two
 * criteria of classification of qualitative data, and in confidence interval estimation for a population standard
 * deviation of a normal distribution from a sample standard deviation.
 *
 * Values from Appendix 1, Table III of William W. Hines & Douglas C. Montgomery, "Probability and Statistics in
 * Engineering and Management Science", Wiley (1980).
 */

var chiSquaredDistributionTable = {
    '1': {
        '0.995': 0,
        '0.99': 0,
        '0.975': 0,
        '0.95': 0,
        '0.9': 0.02,
        '0.5': 0.45,
        '0.1': 2.71,
        '0.05': 3.84,
        '0.025': 5.02,
        '0.01': 6.63,
        '0.005': 7.88
    },
    '2': {
        '0.995': 0.01,
        '0.99': 0.02,
        '0.975': 0.05,
        '0.95': 0.1,
        '0.9': 0.21,
        '0.5': 1.39,
        '0.1': 4.61,
        '0.05': 5.99,
        '0.025': 7.38,
        '0.01': 9.21,
        '0.005': 10.6
    },
    '3': {
        '0.995': 0.07,
        '0.99': 0.11,
        '0.975': 0.22,
        '0.95': 0.35,
        '0.9': 0.58,
        '0.5': 2.37,
        '0.1': 6.25,
        '0.05': 7.81,
        '0.025': 9.35,
        '0.01': 11.34,
        '0.005': 12.84
    },
    '4': {
        '0.995': 0.21,
        '0.99': 0.3,
        '0.975': 0.48,
        '0.95': 0.71,
        '0.9': 1.06,
        '0.5': 3.36,
        '0.1': 7.78,
        '0.05': 9.49,
        '0.025': 11.14,
        '0.01': 13.28,
        '0.005': 14.86
    },
    '5': {
        '0.995': 0.41,
        '0.99': 0.55,
        '0.975': 0.83,
        '0.95': 1.15,
        '0.9': 1.61,
        '0.5': 4.35,
        '0.1': 9.24,
        '0.05': 11.07,
        '0.025': 12.83,
        '0.01': 15.09,
        '0.005': 16.75
    },
    '6': {
        '0.995': 0.68,
        '0.99': 0.87,
        '0.975': 1.24,
        '0.95': 1.64,
        '0.9': 2.2,
        '0.5': 5.35,
        '0.1': 10.65,
        '0.05': 12.59,
        '0.025': 14.45,
        '0.01': 16.81,
        '0.005': 18.55
    },
    '7': {
        '0.995': 0.99,
        '0.99': 1.25,
        '0.975': 1.69,
        '0.95': 2.17,
        '0.9': 2.83,
        '0.5': 6.35,
        '0.1': 12.02,
        '0.05': 14.07,
        '0.025': 16.01,
        '0.01': 18.48,
        '0.005': 20.28
    },
    '8': {
        '0.995': 1.34,
        '0.99': 1.65,
        '0.975': 2.18,
        '0.95': 2.73,
        '0.9': 3.49,
        '0.5': 7.34,
        '0.1': 13.36,
        '0.05': 15.51,
        '0.025': 17.53,
        '0.01': 20.09,
        '0.005': 21.96
    },
    '9': {
        '0.995': 1.73,
        '0.99': 2.09,
        '0.975': 2.7,
        '0.95': 3.33,
        '0.9': 4.17,
        '0.5': 8.34,
        '0.1': 14.68,
        '0.05': 16.92,
        '0.025': 19.02,
        '0.01': 21.67,
        '0.005': 23.59
    },
    '10': {
        '0.995': 2.16,
        '0.99': 2.56,
        '0.975': 3.25,
        '0.95': 3.94,
        '0.9': 4.87,
        '0.5': 9.34,
        '0.1': 15.99,
        '0.05': 18.31,
        '0.025': 20.48,
        '0.01': 23.21,
        '0.005': 25.19
    },
    '11': {
        '0.995': 2.6,
        '0.99': 3.05,
        '0.975': 3.82,
        '0.95': 4.57,
        '0.9': 5.58,
        '0.5': 10.34,
        '0.1': 17.28,
        '0.05': 19.68,
        '0.025': 21.92,
        '0.01': 24.72,
        '0.005': 26.76
    },
    '12': {
        '0.995': 3.07,
        '0.99': 3.57,
        '0.975': 4.4,
        '0.95': 5.23,
        '0.9': 6.3,
        '0.5': 11.34,
        '0.1': 18.55,
        '0.05': 21.03,
        '0.025': 23.34,
        '0.01': 26.22,
        '0.005': 28.3
    },
    '13': {
        '0.995': 3.57,
        '0.99': 4.11,
        '0.975': 5.01,
        '0.95': 5.89,
        '0.9': 7.04,
        '0.5': 12.34,
        '0.1': 19.81,
        '0.05': 22.36,
        '0.025': 24.74,
        '0.01': 27.69,
        '0.005': 29.82
    },
    '14': {
        '0.995': 4.07,
        '0.99': 4.66,
        '0.975': 5.63,
        '0.95': 6.57,
        '0.9': 7.79,
        '0.5': 13.34,
        '0.1': 21.06,
        '0.05': 23.68,
        '0.025': 26.12,
        '0.01': 29.14,
        '0.005': 31.32
    },
    '15': {
        '0.995': 4.6,
        '0.99': 5.23,
        '0.975': 6.27,
        '0.95': 7.26,
        '0.9': 8.55,
        '0.5': 14.34,
        '0.1': 22.31,
        '0.05': 25,
        '0.025': 27.49,
        '0.01': 30.58,
        '0.005': 32.8
    },
    '16': {
        '0.995': 5.14,
        '0.99': 5.81,
        '0.975': 6.91,
        '0.95': 7.96,
        '0.9': 9.31,
        '0.5': 15.34,
        '0.1': 23.54,
        '0.05': 26.3,
        '0.025': 28.85,
        '0.01': 32,
        '0.005': 34.27
    },
    '17': {
        '0.995': 5.7,
        '0.99': 6.41,
        '0.975': 7.56,
        '0.95': 8.67,
        '0.9': 10.09,
        '0.5': 16.34,
        '0.1': 24.77,
        '0.05': 27.59,
        '0.025': 30.19,
        '0.01': 33.41,
        '0.005': 35.72
    },
    '18': {
        '0.995': 6.26,
        '0.99': 7.01,
        '0.975': 8.23,
        '0.95': 9.39,
        '0.9': 10.87,
        '0.5': 17.34,
        '0.1': 25.99,
        '0.05': 28.87,
        '0.025': 31.53,
        '0.01': 34.81,
        '0.005': 37.16
    },
    '19': {
        '0.995': 6.84,
        '0.99': 7.63,
        '0.975': 8.91,
        '0.95': 10.12,
        '0.9': 11.65,
        '0.5': 18.34,
        '0.1': 27.2,
        '0.05': 30.14,
        '0.025': 32.85,
        '0.01': 36.19,
        '0.005': 38.58
    },
    '20': {
        '0.995': 7.43,
        '0.99': 8.26,
        '0.975': 9.59,
        '0.95': 10.85,
        '0.9': 12.44,
        '0.5': 19.34,
        '0.1': 28.41,
        '0.05': 31.41,
        '0.025': 34.17,
        '0.01': 37.57,
        '0.005': 40
    },
    '21': {
        '0.995': 8.03,
        '0.99': 8.9,
        '0.975': 10.28,
        '0.95': 11.59,
        '0.9': 13.24,
        '0.5': 20.34,
        '0.1': 29.62,
        '0.05': 32.67,
        '0.025': 35.48,
        '0.01': 38.93,
        '0.005': 41.4
    },
    '22': {
        '0.995': 8.64,
        '0.99': 9.54,
        '0.975': 10.98,
        '0.95': 12.34,
        '0.9': 14.04,
        '0.5': 21.34,
        '0.1': 30.81,
        '0.05': 33.92,
        '0.025': 36.78,
        '0.01': 40.29,
        '0.005': 42.8
    },
    '23': {
        '0.995': 9.26,
        '0.99': 10.2,
        '0.975': 11.69,
        '0.95': 13.09,
        '0.9': 14.85,
        '0.5': 22.34,
        '0.1': 32.01,
        '0.05': 35.17,
        '0.025': 38.08,
        '0.01': 41.64,
        '0.005': 44.18
    },
    '24': {
        '0.995': 9.89,
        '0.99': 10.86,
        '0.975': 12.4,
        '0.95': 13.85,
        '0.9': 15.66,
        '0.5': 23.34,
        '0.1': 33.2,
        '0.05': 36.42,
        '0.025': 39.36,
        '0.01': 42.98,
        '0.005': 45.56
    },
    '25': {
        '0.995': 10.52,
        '0.99': 11.52,
        '0.975': 13.12,
        '0.95': 14.61,
        '0.9': 16.47,
        '0.5': 24.34,
        '0.1': 34.28,
        '0.05': 37.65,
        '0.025': 40.65,
        '0.01': 44.31,
        '0.005': 46.93
    },
    '26': {
        '0.995': 11.16,
        '0.99': 12.2,
        '0.975': 13.84,
        '0.95': 15.38,
        '0.9': 17.29,
        '0.5': 25.34,
        '0.1': 35.56,
        '0.05': 38.89,
        '0.025': 41.92,
        '0.01': 45.64,
        '0.005': 48.29
    },
    '27': {
        '0.995': 11.81,
        '0.99': 12.88,
        '0.975': 14.57,
        '0.95': 16.15,
        '0.9': 18.11,
        '0.5': 26.34,
        '0.1': 36.74,
        '0.05': 40.11,
        '0.025': 43.19,
        '0.01': 46.96,
        '0.005': 49.65
    },
    '28': {
        '0.995': 12.46,
        '0.99': 13.57,
        '0.975': 15.31,
        '0.95': 16.93,
        '0.9': 18.94,
        '0.5': 27.34,
        '0.1': 37.92,
        '0.05': 41.34,
        '0.025': 44.46,
        '0.01': 48.28,
        '0.005': 50.99
    },
    '29': {
        '0.995': 13.12,
        '0.99': 14.26,
        '0.975': 16.05,
        '0.95': 17.71,
        '0.9': 19.77,
        '0.5': 28.34,
        '0.1': 39.09,
        '0.05': 42.56,
        '0.025': 45.72,
        '0.01': 49.59,
        '0.005': 52.34
    },
    '30': {
        '0.995': 13.79,
        '0.99': 14.95,
        '0.975': 16.79,
        '0.95': 18.49,
        '0.9': 20.6,
        '0.5': 29.34,
        '0.1': 40.26,
        '0.05': 43.77,
        '0.025': 46.98,
        '0.01': 50.89,
        '0.005': 53.67
    },
    '40': {
        '0.995': 20.71,
        '0.99': 22.16,
        '0.975': 24.43,
        '0.95': 26.51,
        '0.9': 29.05,
        '0.5': 39.34,
        '0.1': 51.81,
        '0.05': 55.76,
        '0.025': 59.34,
        '0.01': 63.69,
        '0.005': 66.77
    },
    '50': {
        '0.995': 27.99,
        '0.99': 29.71,
        '0.975': 32.36,
        '0.95': 34.76,
        '0.9': 37.69,
        '0.5': 49.33,
        '0.1': 63.17,
        '0.05': 67.5,
        '0.025': 71.42,
        '0.01': 76.15,
        '0.005': 79.49
    },
    '60': {
        '0.995': 35.53,
        '0.99': 37.48,
        '0.975': 40.48,
        '0.95': 43.19,
        '0.9': 46.46,
        '0.5': 59.33,
        '0.1': 74.4,
        '0.05': 79.08,
        '0.025': 83.3,
        '0.01': 88.38,
        '0.005': 91.95
    },
    '70': {
        '0.995': 43.28,
        '0.99': 45.44,
        '0.975': 48.76,
        '0.95': 51.74,
        '0.9': 55.33,
        '0.5': 69.33,
        '0.1': 85.53,
        '0.05': 90.53,
        '0.025': 95.02,
        '0.01': 100.42,
        '0.005': 104.22
    },
    '80': {
        '0.995': 51.17,
        '0.99': 53.54,
        '0.975': 57.15,
        '0.95': 60.39,
        '0.9': 64.28,
        '0.5': 79.33,
        '0.1': 96.58,
        '0.05': 101.88,
        '0.025': 106.63,
        '0.01': 112.33,
        '0.005': 116.32
    },
    '90': {
        '0.995': 59.2,
        '0.99': 61.75,
        '0.975': 65.65,
        '0.95': 69.13,
        '0.9': 73.29,
        '0.5': 89.33,
        '0.1': 107.57,
        '0.05': 113.14,
        '0.025': 118.14,
        '0.01': 124.12,
        '0.005': 128.3
    },
    '100': {
        '0.995': 67.33,
        '0.99': 70.06,
        '0.975': 74.22,
        '0.95': 77.93,
        '0.9': 82.36,
        '0.5': 99.33,
        '0.1': 118.5,
        '0.05': 124.34,
        '0.025': 129.56,
        '0.01': 135.81,
        '0.005': 140.17
    }
};

var chi_squared_distribution_table = chiSquaredDistributionTable;

/* @flow */

/**
 * The [χ2 (Chi-Squared) Goodness-of-Fit Test](http://en.wikipedia.org/wiki/Goodness_of_fit#Pearson.27s_chi-squared_test)
 * uses a measure of goodness of fit which is the sum of differences between observed and expected outcome frequencies
 * (that is, counts of observations), each squared and divided by the number of observations expected given the
 * hypothesized distribution. The resulting χ2 statistic, `chiSquared`, can be compared to the chi-squared distribution
 * to determine the goodness of fit. In order to determine the degrees of freedom of the chi-squared distribution, one
 * takes the total number of observed frequencies and subtracts the number of estimated parameters. The test statistic
 * follows, approximately, a chi-square distribution with (k − c) degrees of freedom where `k` is the number of non-empty
 * cells and `c` is the number of estimated parameters for the distribution.
 *
 * @param {Array<number>} data
 * @param {Function} distributionType a function that returns a point in a distribution:
 * for instance, binomial, bernoulli, or poisson
 * @param {number} significance
 * @returns {number} chi squared goodness of fit
 * @example
 * // Data from Poisson goodness-of-fit example 10-19 in William W. Hines & Douglas C. Montgomery,
 * // "Probability and Statistics in Engineering and Management Science", Wiley (1980).
 * var data1019 = [
 *     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 *     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 *     1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
 *     2, 2, 2, 2, 2, 2, 2, 2, 2,
 *     3, 3, 3, 3
 * ];
 * ss.chiSquaredGoodnessOfFit(data1019, ss.poissonDistribution, 0.05)); //= false
 */
function chiSquaredGoodnessOfFit(data /*: Array<number> */
, distributionType /*: Function */
, significance /*: number */) /*: boolean */{
    // Estimate from the sample data, a weighted mean.
    var inputMean = mean_1(data),

    // Calculated value of the χ2 statistic.
    chiSquared = 0,

    // Degrees of freedom, calculated as (number of class intervals -
    // number of hypothesized distribution parameters estimated - 1)
    degreesOfFreedom,

    // Number of hypothesized distribution parameters estimated, expected to be supplied in the distribution test.
    // Lose one degree of freedom for estimating `lambda` from the sample data.
    c = 1,

    // The hypothesized distribution.
    // Generate the hypothesized distribution.
    hypothesizedDistribution = distributionType(inputMean),
        observedFrequencies = [],
        expectedFrequencies = [],
        k;

    // Create an array holding a histogram from the sample data, of
    // the form `{ value: numberOfOcurrences }`
    for (var i = 0; i < data.length; i++) {
        if (observedFrequencies[data[i]] === undefined) {
            observedFrequencies[data[i]] = 0;
        }
        observedFrequencies[data[i]]++;
    }

    // The histogram we created might be sparse - there might be gaps
    // between values. So we iterate through the histogram, making
    // sure that instead of undefined, gaps have 0 values.
    for (i = 0; i < observedFrequencies.length; i++) {
        if (observedFrequencies[i] === undefined) {
            observedFrequencies[i] = 0;
        }
    }

    // Create an array holding a histogram of expected data given the
    // sample size and hypothesized distribution.
    for (k in hypothesizedDistribution) {
        if (k in observedFrequencies) {
            expectedFrequencies[+k] = hypothesizedDistribution[k] * data.length;
        }
    }

    // Working backward through the expected frequencies, collapse classes
    // if less than three observations are expected for a class.
    // This transformation is applied to the observed frequencies as well.
    for (k = expectedFrequencies.length - 1; k >= 0; k--) {
        if (expectedFrequencies[k] < 3) {
            expectedFrequencies[k - 1] += expectedFrequencies[k];
            expectedFrequencies.pop();

            observedFrequencies[k - 1] += observedFrequencies[k];
            observedFrequencies.pop();
        }
    }

    // Iterate through the squared differences between observed & expected
    // frequencies, accumulating the `chiSquared` statistic.
    for (k = 0; k < observedFrequencies.length; k++) {
        chiSquared += Math.pow(observedFrequencies[k] - expectedFrequencies[k], 2) / expectedFrequencies[k];
    }

    // Calculate degrees of freedom for this test and look it up in the
    // `chiSquaredDistributionTable` in order to
    // accept or reject the goodness-of-fit of the hypothesized distribution.
    degreesOfFreedom = observedFrequencies.length - c - 1;
    return chi_squared_distribution_table[degreesOfFreedom][significance] < chiSquared;
}

var chi_squared_goodness_of_fit = chiSquaredGoodnessOfFit;

/* @flow */

/**
 * The [Z-Score, or Standard Score](http://en.wikipedia.org/wiki/Standard_score).
 *
 * The standard score is the number of standard deviations an observation
 * or datum is above or below the mean. Thus, a positive standard score
 * represents a datum above the mean, while a negative standard score
 * represents a datum below the mean. It is a dimensionless quantity
 * obtained by subtracting the population mean from an individual raw
 * score and then dividing the difference by the population standard
 * deviation.
 *
 * The z-score is only defined if one knows the population parameters;
 * if one only has a sample set, then the analogous computation with
 * sample mean and sample standard deviation yields the
 * Student's t-statistic.
 *
 * @param {number} x
 * @param {number} mean
 * @param {number} standardDeviation
 * @return {number} z score
 * @example
 * zScore(78, 80, 5); // => -0.4
 */

function zScore(x /*:number*/, mean /*:number*/, standardDeviation /*:number*/) /*:number*/{
  return (x - mean) / standardDeviation;
}

var z_score = zScore;

/* @flow */

var SQRT_2PI = Math.sqrt(2 * Math.PI);

function cumulativeDistribution(z) {
    var sum = z,
        tmp = z;

    // 15 iterations are enough for 4-digit precision
    for (var i = 1; i < 15; i++) {
        tmp *= z * z / (2 * i + 1);
        sum += tmp;
    }
    return Math.round((0.5 + sum / SQRT_2PI * Math.exp(-z * z / 2)) * 1e4) / 1e4;
}

/**
 * A standard normal table, also called the unit normal table or Z table,
 * is a mathematical table for the values of Φ (phi), which are the values of
 * the cumulative distribution function of the normal distribution.
 * It is used to find the probability that a statistic is observed below,
 * above, or between values on the standard normal distribution, and by
 * extension, any normal distribution.
 *
 * The probabilities are calculated using the
 * [Cumulative distribution function](https://en.wikipedia.org/wiki/Normal_distribution#Cumulative_distribution_function).
 * The table used is the cumulative, and not cumulative from 0 to mean
 * (even though the latter has 5 digits precision, instead of 4).
 */
var standardNormalTable /*: Array<number> */ = [];

for (var z = 0; z <= 3.09; z += 0.01) {
    standardNormalTable.push(cumulativeDistribution(z));
}

var standard_normal_table = standardNormalTable;

/* @flow */

/**
 * **[Cumulative Standard Normal Probability](http://en.wikipedia.org/wiki/Standard_normal_table)**
 *
 * Since probability tables cannot be
 * printed for every normal distribution, as there are an infinite variety
 * of normal distributions, it is common practice to convert a normal to a
 * standard normal and then use the standard normal table to find probabilities.
 *
 * You can use `.5 + .5 * errorFunction(x / Math.sqrt(2))` to calculate the probability
 * instead of looking it up in a table.
 *
 * @param {number} z
 * @returns {number} cumulative standard normal probability
 */
function cumulativeStdNormalProbability(z /*:number */) /*:number */{

    // Calculate the position of this value.
    var absZ = Math.abs(z),

    // Each row begins with a different
    // significant digit: 0.5, 0.6, 0.7, and so on. Each value in the table
    // corresponds to a range of 0.01 in the input values, so the value is
    // multiplied by 100.
    index = Math.min(Math.round(absZ * 100), standard_normal_table.length - 1);

    // The index we calculate must be in the table as a positive value,
    // but we still pay attention to whether the input is positive
    // or negative, and flip the output value as a last step.
    if (z >= 0) {
        return standard_normal_table[index];
    } else {
        // due to floating-point arithmetic, values in the table with
        // 4 significant figures can nevertheless end up as repeating
        // fractions when they're computed here.
        return +(1 - standard_normal_table[index]).toFixed(4);
    }
}

var cumulative_std_normal_probability = cumulativeStdNormalProbability;

/* @flow */

/**
 * **[Gaussian error function](http://en.wikipedia.org/wiki/Error_function)**
 *
 * The `errorFunction(x/(sd * Math.sqrt(2)))` is the probability that a value in a
 * normal distribution with standard deviation sd is within x of the mean.
 *
 * This function returns a numerical approximation to the exact value.
 *
 * @param {number} x input
 * @return {number} error estimation
 * @example
 * errorFunction(1).toFixed(2); // => '0.84'
 */

function errorFunction(x /*: number */) /*: number */{
    var t = 1 / (1 + 0.5 * Math.abs(x));
    var tau = t * Math.exp(-Math.pow(x, 2) - 1.26551223 + 1.00002368 * t + 0.37409196 * Math.pow(t, 2) + 0.09678418 * Math.pow(t, 3) - 0.18628806 * Math.pow(t, 4) + 0.27886807 * Math.pow(t, 5) - 1.13520398 * Math.pow(t, 6) + 1.48851587 * Math.pow(t, 7) - 0.82215223 * Math.pow(t, 8) + 0.17087277 * Math.pow(t, 9));
    if (x >= 0) {
        return 1 - tau;
    } else {
        return tau - 1;
    }
}

var error_function = errorFunction;

/* @flow */

/**
 * The Inverse [Gaussian error function](http://en.wikipedia.org/wiki/Error_function)
 * returns a numerical approximation to the value that would have caused
 * `errorFunction()` to return x.
 *
 * @param {number} x value of error function
 * @returns {number} estimated inverted value
 */

function inverseErrorFunction(x /*: number */) /*: number */{
    var a = 8 * (Math.PI - 3) / (3 * Math.PI * (4 - Math.PI));

    var inv = Math.sqrt(Math.sqrt(Math.pow(2 / (Math.PI * a) + Math.log(1 - x * x) / 2, 2) - Math.log(1 - x * x) / a) - (2 / (Math.PI * a) + Math.log(1 - x * x) / 2));

    if (x >= 0) {
        return inv;
    } else {
        return -inv;
    }
}

var inverse_error_function = inverseErrorFunction;

/* @flow */

/**
 * The [Probit](http://en.wikipedia.org/wiki/Probit)
 * is the inverse of cumulativeStdNormalProbability(),
 * and is also known as the normal quantile function.
 *
 * It returns the number of standard deviations from the mean
 * where the p'th quantile of values can be found in a normal distribution.
 * So, for example, probit(0.5 + 0.6827/2) ≈ 1 because 68.27% of values are
 * normally found within 1 standard deviation above or below the mean.
 *
 * @param {number} p
 * @returns {number} probit
 */
function probit(p /*: number */) /*: number */{
    if (p === 0) {
        p = epsilon_1;
    } else if (p >= 1) {
        p = 1 - epsilon_1;
    }
    return Math.sqrt(2) * inverse_error_function(2 * p - 1);
}

var probit_1 = probit;

/* @flow */

/**
 * [Sign](https://en.wikipedia.org/wiki/Sign_function) is a function 
 * that extracts the sign of a real number
 * 
 * @param {Number} x input value
 * @returns {Number} sign value either 1, 0 or -1
 * @throws {TypeError} if the input argument x is not a number
 * @private
 * 
 * @example
 * sign(2); // => 1
 */

function sign(x /*: number */) /*: number */{
    if (typeof x === 'number') {
        if (x < 0) {
            return -1;
        } else if (x === 0) {
            return 0;
        } else {
            return 1;
        }
    } else {
        throw new TypeError('not a number');
    }
}

var sign_1 = sign;

/* @flow */

/**
 * [Bisection method](https://en.wikipedia.org/wiki/Bisection_method) is a root-finding 
 * method that repeatedly bisects an interval to find the root.
 * 
 * This function returns a numerical approximation to the exact value.
 * 
 * @param {Function} func input function
 * @param {Number} start - start of interval
 * @param {Number} end - end of interval
 * @param {Number} maxIterations - the maximum number of iterations
 * @param {Number} errorTolerance - the error tolerance
 * @returns {Number} estimated root value
 * @throws {TypeError} Argument func must be a function
 * 
 * @example
 * bisect(Math.cos,0,4,100,0.003); // => 1.572265625
 */
function bisect(func /*: (x: any) => number */
, start /*: number */
, end /*: number */
, maxIterations /*: number */
, errorTolerance /*: number */) /*:number*/{

    if (typeof func !== 'function') throw new TypeError('func must be a function');

    for (var i = 0; i < maxIterations; i++) {
        var output = (start + end) / 2;

        if (func(output) === 0 || Math.abs((end - start) / 2) < errorTolerance) {
            return output;
        }

        if (sign_1(func(output)) === sign_1(func(start))) {
            start = output;
        } else {
            end = output;
        }
    }

    throw new Error('maximum number of iterations exceeded');
}

var bisect_1 = bisect;

var index$81 = createCommonjsModule(function (module) {
  /* @flow */
  'use strict';

  // # simple-statistics
  //
  // A simple, literate statistics system.

  var ss = module.exports = {};

  // Linear Regression
  ss.linearRegression = linear_regression;
  ss.linearRegressionLine = linear_regression_line;
  ss.standardDeviation = standard_deviation;
  ss.rSquared = r_squared;
  ss.mode = mode_1;
  ss.modeFast = mode_fast;
  ss.modeSorted = mode_sorted;
  ss.min = min_1;
  ss.max = max_1;
  ss.minSorted = min_sorted;
  ss.maxSorted = max_sorted;
  ss.sum = sum_1;
  ss.sumSimple = sum_simple;
  ss.product = product_1;
  ss.quantile = quantile_1;
  ss.quantileSorted = quantile_sorted;
  ss.iqr = ss.interquartileRange = interquartile_range;
  ss.medianAbsoluteDeviation = ss.mad = median_absolute_deviation;
  ss.chunk = chunk_1;
  ss.sampleWithReplacement = sample_with_replacement;
  ss.shuffle = shuffle_1;
  ss.shuffleInPlace = shuffle_in_place;
  ss.sample = sample_1;
  ss.ckmeans = ckmeans_1;
  ss.uniqueCountSorted = unique_count_sorted;
  ss.sumNthPowerDeviations = sum_nth_power_deviations;
  ss.equalIntervalBreaks = equal_interval_breaks;

  // sample statistics
  ss.sampleCovariance = sample_covariance;
  ss.sampleCorrelation = sample_correlation;
  ss.sampleVariance = sample_variance;
  ss.sampleStandardDeviation = sample_standard_deviation;
  ss.sampleSkewness = sample_skewness;
  ss.sampleKurtosis = sample_kurtosis;

  // combinatorics
  ss.permutationsHeap = permutations_heap;
  ss.combinations = combinations_1;
  ss.combinationsReplacement = combinations_replacement;

  // measures of centrality
  ss.addToMean = add_to_mean;
  ss.combineMeans = combine_means;
  ss.combineVariances = combine_variances;
  ss.geometricMean = geometric_mean;
  ss.harmonicMean = harmonic_mean;
  ss.mean = ss.average = mean_1;
  ss.median = median_1;
  ss.medianSorted = median_sorted;
  ss.subtractFromMean = subtract_from_mean;

  ss.rootMeanSquare = ss.rms = root_mean_square;
  ss.variance = variance_1;
  ss.tTest = t_test;
  ss.tTestTwoSample = t_test_two_sample;
  // ss.jenks = require('./src/jenks');

  // Classifiers
  ss.bayesian = bayesian_classifier;
  ss.perceptron = perceptron;

  // Distribution-related methods
  ss.epsilon = epsilon_1; // We make ε available to the test suite.
  ss.factorial = factorial_1;
  ss.bernoulliDistribution = bernoulli_distribution;
  ss.binomialDistribution = binomial_distribution;
  ss.poissonDistribution = poisson_distribution;
  ss.chiSquaredGoodnessOfFit = chi_squared_goodness_of_fit;

  // Normal distribution
  ss.zScore = z_score;
  ss.cumulativeStdNormalProbability = cumulative_std_normal_probability;
  ss.standardNormalTable = standard_normal_table;
  ss.errorFunction = ss.erf = error_function;
  ss.inverseErrorFunction = inverse_error_function;
  ss.probit = probit_1;

  // Root-finding methods
  ss.bisect = bisect_1;
});

function interquartileRange(values) {
  return index$81.interquartileRange(values);
}

function linearRegression(values) {
  return index$81.linearRegression(values);
}

function sum(values) {
  return index$81.sum(values);
}

function median(values) {
  return index$81.median(values);
}

function mean(values) {
  return index$81.mean(values);
}

function max$1(values) {
  return index$81.max(values);
}

function min$1(values) {
  return index$81.min(values);
}

function quantile(values, quantile) {
  return index$81.quantile(values, quantile);
}

function calcSlopeLinearRegressionLine(lrStats) {
  var asLine = index$81.linearRegressionLine(lrStats);
  var pt1 = [0, asLine(0)];
  var pt2 = [1, asLine(1)];
  return convertSlopeToDegrees(pt2[1] - pt1[1], 1);
}

function convertSlopeToDegrees(rise, run) {
  var radians = Math.atan(rise / run);
  return radians * 180 / Math.PI;
}

var index$82 = createCommonjsModule(function (module, exports) {
  /**
   * lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="npm" -o ./`
   * Copyright jQuery Foundation and other contributors <https://jquery.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   */

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /** Used as the `TypeError` message for "Functions" methods. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /** Used to compose bitmasks for comparison styles. */
  var UNORDERED_COMPARE_FLAG = 1,
      PARTIAL_COMPARE_FLAG = 2;

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0,
      MAX_SAFE_INTEGER = 9007199254740991;

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      promiseTag = '[object Promise]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      symbolTag = '[object Symbol]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/,
      reLeadingDot = /^\./,
      rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = _typeof(commonjsGlobal) == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

  /** Detect free variable `self`. */
  var freeSelf = (typeof self === 'undefined' ? 'undefined' : _typeof(self)) == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function('return this')();

  /** Detect free variable `exports`. */
  var freeExports = 'object' == 'object' && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = function () {
    try {
      return freeProcess && freeProcess.binding('util');
    } catch (e) {}
  }();

  /* Node.js helper references. */
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

  /**
   * A specialized version of `baseAggregator` for arrays.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} setter The function to set `accumulator` values.
   * @param {Function} iteratee The iteratee to transform keys.
   * @param {Object} accumulator The initial aggregated object.
   * @returns {Function} Returns `accumulator`.
   */
  function arrayAggregator(array, setter, iteratee, accumulator) {
    var index = -1,
        length = array ? array.length : 0;

    while (++index < length) {
      var value = array[index];
      setter(accumulator, value, iteratee(value), array);
    }
    return accumulator;
  }

  /**
   * A specialized version of `_.some` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if any element passes the predicate check,
   *  else `false`.
   */
  function arraySome(array, predicate) {
    var index = -1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }

  /**
   * The base implementation of `_.property` without support for deep paths.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function baseProperty(key) {
    return function (object) {
      return object == null ? undefined : object[key];
    };
  }

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function (value) {
      return func(value);
    };
  }

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  /**
   * Checks if `value` is a host object in IE < 9.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
   */
  function isHostObject(value) {
    // Many host objects are `Object` objects that can coerce to strings
    // despite having improperly defined `toString` methods.
    var result = false;
    if (value != null && typeof value.toString != 'function') {
      try {
        result = !!(value + '');
      } catch (e) {}
    }
    return result;
  }

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
        result = Array(map.size);

    map.forEach(function (value, key) {
      result[++index] = [key, value];
    });
    return result;
  }

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function (arg) {
      return func(transform(arg));
    };
  }

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set$$1) {
    var index = -1,
        result = Array(set$$1.size);

    set$$1.forEach(function (value) {
      result[++index] = value;
    });
    return result;
  }

  /** Used for built-in method references. */
  var arrayProto = Array.prototype,
      funcProto = Function.prototype,
      objectProto = Object.prototype;

  /** Used to detect overreaching core-js shims. */
  var coreJsData = root['__core-js_shared__'];

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = function () {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
    return uid ? 'Symbol(src)_1.' + uid : '';
  }();

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' + funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

  /** Built-in value references. */
  var _Symbol = root.Symbol,
      Uint8Array = root.Uint8Array,
      propertyIsEnumerable = objectProto.propertyIsEnumerable,
      splice = arrayProto.splice;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeKeys = overArg(Object.keys, Object);

  /* Built-in method references that are verified to be native. */
  var DataView = getNative(root, 'DataView'),
      Map = getNative(root, 'Map'),
      Promise = getNative(root, 'Promise'),
      Set = getNative(root, 'Set'),
      WeakMap = getNative(root, 'WeakMap'),
      nativeCreate = getNative(Object, 'create');

  /** Used to detect maps, sets, and weakmaps. */
  var dataViewCtorString = toSource(DataView),
      mapCtorString = toSource(Map),
      promiseCtorString = toSource(Promise),
      setCtorString = toSource(Set),
      weakMapCtorString = toSource(WeakMap);

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = _Symbol ? _Symbol.prototype : undefined,
      symbolValueOf = symbolProto ? symbolProto.valueOf : undefined,
      symbolToString = symbolProto ? symbolProto.toString : undefined;

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
        length = entries ? entries.length : 0;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
  }

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    return this.has(key) && delete this.__data__[key];
  }

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty.call(data, key) ? data[key] : undefined;
  }

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
  }

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
    return this;
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = hashClear;
  Hash.prototype['delete'] = hashDelete;
  Hash.prototype.get = hashGet;
  Hash.prototype.has = hashHas;
  Hash.prototype.set = hashSet;

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
        length = entries ? entries.length : 0;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
  }

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    return true;
  }

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  }

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
  }

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    if (index < 0) {
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = listCacheClear;
  ListCache.prototype['delete'] = listCacheDelete;
  ListCache.prototype.get = listCacheGet;
  ListCache.prototype.has = listCacheHas;
  ListCache.prototype.set = listCacheSet;

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
        length = entries ? entries.length : 0;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.__data__ = {
      'hash': new Hash(),
      'map': new (Map || ListCache)(),
      'string': new Hash()
    };
  }

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    return getMapData(this, key)['delete'](key);
  }

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return getMapData(this, key).get(key);
  }

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return getMapData(this, key).has(key);
  }

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    getMapData(this, key).set(key, value);
    return this;
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = mapCacheClear;
  MapCache.prototype['delete'] = mapCacheDelete;
  MapCache.prototype.get = mapCacheGet;
  MapCache.prototype.has = mapCacheHas;
  MapCache.prototype.set = mapCacheSet;

  /**
   *
   * Creates an array cache object to store unique values.
   *
   * @private
   * @constructor
   * @param {Array} [values] The values to cache.
   */
  function SetCache(values) {
    var index = -1,
        length = values ? values.length : 0;

    this.__data__ = new MapCache();
    while (++index < length) {
      this.add(values[index]);
    }
  }

  /**
   * Adds `value` to the array cache.
   *
   * @private
   * @name add
   * @memberOf SetCache
   * @alias push
   * @param {*} value The value to cache.
   * @returns {Object} Returns the cache instance.
   */
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED);
    return this;
  }

  /**
   * Checks if `value` is in the array cache.
   *
   * @private
   * @name has
   * @memberOf SetCache
   * @param {*} value The value to search for.
   * @returns {number} Returns `true` if `value` is found, else `false`.
   */
  function setCacheHas(value) {
    return this.__data__.has(value);
  }

  // Add methods to `SetCache`.
  SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
  SetCache.prototype.has = setCacheHas;

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    this.__data__ = new ListCache(entries);
  }

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new ListCache();
  }

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    return this.__data__['delete'](key);
  }

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key);
  }

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key);
  }

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var cache = this.__data__;
    if (cache instanceof ListCache) {
      var pairs = cache.__data__;
      if (!Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
        pairs.push([key, value]);
        return this;
      }
      cache = this.__data__ = new MapCache(pairs);
    }
    cache.set(key, value);
    return this;
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = stackClear;
  Stack.prototype['delete'] = stackDelete;
  Stack.prototype.get = stackGet;
  Stack.prototype.has = stackHas;
  Stack.prototype.set = stackSet;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
    // Safari 9 makes `arguments.length` enumerable in strict mode.
    var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];

    var length = result.length,
        skipIndexes = !!length;

    for (var key in value) {
      if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }

  /**
   * Aggregates elements of `collection` on `accumulator` with keys transformed
   * by `iteratee` and values set by `setter`.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} setter The function to set `accumulator` values.
   * @param {Function} iteratee The iteratee to transform keys.
   * @param {Object} accumulator The initial aggregated object.
   * @returns {Function} Returns `accumulator`.
   */
  function baseAggregator(collection, setter, iteratee, accumulator) {
    baseEach(collection, function (value, key, collection) {
      setter(accumulator, value, iteratee(value), collection);
    });
    return accumulator;
  }

  /**
   * The base implementation of `_.forEach` without support for iteratee shorthands.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array|Object} Returns `collection`.
   */
  var baseEach = createBaseEach(baseForOwn);

  /**
   * The base implementation of `baseForOwn` which iterates over `object`
   * properties returned by `keysFunc` and invokes `iteratee` for each property.
   * Iteratee functions may exit iteration early by explicitly returning `false`.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @returns {Object} Returns `object`.
   */
  var baseFor = createBaseFor();

  /**
   * The base implementation of `_.forOwn` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Object} Returns `object`.
   */
  function baseForOwn(object, iteratee) {
    return object && baseFor(object, iteratee, keys);
  }

  /**
   * The base implementation of `_.get` without support for default values.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @returns {*} Returns the resolved value.
   */
  function baseGet(object, path) {
    path = isKey(path, object) ? [path] : castPath(path);

    var index = 0,
        length = path.length;

    while (object != null && index < length) {
      object = object[toKey(path[index++])];
    }
    return index && index == length ? object : undefined;
  }

  /**
   * The base implementation of `getTag`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    return objectToString.call(value);
  }

  /**
   * The base implementation of `_.hasIn` without support for deep paths.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {Array|string} key The key to check.
   * @returns {boolean} Returns `true` if `key` exists, else `false`.
   */
  function baseHasIn(object, key) {
    return object != null && key in Object(object);
  }

  /**
   * The base implementation of `_.isEqual` which supports partial comparisons
   * and tracks traversed objects.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {boolean} [bitmask] The bitmask of comparison flags.
   *  The bitmask may be composed of the following flags:
   *     1 - Unordered comparison
   *     2 - Partial comparison
   * @param {Object} [stack] Tracks traversed `value` and `other` objects.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   */
  function baseIsEqual(value, other, customizer, bitmask, stack) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || !isObject(value) && !isObjectLike(other)) {
      return value !== value && other !== other;
    }
    return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
  }

  /**
   * A specialized version of `baseIsEqual` for arrays and objects which performs
   * deep comparisons and tracks traversed objects enabling objects with circular
   * references to be compared.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {number} [bitmask] The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} [stack] Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function baseIsEqualDeep(object, other, equalFunc, customizer, bitmask, stack) {
    var objIsArr = isArray(object),
        othIsArr = isArray(other),
        objTag = arrayTag,
        othTag = arrayTag;

    if (!objIsArr) {
      objTag = getTag(object);
      objTag = objTag == argsTag ? objectTag : objTag;
    }
    if (!othIsArr) {
      othTag = getTag(other);
      othTag = othTag == argsTag ? objectTag : othTag;
    }
    var objIsObj = objTag == objectTag && !isHostObject(object),
        othIsObj = othTag == objectTag && !isHostObject(other),
        isSameTag = objTag == othTag;

    if (isSameTag && !objIsObj) {
      stack || (stack = new Stack());
      return objIsArr || isTypedArray(object) ? equalArrays(object, other, equalFunc, customizer, bitmask, stack) : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
    }
    if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
      var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
          othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object,
            othUnwrapped = othIsWrapped ? other.value() : other;

        stack || (stack = new Stack());
        return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new Stack());
    return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
  }

  /**
   * The base implementation of `_.isMatch` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to inspect.
   * @param {Object} source The object of property values to match.
   * @param {Array} matchData The property names, values, and compare flags to match.
   * @param {Function} [customizer] The function to customize comparisons.
   * @returns {boolean} Returns `true` if `object` is a match, else `false`.
   */
  function baseIsMatch(object, source, matchData, customizer) {
    var index = matchData.length,
        length = index,
        noCustomizer = !customizer;

    if (object == null) {
      return !length;
    }
    object = Object(object);
    while (index--) {
      var data = matchData[index];
      if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
        return false;
      }
    }
    while (++index < length) {
      data = matchData[index];
      var key = data[0],
          objValue = object[key],
          srcValue = data[1];

      if (noCustomizer && data[2]) {
        if (objValue === undefined && !(key in object)) {
          return false;
        }
      } else {
        var stack = new Stack();
        if (customizer) {
          var result = customizer(objValue, srcValue, key, object, source, stack);
        }
        if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG, stack) : result)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) || isHostObject(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
  }

  /**
   * The base implementation of `_.iteratee`.
   *
   * @private
   * @param {*} [value=_.identity] The value to convert to an iteratee.
   * @returns {Function} Returns the iteratee.
   */
  function baseIteratee(value) {
    // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
    // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
    if (typeof value == 'function') {
      return value;
    }
    if (value == null) {
      return identity;
    }
    if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object') {
      return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
    }
    return property(value);
  }

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty.call(object, key) && key != 'constructor') {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * The base implementation of `_.matches` which doesn't clone `source`.
   *
   * @private
   * @param {Object} source The object of property values to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatches(source) {
    var matchData = getMatchData(source);
    if (matchData.length == 1 && matchData[0][2]) {
      return matchesStrictComparable(matchData[0][0], matchData[0][1]);
    }
    return function (object) {
      return object === source || baseIsMatch(object, source, matchData);
    };
  }

  /**
   * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
   *
   * @private
   * @param {string} path The path of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatchesProperty(path, srcValue) {
    if (isKey(path) && isStrictComparable(srcValue)) {
      return matchesStrictComparable(toKey(path), srcValue);
    }
    return function (object) {
      var objValue = get$$1(object, path);
      return objValue === undefined && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, undefined, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG);
    };
  }

  /**
   * A specialized version of `baseProperty` which supports deep paths.
   *
   * @private
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyDeep(path) {
    return function (object) {
      return baseGet(object, path);
    };
  }

  /**
   * The base implementation of `_.toString` which doesn't convert nullish
   * values to empty strings.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
      return value;
    }
    if (isSymbol(value)) {
      return symbolToString ? symbolToString.call(value) : '';
    }
    var result = value + '';
    return result == '0' && 1 / value == -INFINITY ? '-0' : result;
  }

  /**
   * Casts `value` to a path array if it's not one.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {Array} Returns the cast property path array.
   */
  function castPath(value) {
    return isArray(value) ? value : stringToPath(value);
  }

  /**
   * Creates a function like `_.groupBy`.
   *
   * @private
   * @param {Function} setter The function to set accumulator values.
   * @param {Function} [initializer] The accumulator object initializer.
   * @returns {Function} Returns the new aggregator function.
   */
  function createAggregator(setter, initializer) {
    return function (collection, iteratee) {
      var func = isArray(collection) ? arrayAggregator : baseAggregator,
          accumulator = initializer ? initializer() : {};

      return func(collection, setter, baseIteratee(iteratee, 2), accumulator);
    };
  }

  /**
   * Creates a `baseEach` or `baseEachRight` function.
   *
   * @private
   * @param {Function} eachFunc The function to iterate over a collection.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseEach(eachFunc, fromRight) {
    return function (collection, iteratee) {
      if (collection == null) {
        return collection;
      }
      if (!isArrayLike(collection)) {
        return eachFunc(collection, iteratee);
      }
      var length = collection.length,
          index = fromRight ? length : -1,
          iterable = Object(collection);

      while (fromRight ? index-- : ++index < length) {
        if (iteratee(iterable[index], index, iterable) === false) {
          break;
        }
      }
      return collection;
    };
  }

  /**
   * Creates a base function for methods like `_.forIn` and `_.forOwn`.
   *
   * @private
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseFor(fromRight) {
    return function (object, iteratee, keysFunc) {
      var index = -1,
          iterable = Object(object),
          props = keysFunc(object),
          length = props.length;

      while (length--) {
        var key = props[fromRight ? length : ++index];
        if (iteratee(iterable[key], key, iterable) === false) {
          break;
        }
      }
      return object;
    };
  }

  /**
   * A specialized version of `baseIsEqualDeep` for arrays with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Array} array The array to compare.
   * @param {Array} other The other array to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} customizer The function to customize comparisons.
   * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} stack Tracks traversed `array` and `other` objects.
   * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
   */
  function equalArrays(array, other, equalFunc, customizer, bitmask, stack) {
    var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
        arrLength = array.length,
        othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(array);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var index = -1,
        result = true,
        seen = bitmask & UNORDERED_COMPARE_FLAG ? new SetCache() : undefined;

    stack.set(array, other);
    stack.set(other, array);

    // Ignore non-index properties.
    while (++index < arrLength) {
      var arrValue = array[index],
          othValue = other[index];

      if (customizer) {
        var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== undefined) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      // Recursively compare arrays (susceptible to call stack limits).
      if (seen) {
        if (!arraySome(other, function (othValue, othIndex) {
          if (!seen.has(othIndex) && (arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
            return seen.add(othIndex);
          }
        })) {
          result = false;
          break;
        }
      } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
        result = false;
        break;
      }
    }
    stack['delete'](array);
    stack['delete'](other);
    return result;
  }

  /**
   * A specialized version of `baseIsEqualDeep` for comparing objects of
   * the same `toStringTag`.
   *
   * **Note:** This function only supports comparing values with tags of
   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {string} tag The `toStringTag` of the objects to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} customizer The function to customize comparisons.
   * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalByTag(object, other, tag, equalFunc, customizer, bitmask, stack) {
    switch (tag) {
      case dataViewTag:
        if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;

      case arrayBufferTag:
        if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
          return false;
        }
        return true;

      case boolTag:
      case dateTag:
      case numberTag:
        // Coerce booleans to `1` or `0` and dates to milliseconds.
        // Invalid dates are coerced to `NaN`.
        return eq(+object, +other);

      case errorTag:
        return object.name == other.name && object.message == other.message;

      case regexpTag:
      case stringTag:
        // Coerce regexes to strings and treat strings, primitives and objects,
        // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
        // for more details.
        return object == other + '';

      case mapTag:
        var convert = mapToArray;

      case setTag:
        var isPartial = bitmask & PARTIAL_COMPARE_FLAG;
        convert || (convert = setToArray);

        if (object.size != other.size && !isPartial) {
          return false;
        }
        // Assume cyclic values are equal.
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= UNORDERED_COMPARE_FLAG;

        // Recursively compare objects (susceptible to call stack limits).
        stack.set(object, other);
        var result = equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);
        stack['delete'](object);
        return result;

      case symbolTag:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other);
        }
    }
    return false;
  }

  /**
   * A specialized version of `baseIsEqualDeep` for objects with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} customizer The function to customize comparisons.
   * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalObjects(object, other, equalFunc, customizer, bitmask, stack) {
    var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
        objProps = keys(object),
        objLength = objProps.length,
        othProps = keys(other),
        othLength = othProps.length;

    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
        return false;
      }
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(object);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);

    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key],
          othValue = other[key];

      if (customizer) {
        var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
      }
      // Recursively compare objects (susceptible to call stack limits).
      if (!(compared === undefined ? objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack) : compared)) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == 'constructor');
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor,
          othCtor = other.constructor;

      // Non `Object` object instances with different constructors are not equal.
      if (objCtor != othCtor && 'constructor' in object && 'constructor' in other && !(typeof objCtor == 'function' && objCtor instanceof objCtor && typeof othCtor == 'function' && othCtor instanceof othCtor)) {
        result = false;
      }
    }
    stack['delete'](object);
    stack['delete'](other);
    return result;
  }

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
  }

  /**
   * Gets the property names, values, and compare flags of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the match data of `object`.
   */
  function getMatchData(object) {
    var result = keys(object),
        length = result.length;

    while (length--) {
      var key = result[length],
          value = object[key];

      result[length] = [key, value, isStrictComparable(value)];
    }
    return result;
  }

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : undefined;
  }

  /**
   * Gets the `toStringTag` of `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  var getTag = baseGetTag;

  // Fallback for data views, maps, sets, and weak maps in IE 11,
  // for data views in Edge < 14, and promises in Node.js.
  if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map && getTag(new Map()) != mapTag || Promise && getTag(Promise.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
    getTag = function getTag(value) {
      var result = objectToString.call(value),
          Ctor = result == objectTag ? value.constructor : undefined,
          ctorString = Ctor ? toSource(Ctor) : undefined;

      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString:
            return dataViewTag;
          case mapCtorString:
            return mapTag;
          case promiseCtorString:
            return promiseTag;
          case setCtorString:
            return setTag;
          case weakMapCtorString:
            return weakMapTag;
        }
      }
      return result;
    };
  }

  /**
   * Checks if `path` exists on `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @param {Function} hasFunc The function to check properties.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   */
  function hasPath(object, path, hasFunc) {
    path = isKey(path, object) ? [path] : castPath(path);

    var result,
        index = -1,
        length = path.length;

    while (++index < length) {
      var key = toKey(path[index]);
      if (!(result = object != null && hasFunc(object, key))) {
        break;
      }
      object = object[key];
    }
    if (result) {
      return result;
    }
    var length = object ? object.length : 0;
    return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
  }

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    length = length == null ? MAX_SAFE_INTEGER : length;
    return !!length && (typeof value == 'number' || reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
  }

  /**
   * Checks if `value` is a property name and not a property path.
   *
   * @private
   * @param {*} value The value to check.
   * @param {Object} [object] The object to query keys on.
   * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
   */
  function isKey(value, object) {
    if (isArray(value)) {
      return false;
    }
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol(value)) {
      return true;
    }
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
  }

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
  }

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = typeof Ctor == 'function' && Ctor.prototype || objectProto;

    return value === proto;
  }

  /**
   * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` if suitable for strict
   *  equality comparisons, else `false`.
   */
  function isStrictComparable(value) {
    return value === value && !isObject(value);
  }

  /**
   * A specialized version of `matchesProperty` for source values suitable
   * for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function matchesStrictComparable(key, srcValue) {
    return function (object) {
      if (object == null) {
        return false;
      }
      return object[key] === srcValue && (srcValue !== undefined || key in Object(object));
    };
  }

  /**
   * Converts `string` to a property path array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the property path array.
   */
  var stringToPath = memoize(function (string) {
    string = toString(string);

    var result = [];
    if (reLeadingDot.test(string)) {
      result.push('');
    }
    string.replace(rePropName, function (match, number, quote, string) {
      result.push(quote ? string.replace(reEscapeChar, '$1') : number || match);
    });
    return result;
  });

  /**
   * Converts `value` to a string key if it's not a string or symbol.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {string|symbol} Returns the key.
   */
  function toKey(value) {
    if (typeof value == 'string' || isSymbol(value)) {
      return value;
    }
    var result = value + '';
    return result == '0' && 1 / value == -INFINITY ? '-0' : result;
  }

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to process.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {}
      try {
        return func + '';
      } catch (e) {}
    }
    return '';
  }

  /**
   * Creates an object composed of keys generated from the results of running
   * each element of `collection` thru `iteratee`. The corresponding value of
   * each key is the number of times the key was returned by `iteratee`. The
   * iteratee is invoked with one argument: (value).
   *
   * @static
   * @memberOf _
   * @since 0.5.0
   * @category Collection
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} [iteratee=_.identity]
   *  The iteratee to transform keys.
   * @returns {Object} Returns the composed aggregate object.
   * @example
   *
   * _.countBy([6.1, 4.2, 6.3], Math.floor);
   * // => { '4': 1, '6': 2 }
   *
   * // The `_.property` iteratee shorthand.
   * _.countBy(['one', 'two', 'three'], 'length');
   * // => { '3': 2, '5': 1 }
   */
  var countBy = createAggregator(function (result, value, key) {
    hasOwnProperty.call(result, key) ? ++result[key] : result[key] = 1;
  });

  /**
   * Creates a function that memoizes the result of `func`. If `resolver` is
   * provided, it determines the cache key for storing the result based on the
   * arguments provided to the memoized function. By default, the first argument
   * provided to the memoized function is used as the map cache key. The `func`
   * is invoked with the `this` binding of the memoized function.
   *
   * **Note:** The cache is exposed as the `cache` property on the memoized
   * function. Its creation may be customized by replacing the `_.memoize.Cache`
   * constructor with one whose instances implement the
   * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
   * method interface of `delete`, `get`, `has`, and `set`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to have its output memoized.
   * @param {Function} [resolver] The function to resolve the cache key.
   * @returns {Function} Returns the new memoized function.
   * @example
   *
   * var object = { 'a': 1, 'b': 2 };
   * var other = { 'c': 3, 'd': 4 };
   *
   * var values = _.memoize(_.values);
   * values(object);
   * // => [1, 2]
   *
   * values(other);
   * // => [3, 4]
   *
   * object.a = 2;
   * values(object);
   * // => [1, 2]
   *
   * // Modify the result cache.
   * values.cache.set(object, ['a', 'b']);
   * values(object);
   * // => ['a', 'b']
   *
   * // Replace `_.memoize.Cache`.
   * _.memoize.Cache = WeakMap;
   */
  function memoize(func, resolver) {
    if (typeof func != 'function' || resolver && typeof resolver != 'function') {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    var memoized = function memoized() {
      var args = arguments,
          key = resolver ? resolver.apply(this, args) : args[0],
          cache = memoized.cache;

      if (cache.has(key)) {
        return cache.get(key);
      }
      var result = func.apply(this, args);
      memoized.cache = cache.set(key, result);
      return result;
    };
    memoized.cache = new (memoize.Cache || MapCache)();
    return memoized;
  }

  // Assign cache to `_.memoize`.
  memoize.Cache = MapCache;

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || value !== value && other !== other;
  }

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  function isArguments(value) {
    // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
    return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') && (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
  }

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }

  /**
   * This method is like `_.isArrayLike` except that it also checks if `value`
   * is an object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array-like object,
   *  else `false`.
   * @example
   *
   * _.isArrayLikeObject([1, 2, 3]);
   * // => true
   *
   * _.isArrayLikeObject(document.body.children);
   * // => true
   *
   * _.isArrayLikeObject('abc');
   * // => false
   *
   * _.isArrayLikeObject(_.noop);
   * // => false
   */
  function isArrayLikeObject(value) {
    return isObjectLike(value) && isArrayLike(value);
  }

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 8-9 which returns 'object' for typed array and other constructors.
    var tag = isObject(value) ? objectToString.call(value) : '';
    return tag == funcTag || tag == genTag;
  }

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    return !!value && (type == 'object' || type == 'function');
  }

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
  }

  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol(value) {
    return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'symbol' || isObjectLike(value) && objectToString.call(value) == symbolTag;
  }

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

  /**
   * Converts `value` to a string. An empty string is returned for `null`
   * and `undefined` values. The sign of `-0` is preserved.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   * @example
   *
   * _.toString(null);
   * // => ''
   *
   * _.toString(-0);
   * // => '-0'
   *
   * _.toString([1, 2, 3]);
   * // => '1,2,3'
   */
  function toString(value) {
    return value == null ? '' : baseToString(value);
  }

  /**
   * Gets the value at `path` of `object`. If the resolved value is
   * `undefined`, the `defaultValue` is returned in its place.
   *
   * @static
   * @memberOf _
   * @since 3.7.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @param {*} [defaultValue] The value returned for `undefined` resolved values.
   * @returns {*} Returns the resolved value.
   * @example
   *
   * var object = { 'a': [{ 'b': { 'c': 3 } }] };
   *
   * _.get(object, 'a[0].b.c');
   * // => 3
   *
   * _.get(object, ['a', '0', 'b', 'c']);
   * // => 3
   *
   * _.get(object, 'a.b.c', 'default');
   * // => 'default'
   */
  function get$$1(object, path, defaultValue) {
    var result = object == null ? undefined : baseGet(object, path);
    return result === undefined ? defaultValue : result;
  }

  /**
   * Checks if `path` is a direct or inherited property of `object`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   * @example
   *
   * var object = _.create({ 'a': _.create({ 'b': 2 }) });
   *
   * _.hasIn(object, 'a');
   * // => true
   *
   * _.hasIn(object, 'a.b');
   * // => true
   *
   * _.hasIn(object, ['a', 'b']);
   * // => true
   *
   * _.hasIn(object, 'b');
   * // => false
   */
  function hasIn(object, path) {
    return object != null && hasPath(object, path, baseHasIn);
  }

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
  }

  /**
   * This method returns the first argument it receives.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Util
   * @param {*} value Any value.
   * @returns {*} Returns `value`.
   * @example
   *
   * var object = { 'a': 1 };
   *
   * console.log(_.identity(object) === object);
   * // => true
   */
  function identity(value) {
    return value;
  }

  /**
   * Creates a function that returns the value at `path` of a given object.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   * @example
   *
   * var objects = [
   *   { 'a': { 'b': 2 } },
   *   { 'a': { 'b': 1 } }
   * ];
   *
   * _.map(objects, _.property('a.b'));
   * // => [2, 1]
   *
   * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
   * // => [1, 2]
   */
  function property(path) {
    return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
  }

  module.exports = countBy;
});

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';
var funcTag = '[object Function]';
var genTag = '[object GeneratorFunction]';

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * The base implementation of `_.values` and `_.valuesIn` which creates an
 * array of `object` property values corresponding to the property names
 * of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the array of property values.
 */
function baseValues(object, props) {
  return arrayMap(props, function (key) {
    return object[key];
  });
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function (arg) {
    return func(transform(arg));
  };
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  var result = isArray$1(value) || isArguments(value) ? baseTimes(value.length, String) : [];

  var length = result.length,
      skipIndexes = !!length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length && (typeof value == 'number' || reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = typeof Ctor == 'function' && Ctor.prototype || objectProto;

  return value === proto;
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') && (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray$1 = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction$1(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction$1(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject$1(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject$1(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys$1(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * Creates an array of the own enumerable string keyed property values of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property values.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.values(new Foo);
 * // => [1, 2] (iteration order is not guaranteed)
 *
 * _.values('hi');
 * // => ['h', 'i']
 */
function values(object) {
  return object ? baseValues(object, keys$1(object)) : [];
}

var index$83 = values;

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]';
var funcTag$1 = '[object Function]';
var genTag$1 = '[object GeneratorFunction]';

/** Used to detect unsigned integer values. */
var reIsUint$1 = /^(?:0|[1-9]\d*)$/;

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes$1(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg$1(func, transform) {
  return function (arg) {
    return func(transform(arg));
  };
}

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$1 = objectProto$1.toString;

/** Built-in value references. */
var propertyIsEnumerable$1 = objectProto$1.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys$1 = overArg$1(Object.keys, Object);

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys$1(value, inherited) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  var result = isArray$2(value) || isArguments$1(value) ? baseTimes$1(value.length, String) : [];

  var length = result.length,
      skipIndexes = !!length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$1.call(value, key)) && !(skipIndexes && (key == 'length' || isIndex$1(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * The base implementation of `_.forEach` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return object && baseFor(object, iteratee, keys$2);
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys$1(object) {
  if (!isPrototype$1(object)) {
    return nativeKeys$1(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$1.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function (collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike$1(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length,
        index = fromRight ? length : -1,
        iterable = Object(collection);

    while (fromRight ? index-- : ++index < length) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function (object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex$1(value, length) {
  length = length == null ? MAX_SAFE_INTEGER$1 : length;
  return !!length && (typeof value == 'number' || reIsUint$1.test(value)) && value > -1 && value % 1 == 0 && value < length;
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype$1(value) {
  var Ctor = value && value.constructor,
      proto = typeof Ctor == 'function' && Ctor.prototype || objectProto$1;

  return value === proto;
}

/**
 * Iterates over elements of `collection` and invokes `iteratee` for each element.
 * The iteratee is invoked with three arguments: (value, index|key, collection).
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length"
 * property are iterated like arrays. To avoid this behavior use `_.forIn`
 * or `_.forOwn` for object iteration.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @alias each
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 * @see _.forEachRight
 * @example
 *
 * _([1, 2]).forEach(function(value) {
 *   console.log(value);
 * });
 * // => Logs `1` then `2`.
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
 *   console.log(key);
 * });
 * // => Logs 'a' then 'b' (iteration order is not guaranteed).
 */
function forEach(collection, iteratee) {
  var func = isArray$2(collection) ? arrayEach : baseEach;
  return func(collection, typeof iteratee == 'function' ? iteratee : identity);
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments$1(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject$1(value) && hasOwnProperty$1.call(value, 'callee') && (!propertyIsEnumerable$1.call(value, 'callee') || objectToString$1.call(value) == argsTag$1);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray$2 = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike$1(value) {
  return value != null && isLength$1(value.length) && !isFunction$2(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject$1(value) {
  return isObjectLike$1(value) && isArrayLike$1(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction$2(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject$2(value) ? objectToString$1.call(value) : '';
  return tag == funcTag$1 || tag == genTag$1;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength$1(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject$2(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike$1(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys$2(object) {
  return isArrayLike$1(object) ? arrayLikeKeys$1(object) : baseKeys$1(object);
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

var index$84 = forEach;

function CollectionOfFlowClasses(dateFirst, dateLast) {
  this.dateFirstRecord = dateFirst;
  this.dateLastRecord = dateLast;
  this.flowClassEvents = [];
  this.flowClassDefinitions = [];
  this.flowClassStatistics = [];
}

CollectionOfFlowClasses.prototype = Object.create(CollectionOfFlowClasses.prototype);

CollectionOfFlowClasses.prototype.addClassDefinitions = function (classDefinitions) {
  this.flowClassDefinitions.push(classDefinitions);
  this.flowClassStatistics = this.flowClassStatistics.concat(classDefinitions.map(function (flowClassification) {
    return { className: flowClassification.className, statistics: [] };
  }));
};

CollectionOfFlowClasses.prototype.addFlowClassEvents = function (flowClassEvent) {
  if (Array.isArray(flowClassEvent)) {
    this.flowClassEvents = this.flowClassEvents.concat(flowClassEvent);
  } else {
    this.flowClassEvents.push(flowClassEvent);
  }
};

CollectionOfFlowClasses.prototype.calcFlowsOccurancesByMonth = function () {
  this._addStatsObjToFlowClasses('occurancesByMonth', {
    totalOccurancesByMonth: clone$1(monthNames),
    meanOccurancesInMonthOverYears: clone$1(monthNames),
    maxOccurancesInMonth: clone$1(monthNames),
    minOccurancesInMonth: clone$1(monthNames)
  });

  this.flowClassStatistics.forEach(function (flowClass) {
    flowClass.statistics.occurancesByMonth.totalOccurancesByMonth.forEach(function (month) {
      month.totalCount = 0;
    });
  });
  this.flowClassStatistics.forEach(function (flowClass) {
    flowClass.statistics.occurancesByMonth.meanOccurancesInMonthOverYears.forEach(function (month) {
      month.meanOccurances = 0;
      month.Years = [];
    });
    flowClass.statistics.occurancesByMonth.maxOccurancesInMonth.forEach(function (month) {
      month.maxOccurancesInMonth = 0;
    });
    flowClass.statistics.occurancesByMonth.minOccurancesInMonth.forEach(function (month) {
      month.minOccurancesInMonth = 0;
    });
  });

  this.flowClassEvents.forEach(function (recordSet) {
    var statsObj = this._getClassStatisticObjByName(recordSet.flowClass);
    var startMonth = recordSet.records[0].date.getMonth();

    var endMonth = recordSet.getLastRecord().date.getMonth();
    var allMonths = [startMonth];
    if (startMonth !== endMonth) {
      allMonths = getMonthsBasedOnRange(startMonth, endMonth);
    }

    var startYear = recordSet.records[0].date.getFullYear();
    var endYear = recordSet.getLastRecord().date.getFullYear();

    allMonths.forEach(function (monthIndex) {
      statsObj.statistics.occurancesByMonth.totalOccurancesByMonth[monthIndex].totalCount++;
      statsObj.statistics.occurancesByMonth.meanOccurancesInMonthOverYears[monthIndex].Years.push(startYear);
      if (startYear !== endYear) statsObj.statistics.occurancesByMonth.meanOccurancesInMonthOverYears[monthIndex].Years.push(endYear);
    });
  }, this);

  this.flowClassStatistics.forEach(function (flowClass) {
    flowClass.statistics.occurancesByMonth.meanOccurancesInMonthOverYears.forEach(function (month) {
      if (month.Years.length > 0) {
        month.Years = index$82(month.Years);
        month.meanOccurances = mean(index$83(month.Years));
      }
    });
  });

  this.flowClassStatistics.forEach(function (flowClass) {
    flowClass.statistics.occurancesByMonth.maxOccurancesInMonth.forEach(function (month, index) {
      if (!Array.isArray(flowClass.statistics.occurancesByMonth.meanOccurancesInMonthOverYears[index].Years)) {
        month.maxOccurancesInMonth = max$1(index$83(flowClass.statistics.occurancesByMonth.meanOccurancesInMonthOverYears[index].Years));
      }
    });
  });

  this.flowClassStatistics.forEach(function (flowClass) {
    flowClass.statistics.occurancesByMonth.minOccurancesInMonth.forEach(function (month, index) {
      if (!Array.isArray(flowClass.statistics.occurancesByMonth.meanOccurancesInMonthOverYears[index].Years)) {
        month.minOccurancesInMonth = min$1(index$83(flowClass.statistics.occurancesByMonth.meanOccurancesInMonthOverYears[index].Years));
      }
    });
  });
};

CollectionOfFlowClasses.prototype.getCountOfOccurancesOfFlowClassifications = function () {
  this._addStatsObjToFlowClasses('totalCountOfOccurances', 0);

  this.flowClassEvents.forEach(function (recordSet) {
    var statsObj = this._getClassStatisticObjByName(recordSet.flowClass);
    statsObj.statistics.totalCountOfOccurances++;
  }, this);
};

CollectionOfFlowClasses.prototype.getDateRangeOfRecordSets = function () {
  var firstSetRecords = this.flowClassEvents[0].records;
  this.dateRange = {
    firstDate: firstSetRecords[0].date,
    firstYear: getFiscalYear(firstSetRecords[0].date),
    lastDate: firstSetRecords[firstSetRecords.length - 2].date,
    lastYear: getFiscalYear(firstSetRecords[firstSetRecords.length - 2].date)
  };

  this.flowClassEvents.forEach(function (recordSet) {
    if (checkIfBefore(recordSet.records[0].date, this.dateRange.firstDate)) {
      this.dateRange.firstDate = recordSet.records[0].date;
      this.dateRange.firstYear = getFiscalYear(recordSet.records[0].date);
    }
    if (checkIfAfter(recordSet.records[0].date, this.dateRange.lastDate)) {
      this.dateRange.lastDate = recordSet.records[0].date;
      this.dateRange.lastYear = getFiscalYear(recordSet.records[0].date);
    }
  }, this);
};

CollectionOfFlowClasses.prototype.getOccurancesOfFlowClassificationsByYear = function () {
  if (!this.flowClassStatistics.dateRange) {
    this.getDateRangeOfRecordSets();
  }
  this._addStatsObjToFlowClasses('occurancesByYear', {
    firstYearRecorded: null,
    lastYearRecorded: null,
    yearsRecorded: [],
    numberYearsWithRecords: null,
    meanOccurancesForAllYears: null,
    meanOccurancesForYearsWherePresent: null,
    maxOccurancesInYear: null,
    minOccurancesInYear: null
  });

  this.flowClassEvents.forEach(function (recordSet) {
    var statsObj = this._getClassStatisticObjByName(recordSet.flowClass);
    if (!statsObj.statistics.occurancesByYear.firstYearRecorded) {
      statsObj.statistics.occurancesByYear.firstYearRecorded = recordSet.records[0].date.getFullYear();
    } else if (statsObj.statistics.occurancesByYear.firstYearRecorded > recordSet.records[0].date.getFullYear()) {
      statsObj.statistics.occurancesByYear.firstYearRecorded = recordSet.records[0].date.getFullYear();
    }

    if (!statsObj.statistics.occurancesByYear.lastYearRecorded) {
      statsObj.statistics.occurancesByYear.lastYearRecorded = recordSet.records[0].date.getFullYear();
    } else if (statsObj.statistics.occurancesByYear.lastYearRecorded < recordSet.records[0].date.getFullYear()) {
      statsObj.statistics.occurancesByYear.lastYearRecorded = recordSet.records[0].date.getFullYear();
    }

    statsObj.statistics.occurancesByYear.yearsRecorded.push(recordSet.records[0].date.getFullYear());
  }, this);

  this.flowClassStatistics.forEach(function (flowClass) {
    if (flowClass.statistics.occurancesByYear.yearsRecorded.length > 0) {
      flowClass.statistics.occurancesByYear.countByYear = index$82(flowClass.statistics.occurancesByYear.yearsRecorded);
      flowClass.statistics.occurancesByYear.numberYearsWithRecords = Object.keys(flowClass.statistics.occurancesByYear.countByYear).length;
      var countValues = index$83(flowClass.statistics.occurancesByYear.countByYear);
      flowClass.statistics.occurancesByYear.meanOccurancesForYearsWherePresent = mean(countValues);
      flowClass.statistics.occurancesByYear.maxOccurancesInYear = max$1(countValues);
      flowClass.statistics.occurancesByYear.minOccurancesInYear = min$1(countValues);
      var totalYears = getDifferenceInYears(this.dateFirstRecord, this.dateLastRecord);
      flowClass.statistics.occurancesByYear.numberYearsWithNoRecordsAcrossAllRecordSets = Math.abs(getDifferenceInYears(this.dateFirstRecord, this.dateLastRecord)) - flowClass.statistics.occurancesByYear.numberYearsWithRecords;
      var tempArray = new Array(flowClass.statistics.occurancesByYear.numberYearsWithNoRecordsAcrossAllRecordSets);
      tempArray.fill(0);
      var filledArray = index$83(flowClass.statistics.occurancesByYear.countByYear).concat(tempArray);
      flowClass.statistics.occurancesByYear.meanOccurancesForAllYears = mean(filledArray);
    }
  }, this);
};

CollectionOfFlowClasses.prototype.getDaysBetweenFlowClassifications = function () {
  this.flowClassEvents.forEach(function (set, index) {
    if (index < this.flowClassEvents.length) {
      var nextFlowOccurance = this._findNextOccuranceOfFlowClassification(index, set.flowClass);
      if (nextFlowOccurance) {
        set.daysUntilNextOccurance = Math.abs(getDifferenceInDays(nextFlowOccurance.records[0].date, set.records[set.records.length - 1].date));
      } else {
        set.daysUntilNextOccurance = null;
      }
    }
  }, this);
};

CollectionOfFlowClasses.prototype.calcmeanDaysBetweenFlowClassifications = function () {
  this._addStatsObjToFlowClasses('meanDaysBetweenOccurances', { values: [], mean: null });

  this.flowClassEvents.forEach(function (recordSet) {
    var statsObj = this._getClassStatisticObjByName(recordSet.flowClass);
    if (recordSet.daysUntilNextOccurance) {
      statsObj.statistics.meanDaysBetweenOccurances.values.push(recordSet.daysUntilNextOccurance);
    }
  }, this);

  this.flowClassStatistics.forEach(function (flowClass) {
    if (flowClass.statistics.meanDaysBetweenOccurances.values.length > 0) {
      flowClass.statistics.meanDaysBetweenOccurances.mean = mean(flowClass.statistics.meanDaysBetweenOccurances.values);
    }
  });
};

CollectionOfFlowClasses.prototype.calcmeanDurationOfFlowClassification = function () {
  this._addStatsObjToFlowClasses('meanLengthOfFlowOccurances', { values: [], mean: null });

  this.flowClassEvents.forEach(function (recordSet) {
    var statsObj = this._getClassStatisticObjByName(recordSet.flowClass);
    statsObj.statistics.meanLengthOfFlowOccurances.values.push(recordSet.records.length);
  }, this);

  this.flowClassStatistics.forEach(function (flowClass) {
    if (flowClass.statistics.meanLengthOfFlowOccurances.values.length > 0) {
      flowClass.statistics.meanLengthOfFlowOccurances.mean = mean(flowClass.statistics.meanLengthOfFlowOccurances.values);
    }
  });
};

CollectionOfFlowClasses.prototype.getFlowPeaksByClass = function (percentiles) {
  this._addStatsObjToFlowClasses('flowPeakDurations', { values: [], mean: null, percentiles: [] });

  this.flowClassEvents.forEach(function (recordSet) {
    var statsObj = this._getClassStatisticObjByName(recordSet.flowClass);
    if (recordSet.records[0].peak) {
      statsObj.statistics.flowPeakDurations.values.push(recordSet.records.length);
    }
  }, this);

  this.flowClassStatistics.forEach(function (flowClass) {
    if (flowClass.statistics.flowPeakDurations.values.length > 0) {
      flowClass.statistics.flowPeakDurations.mean = mean(flowClass.statistics.flowPeakDurations.values);
      percentiles.forEach(function (percentile) {
        flowClass.statistics.flowPeakDurations.percentiles.push({
          percentile: percentile,
          score: quantile(flowClass.statistics.flowPeakDurations.values, percentile)
        });
      });
    }
  });
};

CollectionOfFlowClasses.prototype.getPeaksAboveThresholdByYear = function () {
  if (!this.flowClassStatistics.dateRange) {
    this.getDateRangeOfRecordSets();
  }
  if (!this.flowClassStatistics[0].statistics.occurancesOfPeaksByYear) {
    this.getOccurancesOfFlowPeaksByYear();
  }
  this._addStatsObjToFlowClasses('peaksAboveThresholdByYear', {
    countByYear: {},
    meanOccurancesForYearsWherePresent: null,
    countYearsWherePresent: null
  });

  this.flowClassStatistics.forEach(function (flowClass, index) {
    if (flowClass.statistics.occurancesOfPeaksByYear.yearsRecorded.length > 0) {

      for (var i = index; i < this.flowClassStatistics.length; i++) {
        index$84(this.flowClassStatistics[i].statistics.occurancesOfPeaksByYear.countByYear, function (value, key) {
          if (!flowClass.statistics.peaksAboveThresholdByYear.countByYear[key]) {
            flowClass.statistics.peaksAboveThresholdByYear.countByYear[key] = value;
          } else {
            flowClass.statistics.peaksAboveThresholdByYear.countByYear[key] = flowClass.statistics.peaksAboveThresholdByYear.countByYear[key] + value;
          }
        });
      }
      flowClass.statistics.peaksAboveThresholdByYear.meanOccurancesForYearsWherePresent = mean(index$83(flowClass.statistics.peaksAboveThresholdByYear.countByYear));
      flowClass.statistics.peaksAboveThresholdByYear.countYearsWherePresent = index$83(flowClass.statistics.peaksAboveThresholdByYear.countByYear).length;
      flowClass.statistics.peaksAboveThresholdByYear.sumOfEvents = sum(index$83(flowClass.statistics.peaksAboveThresholdByYear.countByYear));
    }
  }, this);
};

CollectionOfFlowClasses.prototype.getOccurancesOfFlowPeaksByYear = function () {
  if (!this.flowClassStatistics.dateRange) {
    this.getDateRangeOfRecordSets();
  }
  this._addStatsObjToFlowClasses('occurancesOfPeaksByYear', {
    firstYearRecorded: null,
    lastYearRecorded: null,
    yearsRecorded: [],
    numberYearsWithRecords: null,
    meanOccurancesForAllYears: null,
    meanOccurancesForYearsWherePresent: null,
    maxOccurancesInYear: null,
    minOccurancesInYear: null
  });

  this.flowClassEvents.forEach(function (recordSet) {
    if (recordSet.records[0].peak) {
      var lastRecord = recordSet.records[recordSet.records.length - 1];
      var statsObj = this._getClassStatisticObjByName(recordSet.flowClass);
      if (!statsObj.statistics.occurancesOfPeaksByYear.firstYearRecorded) {
        statsObj.statistics.occurancesOfPeaksByYear.firstYearRecorded = getFiscalYear(lastRecord.date);
      } else if (statsObj.statistics.occurancesOfPeaksByYear.firstYearRecorded !== getFiscalYear(lastRecord.date)) {
        statsObj.statistics.occurancesOfPeaksByYear.firstYearRecorded = getFiscalYear(lastRecord.date);
      }

      if (!statsObj.statistics.occurancesOfPeaksByYear.lastYearRecorded) {
        statsObj.statistics.occurancesOfPeaksByYear.lastYearRecorded = getFiscalYear(lastRecord.date);
      } else if (statsObj.statistics.occurancesOfPeaksByYear.lastYearRecorded !== getFiscalYear(lastRecord.date)) {
        statsObj.statistics.occurancesOfPeaksByYear.lastYearRecorded = getFiscalYear(lastRecord.date);
      }

      statsObj.statistics.occurancesOfPeaksByYear.yearsRecorded.push(getFiscalYear(lastRecord.date));
    }
  }, this);

  this.flowClassStatistics.forEach(function (flowClass) {
    if (flowClass.statistics.occurancesOfPeaksByYear.yearsRecorded.length > 0) {
      flowClass.statistics.occurancesOfPeaksByYear.countByYear = index$82(flowClass.statistics.occurancesOfPeaksByYear.yearsRecorded);
      flowClass.statistics.occurancesOfPeaksByYear.numberYearsWithRecords = Object.keys(flowClass.statistics.occurancesOfPeaksByYear.countByYear).length;
      flowClass.statistics.occurancesOfPeaksByYear.meanOccurancesForYearsWherePresent = mean(index$83(flowClass.statistics.occurancesOfPeaksByYear.countByYear));
      flowClass.statistics.occurancesOfPeaksByYear.numberYearsWithNoRecordsAcrossAllRecordSets = Math.abs(getDifferenceInYears(this.flowClassStatistics.dateRange.firstDate, this.flowClassStatistics.dateRange.lastDate));
      var tempArray = new Array(flowClass.statistics.occurancesOfPeaksByYear.numberYearsWithNoRecordsAcrossAllRecordSets);
      tempArray.fill(0);
      var filledArray = index$83(flowClass.statistics.occurancesOfPeaksByYear.countByYear).concat(tempArray);
      flowClass.statistics.occurancesOfPeaksByYear.meanOccurancesForAllYears = mean(filledArray);
      flowClass.statistics.occurancesOfPeaksByYear.maxOccurancesInYear = max$1(index$83(flowClass.statistics.occurancesOfPeaksByYear.countByYear));
      flowClass.statistics.occurancesOfPeaksByYear.minOccurancesInYear = min$1(index$83(flowClass.statistics.occurancesOfPeaksByYear.countByYear));
    }
  }, this);
};

CollectionOfFlowClasses.prototype.getOccurancesOfFlowPeaksByMonth = function () {

  this._addStatsObjToFlowClasses('occurancesOfPeaksByMonth', {
    monthsRecorded: [],
    maxOccurancesInMonth: null,
    minOccurancesInMonth: null
  });

  this.flowClassEvents.forEach(function (recordSet) {
    if (recordSet.records[0].peak) {
      var lastRecord = recordSet.records[recordSet.records.length - 1];
      var statsObj = this._getClassStatisticObjByName(recordSet.flowClass);

      statsObj.statistics.occurancesOfPeaksByMonth.monthsRecorded.push(lastRecord.date.getMonth());
    }
  }, this);

  this.flowClassStatistics.forEach(function (flowClass) {
    if (flowClass.statistics.occurancesOfPeaksByMonth.monthsRecorded.length > 0) {
      flowClass.statistics.occurancesOfPeaksByMonth.countByMonth = index$82(flowClass.statistics.occurancesOfPeaksByMonth.monthsRecorded);
      for (var i = 0; i < 12; i++) {
        if (!flowClass.statistics.occurancesOfPeaksByMonth.countByMonth[i]) {
          flowClass.statistics.occurancesOfPeaksByMonth.countByMonth[i] = 0;
        }
      }
      flowClass.statistics.occurancesOfPeaksByMonth.maxOccurancesInMonth = max$1(index$83(flowClass.statistics.occurancesOfPeaksByMonth.countByMonth));
      flowClass.statistics.occurancesOfPeaksByMonth.minOccurancesInMonth = min$1(index$83(flowClass.statistics.occurancesOfPeaksByMonth.countByMonth));
    }
  }, this);
};

CollectionOfFlowClasses.prototype.getRateOfFallByClass = function (percentiles) {
  this._addStatsObjToFlowClasses('rateOfFall', { values: [], percentiles: [] });

  this.flowClassEvents.forEach(function (recordSet) {
    var statsObj = this._getClassStatisticObjByName(recordSet.flowClass);
    recordSet.records.forEach(function (record) {
      if (record.rateOfFall) {
        statsObj.statistics.rateOfFall.values.push(record.rateOfFall);
      }
    });
  }, this);

  this.flowClassStatistics.forEach(function (flowClass) {
    if (flowClass.statistics.rateOfFall.values.length > 0) {
      percentiles.forEach(function (percentile) {
        flowClass.statistics.rateOfFall.percentiles.push({
          percentile: percentile,
          score: quantile(flowClass.statistics.rateOfFall.values, percentile)
        });
      });
    }
  });
};

CollectionOfFlowClasses.prototype.getRateOfRiseByClass = function (percentiles) {
  this._addStatsObjToFlowClasses('rateOfRise', { values: [], percentiles: [] });

  this.flowClassEvents.forEach(function (recordSet) {
    var statsObj = this._getClassStatisticObjByName(recordSet.flowClass);
    recordSet.records.forEach(function (record) {
      if (record.rateOfRise) {
        statsObj.statistics.rateOfRise.values.push(record.rateOfRise);
      }
    });
  }, this);

  this.flowClassStatistics.forEach(function (flowClass) {
    if (flowClass.statistics.rateOfRise.values.length > 0) {
      percentiles.forEach(function (percentile) {
        flowClass.statistics.rateOfRise.percentiles.push({
          percentile: percentile,
          score: quantile(flowClass.statistics.rateOfRise.values, percentile)
        });
      });
    }
  });
};

CollectionOfFlowClasses.prototype._findNextOccuranceOfFlowClassification = function (currentIndex, className) {
  var i = currentIndex + 1;
  for (i; i < this.flowClassEvents.length; i++) {
    if (this.flowClassEvents[i].flowClass === className) {
      return this.flowClassEvents[i];
    }
  }
};

CollectionOfFlowClasses.prototype._getClassStatisticObjByName = function (className) {

  for (var i = 0; i < this.flowClassStatistics.length; i++) {
    if (this.flowClassStatistics[i].className === className) {
      return this.flowClassStatistics[i];
    }
  }
};

CollectionOfFlowClasses.prototype._addStatsObjToFlowClasses = function (name, obj) {
  this.flowClassStatistics.forEach(function (flowClass) {
    flowClass.statistics[name] = clone$1(obj);
  });
};

CollectionOfFlowClasses.prototype.compareFlowClassShapes = function (percentiles) {
  this._addStatsObjToFlowClasses('flowShapes', { events: [] });
  this.flowClassEvents.forEach(function (recordSet, index) {
    var statsObj = this._getClassStatisticObjByName(recordSet.flowClass);
    if (recordSet.records[0].peak) {
      var eventValues = [];
      var actualVals = recordSet.records.map(function (record) {
        return record.volume;
      });
      eventValues = actualVals.concat(eventValues);
      var startOfFlowIndex = index - 1;
      if (startOfFlowIndex > 0) {
        while (!this.flowClassEvents[startOfFlowIndex].records[0].peak) {
          var vals = this.flowClassEvents[startOfFlowIndex].records.map(function (record) {
            return record.volume;
          });
          eventValues = vals.concat(eventValues);
          startOfFlowIndex--;
        }
        var finalVals = this.flowClassEvents[startOfFlowIndex].records.map(function (record) {
          return record.volume;
        });
        eventValues = finalVals.concat(eventValues);
      }

      var endOfFlowIndex = index + 1;
      if (endOfFlowIndex < this.flowClassEvents.length - 1) {
        while (!this.flowClassEvents[endOfFlowIndex].records[0].peak) {
          var laterVals = this.flowClassEvents[endOfFlowIndex].records.map(function (record) {
            return record.volume;
          });
          eventValues = eventValues.concat(laterVals);
          if (endOfFlowIndex === this.flowClassEvents.length - 1) {
            break;
          }
          endOfFlowIndex++;
        }
        var finalEndVals = this.flowClassEvents[endOfFlowIndex].records.map(function (record) {
          return record.volume;
        });
        eventValues = eventValues.concat(finalEndVals);
      }
      statsObj.statistics.flowShapes.events.push(eventValues);
    }
  }, this);
};

// import json2csv from 'json2csv'
// import fs from 'fs'
function clone$1(obj) {
  var copy;
  if (obj == null || (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object') return obj;
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone$1(obj[i]);
    }
    return copy;
  }

  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone$1(obj[attr]);
    }
    return copy;
  }
  throw new Error('Unable to copy obj.');
}

// export function exportToCSV (filename, data) {
//   var csv = json2csv({
//     data: data
//   })
//   fs.writeFile(filename, csv, function (err) {
//     if (err) throw err
//   })
// }

// export function combineFlowClassCollections (arrayCollections) {
//   var collection = new CollectionOfFlowClasses()

//   arrayCollections.forEach(function (fcCollection) {
//     collection.addClassDefinitions(fcCollection.classDefinitions)
//     collection.addFlowClassEvents(fcCollection.flowClassEvents.slice(0))
//   })
//   return collection
// }

function FlowClassEvent(records, fc, fcType) {
  this.records = records;
  this.flowClass = fc;
  this.flowClassType = fcType;
}

FlowClassEvent.prototype = Object.create(FlowClassEvent.prototype);

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$2 = 9007199254740991;

/** `Object#toString` result references. */
var argsTag$2 = '[object Arguments]';
var funcTag$2 = '[object Function]';
var genTag$2 = '[object GeneratorFunction]';

/** Used to detect unsigned integer values. */
var reIsUint$2 = /^(?:0|[1-9]\d*)$/;

/**
 * A specialized version of `_.forEachRight` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEachRight(array, iteratee) {
  var length = array ? array.length : 0;

  while (length--) {
    if (iteratee(array[length], length, array) === false) {
      break;
    }
  }
  return array;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes$2(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg$2(func, transform) {
  return function (arg) {
    return func(transform(arg));
  };
}

/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$2.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$2 = objectProto$2.toString;

/** Built-in value references. */
var propertyIsEnumerable$2 = objectProto$2.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys$2 = overArg$2(Object.keys, Object);

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys$2(value, inherited) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  var result = isArray$3(value) || isArguments$2(value) ? baseTimes$2(value.length, String) : [];

  var length = result.length,
      skipIndexes = !!length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$2.call(value, key)) && !(skipIndexes && (key == 'length' || isIndex$2(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * The base implementation of `_.forEachRight` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */
var baseEachRight = createBaseEach$1(baseForOwnRight, true);

/**
 * This function is like `baseFor` except that it iterates over properties
 * in the opposite order.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseForRight = createBaseFor$1(true);

/**
 * The base implementation of `_.forOwnRight` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwnRight(object, iteratee) {
  return object && baseForRight(object, iteratee, keys$3);
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys$2(object) {
  if (!isPrototype$2(object)) {
    return nativeKeys$2(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$2.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach$1(eachFunc, fromRight) {
  return function (collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike$2(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length,
        index = fromRight ? length : -1,
        iterable = Object(collection);

    while (fromRight ? index-- : ++index < length) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor$1(fromRight) {
  return function (object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex$2(value, length) {
  length = length == null ? MAX_SAFE_INTEGER$2 : length;
  return !!length && (typeof value == 'number' || reIsUint$2.test(value)) && value > -1 && value % 1 == 0 && value < length;
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype$2(value) {
  var Ctor = value && value.constructor,
      proto = typeof Ctor == 'function' && Ctor.prototype || objectProto$2;

  return value === proto;
}

/**
 * This method is like `_.forEach` except that it iterates over elements of
 * `collection` from right to left.
 *
 * @static
 * @memberOf _
 * @since 2.0.0
 * @alias eachRight
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 * @see _.forEach
 * @example
 *
 * _.forEachRight([1, 2], function(value) {
 *   console.log(value);
 * });
 * // => Logs `2` then `1`.
 */
function forEachRight(collection, iteratee) {
  var func = isArray$3(collection) ? arrayEachRight : baseEachRight;
  return func(collection, typeof iteratee == 'function' ? iteratee : identity$1);
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments$2(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject$2(value) && hasOwnProperty$2.call(value, 'callee') && (!propertyIsEnumerable$2.call(value, 'callee') || objectToString$2.call(value) == argsTag$2);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray$3 = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike$2(value) {
  return value != null && isLength$2(value.length) && !isFunction$3(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject$2(value) {
  return isObjectLike$2(value) && isArrayLike$2(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction$3(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject$3(value) ? objectToString$2.call(value) : '';
  return tag == funcTag$2 || tag == genTag$2;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength$2(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$2;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject$3(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike$2(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys$3(object) {
  return isArrayLike$2(object) ? arrayLikeKeys$2(object) : baseKeys$2(object);
}

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity$1(value) {
  return value;
}

var index$85 = forEachRight;

function classifyByFlowPeakInBands(recordSet, criteria) {
  addFlowClassesBasedOnBands(recordSet, criteria);

  var records = recordSet.records;
  index$85(recordSet.records, function (record, index) {
    var nextRecordIndex = index + 1;
    var nextRecord = records[nextRecordIndex];
    if (index < records.length - 1) {

      if (nextRecord.classification < record.classification) {
        record.falling = true;
      } else {
        if (nextRecord.falling === true && nextRecord.classification === record.classification) {
          record.falling = true;
        } else {
          record.falling = false;
        }
      }
    } else {
      record.falling = false;
    }
  });

  recordSet.records.forEach(function (record, index) {
    record.rateOfFall = null;
    record.rateOfRise = null;
    if (index > 0) {
      var prevRecordIndex = index - 1;
      var prevRecord = recordSet.records[prevRecordIndex];
      record.rateOfRise = null;
      if (record.volume > prevRecord.volume) {
        record.rateOfRise = record.volume / prevRecord.volume;
      }

      if (record.volume < prevRecord.volume) {
        record.rateOfFall = record.volume / prevRecord.volume;
      }
      if (record.classification > prevRecord.classification) {
        record.rising = true;
      } else {
        if (prevRecord.rising === true && record.classification === prevRecord.classification) {
          record.rising = true;
        } else {
          record.rising = false;
        }
      }
    } else {
      record.rising = true;
    }

    if (record.rising && record.falling) {
      record.peak = true;
    } else {
      record.peak = false;
    }
  });

  var events = breakClassesIntoEvents(records, criteria);

  recordSet.records.forEach(function (record, index) {
    delete record.rising;
    delete record.falling;
    delete record.rateOfRise;
    delete record.rateOfFall;
    delete record.peak;
    delete record.classification;
  });

  return events;
}

function breakClassesIntoEvents(records, criteria) {
  var allSets = [];
  var currentSet = [];

  records.forEach(function (record, index) {
    if (record.classification !== null) {
      currentSet.push(record);
      var nextRecord = records[index + 1];
      if (!nextRecord) {
        nextRecord = {};
      }
      if (nextRecord.classification !== record.classification) {
        allSets.push(new FlowClassEvent(clone$1(currentSet), record.classification, 'Flow Peak In Band'));
        currentSet = [];
      }
    }
  });
  return allSets;
}

function addFlowClassesBasedOnBands(recordSet, classificationCriteria) {

  recordSet.records.forEach(function (record) {
    record.classification = null;
    for (var i = 0; i < classificationCriteria.length; i++) {
      var criteria = classificationCriteria[i];
      if (inRange(record.volume, criteria.flowRequirements.min, criteria.flowRequirements.max)) {
        record.classification = criteria.className;
        break;
      }
    }
  });
}

function classifyByVolumetricClass(recordSet, criteria) {
  var matchingRecordSets = [];

  var rs = [];
  var currentTotal = 0;
  var validMonths = getMonthsBasedOnRange(criteria.timing.startMonth, criteria.timing.endMonth);
  console.log(validMonths);

  recordSet.records.forEach(function (record, index) {
    if (currentTotal < criteria.flowRequirements.max && rs.length < criteria.duration.max && record.isInMonths(validMonths)) {
      var potentialVol = currentTotal + record.volume;
      if (currentTotal > criteria.flowRequirements.min && rs.length > criteria.duration.min) {
        matchingRecordSets.push(new FlowClassEvent(clone$1(rs), criteria.className, 'Volumetric'));
        rs = [];
        currentTotal = 0;
      } else {
        rs.push(record);
        currentTotal = currentTotal + record.volume;
      }
    } else {
      rs = [];
      currentTotal = 0;
    }
  });

  return matchingRecordSets;
}

function RecordSet(data, options) {
  this.options = options;
  this.records = [];
  data.forEach(function (recordData) {
    this.addRecord(recordData);
  }, this);
  return this;
}

RecordSet.prototype.addRecord = function (data) {
  this.records.push(new Record(data, this.options));
};

RecordSet.prototype.getLastRecord = function (data) {
  return this.records[this.records.length - 1];
};

RecordSet.prototype.filterByMonths = function (validMonths) {
  return new RecordSubset(this.records, 'months', validMonths);
};

RecordSet.prototype.filterByDateRange = function (minDate, maxDate) {
  return new RecordSubset(this.records, 'dateRange', { start: minDate, end: maxDate });
};

RecordSet.prototype.findPeak = function () {
  var peakVolume = 0;
  var outRecord = null;
  this.records.forEach(function (record) {
    if (record.volume > peakVolume) {
      peakVolume = record.volume;
      outRecord = record;
    }
  });
  return outRecord;
};

RecordSet.prototype.filterByPercentageOfRecords = function (minPercentage, maxPercentage) {
  return new RecordSubset(this.records, 'percentageRange', { start: minPercentage, end: maxPercentage });
};

RecordSet.prototype.calcInterquartileRange = function (property) {
  var values = this.getValuesByProperty(property);
  return interquartileRange(values);
};

RecordSet.prototype.durationInDays = function () {
  return getDifferenceInDays(this.records[0].date, this.records[this.records.length - 1]);
};

RecordSet.prototype.occursInMonth = function (monthName) {
  for (var i = 0; i < this.records.length; i++) {
    if (this.records[i].value.isInMonth(monthName)) {
      return true;
    }
  }
  return false;
};

RecordSet.prototype.calcSum = function (property) {
  var values = this.getValuesByProperty(property);
  return sum(values);
};

RecordSet.prototype.spanOfYears = function (property) {
  return getDifferenceInYears(this.records[0].date, this.records[this.records.length - 1].date);
};

RecordSet.prototype.calcLinearRegression = function (property, asDegrees) {
  var values = this.getValuesByPropertyWithIndex(property);
  var lr = linearRegression(values);
  if (!asDegrees) {
    return lr;
  } else {
    return calcSlopeLinearRegressionLine(lr);
  }
};

RecordSet.prototype.calcSlopeAsDegrees = function (property, asDegrees) {
  return convertSlopeToDegrees(this.records[this.records.length - 1][property] - this.records[0][property], this.records.length);
};

RecordSet.prototype.getValuesByProperty = function (property) {
  var values = [];
  this.records.forEach(function (record) {
    values.push(record[property]);
  }, this);
  return values;
};

RecordSet.prototype.getValuesByPropertyWithIndex = function (property) {
  var outArray = [];
  this.records.forEach(function (record, index) {
    if (record.hasVolume()) {
      outArray.push([index, record[property]]);
    }
  }, this);
  return outArray;
};

// RecordSet.prototype.exportToCSV = function (filename, options) {
//   var fields = [{
//     label: 'Volume',
//     value: function (record) {
//       return record.volume
//     }
//   }, {
//     label: 'Date',
//     value: function (record) {
//       return formatDateToString(record.date, options.dateFormat)
//     }
//   }
//   ]
//   var csv = json2csv({
//     data: this.records.toArray(),
//     fields: fields
//   })
//   fs.writeFile(filename, csv, function (err) {
//     if (err) throw err
//   })
// }

RecordSet.prototype.checkCriteria = function (criteriaObj) {
  var allPotentialRecordSets = [];
  var matchingRecordSets = [];

  this.records.forEach(function (record, index) {
    allPotentialRecordSets.push(this.records.slice(index, index + criteriaObj.duration.min));
  }, this);

  allPotentialRecordSets.forEach(function (potentialRecordSet, aprIndex) {
    var allRecordsMetCriteria = true;
    potentialRecordSet.forEach(function (record, recIndex) {
      criteriaObj.recordCriteria.forEach(function (criteria) {
        if (!record.value.meetsCriteria(criteria.property, criteria.comparitor, criteria.value)) {
          allRecordsMetCriteria = false;
        }
      });
    }, this);
    if (allRecordsMetCriteria) {
      var subset = new RecordSubset(potentialRecordSet, 'criteriaQuery', criteriaObj);
      matchingRecordSets.push(subset);
    }
  });

  matchingRecordSets.forEach(function (recordSet, index) {
    recordSet.filter.flowRequirements.forEach(function (criteria) {
      var statResult = null;
      criteria.criteriaMet = true;
      switch (criteria.statistic) {
        case 'linearRegressionSlope':
          var datasubset = recordSet.filterByPercentageOfRecords(criteria.dataSubset.perStart, criteria.dataSubset.perEnd);
          statResult = datasubset.calcLinearRegression('volume', true);
          break;
        case 'iqr':
          statResult = recordSet.calcInterquartileRange('volume');
          break;
        case 'sum':
          statResult = recordSet.calcSum('volume');
      }
      criteria.actualValue = statResult;
      if (!meetsCriteria(statResult, criteria.comparitor, criteria.value)) {
        criteria.criteriaMet = false;
        recordSet.meetsAllRequirements = false;
      }
    }, this);
  }, this);

  var onlyMRS = matchingRecordSets.filter(function (rs) {
    return rs.meetsAllRequirements === true;
  });

  return onlyMRS;
};

RecordSet.prototype.createCollectionOfFlowClasses = function (criteriaCollection) {
  var collection = new CollectionOfFlowClasses(this.records[0].date, this.records[this.records.length - 3].date);
  collection.addClassDefinitions(criteriaCollection);

  var fpb = criteriaCollection.filter(function (criteria) {
    return criteria.classificationType === 'Flow Peak In Band';
  });
  if (fpb.length > 0) {
    var flowClassEvents = classifyByFlowPeakInBands(this, fpb);
    collection.addFlowClassEvents(flowClassEvents);
  }

  criteriaCollection.forEach(function (criteria) {
    switch (criteria.classificationType) {
      case 'Volumetric':
        var flowClassEvents = classifyByVolumetricClass(this, criteria);
        collection.addFlowClassEvents(flowClassEvents);
        break;
    }
  }, this);

  return collection;
};

// RecordSet.prototype.volumeticFinder = function (criteriaObj) {
//   var matchingRecordSets = []

//   var rs = []
//   var currentTotal = 0

//   this.records.forEach(function (record, index) {
//     if (currentTotal < criteriaObj.flowRequirements.max) {
//       var potentialVol = currentTotal + record.volume
//       if (potentialVol > criteriaObj.flowRequirements.max && currentTotal > criteriaObj.flowRequirements.min 
//           && rs.length > criteriaObj.duration.min && rs.length < criteriaObj.duration.max) {
//           matchingRecordSets.push(new RecordSubset(rs, 'classification', 'OS1'))
//           rs = []
//           currentTotal = 0        
//       } else {
//         rs.push(record)
//         currentTotal = currentTotal + record.volume           
//       }
//     } else if (currentTotal < criteriaObj.flowRequirements.min && rs.length > criteriaObj.duration.max || currentTotal > criteriaObj.flowRequirements.max) {
//       rs = []
//       currentTotal = 0
//     }

//   }, this)

//   return new CollectionOfRecordSets(matchingRecordSets, criteriaObj)
// }


// RecordSet.prototype.classifyRecords = function (classificationCriteria) {
//   this.classificationCriteria = classificationCriteria
//   this.records.forEach(function (record) {
//     record.classification = null
//     for (var i = 0; i < classificationCriteria.classifications.length; i++) {
//       var criteria = classificationCriteria.classifications[i]
//       if (inRange(record[classificationCriteria.property], criteria.min, criteria.max)) {
//         record.classification = criteria.className
//         // TEMP ADD CLASS INDEX
//         record.classificationIndex = i
//         break
//       }
//     }
//   }, this)
// }

// RecordSet.prototype.breakClassifiedRecordsIntoRecordSets = function () {
//   var allSets = []
//   var currentSet = []
//   this.records.forEach(function (record, index) {
//     if (record.classification !== null) {
//       currentSet.push(record)
//       var nextRecord = this.records[index + 1]
//       if (!nextRecord) {
//         nextRecord = {}
//       }
//       if (nextRecord.classification !== record.classification) {
//         allSets.push(new RecordSubset(currentSet, 'classification', record.classification))
//         currentSet = []
//       }
//     }

//   }, this)
//   return new CollectionOfRecordSets(allSets, this.classificationCriteria)
// }

// RecordSet.prototype.iansApproach = function () {
//   var records = this.records
//   forEachReverse(this.records, function (record, index) {
//     var nextRecordIndex = index + 1
//     var nextRecord = records[nextRecordIndex]
//     if (index < records.length - 1) {

//       if (nextRecord.classificationIndex < record.classificationIndex) {
//         record.falling = true
//       } else {
//         if (nextRecord.falling === true && nextRecord.classificationIndex === record.classificationIndex) {
//           record.falling = true
//         } else {
//           record.falling = false
//         }
//       }
//     } else {
//       record.falling = false
//     }

//   })

//   this.records.forEach(function (record, index) {
//     record.rateOfFall = null
//     record.rateOfRise = null
//     if (index > 0) {
//       var prevRecordIndex = index - 1
//       var prevRecord = this.records[prevRecordIndex]
//       record.rateOfRise = null
//       if (record.volume > prevRecord.volume) {
//         record.rateOfRise = record.volume / prevRecord.volume
//       }

//       if (record.volume < prevRecord.volume) {
//         record.rateOfFall = record.volume / prevRecord.volume
//       }
//       if (record.classificationIndex > prevRecord.classificationIndex) {
//         record.rising = true
//       } else {
//         if (prevRecord.rising === true && record.classificationIndex === prevRecord.classificationIndex) {
//           record.rising = true
//         } else {
//           record.rising = false
//         }
//       }
//     } else {
//       record.rising = true
//     }

//     if (record.rising && record.falling) {
//       record.peak = true
//     } else {
//       record.peak = false
//     }
//   }, this)

// }

// RecordSet.prototype.calcDurations = function (criteria) {
//   var outStats = []
//   criteria.classifications.forEach(function (classification, classIndex) {

//     var durationEventWaist = []
//     var countAboveWaist = 0
//     var isAboveBand = true
//     var isBelowNextBand = true

//     this.records.forEach(function (record, index) {

//       var waistVal = classification.max / 2
//       if (record.volume >= waistVal) {
//         countAboveWaist++
//       } else {
//         countAboveWaist = 0
//       }
//       if (countAboveWaist >= 1) {
//         if (record.volume > classification.max) {
//           isAboveBand = true
//         }
//       } else {
//         isAboveBand = false
//       }

//       if (countAboveWaist >= 1) {
//         if (record.volume > criteria.classifications[classIndex + 1].max) {
//           isBelowNextBand = true
//         }
//       } else {
//         isBelowNextBand = false
//       }
//       if (countAboveWaist > 0 && !isBelowNextBand && isAboveBand && this.records[index + 1].volume < waistVal) {
//         durationEventWaist.push(countAboveWaist)
//       }

//     }, this)
//     var medianVal = null
//     if (durationEventWaist.length > 0) {
//       medianVal = median(durationEventWaist)
//     }
//     outStats.push({
//       classname: classification.className,
//       values: durationEventWaist,
//       median: medianVal
//     })

//   }, this)
//   return outStats
// }

exports.RecordSet = RecordSet;
//# sourceMappingURL=hydrology.js.map
