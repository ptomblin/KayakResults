/* global $, PouchDB, fetch */
/* global CONFIG_DB, COUCHURL, logWarning, logError, hhmmssToDate, millisecondsToHHMMSS, initDate, query, defaultAgeCategories, defaultGenderCategories, defaultBoatClasses */
/* global FatalError, BoatClass, htmlEscape */

var title, raceName, raceDate, raceDirector, ageCategories, genderCategories, boatClasses;

if (query.race === 'saranac') {
  // Default configuration for testing
  raceName = 'Saranac Lake 12 Miler';
  raceDate = '06/06/2020';
  raceDirector = 'Paul Tomblin'
  ageCategories = defaultAgeCategories;
  genderCategories = defaultGenderCategories;
  boatClasses = defaultBoatClasses;
  initialize('kayakresults');
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
      boatClasses = {};
      data.boat_classes.forEach(function (bc) {
        var classes = [];
        bc.classes.forEach(function (cl) {
          classes.push(new BoatClass(cl.Name, cl.Crew !== '1'));
        });
        boatClasses[bc.category] = classes;
      });
      initialize(query.race);
    }).catch(function (error) {
      logError('Bad response from server: ' + error);
      throw new FatalError('Other Error ' + error);
    });
}
function initialize (databasename) {
 
  $('#race-name').val(raceName);
  $('#race-date').val(raceDate);
  $('#race-director').val(raceDirector);

  var template = $('#age-category-template').clone(false).removeClass('d-none').addClass('d-flex').removeAttr('id');

  ageCategories.forEach(function (item, index) {
    var clone = template.clone(false);
    clone.data('type', 'age-category').data('category', item);
    clone.children('[name="age-inner"]').html(htmlEscape(item));
    $('#age-category-insertion').before(clone);
  });

  template = $('#gender-category-template').clone(false).removeClass('d-none').addClass('d-flex').removeAttr('id');

  genderCategories.forEach(function (item, index) {
    var clone = template.clone(false);
    clone.data('type', 'gender-category').data('category', item);
    clone.children('[name="gender-inner"]').html(htmlEscape(item));
    $('#gender-category-insertion').before(clone);
  });

  var outerTemplate = $('#bcat-template').clone(false).removeClass('d-none').addClass('d-flex').removeAttr('id');
  var innerTemplate = $('#bclass-template').clone(false).removeClass('d-none').addClass('d-flex').removeAttr('id');
  var outerInsertion = $('#boat-categories').find('[name="bcat-insertion"]');

  for (var category in boatClasses) {
    var classes = boatClasses[category];
    var outerClone = outerTemplate.clone(false);
    outerClone.data('type', 'boat-category').data('category', category);

    outerClone.children('[name="bcat-inner"]').html(category);
    var innerInsertion = outerClone.find('[name="bclass-insertion"]');
    classes.forEach(function (item) {
      var innerClone = innerTemplate.clone(false);
      innerClone.data('type', 'boat-class').data('category', category).data('has-crew', item.hasCrew).data('class', item.name)
      innerClone.children('[name="bclass-inner"]').html(item.name).data('category', category).data('has-crew', item.hasCrew).data('name', item.name);
      innerInsertion.before(innerClone);
    });
    outerInsertion.before(outerClone);
  };
}
