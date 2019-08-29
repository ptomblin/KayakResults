// This stuff should be in a config file or something:
var title = "Saranac Lake 12 Miler";
var age_categories = ["Under 50", "Over 50", "Mixed"];
var boat_classes = {
    "Guideboat": ["1 Person Guideboat", "2 Person Guideboat", "Open Touring Guideboat"],
    "Kayak": ["K-1 Recreational", "K-1 Touring", "K-1 Unlimited", "2 Person Kayak"],
    "Canoe": ["Solo Recreational", "C-1 Stock", "C-2 Stock", "C-2 Amateur", "C-4 Stock", "Voyageur"],
    "SUP": ["12'6\" Class", "14' Class"]
};


//
ResultsObj = function (databasename, remoteorigin) {
    'use strict';

    Object.defineProperty(this, 'pdb', {writable: true});
    Object.defineProperty(this, 'remote', {writable: true});
    // Object.defineProperty(this, 'entryformobj', {writable: true});
    // Object.defineProperty(this, 'notetable', {writable: true});
 	// Object.defineProperty(this, 'searchentryformobj', {writable: true});
 	// Object.defineProperty(this, 'errordialog', {writable: true});

    var that = this;

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
    this.pdb.on('error', function (err) { debugger; });
    this.remote = remoteorigin + '/'+databasename;
};

/*
Create a function to log errors to the console for
development.
*/

ResultsObj.prototype.reporter = function (error, response) {
    'use strict';
    if (console !== undefined) {
        if (error) { console.log(error); }
        if (response) { console.log(response); }
    }
};

ResultsObj.prototype.saveRegistration = function() {
    'use strict';
    var o = {}, that = this;

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
    o.ageCategory = this.entryformobj.ageCategory.value;
    o.genderCategory = this.entryformobj.genderCategory.value;
    // o.awaMember = this.entryformobj.awaMember.value;
    // o.nymcraMember = this.entryformobj.nymcraMember.value;
    o.boatnumber = this.entryformobj.boatnumber.value;
    o.boatClass = this.entryformobj.boatClass.value;
    o.category = o.boatClass + ' ' + o.ageCategory + ' ' + o.genderCategory;
    o.modified = new Date().getTime();
    this.pdb.put(o).then(function(response) {
        that.reporter(response);
        if (response && response.ok) {
            $('#entries-tab').tab('show');
        }
    }).catch(function(error) {
        that.reporter("error = " + error);
        // do something
    });
}

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
}

ResultsObj.prototype.editEntry = function(rowData) {
    this.entryformobj._id.value = rowData._id;
    this.entryformobj._rev.value = rowData._rev;
    this.entryformobj.p1name.value = rowData.p1name
    this.entryformobj.p2name.value = rowData.p2name
    // this.entryformobj.p1addr1.value = rowData.p1addr1
    this.entryformobj.p1addr2.value = rowData.p1addr2
    // this.entryformobj.p2addr1.value = rowData.p2addr1
    this.entryformobj.p2addr2.value = rowData.p2addr2
    // this.entryformobj.p1phone.value = rowData.p1phone
    // this.entryformobj.p2phone.value = rowData.p2phone
    // this.entryformobj.p1age.value = rowData.p1age
    // this.entryformobj.p2age.value = rowData.p2age
    // this.entryformobj.p1email.value = rowData.p1email
    // this.entryformobj.p2email.value = rowData.p2email
    this.entryformobj.ageCategory.value = rowData.ageCategory
    this.entryformobj.genderCategory.value = rowData.genderCategory
    // this.entryformobj.awaMember.value = rowData.awaMember
    // this.entryformobj.nymcraMember.value = rowData.nymcraMember
    this.entryformobj.boatnumber.value = rowData.boatnumber
    this.entryformobj.boatClass.value = rowData.boatClass
    $('#entry-tab').tab('show');
}

ResultsObj.prototype.resetEntryForm = function() {
    this.entryformobj.reset();
    this.entryformobj._id.value = '';
    this.entryformobj._rev.value = '';
}

ResultsObj.prototype.showEntry = function() {
    var that = this;
    var boatNumber = $('#add_result_boat_number').val();
    that.pdb.find({
        selector: {boatnumber: boatNumber},
        fields: ['_id', 'p1name', 'p2name', 'boatClass', 'result']
    }).then(function(response) {
        that.reporter(response);
        if (response.docs.length <= 0) {
            // do something - number not found
            return;
        }
        var results = response.docs[0];
        $('#add_result_class').val(results.boatClass);
        $('#add_result_person1').val(results.p1name);
        $('#add_result_person2').val(results.p2name);
        $('#add_result_result').val(results.result);
        $('#add_result_id').val(results._id);
    }).catch(function(error) {
        that.reporter(error);
    });

}

ResultsObj.prototype.resetAddResultsForm = function() {
    $('#add_result_boat_number').val('');
    $('#add_result_result').val('');
    $('#add_result_class').val('');
    $('#add_result_person1').val('');
    $('#add_result_person2').val('');
    $('#add_result_id').val('');
}

