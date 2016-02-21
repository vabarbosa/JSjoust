$(document).ready(function () {
  var Leaderboard = PouchDB('leaderboard');
  var api = '/keygen?user=leaderboard';
  $.get(api, function (data) {
    Leaderboard.sync(data.url, { live: true, retry: true });
    var changes = Leaderboard.changes({
      live: true,
      retry: true,
      include_docs: true,
    }).on('change', function (change) {
      // handle change
      createLeaderboard()
    }).on('complete', function (info) {
      // changes() was canceled
      console.log('Change Cancelled');
    }).on('error', function (err) {
      console.log(err);
    });
  });

  var createLeaderboard = function () {
    Leaderboard.query('leaderboard', {
      reduce: true,
      group: true,
      group_level: 1,
      descending: true,
    }, function (err, data) {
      $.each(data.rows, function (index, row) {
        addGameItem(row);
      });

      sortMessage();
    });
  };

  var addGameItem = function (change) {
    var username = change.key[0];
    if (username) {
      var $userItem = $('div[data-twitter="' + username + '"]');
      if ($userItem.length) {
        $('div[data-twitter="' + username + '"] .score').html(change.value)
      } else {
        var li = '<div class="row" data-twitter=\"' + username + '\">';
        li += '<div class="col-md-3" ><img width="100%" src=\"https://avatars.io/twitter/' + username + '\" class=" img-circle" /></div>';
        li += '<div class="col-md-7" ><strong>' + username + '</strong></div>'
        li += '<div class="col-md-2"><strong class="score" >' + change.value + '</strong></div>';
        li += '</div>';
        $('#leaderboard').append(li);
      }
    }
  };

  var sortMessage = function() {
      var ul = $('#leaderboard');
      var arr = $.makeArray(ul.children('div.row'));

      arr.sort(function (a, b) {
        var textA = +$(a).find('.score').html();
        var textB = +$(b).find('.score').html();

        if (textA < textB) return 1;
        if (textA > textB) return -1;

        return 0;
      });

      ul.empty();

      $.each(arr, function () {
        ul.append(this);
      });
    };

  createLeaderboard();
});
