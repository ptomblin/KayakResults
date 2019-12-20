/* global $, PouchDB, fetch */

var COUCHURL = 'http://127.0.0.1:5984';
var CONFIG_DB = '/config-db/';
var POUCH_RACE_DB = 'kayakresults_racedb';
var POUCH_CONFIG_DB = 'kayakresults_localconfig';

function getQueryParams (qs) {
  qs = qs.split('+').join(' ');

  var params = {};
  var tokens;
  var re = /[?&]?([^=]+)=([^&]*)/g;

  while (tokens = re.exec(qs)) {
    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }

  return params;
}

function FatalError () {
  Error.apply(this, arguments);
  this.name = 'FatalError';
}
FatalError.prototype = Object.create(Error.prototype);

function logError (error) {
  $('#message-area').html('<div class="alert alert-danger">' + error + '</div>');
  $('body').removeClass('loading').addClass('error');
}

function logWarning (warning) {
  $('#message-area').html('<div class="alert alert-warning">' + warning + '</div>');
  $('body').removeClass('loading').addClass('warning');
}

function BoatClass (name, hasCrew) {
  this.name = name;
  this.hasCrew = hasCrew;
}

var initDate = new Date(2000, 1, 1);
initDate.setUTCHours(0);
initDate.setUTCMinutes(0);
initDate.setUTCSeconds(0);
initDate.setUTCMinutes(0);

function hhmmssToDate (str) {
  var d = new Date(initDate.getTime());
  var numbers = str.match(/[\d.]+/g).map(Number);
  d.setUTCSeconds(numbers.pop());
  if (numbers.length > 0) {
    d.setUTCMinutes(numbers.pop());
  }
  if (numbers.length > 0) {
    d.setUTCHours(numbers.pop());
  }
  return d;
}

function millisecondsToHHMMSS (num) {
  var seconds = Math.round(num / 1000);
  var hours = Math.floor(seconds / (60 * 60));
  var divMins = seconds % (60 * 60);
  var mins = Math.floor(divMins / 60);
  var secs = Math.ceil(divMins % 60);
  return ('00' + hours).slice(-2) + ':' + ('00' + mins).slice(-2) + ':' + ('00' + secs).slice(-2);
}

function slugify (string) {
  const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;';
  const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------';
  const p = new RegExp(a.split('').join('|'), 'g');

  return string.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, function (c) { return b.charAt(a.indexOf(c)); }) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word characters
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

function htmlEscape (str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function htmlUnescape (str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

var defaultRaceConfig = {
  _id: 'config',
  race_director: 'Paul Tomblin',
  race_director_id: 'ptomblin',
  race_name: 'Round The Mountain 2020',
  race_date: '2020/04/20',
  age_categories: [
    'Under 50',
    'Over 50',
    'Mixed'
  ],
  gender_categories: [
    'Male',
    'Female',
    'Mixed'
  ],
  boat_classes: [
    {
      category: 'Guideboat',
      classes: [
        {
          Name: '1 Person',
          hasCrew: false
        },
        {
          Name: '2 Person',
          hasCrew: true
        },
        {
          Name: 'Open Touring',
          hasCrew: false
        }
      ]
    },
    {
      category: 'Kayak',
      classes: [
        {
          Name: 'Recreational',
          hasCrew: false
        },
        {
          Name: 'K-1 Touring',
          hasCrew: false
        },
        {
          Name: 'K-1 Unlimited',
          hasCrew: false
        },
        {
          Name: 'K-2 Double Kayak',
          hasCrew: true
        }
      ]
    },
    {
      category: 'Canoe',
      classes: [
        {
          Name: 'Solo Recreational',
          hasCrew: false
        },
        {
          Name: 'Double Recreational',
          hasCrew: true
        },
        {
          Name: 'C-1 Stock',
          hasCrew: false
        },
        {
          Name: 'C-2 Stock',
          hasCrew: true
        },
        {
          Name: 'C-2 Amateur',
          hasCrew: true
        },
        {
          Name: 'C-4 Stock',
          hasCrew: true
        },
        {
          Name: 'Voyageur',
          hasCrew: true
        }
      ]
    },
    {
      category: 'SUP',
      classes: [
        {
          Name: '12\' 6" Class',
          hasCrew: false
        },
        {
          Name: '14\' Class',
          hasCrew: false
        }
      ]
    }
  ]
};
