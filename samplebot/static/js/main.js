let userlist = [];
let start_accountlist = [];
let white_accountlist = [];
let black_accountlist = [];
let follow_time_flag = false;
let unfollow_time_flag = false;
let follow_timerange = {};
let unfollow_timerange = {};

$(document).ready(function () {
  // initial user list display
  initialDraw();

  // click add account button
  $('.add_account_button').click(function () {
    $('#add_username').val('');
    $('#add_password').val('');
    $('#add_message').html('');
    $('#add_account_modal').modal('show');
  });

  // click add button in modal
  $('#add_account').click(function () {
    let username = $('#add_username').val();
    let password = $('#add_password').val();
    if (username && password) {
      let is_repeat = repeatCheck(userlist, username);
      if (is_repeat) {
        $('#add_message').html('User already exist!');
        $('#add_username').val('');
        $('#add_password').val('');
        $('#add_username').focus();
      } else {
        $.get("/addUser", { 'username': username, 'password': password }, function (result) {
          userlist = JSON.parse(result);
          $('.sidenav .userlist').append('<li><a href="#" class="well text-center" data-username="' + username + '">' + username + '<span class="glyphicon glyphicon-remove user-del" data-name="' + username + '"></span></a></li>')
          if (userlist.length == 1) $('.sidenav .userlist li:first-child').addClass('active');
          $('#add_account_modal').modal('hide');
        });
      }
    } else {
      $('#add_message').html('Input username and password!');
    }
  });

  // click user in userlist of sidebar
  $('.sidenav .userlist').on('click', 'li', function () {
    $('.sidenav .userlist li.active').removeClass('active')
    $(this).addClass('active');
    let username = $('.sidenav .userlist li.active a').data('username');
    $.get("/getUserlist", { userdata: username }, function (result) {
      userlist = JSON.parse(result);
      buildPage(username);
    });
  })

  // click user delete in userlist of sidebar
  $('.samplebot .sidenav .userlist').on('click', 'li a span.user-del', function() {
    let username = $(this).data('name');
    $.get('/delUser', { username: username }, function (result) {
      initialDraw();
    })
  })

  // click add button in settings
  $('.settings-div .start-account-div .start-account-add-btn').click(function () {
    let username = $('.settings-div .start-account-div .start-account-add-input').val();
    if (username) {
      start_accountlist.push(username);
      $('.settings-div .start-account-div .start-account-list-div').append('<li>' + username + '<span class="account-del" data-name="' + username + '">x</span></li>')
      $('.settings-div .start-account-div .start-account-add-input').val('');
    }
  });

  // click add button in whitelist
  $('.userlist-div .whitelist-account-div .whitelist-account-add-btn').click(function () {
    let username = $('.userlist-div .whitelist-account-div .whitelist-account-input').val();
    if (username && !repeatCheck(white_accountlist, username)) {
      white_accountlist.push(username);
      $('.userlist-div .whitelist-account-list-div').append('<li>' + username + '<span class="account-del" data-name="' + username + '">x</span></li>')
      $('.userlist-div .whitelist-account-div .whitelist-account-input').val('');
    }
  })

  // click add button in blacklist
  $('.userlist-div .blacklist-account-div .blacklist-account-add-btn').click(function () {
    let username = $('.userlist-div .blacklist-account-div .blacklist-account-input').val();
    if (username && !repeatCheck(black_accountlist, username)) {
      black_accountlist.push(username);
      $('.userlist-div .blacklist-account-list-div').append('<li>' + username + '<span class="account-del" data-name="' + username + '">x</span></li>')
      $('.userlist-div .blacklist-account-div .blacklist-account-input').val('');
    }
  })

  // click delete button of start account
  $('.settings-div .start-account-div .start-account-list-div').on('click', 'li span.account-del', function () {
    let username = $(this).data('name');
    removeAccount(start_accountlist, username);
    $(this).parent().remove();
  });

  // click delete button of start account
  $('.userlist-div .whitelist-div .whitelist-account-list-div').on('click', 'li span.account-del', function () {
    let username = $(this).data('name');
    removeAccount(white_accountlist, username);
    $(this).parent().remove();
  });

  // click delete button of start account
  $('.userlist-div .blacklist-div .blacklist-account-list-div').on('click', 'li span.account-del', function () {
    let username = $(this).data('name');
    removeAccount(black_accountlist, username);
    $(this).parent().remove();
  });


  // click run button to submit
  $('#runBot').click(function () {

    let username = $('.sidenav .userlist li.active a').data('username');
    let userdata = getUserDataFromName(username);
    let formdata = $('#settings_form').serializeArray();
    $('#runBot').css('display', 'none');
    $('#stopBot').css('display', 'block');

    if (username) {
      $.get("/getRunData", { userdata: JSON.stringify(userdata), formdata: JSON.stringify(formdata), start_accountlist: JSON.stringify(start_accountlist), white_accountlist: JSON.stringify(white_accountlist), black_accountlist: JSON.stringify(black_accountlist), follow_timerange: JSON.stringify(follow_timerange), unfollow_timerange: JSON.stringify(unfollow_timerange) }, function (result) {
        
      });
    }
  });

  // click pause button to stop
  $('#settings_form').on('click', '#stopBot', function() {
    let username = $('.sidenav .userlist li.active a').data('username');
    $(this).css('display', 'none');
    $('#runBot').css('display', 'block');
    $.get("/stopBot", {username: username}, function(){
      console.log('stoped.');
    });
  });

  // time picker
  $('.timerange').on('click', function (e) {
    e.stopPropagation();
    var input = $(this).find('input');
    if (input.hasClass('follow-time')) {
      follow_time_flag = true;
    } else if (input.hasClass('unfollow-time')) {
      unfollow_time_flag = true;
    } else {
      console.log('error!')
    }
    var now = new Date();
    var hours = now.getHours();
    var period = "PM";
    if (hours < 12) {
      period = "AM";
    } else {
      hours = hours - 12;
    }
    var minutes = now.getMinutes();

    var range = {
      from: {
        hour: hours,
        minute: minutes,
        period: period
      },
      to: {
        hour: hours,
        minute: minutes,
        period: period
      }
    };

    if (input.val() !== "") {
      var timerange = input.val();
      var matches = timerange.match(/([0-9]{2}):([0-9]{2}) (\bAM\b|\bPM\b)  -  ([0-9]{2}):([0-9]{2}) (\bAM\b|\bPM\b)/);
      if (matches.length === 7) {
        range = {
          from: {
            hour: matches[1],
            minute: matches[2],
            period: matches[3]
          },
          to: {
            hour: matches[4],
            minute: matches[5],
            period: matches[6]
          }
        }
      }
    };

    var html = '<div class="timerangepicker-container">' +
      '<div class="timerangepicker-from">' +
      '<label class="timerangepicker-label">From:</label>' +
      '<div class="timerangepicker-display hour">' +
      '<span class="increment fa fa-angle-up"></span>' +
      '<span class="value">' + ('0' + range.from.hour).substr(-2) + '</span>' +
      '<span class="decrement fa fa-angle-down"></span>' +
      '</div>' +
      ':' +
      '<div class="timerangepicker-display minute">' +
      '<span class="increment fa fa-angle-up"></span>' +
      '<span class="value">' + ('0' + range.from.minute).substr(-2) + '</span>' +
      '<span class="decrement fa fa-angle-down"></span>' +
      '</div>' +
      ':' +
      '<div class="timerangepicker-display period">' +
      '<span class="increment fa fa-angle-up"></span>' +
      '<span class="value">'+ range.from.period +'</span>' +
      '<span class="decrement fa fa-angle-down"></span>' +
      '</div>' +
      '</div>' +
      '<div class="timerangepicker-to">' +
      '<label class="timerangepicker-label">To:</label>' +
      '<div class="timerangepicker-display hour">' +
      '<span class="increment fa fa-angle-up"></span>' +
      '<span class="value">' + ('0' + range.to.hour).substr(-2) + '</span>' +
      '<span class="decrement fa fa-angle-down"></span>' +
      '</div>' +
      ':' +
      '<div class="timerangepicker-display minute">' +
      '<span class="increment fa fa-angle-up"></span>' +
      '<span class="value">' + ('0' + range.to.minute).substr(-2) + '</span>' +
      '<span class="decrement fa fa-angle-down"></span>' +
      '</div>' +
      ':' +
      '<div class="timerangepicker-display period">' +
      '<span class="increment fa fa-angle-up"></span>' +
      '<span class="value">'+ range.to.period +'</span>' +
      '<span class="decrement fa fa-angle-down"></span>' +
      '</div>' +
      '</div>' +
      '</div>';

    $(html).insertAfter(this);
    $('.timerangepicker-container').on( 'click', '.timerangepicker-display.hour .increment', function () {
        var value = $(this).siblings('.value');
        value.text(
          increment(value.text(), 12, 1, 2)
        );
      }
    );

    $('.timerangepicker-container').on( 'click', '.timerangepicker-display.hour .decrement', function () {
        var value = $(this).siblings('.value');
        value.text(
          decrement(value.text(), 12, 1, 2)
        );
      }
    );

    $('.timerangepicker-container').on( 'click', '.timerangepicker-display.minute .increment',  function () {
        var value = $(this).siblings('.value');
        value.text(
          increment(value.text(), 59, 0,  2)
        );
      }
    );

    $('.timerangepicker-container').on( 'click', '.timerangepicker-display.minute .decrement', function () {
        var value = $(this).siblings('.value');
        value.text(
          decrement(value.text(), 59, 0, 2)
        );
      }
    );

    $('.timerangepicker-container').on( 'click', '.timerangepicker-display.period .increment, .timerangepicker-display.period .decrement', function () {
        var value = $(this).siblings('.value');
        var next = value.text() == "PM" ? "AM" : "PM";
        value.text(next);
      }
    );
  });

  $(document).on('click', e => {
    if (!$(e.target).closest('.timerangepicker-container').length) {
      if ($('.timerangepicker-container').is(":visible")) {
        var timerangeContainer = $('.timerangepicker-container');
        if (timerangeContainer.length > 0) {
          var timeRange = {
            from: {
              hour: timerangeContainer.find('.value')[0].innerText,
              minute: timerangeContainer.find('.value')[1].innerText,
              period: timerangeContainer.find('.value')[2].innerText
            },
            to: {
              hour: timerangeContainer.find('.value')[3].innerText,
              minute: timerangeContainer.find('.value')[4].innerText,
              period: timerangeContainer.find('.value')[5].innerText
            },
          };

          if (follow_time_flag) {
            follow_timerange = timeRange;
            follow_time_flag = false;
          } else if (unfollow_time_flag) {
            unfollow_timerange = timeRange;
            unfollow_time_flag = false;
          }
          timerangeContainer.parent().find('.time-set').val(
            timeRange.from.hour + ":" +
            timeRange.from.minute + " " +
            timeRange.from.period + "  -  " +
            timeRange.to.hour + ":" +
            timeRange.to.minute + " " +
            timeRange.to.period
          );
          timerangeContainer.remove();
        }
      }
    }

  });

  // digital only function
  $('input.digital-only').keypress(function (event) {
    if (event.which != 8 && isNaN(String.fromCharCode(event.which))) {
      event.preventDefault();
    }
  });

});

