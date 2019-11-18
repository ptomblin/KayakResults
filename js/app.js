/* eslint-disable no-console */
/* global $, PouchDB */
var COUCHURL = 'http://127.0.0.1:5984';
var CONFIG_DB = '/config-db/';

function getQueryParams(qs) {
  qs = qs.split('+').join(' ');

  var params = {},
    tokens,
    re = /[?&]?([^=]+)=([^&]*)/g;

  while (tokens = re.exec(qs)) {
    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
  }

  return params;
}

function FatalError() {
  Error.apply(this, arguments);
  this.name = 'FatalError';
}
FatalError.prototype = Object.create(Error.prototype);

var query = getQueryParams(document.location.search);
if (!query.race) {
  $('#message-area').html('<div class="alert alert-danger">Race Name Not Passed In</div>');
  $('body').removeClass('loading').addClass('error');
  throw new FatalError('Called wrong');
}

function BoatClass(name, hasCrew) {
  this.name = name;
  this.hasCrew = hasCrew;
}

var title, ageCategories, boatClasses;

//
var ResultsObj = function(databasename, remoteorigin) {
  'use strict';

  Object.defineProperty(this, 'pdb', { writable: true });
  Object.defineProperty(this, 'remote', { writable: true });
  // Object.defineProperty(this, 'entryformobj', {writable: true});
  // Object.defineProperty(this, 'notetable', {writable: true});
  // Object.defineProperty(this, 'searchentryformobj', {writable: true});
  // Object.defineProperty(this, 'errordialog', {writable: true});

  var that = this;

  // eslint-disable-next-line no-undef
  this.pdb = new PouchDB(databasename);
  this.pdb.createIndex({
    index: {
      fields: ['boatnumber']
    }
  }).then(function(result) {
    that.reporter(result);
  }).catch(function(err) {
    that.reporter('err = ' + err);
  });
  // this.pdb.on('error', function(err) {}); DO SOMETHING
  if (remoteorigin) {
    this.remote = remoteorigin + '/' + databasename;
    this.setupSync(databasename, this.remote);
  }
};

ResultsObj.prototype.setupSync = function(databasename, remote) {
  var that = this;
  this.sync = PouchDB.sync(databasename, remote, { live: true, retry: true })
    .on('change', function(info) {
      that.reporter('on change ' + info);
      if (info.direction === 'pull') {
        $('.alert.alert-warning').removeClass('d-none');
        that.reporter('it\'s a pull');
      }
    }).on('error', function(error) {
      that.reporter('sync error ' + error);
    });
};

/*
Create a function to log errors to the console for
development.
*/

ResultsObj.prototype.reporter = function(error, response) {
  'use strict';
  if (console !== undefined) {
    if (error) { console.log(error); }
    if (response) { console.log(response); }
  }
};

ResultsObj.prototype.saveRegistration = function() {
  'use strict';
  var o = {};
  var that = this;

  /* Create an id if not found */
  if (!this.entryformobj._id.value) {
    o._id = new Date().getTime() + '';
  } else {
    o._id = this.entryformobj._id.value;
  }

  if (this.entryformobj._rev.value) {
    o._rev = this.entryformobj._rev.value;
  }

  /* build the object */
  o.p1name = this.entryformobj.p1name.value;
  o.p2name = this.entryformobj.p2name.value;
  // o.p1addr1 = this.entryformobj.p1addr1.value;
  o.p1addr2 = this.entryformobj.p1addr2.value;
  // o.p2addr1 = this.entryformobj.p2addr1.value;
  o.p2addr2 = this.entryformobj.p2addr2.value;
  // o.p1phone = this.entryformobj.p1phone.value;
  // o.p2phone = this.entryformobj.p2phone.value;
  // o.p1age = this.entryformobj.p1age.value;
  // o.p2age = this.entryformobj.p2age.value;
  // o.p1email = this.entryformobj.p1email.value;
  // o.p2email = this.entryformobj.p2email.value;
  o.agecategory = this.entryformobj.agecategory.value;
  o.gendercategory = this.entryformobj.gendercategory.value;
  // o.awaMember = this.entryformobj.awaMember.value;
  // o.nymcraMember = this.entryformobj.nymcraMember.value;
  o.boatnumber = this.entryformobj.boatnumber.value;
  var catClass = this.entryformobj.boatclass.value.split('/');
  o.boatcategory = catClass.length > 0 ? catClass[0] : '';
  o.boatclass = catClass.length > 0 ? catClass[1] : '';
  o.category = o.boatcategory + ' ' + o.boatclass + ' ' + o.agecategory + ' ' + o.gendercategory;
  o.modified = new Date().getTime();
  this.pdb.put(o).then(function(response) {
    that.reporter(response);
    if (response && response.ok) {
      if (that.entryformobj._id.value) {
        $('#entries-tab').tab('show');
      } else {
        that.resetEntryForm();
      }
    }
  }).catch(function(error) {
    that.reporter('error = ' + error);
    // do something
  });
};

