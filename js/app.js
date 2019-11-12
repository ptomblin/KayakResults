/* eslint-disable no-console */

function BoatClass(name, hasCrew) {
    this.name = name;
    this.hasCrew = hasCrew;
}
// This stuff should be in a config file or something:
var title = 'Saranac Lake 12 Miler';
var age_categories = ['Under 50', 'Over 50', 'Mixed'];
var boat_classes = {
    'Guideboat': [new BoatClass('1 Person', false), new BoatClass('2 Person', true), new BoatClass('Open Touring', false)],
    'Kayak': [new BoatClass('Recreational', false), new BoatClass('K-1 Touring', false), new BoatClass('K-1 Unlimited', false), new BoatClass('2 Person Kayak', true)],
    'Canoe': [new BoatClass('Solo Recreational', false), new BoatClass('C-1 Stock', false), new BoatClass('C-2 Stock', true), new BoatClass('C-2 Amateur', true), new BoatClass('C-4 Stock', true), new BoatClass('Voyageur', true)],
    'SUP': [new BoatClass('12\'6" Class', false), new BoatClass('14\' Class', false)]
};


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
    //this.pdb.on('error', function(err) {}); DO SOMETHING
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
            if (info.direction == 'pull') {
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
    var o = {},
        that = this;

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
    var cat_class = this.entryformobj.boatclass.value.split('/');
    o.boatcategory = cat_class.length > 0 ? cat_class[0] : '';
    o.boatclass = cat_class.length > 0 ? cat_class[1] : '';
    o.category = o.boatcategory + ' ' + o.boatclass + ' ' + o.agecategory + ' ' + o.gendercategory;
    o.modified = new Date().getTime();
    this.pdb.put(o).then(function(response) {
        that.reporter(response);
        if (response && response.ok) {
            $('#entries-tab').tab('show');
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
    var bc = boat_classes[rowData.boatcategory].filter(function(b) { return b.name == rowData.boatclass; })[0];
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
    if (record.p2name != '') {
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
    var that = this;
    this.pdb.allDocs({ 'include_docs': true }).then(function(response) {
        that.reporter(response);
        var data = response.rows.filter(function(val) {
            return Boolean(val.doc.category);
        }).map(function(val) {
            return val.doc;
        });
        var entryTable = $('#entries-table').DataTable({
            destroy: true,
            select: true,
            rowGroup: {
                dataSrc: 'category'
            },
            orderFixed: [
                [0, 'asc']
            ],
            data: data,
            columnDefs: [{ visible: false, targets: [0] }],
            columns: [
                { data: 'category' },
                { data: 'boatnumber' },
                { data: 'p1name' },
                { data: 'p1addr2' },
                { data: 'p2name' },
                { data: 'p2addr2' }
            ],
            searching: false,
            lengthChange: true,
            buttons: [
                'print',
                'pdfHtml5',
                'csvHtml5'
            ]
        });
        entryTable.on('select', function(e, dt, type, indexes) {
            var rowData = dt.rows(indexes).data().toArray()[0];
            that.editEntry(rowData);
        });
        $('#entries-tab-button-div').append(entryTable.buttons().container());
    }).catch(function(error) {
        that.reporter(error);
        // do something
    });
};

ResultsObj.prototype.showResults = function() {
    'use strict';
    var that = this;
    this.pdb.allDocs({ 'include_docs': true }).then(function(response) {
        that.reporter(response);
        var lastPos = 0;
        var lastCat = '';
        var catLeader = null;
        var prevTime = null;
        var data = response.rows.filter(function(val) {
            return Boolean(val.doc.category);
        }).map(function(val) {
            if (val.doc.result) {
                val.doc.resDate = val.doc.result.hhmmssToDate();
            } else {
                val.doc.resDate = null;
            }
            return val.doc;
        }).sort(function(a, b) {
            if (a.category < b.category) {
                return -1;
            }
            if (a.category > b.category) {
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
            if (doc.category != lastCat) {
                lastCat = doc.category;
                lastPos = 0;
                catLeader = doc.resDate;
                prevTime = doc.resDate;
            }
            if (doc.result) {
                doc.position = ++lastPos;
                doc.behindLeader = (doc.resDate - catLeader).millisecondsToHHMMSS();
                doc.behindPrev = (doc.resDate - prevTime).millisecondsToHHMMSS();
                prevTime = doc.resDate;
            } else {
                doc.position = 'NF';
                doc.result = 'NF';
                doc.behindLeader = 'NF';
                doc.behindPrev = 'NF';
            }
            return doc;
        });
        var resultsTable = $('#results-table').DataTable({
            destroy: true,
            select: true,
            rowGroup: {
                dataSrc: 'category'
            },
            /*orderFixed: [
                [0, 'asc'],
                [1, 'asc']
            ],*/
            data: data,
            columnDefs: [{ visible: false, targets: [0] }],
            columns: [
                { data: 'category' },
                { data: 'result' },
                { data: 'position' },
                { data: 'behindLeader' },
                { data: 'behindPrev' },
                { data: 'boatnumber' },
                { data: 'p1name' },
                { data: 'p1addr2' },
                { data: 'p2name' },
                { data: 'p2addr2' }
            ],
            buttons: [
                'print',
                'pdfHtml5',
                'csvHtml5'
            ]
        });
        $('#results-tab-button-div').append(resultsTable.buttons().container());
        resultsTable.on('select', function(e, dt, type, indexes) {
            var rowData = dt.rows(indexes).data().toArray()[0];
            that.editResult(rowData);
            $('#addresult-tab').tab('show');
        });
    }).catch(function(error) {
        that.reporter(error);
        // do something
    });
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
            if (response.docs.some(function(val) { return val._id != id; })) {
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
    this.setCrewFields(event.target.dataset.hasCrew == 'true');
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
    if ($('#add_result_boat_number').val() == '') {
        $('#add_result_boat_number').focus().select();
    } else {
        $('#add_result_result').focus().select();
    }
};

var ro = new ResultsObj('kayakresults', 'http://127.0.0.1:5984');

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

String.prototype.hhmmssToDate = function() {
    var d = new Date();
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    var numbers = this.match(/[\d.]+/g).map(Number);
    d.setSeconds(numbers.pop());
    if (numbers.length > 0) {
        d.setMinutes(numbers.pop());
    }
    if (numbers.length > 0) {
        d.setHours(numbers.pop());
    }
    return d;
};

Number.prototype.millisecondsToHHMMSS = function() {
    var seconds = Math.round(this / 1000);
    var hours = Math.floor(seconds / (60 * 60));
    var divMins = seconds % (60 * 60);
    var mins = Math.floor(divMins / 60);
    var secs = Math.ceil(divMins % 60);
    return ('00' + hours).slice(-2) + ':' + ('00' + mins).slice(-2) + ':' + ('00' + secs).slice(-2);
};

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

// Initialization
document.title = title;
$('#inner-title').html(htmlEscape(title));
age_categories.forEach(function(item, index) {
    var feedback = index == age_categories.length - 1 ? '<div class="invalid-feedback"><div class="form-check">Please enter an age category</div></div>' : '';
    $('#age-category').append(`<div class="form-check form-check-inline">
        <input class="form-check-input" type="radio" name="agecategory" value="${htmlEscape(item)}" required/>
        <label class="form-check-label">${item}</label>
        ${feedback}
        </div>`);
});
for (var category in boat_classes) {
    var classes = boat_classes[category];
    var inner = '';
    classes.forEach(function(item) {
        inner = inner.concat(`<div class="form-check offset-sm-1 col-sm-2">
        <input class="form-check-input" type="radio" name="boatclass" data-category="${category}" data-has-crew="${item.hasCrew}" data-name="${item.name}" value="${htmlEscape(category+'/'+item.name)}" required/>
        <label class="form-check-label">${item.name}</label>
      </div>
        `);
    });
    $('#boat-classes').append(`<div class="form-group row">
    <div class="offset-sm-1 col-sm-11"><h4>${htmlEscape(category)}</h4></div></div>
    <div class="form-group row">${inner}</div>
    `);
}

$('#deleteEntry').on('click', ro.deleteEntry.bind(ro));
$('#clearEntry').on('click', ro.resetEntryForm.bind(ro));
$('#add_result_boat_number').on('focusout blur', ro.showEntry.bind(ro));
$('#add_result_submit').on('click', ro.saveResult.bind(ro));
$('#add_result_clear').on('click', function() { return ro.resetAddResultsForm(''); });
$('#boatnumber').on('focusout blur', ro.checkForDuplicates.bind(ro));
$('input[name="boatclass"]').change(ro.boatClassChanged.bind(ro));

$('#entries-tab').on('show.bs.tab', ro.showEntries.bind(ro));
$('#addresult-tab').on('shown.bs.tab', ro.addResultTabFocus.bind(ro));
$('#addresult-tab').on('hide.bs.tab', function() { return ro.resetAddResultsForm(''); });
$('#entry-tab').on('hide.bs.tab', ro.resetEntryForm.bind(ro));
$('#results-tab').on('show.bs.tab', ro.showResults.bind(ro));