function initialDraw() {
  $.get("/getUserlist", function (result) {
    userlist = JSON.parse(result);
    $('.sidenav .userlist').html('')
    if (userlist.length) {
      userlist.forEach(user => {
        $('.sidenav .userlist').append('<li><a href="#" class="well text-center" data-username="' + user['username'] + '">' + user['username'] + '<span class="glyphicon glyphicon-remove user-del" data-name="' + user['username'] + '"></span></a></li>')
      });
      buildPage(userlist[0]['username']);
    } else {
      $('#runBot').css('display', 'block');
      $('#stopBot').css('display', 'none');
      $('.time-set').val('');
      $('.checkbox').prop('checked', false);
      $('.settings-div .follow-amount-input').val(0);
      $('.settings-div .follow-every-input').val(0);
      $('.settings-div .unfollow-amount-input').val(0);
      $('.settings-div .unfollow-every-input').val(0);
    }
  });
};

function repeatCheck(list, user) {
  for (let i = 0; i < list.length; i++) {
    if (list[i]['username'] == user) {
      return true;
    }
  }
  return false;
};

function getUserDataFromName(name) {
  for (let i = 0; i < userlist.length; i++) {
    if (userlist[i]['username'] == name) {
      return { username: name, password: userlist[i]['password']};
    }
  }
  return false;
}