ResultsObj.prototype.deleteEntry = function() {
  var that = this;
  var _id = that.entryformobj._id.value;
  var _rev = that.entryformobj._rev.value;
  that.pdb.remove(_id, _rev).then(function(response) {
    if (response.ok) {
      $('#entries-tab').tab('show');
    }
  }).catch(function(error) {
    that.reporter(error);
    if (error) {
      // Do something
    }
  });
};

ResultsObj.prototype.editEntry = function(rowData) {
  this.entryformobj.boatnumber.value = rowData.boatnumber;
  this.entryformobj.boatclass.value = rowData.boatcategory + '/' + rowData.boatclass;
  var bc = boatClasses[rowData.boatcategory].filter(function(b) { return b.name === rowData.boatclass; })[0];
  this.setCrewFields(bc.hasCrew);
  this.entryformobj._id.value = rowData._id;
  this.entryformobj._rev.value = rowData._rev;
  this.entryformobj.p1name.value = rowData.p1name;
  this.entryformobj.p2name.value = rowData.p2name;
  // this.entryformobj.p1addr1.value = rowData.p1addr1
  this.entryformobj.p1addr2.value = rowData.p1addr2;
  // this.entryformobj.p2addr1.value = rowData.p2addr1
  this.entryformobj.p2addr2.value = rowData.p2addr2;
  // this.entryformobj.p1phone.value = rowData.p1phone
  // this.entryformobj.p2phone.value = rowData.p2phone
  // this.entryformobj.p1age.value = rowData.p1age
  // this.entryformobj.p2age.value = rowData.p2age
  // this.entryformobj.p1email.value = rowData.p1email
  // this.entryformobj.p2email.value = rowData.p2email
  this.entryformobj.agecategory.value = rowData.agecategory;
  this.entryformobj.gendercategory.value = rowData.gendercategory;
  // this.entryformobj.awaMember.value = rowData.awaMember
  // this.entryformobj.nymcraMember.value = rowData.nymcraMember
  $('#entry-tab').tab('show');
};

ResultsObj.prototype.resetEntryForm = function() {
  this.entryformobj.reset();
  this.entryformobj._id.value = '';
  this.entryformobj._rev.value = '';
  this.setCrewFields(true);
};

ResultsObj.prototype.showEntry = function() {
  var that = this;
  var boatNumber = $('#add_result_boat_number').val();
  that.pdb.find({
    selector: { boatnumber: boatNumber },
    fields: ['_id', 'p1name', 'p2name', 'boatcategory', 'boatclass', 'result']
  }).then(function(response) {
    that.reporter(response);
    if (response.docs.length <= 0) {
      that.resetAddResultsForm(boatNumber);
      $('#add_result_boat_number').addClass('is-invalid');
      return;
    }
    $('#add_result_submit').attr('disabled', false);
    that.updateResultBoatInfo(response.docs[0]);
  }).catch(function(error) {
    that.reporter(error);
  });
};

ResultsObj.prototype.updateResultBoatInfo = function(record) {
  $('#add_result_boat_number').removeClass('is-invalid');
  $('#add_result_category').addClass('readonly-highlight').val(record.boatcategory);
  $('#add_result_class').addClass('readonly-highlight').val(record.boatclass);
  $('#add_result_person1').addClass('readonly-highlight').val(record.p1name);
  if (record.p2name !== '') {
    $('#add_result_person2').removeClass('invisible').addClass('readonly-highlight').val(record.p2name);
  } else {
    $('#add_result_person2').removeClass('readonly-highlight').addClass('invisible');
  }
  $('#add_result_result').val(record.result);
  $('#add_result_id').val(record._id);
  $('#add_result_result').focus().select();
};

