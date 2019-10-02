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
    this.remote = remoteorigin + '/' + databasename;
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
    this.entryformobj.boatnumber.value = rowData.boatnumber;
    this.entryformobj.boatclass.value = rowData.boatcategory + '/' + rowData.boatclass;
    $('#entry-tab').tab('show');
};

ResultsObj.prototype.resetEntryForm = function() {
    this.entryformobj.reset();
    this.entryformobj._id.value = '';
    this.entryformobj._rev.value = '';
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
        $('#add_result_boat_number').removeClass('is-invalid');
        $('#add_result_submit').attr('disabled', false);
        var results = response.docs[0];
        $('#add_result_category').val(results.boatcategory);
        $('#add_result_class').val(results.boatclass);
        $('#add_result_person1').val(results.p1name);
        $('#add_result_person2').val(results.p2name);
        $('#add_result_result').val(results.result);
        $('#add_result_id').val(results._id);
    }).catch(function(error) {
        that.reporter(error);
    });
};

ResultsObj.prototype.resetAddResultsForm = function(boatNumber) {
    $('#add_result_boat_number').removeClass('is-invalid');
    $('#add_result_submit').attr('disabled', true);
    $('#add_result_boat_number').val(boatNumber);
    $('#add_result_result').val('');
    $('#add_result_category').val('');
    $('#add_result_class').val('');
    $('#add_result_person1').val('');
    $('#add_result_person2').val('');
    $('#add_result_id').val('');
};

ResultsObj.prototype.editResult = function(rowData) {
    $('#add_result_boat_number').val(rowData.boatnumber);
    $('#add_result_result').val(rowData.result);
    $('#add_result_category').val(rowData.boatcategory);
    $('#add_result_class').val(rowData.boatclass);
    $('#add_result_person1').val(rowData.p1name);
    $('#add_result_person2').val(rowData.p2name);
    $('#add_result_id').val(rowData._id);
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
                [0, 'asc'],
                [1, 'asc'],
                [2, 'asc'],
                [3, 'asc']
            ],
            data: data,
            columnDefs: [{ visible: false, targets: [0, 1, 2, 3] }],
            columns: [
                { data: 'boatcategory' },
                { data: 'boatclass' },
                { data: 'agecategory' },
                { data: 'gendercategory' },
                { data: 'boatnumber' },
                { data: 'p1name' },
                { data: 'p1addr2' },
                { data: 'p2name' },
                { data: 'p2addr2' }
            ]
        });
        entryTable.on('select', function(e, dt, type, indexes) {
            var rowData = dt.rows(indexes).data().toArray()[0];
            that.editEntry(rowData);
        });
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
        var data = response.rows.filter(function(val) {
            return Boolean(val.doc.category);
        }).map(function(val) {
            val.doc.result = val.doc.result || 'NF';
            return val.doc;
        });
        var resultsTable = $('#results-table').DataTable({
            destroy: true,
            select: true,
            rowGroup: {
                dataSrc: 'category'
            },
            orderFixed: [
                [0, 'asc'],
                [1, 'asc']
            ],
            data: data,
            columnDefs: [{ visible: false, targets: [0] }],
            columns: [
                { data: 'category' },
                { data: 'result' },
                { data: 'boatnumber' },
                { data: 'p1name' },
                { data: 'p1addr2' },
                { data: 'p2name' },
                { data: 'p2addr2' }
            ]
        });
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
            if (response.docs.some(val => val._id != id)) {
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
    var that = this;
    that.reporter(event);
    var hasCrew = event.target.dataset.hasCrew == 'true';
    if (hasCrew) {
        that.entryformobj.p2name.removeAttribute('disabled');
        that.entryformobj.p2name.setAttribute('required', 'required');
        that.entryformobj.p2addr2.removeAttribute('disabled');
        that.entryformobj.agecategory.item(2).removeAttribute('disabled');
        that.entryformobj.gendercategory.item(2).removeAttribute('disabled');
    } else {
        that.entryformobj.p2name.setAttribute('disabled', 'disabled');
        that.entryformobj.p2name.removeAttribute('required');
        that.entryformobj.p2name.value = '';
        that.entryformobj.p2addr2.setAttribute('disabled', 'disabled');
        that.entryformobj.p2addr2.value = '';
        that.entryformobj.agecategory.item(2).setAttribute('disabled', 'disabled');
        that.entryformobj.agecategory.item(2).checked = false;
        that.entryformobj.gendercategory.item(2).setAttribute('disabled', 'disabled');
        that.entryformobj.gendercategory.item(2).checked = false;
    }
};

var ro = new ResultsObj('kayakresults');

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

function slugify(string) {
    const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;';
    const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------';
    const p = new RegExp(a.split('').join('|'), 'g');

    return string.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
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
$('#boatnumber').on('focusout blur', ro.checkForDuplicates.bind(ro));
$('input[name="boatclass"]').change(ro.boatClassChanged.bind(ro));

$('#entries-tab').on('show.bs.tab', ro.showEntries.bind(ro));
$('#addresult-tab').on('hide.bs.tab', (function() { return ro.resetAddResultsForm(''); }()));
$('#entry-tab').on('hide.bs.tab', ro.resetEntryForm.bind(ro));
$('#results-tab').on('show.bs.tab', ro.showResults.bind(ro));