function increment(value, max, min, size) {
  var intValue = parseInt(value);
  if (intValue == max) {
    return ('0' + min).substr(-size);
  } else {
    var next = intValue + 1;
    return ('0' + next).substr(-size);
  }
}

function decrement(value, max, min, size) {
  var intValue = parseInt(value);
  if (intValue == min) {
    return ('0' + max).substr(-size);
  } else {
    var next = intValue - 1;
    return ('0' + next).substr(-size);
  }
}

function removeAccount(list, username) {
  for (let i = 0; i < list.length; i++) {
    if (list[i] == username) {
      list.splice(i, 1);
    }
  }
  return list;
}

function buildPage(user) {
  start_accountlist = [];
  white_accountlist = [];
  black_accountlist = [];
  follow_timerange = {};
  unfollow_timerange = {};
  console.log(userlist)
  if (userlist.length) {
    for (let i = 0; i < userlist.length; i++ ) {
      if (userlist[i]['username'] == user) {
        $('.sidenav .userlist li.active').removeClass('active');
        $('.sidenav .userlist li:nth-child(' + (i+1) + ')').addClass('active');

        $('.settings-div .start-account-add-input').val('');
        if (userlist[i]['start_accounts']) {
          let start_accounts = JSON.parse(userlist[i]['start_accounts']);
          start_accountlist = start_accounts;
          let start_account_list_div = '';
          for (let j = 0; j < start_accounts.length; j++) {
            start_account_list_div += '<li>' + start_accounts[j] + '<span class="account-del" data-name="' + start_accounts[j] + '">x</span></li>';
          }
          $('.settings-div .start-account-div .start-account-list-div').html(start_account_list_div);
        } else {
          $('.settings-div .start-account-div .start-account-list-div').html('');
        }

        if (userlist[i]['follow_amount']) {
          $('.settings-div .follow-amount-input').val(userlist[i]['follow_amount']);
        } else {
          $('.settings-div .follow-amount-input').val(0);
        }

        if (userlist[i]['follow_every']) {
          $('.settings-div .follow-every-input').val(userlist[i]['follow_every']);
        } else {
          $('.settings-div .follow-every-input').val(0);
        }

        if (userlist[i]['unfollow_amount']) {
          $('.settings-div .unfollow-amount-input').val(userlist[i]['unfollow_amount']);
        } else {
          $('.settings-div .unfollow-amount-input').val(0);
        }

        if (userlist[i]['unfollow_every']) {
          $('.settings-div .unfollow-every-input').val(userlist[i]['unfollow_every']);
        } else {
          $('.settings-div .unfollow-every-input').val(0);
        }

        if (userlist[i]['follow_timerange'] && userlist[i]['follow_timerange'] != "{}") {
          let timerange = JSON.parse(userlist[i]['follow_timerange']);
          follow_timerange = timerange;
          $('.settings-div .follow-time').val(
            timerange.from.hour + ":" +
            timerange.from.minute + " " +
            timerange.from.period + "  -  " +
            timerange.to.hour + ":" +
            timerange.to.minute + " " +
            timerange.to.period
          );
        } else {
          $('.settings-div .follow-time').val('');
        }

        if (userlist[i]['unfollow_timerange'] && userlist[i]['unfollow_timerange'] != "{}") {
          let timerange = JSON.parse(userlist[i]['unfollow_timerange']);
          unfollow_timerange = timerange;
          $('.settings-div .unfollow-time').val(
            timerange.from.hour + ":" +
            timerange.from.minute + " " +
            timerange.from.period + "  -  " +
            timerange.to.hour + ":" +
            timerange.to.minute + " " +
            timerange.to.period
          );
        } else {
          $('.settings-div .unfollow-time').val('');
        }
          

        if (userlist[i]['follow_days']) {
          let follow_days = JSON.parse(userlist[i]['follow_days']);
          if (follow_days.includes(0)) {
            $('.settings-div .follow-settings .day-select .follow-monday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .follow-monday').prop('checked', false);
          }
          if (follow_days.includes(1)) {
            $('.settings-div .follow-settings .day-select .follow-tuesday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .follow-tuesday').prop('checked', false);
          }
          if (follow_days.includes(2)) {
            $('.settings-div .follow-settings .day-select .follow-wednsday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .follow-wednsday').prop('checked', false);
          }
          if (follow_days.includes(3)) {
            $('.settings-div .follow-settings .day-select .follow-thursday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .follow-thursday').prop('checked', false);
          }
          if (follow_days.includes(4)) {
            $('.settings-div .follow-settings .day-select .follow-friday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .follow-friday').prop('checked', false);
          }
          if (follow_days.includes(5)) {
            $('.settings-div .follow-settings .day-select .follow-saturday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .follow-saturday').prop('checked', false);
          }
          if (follow_days.includes(6)) {
            $('.settings-div .follow-settings .day-select .follow-sunday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .follow-sunday').prop('checked', false);
          }
        } else {
          $('.settings-div .follow-settings .day-select .follow-checkbox').prop('checked', false);
        }

        if (userlist[i]['unfollow_days']) {
          let unfollow_days = JSON.parse(userlist[i]['unfollow_days']);
          if (unfollow_days.includes(0)) {
            $('.settings-div .follow-settings .day-select .unfollow-monday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .unfollow-monday').prop('checked', false);
          }
          if (unfollow_days.includes(1)) {
            $('.settings-div .follow-settings .day-select .unfollow-tuesday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .unfollow-tuesday').prop('checked', false);
          }
          if (unfollow_days.includes(2)) {
            $('.settings-div .follow-settings .day-select .unfollow-wednsday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .unfollow-wednsday').prop('checked', false);
          }
          if (unfollow_days.includes(3)) {
            $('.settings-div .follow-settings .day-select .unfollow-thursday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .unfollow-thursday').prop('checked', false);
          }
          if (unfollow_days.includes(4)) {
            $('.settings-div .follow-settings .day-select .unfollow-friday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .unfollow-friday').prop('checked', false);
          }
          if (unfollow_days.includes(5)) {
            $('.settings-div .follow-settings .day-select .unfollow-saturday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .unfollow-saturday').prop('checked', false);
          }
          if (unfollow_days.includes(6)) {
            $('.settings-div .follow-settings .day-select .unfollow-sunday').prop('checked', true);
          } else {
            $('.settings-div .follow-settings .day-select .unfollow-sunday').prop('checked', false);
          }
        } else {
          $('.settings-div .follow-settings .day-select .unfollow-checkbox').prop('checked', false);
        }
        
        if (userlist[i]['status'] == true) {
          $('#runBot').css('display', 'none');
          $('#stopBot').css('display', 'block');
        } else {
          $('#runBot').css('display', 'block');
          $('#stopBot').css('display', 'none');
        }

        $('.userlist-div .whitelist-account-input').val('');
        if (userlist[i]['whitelist']) {
          let whitelist = JSON.parse(userlist[i]['whitelist']);
          white_accountlist = whitelist;
          let whitelist_div = '';
          for (let j = 0; j < whitelist.length; j++) {
            whitelist_div += '<li>' + whitelist[j] + '<span class="account-del" data-name="' + whitelist[j] + '">x</span></li>';
          }
          $('.userlist-div .whitelist-account-list-div').html(whitelist_div);
        } else {
          $('.userlist-div .whitelist-account-list-div').html('');
        }
          
        $('.userlist-div .blacklist-account-input').val('');
        if (userlist[i]['whitelist']) {
          let blacklist = JSON.parse(userlist[i]['blacklist']);
          black_accountlist = blacklist;
          let blacklist_div = '';
          for (let j = 0; j < blacklist.length; j++) {
            blacklist_div += '<li>' + blacklist[j] + '<span class="account-del" data-name="' + blacklist[j] + '">x</span></li>';
          }
          $('.userlist-div .blacklist-account-list-div').html(blacklist_div);
        } else {
          $('.userlist-div .blacklist-account-list-div').html('');
        }
      }
    }
  } 
}