ResultsObj.prototype.resetAddResultsForm = function(boatNumber) {
  $('#add_result_submit').attr('disabled', true);
  $('#add_result_boat_number').removeClass('is-invalid').focus().select().val(boatNumber);
  $('#add_result_result').val('');
  $('#add_result_category').removeClass('readonly-highlight').val('');
  $('#add_result_class').removeClass('readonly-highlight').val('');
  $('#add_result_person1').removeClass('readonly-highlight').val('');
  $('#add_result_person2').removeClass('readonly-highlight').removeClass('invisible').val('');
  $('#add_result_id').val('');
};

ResultsObj.prototype.editResult = function(rowData) {
  $('#add_result_submit').attr('disabled', false);
  $('#add_result_boat_number').val(rowData.boatnumber);
  $('#add_result_result').val(rowData.result);
  this.updateResultBoatInfo(rowData);
};

ResultsObj.prototype.saveResult = function() {
  var that = this;
  that.pdb.get($('#add_result_id').val()).then(function(doc) {
    doc.result = $('#add_result_result').val();
    return that.pdb.put(doc);
  }).then(function(response) {
    that.reporter(response);
    if (response && response.ok) {
      that.resetAddResultsForm('');
    }
  }).catch(function(error) {
    that.reporter('error = ' + error);
    // do something
  });
};

ResultsObj.prototype.showEntries = function() {
  'use strict';
  $('.alert.alert-warning').addClass('d-none');
  var that = this;
  this.pdb.allDocs({ include_docs: true }).then(function(response) {
    that.reporter(response);
    var data = response.rows.filter(function(val) {
      return Boolean(val.doc.category);
    }).map(function(val) {
      return val.doc;
    });
    that.entryTable = $('#entries-table').DataTable({
      destroy: true,
      select: true,
      rowGroup: {
        dataSrc: 'category'
      },
      orderFixed: [
        [0, 'asc']
      ],
      data: data,
      columns: [
        { data: 'category', visible: false },
        { data: 'boatnumber', className: 'fixedTable', width: '2em' },
        { data: 'p1name', width: '25%' },
        { data: 'p1addr2', width: '15%' },
        { data: 'p2name', width: '25%' },
        { data: 'p2addr2', width: '15%' }
      ],
      searching: false,
      lengthChange: true,
      buttons: [{
          extend: 'print',
          orientation: 'landscape'
        },
        {
          extend: 'pdfHtml5',
          orientation: 'landscape'
        },
        'csvHtml5'
      ]
    });
    that.entryTable.on('select', function(e, dt, type, indexes) {
      var rowData = dt.rows(indexes).data().toArray()[0];
      that.editEntry(rowData);
    });
    $('#entries-tab-button-div').append(that.entryTable.buttons().container());
  }).catch(function(error) {
    that.reporter(error);
    // do something
  });
};

ResultsObj.prototype.shownEntries = function() {
  this.entryTable.columns.adjust().draw();
};

ResultsObj.prototype.clickCategory = function() {
  var useCategory = $('input[name="usecategory"]:checked').val() === 'yes';
  window.sessionStorage.setItem('group_by', useCategory);
  // don't show the results if the tab isn't visible
  // - used when setting the use category on a refresh
  if ($('#results-tab').hasClass('active')) {
    this.showResults();
  }
};

ResultsObj.prototype.getBestTimes = function(timeStorage, useCategory, doc) {
  var cat = !useCategory ? 'all' : doc.category;
  // If we're not using category, bestTime and prevTime come from 'all', but currentPos still comes from cat
  if (!(cat in timeStorage)) {
    timeStorage[cat] = {
      bestTime: doc.resDate,
      prevTime: doc.resDate,
      currentPos: 1
    };
  }
  if (!useCategory && !(doc.category in timeStorage)) {
    timeStorage[doc.category] = {
      currentPos: 1
    };
  }
  var prevTime = timeStorage[cat].prevTime;
  timeStorage[cat].prevTime = doc.resDate;

  return [timeStorage[cat].bestTime, prevTime, timeStorage[doc.category].currentPos++];
};