ResultsObj.prototype.editResult = function(rowData) {
    $('#add_result_boat_number').val(rowData.boatnumber);
    $('#add_result_result').val(rowData.result);
    $('#add_result_class').val(rowData.boatClass);
    $('#add_result_person1').val(rowData.p1name);
    $('#add_result_person2').val(rowData.p2name);
    $('#add_result_id').val(rowData._id);
}

ResultsObj.prototype.saveResult = function() {
    that = this;
    that.pdb.get($('#add_result_id').val()).then(function (doc){
        doc.result = $('#add_result_result').val();
        return that.pdb.put(doc);
    }).then(function(response) {
        that.reporter(response);
        if (response && response.ok) {
            that.resetAddResultsForm();
        }
    }).catch(function(error) {
        that.reporter("error = " + error);
        // do something
    });
}

ResultsObj.prototype.showEntries = function() {
    'use strict';
    var that = this;
    this.pdb.allDocs({'include_docs': true}).then(function(response) {
        that.reporter(response);
        var data = response.rows.filter(function(val) {
            return Boolean(val.doc.category);
        }).map(function(val) {
            return val.doc;
        });
        var entryTable = $('#entries-table').DataTable( {
            destroy: true,
            select: true,
            rowGroup: {
                dataSrc: 'category'
            },
            orderFixed: [[0, 'asc'], [1, 'asc'], [2, 'asc']],
            data: data,
            columnDefs: [{visible: false, targets: [0, 1, 2]}],
            columns: [
                { data: "boatClass" },
                { data: "ageCategory" },
                { data: "genderCategory" },
                { data: "boatnumber" },
                { data: "p1name" },
                { data: "p1addr2" },
                { data: "p2name" },
                { data: "p2addr2" }
            ]
        } );
        entryTable.on('select', function(e, dt, type, indexes) {
            var rowData = dt.rows( indexes ).data().toArray()[0];
            that.editEntry(rowData);
        })
    }).catch(function(error) {
        that.reporter(error);
        // do something
    });
}

ResultsObj.prototype.showResults = function() {
    'use strict';
    var that = this;
    this.pdb.allDocs({'include_docs': true}).then(function(response) {
        that.reporter(response);
        var data = response.rows.filter(function(val) {
            return Boolean(val.doc.category);
        }).map(function(val) {
            val.doc.result = val.doc.result || 'NF';
            return val.doc;
        });
        var resultsTable = $('#results-table').DataTable( {
            destroy: true,
            select: true,
            rowGroup: {
                dataSrc: 'category'
            },
            orderFixed: [[0, 'asc'], [1, 'asc']],
            data: data,
            columnDefs: [{visible: false, targets: [0]}],
            columns: [
                { data: "category" },
                { data: "result" },
                { data: "boatnumber" },
                { data: "p1name" },
                { data: "p1addr2" },
                { data: "p2name" },
                { data: "p2addr2" }
            ]
        } );
        resultsTable.on('select', function(e, dt, type, indexes) {
            var rowData = dt.rows( indexes ).data().toArray()[0];
            that.editResult(rowData);
            $('#addresult-tab').tab('show');
        })
    }).catch(function(error) {
        that.reporter(error);
        // do something
    });
}

ro = new ResultsObj('kayakresults');

ro.entryformobj = document.getElementById("registration_form");
ro.entriesobj = document.getElementById('entries-table');
ro.addresultobj = document.getElementById('add_result');

ro.entryformobj.addEventListener('submit', function (e) {
    e.preventDefault();
    ro.saveRegistration();
});

$('#deleteEntry').on('click', ro.deleteEntry.bind(ro));
$('#clearEntry').on('click', ro.resetEntryForm.bind(ro));
$('#add_result_boat_number').on('focusout blur', ro.showEntry.bind(ro));
$('#add_result_submit').on('click', ro.saveResult.bind(ro));

$('#entries-tab').on('show.bs.tab', ro.showEntries.bind(ro));
$('#addresult-tab').on('hide.bs.tab', ro.resetAddResultsForm);
$('#entry-tab').on('hide.bs.tab', ro.resetEntryForm.bind(ro));
$('#results-tab').on('show.bs.tab', ro.showResults.bind(ro));

function slugify(string) {
    const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;'
    const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')
  
    return string.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w\-]+/g, '') // Remove all non-word characters
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  }

// Initialization
document.title = title;
$('#inner-title').html(title);
age_categories.forEach(function(item, index) {
    $('#age-category').append(`<div class="form-check form-check-inline">
    <input class="form-check-input" type="radio" name="ageCategory" value="${item}">
    <label class="form-check-label">${item}</label>
    </div>`
    );
});
for (var category in boat_classes) {
    var classes = boat_classes[category];
    var inner = "";
    classes.forEach(function(item, index) {
        inner = inner.concat(`<div class="form-check offset-sm-1 col-sm-2">
        <input class="form-check-input" type="radio" name="boatClass" value="${item}"/>
        <label class="form-check-label">${item}</label>
      </div>
        `)
    });
    $('#boat-classes').append(`<div class="form-group row">
    <div class="offset-sm-1 col-sm-11"><h4>${category}</h4></div></div>
    <div class="form-group row">${inner}</div>
    `)
};
