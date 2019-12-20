/* global $, PouchDB, fetch */
/* global CONFIG_DB, COUCHURL, logWarning, logError, hhmmssToDate, millisecondsToHHMMSS, initDate, query, defaultAgeCategories, defaultGenderCategories, defaultBoatClasses */
/* global FatalError, BoatClass, htmlEscape, slugify */

var raceName, raceDate, raceDirector, ageCategories, genderCategories, boatClasses, dbname, id, rev;

if (query.race === 'saranac') {
  // Default configuration for testing
  raceName = 'Saranac Lake 12 Miler';
  raceDate = '06/06/2020';
  raceDirector = 'Paul Tomblin';
  ageCategories = defaultAgeCategories;
  genderCategories = defaultGenderCategories;
  boatClasses = defaultBoatClasses;
  dbname = 'kayakresults';
  id = null;
  rev = null;
  initialize();
} else {
  fetch(COUCHURL + CONFIG_DB + query.race)
    .then(function (response) {
      if (!response.ok) {
        logError('Bad response from server');
        throw new FatalError('Bad response');
      }
      return response;
    }).then(function (resp) {
      return resp.json();
    }).then(function (data) {
      raceName = data.race_name;
      raceDirector = data.race_director;
      raceDate = data.race_date;
      ageCategories = data.age_categories;
      genderCategories = data.gender_categories;
      id = data._id;
      rev = data._rev;
      boatClasses = {};
      data.boat_classes.forEach(function (bc) {
        var classes = [];
        bc.classes.forEach(function (cl) {
          classes.push(new BoatClass(cl.Name, cl.hasCrew));
        });
        boatClasses[bc.category] = classes;
      });
      dbname = query.race;
      initialize();
    }).catch(function (error) {
      logError('Bad response from server: ' + error);
      throw new FatalError('Other Error ' + error);
    });
}

function initialize () {
  document.title = raceName + ' Race Configuration';
  $('#race-name').val(raceName);
  $('#race-date').val(raceDate);
  $('#race-director').val(raceDirector);

  var template = $('#age-category-template').clone(false).removeClass('d-none').addClass('d-flex').removeAttr('id');
  var insertionPoint = $('#age-category-insertion');
  ageCategories.forEach(function (item) {
    cloneTemplate(template, insertionPoint, item);
  });

  template = $('#gender-category-template').clone(false).removeClass('d-none').addClass('d-flex').removeAttr('id');
  insertionPoint = $('#gender-category-insertion');

  genderCategories.forEach(function (item) {
    cloneTemplate(template, insertionPoint, item);
  });

  var outerTemplate = $('#bcat-template').clone(false).removeClass('d-none').addClass('d-flex').removeAttr('id');
  var innerTemplate = $('#bclass-template').clone(false).removeClass('d-none').addClass('d-flex').removeAttr('id');
  var outerInsertion = $('#bcat-insertion');

  for (var category in boatClasses) {
    var classes = boatClasses[category];
    var outerClone = outerTemplate.clone(false);
    outerClone.data('category', category);

    outerClone.children('[name="bcat-inner"]').html(category);
    var innerInsertion = outerClone.find('[name="bclass-insertion"]');
    classes.forEach(function (item) {
      var innerClone = innerTemplate.clone(false);
      innerClone.data('type', 'boat-class').data('category', category).data('has-crew', item.hasCrew).data('class', item.name);
      innerClone.children('[name="bclass-inner"]').html(item.name).data('category', category).data('has-crew', item.hasCrew).data('name', item.name);
      innerInsertion.before(innerClone);
    });
    outerInsertion.before(outerClone);
  }
}

function cloneTemplate (template, insertionPoint, item) {
  var clone = template.clone(true).removeClass('d-none').addClass('d-flex').removeAttr('id');
  clone.data('category', item);
  clone.children('[name$="-inner"]').html(htmlEscape(item));
  insertionPoint.before(clone);
}

$('ul').on('click', 'div[name="age-deletion"], div[name="gender-deletion"], div[name="bclass-deletion"], div[name="bcat-deletion"]', function () {
  var li = $(this).parent();
  li.remove();
});