ResultsObj.prototype.showResults = function() {
  'use strict';
  $('.alert.alert-warning').addClass('d-none');

  var useCategory = $('input[name="usecategory"]:checked').val() === 'yes';
  var timeStorage = {};

  var that = this;
  this.pdb.allDocs({ include_docs: true }).then(function(response) {
    that.reporter(response);
    var data = response.rows.filter(function(val) {
      return Boolean(val.doc.category);
    }).map(function(val) {
      if (val.doc.result) {
        val.doc.resDate = hhmmssToDate(val.doc.result);
      } else {
        val.doc.resDate = null;
      }
      return val.doc;
    }).sort(function(a, b) {
      if (useCategory && a.category < b.category) {
        return -1;
      }
      if (useCategory && a.category > b.category) {
        return 1;
      }
      if (a.resDate && b.resDate) {
        return a.resDate - b.resDate;
      }
      if (a.result) {
        return -1;
      }
      if (b.result) {
        return 1;
      }
      return 0;
    }).map(function(doc) {
      if (doc.resDate) {
        var values = that.getBestTimes(timeStorage, useCategory, doc);
        var bestTime = values[0];
        var prevTime = values[1];
        var currentPos = values[2];

        doc.position = currentPos;
        doc.result = millisecondsToHHMMSS(hhmmssToDate(doc.result) - initDate);
        doc.behindLeader = millisecondsToHHMMSS(doc.resDate - bestTime);
        doc.behindPrev = millisecondsToHHMMSS(doc.resDate - prevTime);
      } else {
        doc.position = '-';
        doc.result = 'NF';
        doc.behindLeader = '-';
        doc.behindPrev = '-';
      }
      return doc;
    });
    var tableOptions = {
      destroy: true,
      select: true,
      autowidth: false,
      data: data,
      columns: [
        { data: 'category', width: '25%' },
        { data: 'result', className: 'fixedTable', width: '5em' },
        { data: 'position', className: 'fixedTable', width: '2em' },
        { data: 'behindLeader', className: 'fixedTable', width: '5em' },
        { data: 'behindPrev', className: 'fixedTable', width: '5em' },
        { data: 'boatnumber', className: 'fixedTable', width: '2em' },
        { data: 'p1name', width: '20%' },
        { data: 'p1addr2', width: '10%' },
        { data: 'p2name', width: '20%' },
        { data: 'p2addr2', width: '10%' }
      ],
      buttons: [{
          extend: 'print',
          orientation: 'landscape'
        },
        {
          extend: 'pdfHtml5',
          orientation: 'landscape'
        },
        'csvHtml5'
      ]
    };

    if (useCategory) {
      tableOptions.columns[0] = { data: 'category', visible: false };
      tableOptions.rowGroup = { dataSrc: 'category' };
      tableOptions.orderFixed = [
        [0, 'asc']
      ];
    } else {
      tableOptions.ordering = false;
    }

    that.resultsTable = $('#results-table').DataTable(tableOptions);
    $('#results-tab-button-div').append(that.resultsTable.buttons().container());
    that.resultsTable.on('select', function(e, dt, type, indexes) {
      var rowData = dt.rows(indexes).data().toArray()[0];
      that.editResult(rowData);
      $('#addresult-tab').tab('show');
    });
  }).catch(function(error) {
    that.reporter(error);
    // do something
  });
};

ResultsObj.prototype.shownResults = function() {
  this.resultsTable.columns.adjust().draw();
};

ResultsObj.prototype.checkForDuplicates = function(callback) {
  // If there is another entry with the same boat number and different _id, then
  // validation fails and so we don't save.
  var that = this;
  var boatNumber = $('#boatnumber').val();
  this.entryformobj.classList.remove('was-validated');
  var id = $('#_id').val();
  that.pdb.find({
    selector: { boatnumber: boatNumber },
    fields: ['_id']
  }).then(function(response) {
    that.reporter(response);
    if (response.docs.length > 0) {
      if (response.docs.some(function(val) { return val._id !== id; })) {
        $('#boatnumber').addClass('is-invalid');
        return;
      }
    }
    $('#boatnumber').removeClass('is-invalid');
    callback instanceof Function && callback();
  }).catch(function(error) {
    that.reporter(error);
  });
};

