$(document).ready(function () {

  var WAITING = 'Waiting';
  var PLAYING  = 'Playing';
  var SAFE     = 'Safe';
  var GAMEOVER = 'Game Over!';
  var gameState = WAITING;

  // Get people to join
  $('#asktojoin').on('click', function (e) {
    e.preventDefault();
    var joinurl = '/join';
    $.get(joinurl, function (data) {
      window.location.href = '/controller/' + data.gameDb;
    });
  });

  $('#startgame').on('click', function (err, data) {
    var starturl = '/start/' + gameDBName;
    $.get(starturl, function (data) {
      gameState = PLAYING;
      $('#gameState').html(gameState);
      flipSafeStatus(gameDBName);
    });
  });

  if (gameDBName) {
    $('#gameState').html(gameState);
    var GAMEON = 1;
    var GAMEOVER = 2;
    var state = GAMEON;
    var gameDB = PouchDB(gameDBName);
    var api = '/keygen?user=' + gameDBName;
    $.get(api, function (data) {
      gameDB.sync(data.url, { live: true, retry: true });
      gameDB.allDocs({ include_docs: true }, function (err, data) {
        $.each(data.rows, function (index, change) {
          addGameItem(change);
        });
      });

      var changes = gameDB.changes({
        live: true,
        retry: true,
        include_docs: true,
      }).on('change', function (change) {
        // handle change
        addGameItem(change);
      }).on('complete', function (info) {
        // changes() was canceled
        console.log('Change Cancelled');
      }).on('error', function (err) {
        console.log(err);
      });
    });
  }

  var flipSafeStatus = function (gameDBName) {
    gameState = (gameState === PLAYING) ? SAFE : PLAYING;
    var url = '/state/' + (((gameState === PLAYING)) ? 'safe' : 'active') + '/' + gameDBName;
    $.post(url, function (err, data) {
      var delay = Math.floor((Math.random() * 20000) + 5000);
      console.log(delay);
      console.log(gameState);
      $('#gameState').html(gameState);
      setTimeout(function () {
        flipSafeStatus(gameDBName);
      }, delay);
    });
  };
});

var addGameItem = function (change) {
  var username = change.doc.twitter;
  if (username) {
    var status   = change.doc.status;
    var $userItem = $('li[data-twitter="' + username + '"]');
    if ($userItem.length) {
      if (status !== 'join') {
        if (!$userItem.hasClass(status)) {
          $userItem.addClass(status);
          $userItem.removeClass('join');
        }
      }
    } else {
      var li = '<li data-twitter=\"' + username + '\" class=\"' + status + '\">';
      li += '<img class=\"img-circle\" width=\"50px\" src=\"https://avatars.io/twitter/' + username + '\" />';
      li += '<strong>' + username + '</strong>';
      li += '</li>';
      $('ul#players').append(li);
    }
  }
};
