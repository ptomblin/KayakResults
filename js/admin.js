/* global $, PouchDB, fetch */
/* global CONFIG_DB, COUCHURL, logWarning, logError, hhmmssToDate, millisecondsToHHMMSS, initDate, query, defaultAgeCategories, defaultGenderCategories, defaultBoatClasses */
/* global FatalError, BoatClass, htmlEscape */

var raceName, raceDate, raceDirector, ageCategories, genderCategories, boatClasses, dbname;

if (query.race === 'saranac') {
  // Default configuration for testing
  raceName = 'Saranac Lake 12 Miler';
  raceDate = '06/06/2020';
  raceDirector = 'Paul Tomblin'
  ageCategories = defaultAgeCategories;
  genderCategories = defaultGenderCategories;
  boatClasses = defaultBoatClasses;
  dbname = 'kayakresults'
  initialize();
} else {
  fetch(COUCHURL + CONFIG_DB + query.race)
    .then(function(response) {
      if (!response.ok) {
        logError('Bad response from server');
        throw new FatalError('Bad response');
      }
      return response;
    }).then(function(resp) {
      return resp.json();
    }).then(function(data) {
      raceName = data.race_name;
      raceDirector = data.race_director;
      raceDate = data.race_date;
      ageCategories = data.age_categories;
      genderCategories = data.gender_categories;
      boatClasses = {};
      data.boat_classes.forEach(function(bc) {
        var classes = [];
        bc.classes.forEach(function(cl) {
          classes.push(new BoatClass(cl.Name, cl.Crew !== '1'));
        });
        boatClasses[bc.category] = classes;
      });
      dbname = query.race;
      initialize();
    }).catch(function(error) {
      logError('Bad response from server: ' + error);
      throw new FatalError('Other Error ' + error);
    });
}

function initialize() {
  document.title = raceName + ' Race Configuration';
  $('#race-name').val(raceName);
  $('#race-date').val(raceDate);
  $('#race-director').val(raceDirector);

  var template = $('#age-category-template').clone(false).removeClass('d-none').addClass('d-flex').removeAttr('id');
  var insertionPoint = $('#age-category-insertion');
  ageCategories.forEach(function(item, index) {
    cloneTemplate(template, insertionPoint, item);
  });

  template = $('#gender-category-template').clone(false).removeClass('d-none').addClass('d-flex').removeAttr('id');
  insertionPoint = $('#gender-category-insertion');

  genderCategories.forEach(function(item, index) {
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
    classes.forEach(function(item) {
      var innerClone = innerTemplate.clone(false);
      innerClone.data('type', 'boat-class').data('category', category).data('has-crew', item.hasCrew).data('class', item.name)
      innerClone.children('[name="bclass-inner"]').html(item.name).data('category', category).data('has-crew', item.hasCrew).data('name', item.name);
      innerInsertion.before(innerClone);
    });
    outerInsertion.before(outerClone);
  };
}

function cloneTemplate(template, insertionPoint, item) {
  var clone = template.clone(true).removeClass('d-none').addClass('d-flex').removeAttr('id');
  clone.data('category', item);
  clone.children('[name$="-inner"]').html(htmlEscape(item));
  insertionPoint.before(clone);
}

$('ul').on('click', 'div[name="age-deletion"], div[name="gender-deletion"], div[name="bclass-deletion"], div[name="bcat-deletion"]', function() {
  var li = $(this).parent();
  li.remove();
});

$('#age-category-insertion, #gender-category-insertion, li[name="bcat-insertion"]').on('click', function() {
  var li = $(this);
  var title = li.data('title');
  $('#new-thing-title').html('New ' + title + ' Category');
  $('#new-thing-label').html('New ' + title + ' Category Name');
  $('#new-thing-name').val('');
  $('#new-thing-crewsize-group').addClass('d-none');
  $('#new-thing-crewsize').val('');
  $('#new-thing-save').attr('disabled', true);
  $('#new-thing').data('type', 'id').data('target', this).data('target-id', li.attr('id')).modal('show');
});

$('li[name="bclass-insertion"]').on('click', function() {
  var li = $(this);
  var title = li.parents('li').data('category');
  $('#new-thing-title').html('New ' + title + ' Class');
  $('#new-thing-label').html('New ' + title + ' Class Name');
  $('#new-thing-name').val('');
  $('#new-thing-crewsize-group').removeClass('d-none');
  $('#new-thing-crewsize').val('');
  $('#new-thing-save').attr('disabled', true);
  $('#new-thing').data('type', 'target').data('target', this).data('target-id', li.attr('id')).modal('show');
});

$('#new-thing').on('keyup blur', 'input:visible', function() {
  var disableIt = false;
  $('#new-thing input:visible').each(function() {
    if ($(this).val() === '') {
      disableIt = true;
    }
  });
  $('#new-thing-save').attr('disabled', disableIt);
});

$('#new-thing-save').on('click', function() {
  $('#new-thing').modal('hide');
  var $target;
  if ($('#new-thing').data('type') == 'id') {
    $target = $('#' + $('#new-thing').data('target-id'));
  } else {
    $target = $($('#new-thing').data('target'));
  }
  var $template = $target.siblings().first();
  var name = $('#new-thing-name').val();
  cloneTemplate($template, $target, name);
});

$('#resetConfig').on('click', function() {
  $('li.list-group-item.d-flex:visible:not([id$=insertion])').remove();
  initialize();
})