ResultsObj.prototype.boatClassChanged = function(event) {
  this.setCrewFields(event.target.dataset.hasCrew === 'true');
};

ResultsObj.prototype.setCrewFields = function(hasCrew) {
  if (hasCrew) {
    this.entryformobj.p2name.removeAttribute('disabled');
    this.entryformobj.p2name.setAttribute('required', 'required');
    this.entryformobj.p2addr2.removeAttribute('disabled');
    this.entryformobj.agecategory.item(2).removeAttribute('disabled');
    this.entryformobj.gendercategory.item(2).removeAttribute('disabled');
  } else {
    this.entryformobj.p2name.setAttribute('disabled', 'disabled');
    this.entryformobj.p2name.removeAttribute('required');
    this.entryformobj.p2name.value = '';
    this.entryformobj.p2addr2.setAttribute('disabled', 'disabled');
    this.entryformobj.p2addr2.value = '';
    this.entryformobj.agecategory.item(2).setAttribute('disabled', 'disabled');
    this.entryformobj.agecategory.item(2).checked = false;
    this.entryformobj.gendercategory.item(2).setAttribute('disabled', 'disabled');
    this.entryformobj.gendercategory.item(2).checked = false;
  }
};

ResultsObj.prototype.addResultTabFocus = function() {
  if ($('#add_result_boat_number').val() === '') {
    $('#add_result_boat_number').focus().select();
  } else {
    $('#add_result_result').focus().select();
  }
};

ResultsObj.prototype.refresh = function() {
  if ($('#entries-tab').hasClass('active')) {
    this.showEntries();
  }
  if ($('#results-tab').hasClass('active')) {
    this.showResults();
  }
};

var initDate = new Date(2000, 1, 1);
initDate.setUTCHours(0);
initDate.setUTCMinutes(0);
initDate.setUTCSeconds(0);
initDate.setUTCMinutes(0);

