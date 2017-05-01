(function() {
  'use strict';

  angular.module('application', [
    'ui.router',
    'ngAnimate',

    //foundation
    'foundation',
    'foundation.dynamicRouting',
    'foundation.dynamicRouting.animations'
  ]).controller('MainController', function($scope, $timeout) {
    const vm = this;
    vm.startTime = startTime;
    vm.drag = {
      dragging: false,
      element: null,
      offsetLeft: 0,
      offsetTop: 0,
    };
    vm.widgets = {
      time: {
        left: '75%',
        top: '0px'
      },
      twitter: {
        left: '0px',
        top: '0px'
      },
      weather: {
        left: '88%',
        top: '650px'
      }
    }
    vm.expanded = {
      expanded: false,
      widget: null
    };

    // setup
    startTime();
    loadWeather();
    loadTweets();

    let oldFrame;
    const controller = Leap.loop({enableGestures: true}, function(frame) {
      if (vm.expanded.expanded) {
        for (const widget in vm.widgets) {
          $(`#${widget}`).css('display', 'none');
        }
        $('.expand').css('display', 'block');
        $(`#${vm.expanded.widget}-expanded`).css('display', 'inline');
      } else {
        vm.expanded.widget = null;
        for (const widget in vm.widgets) {
          $(`#${widget}`).css('display', 'block');
          $(`#${widget}-expanded`).css('display', 'none');
        }
        $('.expand').css('display', 'none');
      }

      const hand = frame.hands[0];
      _refreshPointer(frame);
      _handleGestures(frame);
      _dragHandler(hand);
      if (frame.hands.length > 0) {

        _transformPointer(hand.screenPosition());
        if (hand.pinchStrength >= 0.8) {

          //console.log(document.elementFromPoint(hand.screenPosition()[0], hand.screenPosition()[1] + 500));
          $('#fuse-pointer').css('border', '6px solid #0cffff');

          const ele = document.elementFromPoint(hand.screenPosition()[0], hand.screenPosition()[1] + 500)
          if (ele && $(ele).hasClass('fuse-widget')) {
            //console.log(ele);
            vm.drag.dragging = true;
            vm.drag.element = $(ele);
            vm.drag.offsetLeft = hand.screenPosition()[0] - $(ele).position().left;
            vm.drag.offsetTop = hand.screenPosition()[1] + 500 - $(ele).position().top;
          }

        } else {
          $('#fuse-pointer').css('border', '6px solid #FFF');
          vm.drag.dragging = false;
        }
      }
      oldFrame = frame;
    }).use('screenPosition', {scale: 0.5});

    function _refreshPointer(frame) {
      if (frame.hands.length == 0) {
        $('#fuse-pointer').css('display', 'none');
      } else {
        $('#fuse-pointer').css('display', 'block');
      }
    }

    function _transformPointer(position) {
      const pointer = $('#fuse-pointer');
      pointer.css('left', position[0]);
      pointer.css('top', position[1] + 500);
      //console.log(document.elementFromPoint(position[0], position[1]));
    }

    function _dragHandler(hand) {
      if (!hand) {
        $('#center').css('display', 'none');
        return;
      }
      if (vm.drag.dragging) {
        $('#center').css('display', 'block');
        vm.drag.element.css('left', hand.screenPosition()[0] - vm.drag.offsetLeft);
        vm.drag.element.css('top', hand.screenPosition()[1] + 500 - vm.drag.offsetTop);
      } else {
        $('#center').css('display', 'none');
        if (vm.drag.element) {
          /*const insideExpand = 480 <= hand.screenPosition()[0]
            && hand.screenPosition()[0] <= 800
            && 384 <= (hand.screenPosition()[1] + 500)
            && (hand.screenPosition()[1] + 500) <= 640;*/
            const insideExpand = 200 <= hand.screenPosition()[0]
              && hand.screenPosition()[0] <= 650
              && 120 <= (hand.screenPosition()[1] + 500)
              && (hand.screenPosition()[1] + 500) <= 450;
            //console.log(hand.screenPosition()[0], hand.screenPosition()[1] + 500);
          if (insideExpand) {
            vm.expanded.expanded = true;
            vm.expanded.widget = vm.drag.element[0].id;
          }

          vm.drag.element.css('left', vm.widgets[vm.drag.element[0].id].left);
          vm.drag.element.css('top', vm.widgets[vm.drag.element[0].id].top);
          vm.drag.element = null;
        }
      }
    }

    function _handleGestures(frame) {
      //Swipe
      if (oldFrame && frame.hands.length > 0 && oldFrame.hands.length > 0) {
        const hand2 = frame.hands[0];
        const hand = oldFrame.hands[0];
        if (hand.pinchStrength < 0.2 && hand.grabStrength < 0.2) {
          const x = hand2.screenPosition()[0] - hand.screenPosition()[0];
          const y = hand2.screenPosition()[1] - hand.screenPosition()[1];
          //console.log(x, y);
          if (Math.abs(x) > Math.abs(y) * 2) {
            if (x > 50) {
              _horizontalSwipe(true);
            } else if (x < -50) {
              _horizontalSwipe(false);
            }
          } else if (Math.abs(y) > Math.abs(x) * 2) {
            if (y > 50) {
              _verticalSwipe(true);
            } else if (y < -50) {
              _verticalSwipe(false);
            }
          }
        }
      }
    }

    function _horizontalSwipe(right) {
      if (right) {
        if (document.location.href != 'http://localhost:8079/#!/paint') document.location.href = 'http://localhost:8079/#!/paint'
      } else {
        if (document.location.href != 'http://localhost:8079/#!/') {
          document.location.href = 'http://localhost:8079/#!/'
          document.location.reload();
        }
      }
    }

    function _verticalSwipe(down) {
      if (down) {
        //$('#close-button').trigger('click');
      }
      if (vm.expanded.expanded && down) {
        vm.expanded = {
          expanded: false,
          widget: null
        }
      } else if (!down && !vm.expanded.expanded) {
        //$('#open-button').trigger('click');
      }
    }

    function startTime() {
      var today = new Date();
      var h = today.getHours();
      var m = today.getMinutes();
      var s = today.getSeconds();
      var period = 'AM';
      if (h > 12) {
        h = h % 12;
        period = 'PM';
      }
      m = _checkTime(m);
      s = _checkTime(s);
      //$('.fuse-time').text(h + ':' + m + ':' + s);
      $('.fuse-time').text(`${h}:${m}:${s} ${period}`)
      var t = setTimeout(startTime, 500);
    }

    function _checkTime(i) {
      if (i < 10) {i = '0' + i};
      return i;
    }

    function loadWeather() {
      let html = "";
      $.simpleWeather({
        location: 'Windsor, ON',
        woeid: '',
        unit: 'c',
        success: function(weather) {
          html = '<h1>' + weather.temp + '&deg;' + weather.units.temp+ '</h1>';
          $(".fuse-weather").html(html);
        },
        error: function(error) {
          $(".fuse-weather").html('<p>'+error+'</p>');
        }
      });
      $.simpleWeather({
        location: 'Windsor, ON',
        woeid: '',
        unit: 'c',
        success: function(weather) {
          html = '<h2 style="text-align: center"><i class="icon-'+weather.code+'"></i> '+weather.temp+'&deg;'+weather.units.temp+'</h2>';
          html += '<ul style="text-align: center"><li style="list-style: none;">'+weather.city+', '+weather.region+'</li>';
          html += '<li style="text-align: center; list-style: none;" class="currently">'+weather.currently+'</li>';
          html += '<li style="text-align: center; list-style: none;">'+weather.wind.direction+' '+weather.wind.speed+' '+weather.units.speed+'</li></ul>';

          $(".fuse-weather-expanded").html(html);
        },
        error: function(error) {
          $("#weather").html('<p>'+error+'</p>');
        }
      });
    }

    function loadTweets() {
      var configProfile = {
        "profile": {"screenName": 'MasseyHacks'}, //MasseyHacks
        "domId": 'fuse-twitter',
        "maxTweets": 3,
        "enableLinks": true,
        "showUser": true,
        "showTime": true,
        "showImages": false,
        "lang": 'en'
      };
      twitterFetcher.fetch(configProfile);

      var configProfile2 = {
        "profile": {"screenName": 'MasseyHacks'},
        "domId": 'fuse-twitter-expanded',
        "maxTweets": 2,
        "enableLinks": true,
        "showUser": true,
        "showTime": true,
        "showImages": false,
        "lang": 'en'
      };
      twitterFetcher.fetch(configProfile2);
      var configProfile3 = {
        "profile": {"screenName": 'MLHacks'},
        "domId": 'fuse-twitter-expanded2',
        "maxTweets": 2,
        "enableLinks": true,
        "showUser": true,
        "showTime": true,
        "showImages": false,
        "lang": 'en'
      };
      twitterFetcher.fetch(configProfile3);
      var t = setTimeout(loadTweets, 5000);
    }
  }).controller('PaintController', function($scope, $timeout) {
    let color = '#fff';
    var c = document.getElementById('canvas');
    var ctx = c.getContext('2d');
    let prevX, prevY, currX, currY;
    let lastTime = 0;

    const controller = Leap.loop({enableGestures: true}, function(frame) {
      const hand = frame.hands[0];
      if (frame.hands.length > 0) {
        _transformPointer(hand.screenPosition());
        if (hand.pinchStrength >= 0.8) {
          const ele = document.elementFromPoint(hand.screenPosition()[0], hand.screenPosition()[1] + 500);
          if (ele) {
            if ($(ele).hasClass('color-div')) {
              color = $(ele).css('background-color');
            } else if ($(ele)[0].id === 'canvas') {
              //console.log(frame.id, prevFrameId);
              if(new Date().getTime() - lastTime <= 50) {
                prevX = currX;
                prevY = currY;
                currX = hand.screenPosition()[0] - 100;
                currY = hand.screenPosition()[1] + 500;
                draw();
              } else {
                prevX = currX;
                prevY = currY;
                currX = hand.screenPosition()[0] - 100;
                currY = hand.screenPosition()[1] + 500;
              }
              lastTime = new Date().getTime();
            }
          }
        }
      }
    }).use('screenPosition', {scale: 0.5});

    function draw() {
      if (prevX) {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 25;
        ctx.stroke();
        ctx.closePath();
      }
    }


    function _transformPointer(position) {
      const pointer = $('#fuse-pointer');
      pointer.css('left', position[0]);
      pointer.css('top', position[1] + 500);
      pointer.css('border', '6px solid ' + color);
      //console.log(document.elementFromPoint(position[0], position[1]));
    }
  })
    .config(config)
    .run(run)
  ;

  config.$inject = ['$urlRouterProvider', '$locationProvider'];

  function config($urlProvider, $locationProvider) {
    $urlProvider.otherwise('/');

    $locationProvider.html5Mode({
      enabled:false,
      requireBase: false
    });

    $locationProvider.hashPrefix('!');
  }

  function run() {
    FastClick.attach(document.body);
  }

})();
