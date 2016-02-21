$(document).ready(function () {
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

    var winner = function () {

      var mapRed = {
        map: function (doc) {
          if (doc.status) {
            emit([doc.status, doc.twitter], doc);
          }
        },
        reduce: '_count',
      };
      gameDB.query(mapRed, {
        reduce: true,
        inclusive_end: true,
        startkey: ['join'],
        endkey: ['join', {}],
        group: true,
        group_level: 1
      }, function (err, data) {
        var playersJoined = data.rows[0].value;
        gameDB.query(mapRed, {
          reduce: true,
          inclusive_end: true,
          startkey: ['lost'],
          endkey: ['lost', {}],
          group: true,
          group_level: 1
        }, function (err, data) {
          var playersLost = data.rows[0].value;
          $('#playersLeft').html(' ' + (playersJoined - playersLost));

          if ((playersJoined - playersLost) === 1 &&
            state === GAMEON) {
            var api = '/gameover/' + gameDBName;
            $.post(api, function (data) {
              console.log('later loser');
              gameDB.allDocs({include_docs: true}, function (err, data) {
                if (err) console.log(err);
                var winnerArray = [];
                $.each(data.rows, function (index, row) {
                  if (row.doc.status === 'join') {
                    winnerArray.push(row.doc.twitter);
                  } else if (row.doc.status === 'lost') {
                    winnerArray.splice(winnerArray.indexOf(row.doc.twitter), 1);
                  }
                });
                gameDB.put({
                  _id: winnerArray[0] + '_win',
                  status: 'win',
                  twitter: winnerArray[0],
                  timestamp: Date.now(),
                }).then(function (response) {
                  // handle response
                  console.log('Everyone Informed of loss');
                }).catch(function (err) {
                  console.log(err);
                });
                state = GAMEOVER;
                $('h1').html('Winner is ' + winnerArray[0]);

              });
            });
          }
        });
      });
    };

    var changes = gameDB.changes({
      live: true,
      retry: true,
      include_docs: true,
    }).on('change', function (change) {
      // handle change
      addGameItem(change);
      winner();
    }).on('complete', function (info) {
      // changes() was canceled
      console.log('Change Cancelled');
    }).on('error', function (err) {
      console.log(err);
    });
  });
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
      li += '<img width=\"50px\" src=\"https://avatars.io/twitter/' + username + '\" />';
      li += '<strong>' + username + '</strong>';
      li += '</li>';
      $('ul#players').append(li);
    }
  }
};