$('#age-category-insertion, #gender-category-insertion, li[name="bcat-insertion"]').on('click', function () {
  var li = $(this);
  var title = li.data('title');
  $('#new-thing-title').html('New ' + title + ' Category');
  $('#new-thing-label').html('New ' + title + ' Category Name');
  $('#new-thing-name').val('');
  $('#new-thing-save').attr('disabled', true);
  $('#new-thing').data('type', 'id').data('target', this).data('target-id', li.attr('id')).modal('show');
});

$('ul').on('click', 'li[name="bclass-insertion"]', function () {
  var li = $(this);
  var title = li.parents('li').data('category');
  $('#new-class-title').html('New ' + title + ' Class');
  $('#new-class-label').html('New ' + title + ' Class Name');
  $('#new-class-name').val('');
  $('#new-class-hascrew').prop('checked', false);
  $('#new-class-save').attr('disabled', true);
  $('#new-class').data('type', 'target').data('target', this).data('target-id', li.attr('id')).modal('show');
});

$('#new-thing, #new-class').on('keyup blur', 'input:visible', function () {
  var disableIt = false;
  var parent = $(this).parents('.modal-content');
  parent.find('input:visible').each(function () {
    if ($(this).val() === '') {
      disableIt = true;
    }
  });
  parent.find('button.btn-primary').attr('disabled', disableIt);
});

$('#new-class-save').on('click', function () {
  $('#new-class').modal('hide');
  var $target;
  if ($('#new-class').data('type') === 'id') {
    $target = $('#' + $('#new-class').data('target-id'));
  } else {
    $target = $($('#new-class').data('target'));
  }
  var $innerClone = $target.siblings().first().clone(false).removeClass('d-none').addClass('d-flex').removeAttr('id');
  var name = $('#new-class-name').val();
  $innerClone.data('type', 'boat-class').data('class', name).data('has-crew', $('#new-class-hascrew').prop('checked'));
  $innerClone.children('[name="bclass-inner"]').html(name);
  $target.before($innerClone);
});

$('#new-thing-save').on('click', function () {
  $('#new-thing').modal('hide');
  var $target;
  if ($('#new-thing').data('type') === 'id') {
    $target = $('#' + $('#new-thing').data('target-id'));
  } else {
    $target = $($('#new-thing').data('target'));
  }
  var $template = $target.siblings().first();
  var name = $('#new-thing-name').val();
  cloneTemplate($template, $target, name);
});

$('#resetConfig').on('click', function () {
  $('li.list-group-item.d-flex:visible:not([id$=insertion])').remove();
  initialize();
});

$('#saveConfig').on('click', function () {
  var config = {
    race_director: $('#race-director').val(),
    race_name: $('#race-name').val(),
    race_date: $('#race-date').val()
  };
  if (id !== null) {
    config._id = id;
    config._rev = rev;
  } else {
    config._id = slugify(config.race_name + config.race_date);
  }
  var ages = [];
  $('#age-category li:visible:not("#age-category-insertion")').each(function () {
    ages.push($(this).data('category'));
  });
  config.age_categories = ages;

  var genders = [];
  $('#gender-category li:visible:not("#gender-category-insertion")').each(function () {
    genders.push($(this).data('category'));
  });
  config.gender_categories = genders;

  var boatCategories = [];
  $('#boat-category > li:visible:not([id=bcat-insertion])').each(function () {
    var boatClasses = [];
    $(this).find('ul > li:visible:not([name="bclass-insertion"])').each(function () {
      boatClasses.push({
        Name: $(this).data('class'),
        hasCrew: $(this).data('hasCrew')
      });
    });
    boatCategories.push({
      category: $(this).data('category'),
      classes: boatClasses
    });
  });
  config.boat_classes = boatCategories;
  console.log(JSON.stringify(config));

  if (query.race !== 'saranac') {
    fetch(COUCHURL + CONFIG_DB + query.race, {
      method: 'PUT',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    })
      .then(function (response) {
        if (!response.ok) {
          logError('Bad response from server');
          throw new FatalError('Bad response');
        }
        return response;
      }).then(function (resp) {
        return resp.json();
      }).catch(function (error) {
        logError('Bad response from server: ' + error);
        throw new FatalError('Other Error ' + error);
      });
  }
});
