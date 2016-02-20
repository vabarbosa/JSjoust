$(document).ready(function () {

  // game states
  var LOADING = 0;
  var READY = 1;
  var STARTED = 2;
  var LOST = 3;
  var state = LOADING;

  // Enable pusher logging - don't include this in production
  Pusher.log = function (message) {
    if (window.console && window.console.log) {
      window.console.log(message);
    }
  };

  var pusher = new Pusher('054a6c871c383a05df7d', {
    encrypted: true,
  });

  var channel = pusher.subscribe('jsjoust-channel');

  channel.bind('join', function (data) {
    var joinGameLink = '<a class=\"join-game\" data-game-db=\"' + data.gameDb + '\">Join Game</a>';
    $('h1').html(joinGameLink);
    $('.join-game').on('click', function (e) {
      e.preventDefault();
      console.log($(this).attr('data-game-db'));
      joinGame(data.gameDb);
    });
  });

  var joinGame = function (gameDB) {
    var api = '/keygen?user=' + gameDB;
    $.get(api, function (data) {
      localStorage.setItem('url', data.url);
      var url = data.url;
      var localDB = $('<a>', { href: url })[0].pathname.substr(1);
      var gameDB = PouchDB(localDB);
      gameDB.sync(url, { live: true, retry: true }).on('change', function (info) {
        // handle change
        console.log(info);
      }).on('paused', function () {
        // replication paused (e.g. user went offline)
      }).on('active', function () {
        // replicate resumed (e.g. user went back online)
      }).on('denied', function (info) {
        // a document failed to replicate (e.g. due to permissions)
      }).on('complete', function (info) {
        // handle complete
      }).on('error', function (err) {
        // handle error
        console.log(err);
      });

      gameDB.put({
        _id: twitterUser + '_join',
        status: 'join',
        twitter: twitterUser,
        timestamp: Date.now(),
      }).then(function (response) {
        // handle response
        console.log('Everyone Informed of join');
        $('h1').html('Ready');
        state = READY;
      }).catch(function (err) {
        console.log(err);
      });

      console.log('Waiting for join/loss responses');
      var changes = gameDB.changes({
        live: true,
        retry: true,
        include_docs: true,
      }).on('change', function (change) {
        // handle change

        $('ul#players').append(JSON.stringify(change));
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
      }).on('complete', function (info) {
        // changes() was canceled
        console.log('Change Cancelled');
      }).on('error', function (err) {
        console.log(err);
      });

      var playGame = function () {
        trackMotion();
        setInterval(function () { state = STARTED; }, 1000);
      };

      var trackMotion = function () {
        window.addEventListener('deviceorientation', function (e) {
          if (e.gamma !== null && state === STARTED) {
            // Get the distance
            var distance = Math.sqrt(
              Math.pow(Math.sin(2 * Math.PI * (e.gamma / 180)), 2) +
              Math.pow(Math.sin(2 * Math.PI * (e.alpha / 360)), 2) +
              Math.pow(Math.sin(2 * Math.PI * (e.beta / 360)), 2)
            );

            // Scale the distance
            distance = scale(distance);

            // Display the changes
            $('h1').html(distance);
            $('body').css('background', colour(distance));

            // Knock you out
            if (tooFast(distance)) {
              endGame();
            }
          }
        });
      };

      // End Game
      var endGame = function () {
        // alert('lose');
        state = LOST;
        navigator.vibrate([3000, 2000, 1000]);
        gameDB.put({
          _id: twitterUser + '_lost',
          status: 'lost',
          twitter: twitterUser,
          timestamp: Date.now(),
        }).then(function (response) {
          // handle response
          console.log('Everyone Informed of loss');
          window.location.href = '/gameover/' + localDB;
        }).catch(function (err) {
          console.log(err);
        });
      };

      channel.bind('start-' + localDB, function (data) {
        console.log('Game On');
        playGame();
      });
    });
  };

  // Scale result
  var scale = function scale(d) {
    return Math.min(1, d * 0.7);
  };

  // Return the Hue
  var hue = function (d) {
    return Math.floor((1 - d) * 120);
  };

  // Return a HSL colour
  var colour = function (d) {
    return 'hsl(' + hue(d) + ', 100%, 45%)';
  };

  // If you go to fast
  var tooFast = function tooFast(s) {
    return (s >= 1) ? true : false;
  };
});