function hhmmssToDate(str) {
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

function millisecondsToHHMMSS(num) {
  var seconds = Math.round(num / 1000);
  var hours = Math.floor(seconds / (60 * 60));
  var divMins = seconds % (60 * 60);
  var mins = Math.floor(divMins / 60);
  var secs = Math.ceil(divMins % 60);
  return ('00' + hours).slice(-2) + ':' + ('00' + mins).slice(-2) + ':' + ('00' + secs).slice(-2);
}

function slugify(string) {
  const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;';
  const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------';
  const p = new RegExp(a.split('').join('|'), 'g');

  return string.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, function(c) { return b.charAt(a.indexOf(c)); }) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word characters
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

function htmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function htmlUnescape(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function recordSelectedTab(e) {
  window.sessionStorage.setItem('current_tab', e.target.attributes.id.value);
}

$('a[data-toggle="tab"]').on('shown.bs.tab', recordSelectedTab);

if (window.sessionStorage.getItem('group_by')) {
  var buttonNum = window.sessionStorage.getItem('group_by') === 'true' ? 0 : 1;
  $('input[name="usecategory"]').eq(buttonNum).parent().button('toggle');
}

if (window.sessionStorage.getItem('current_tab')) {
  $('#' + window.sessionStorage.getItem('current_tab')).tab('show');
}

if (query.race === 'saranac') {
  // Default configuration for testing
  title = 'Saranac Lake 12 Miler';
  ageCategories = ['Under 50', 'Over 50', 'Mixed'];
  boatClasses = {
    Guideboat: [new BoatClass('1 Person', false), new BoatClass('2 Person', true), new BoatClass('Open Touring', false)],
    Kayak: [new BoatClass('Recreational', false), new BoatClass('K-1 Touring', false), new BoatClass('K-1 Unlimited', false), new BoatClass('2 Person Kayak', true)],
    Canoe: [new BoatClass('Solo Recreational', false), new BoatClass('C-1 Stock', false), new BoatClass('C-2 Stock', true), new BoatClass('C-2 Amateur', true), new BoatClass('C-4 Stock', true), new BoatClass('Voyageur', true)],
    SUP: [new BoatClass('12\'6" Class', false), new BoatClass('14\' Class', false)]
  };
  initialize('kayakresults');
} else {
  fetch(COUCHURL + CONFIG_DB + query.race)
    .then(function(response) {
      if (!response.ok) {
        $('#message-area').html('<div class="alert alert-danger">Bad response from server</div>');
        $('body').removeClass('loading').addClass('error');
        throw new FatalError('Called wrong');
      }
      return response;
    }).then(function(resp) {
      return resp.json();
    }).then(function(data) {
      title = data['race_name'];
      ageCategories = data['age_categories'];
      //genderCategories = data['gender_categories'];
      boatClasses = {};
      data['boat_classes'].forEach(function(bc) {
        var classes = [];
        bc['classes'].forEach(function(cl) {
          classes.push(new BoatClass(cl['Name'], cl['Crew'] != '1'));
        });
        boatClasses[bc['category']] = classes;
      });
      initialize(query.race);
    });
}

function initialize(databasename) {

  document.title = title;
  $('#inner-title').html(htmlEscape(title));
  ageCategories.forEach(function(item, index) {
    var feedback = index === ageCategories.length - 1 ? '<div class="invalid-feedback"><div class="form-check">Please enter an age category</div></div>' : '';
    $('#age-category').append(`<div class="form-check form-check-inline">
          <input class="form-check-input" type="radio" name="agecategory" value="${htmlEscape(item)}" required/>
          <label class="form-check-label">${item}</label>
          ${feedback}
          </div>`);
  });
  for (var category in boatClasses) {
    var classes = boatClasses[category];
    var inner = '';
    classes.forEach(function(item) {
      inner = inner.concat(`<div class="form-check offset-sm-1 col-sm-2">
          <input class="form-check-input" type="radio" name="boatclass" data-category="${category}" data-has-crew="${item.hasCrew}" data-name="${item.name}" value="${htmlEscape(category + '/' + item.name)}" required/>
          <label class="form-check-label">${item.name}</label>
        </div>
          `);
    });
    $('#boat-classes').append(`<div class="form-group row">
      <div class="offset-sm-1 col-sm-11"><h4>${htmlEscape(category)}</h4></div></div>
      <div class="form-group row">${inner}</div>
      `);
  }

  var ro = new ResultsObj(databasename, COUCHURL);

  ro.entryformobj = document.getElementById('registration_form');
  ro.entriesobj = document.getElementById('entries-table');
  ro.addresultobj = document.getElementById('add_result');

  ro.entryformobj.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();
    ro.entryformobj.classList.add('was-validated');
    if (ro.entryformobj.checkValidity() === false) {
      return;
    }
    ro.checkForDuplicates(ro.saveRegistration.bind(ro));
  });

  $('#deleteEntry').on('click', ro.deleteEntry.bind(ro));
  $('#clearEntry').on('click', ro.resetEntryForm.bind(ro));
  $('#add_result_boat_number').on('focusout blur', ro.showEntry.bind(ro));
  $('#add_result_submit').on('click', ro.saveResult.bind(ro));
  $('#add_result_clear').on('click', function() { return ro.resetAddResultsForm(''); });
  $('#boatnumber').on('focusout blur', ro.checkForDuplicates.bind(ro));
  $('input[name="boatclass"]').change(ro.boatClassChanged.bind(ro));
  $('button[name="refresh"]').on('click', ro.refresh.bind(ro));
  $('input[name="usecategory"]').change(ro.clickCategory.bind(ro));
  $('#entries-tab').on('show.bs.tab', ro.showEntries.bind(ro));
  $('#entries-tab').on('shown.bs.tab', ro.shownEntries.bind(ro));
  $('#addresult-tab').on('shown.bs.tab', ro.addResultTabFocus.bind(ro));
  $('#addresult-tab').on('hide.bs.tab', function() { return ro.resetAddResultsForm(''); });
  $('#entry-tab').on('hide.bs.tab', ro.resetEntryForm.bind(ro));
  $('#results-tab').on('show.bs.tab', ro.showResults.bind(ro));
  $('#results-tab').on('shown.bs.tab', ro.shownResults.bind(ro));

  $('body').removeClass('loading');
}