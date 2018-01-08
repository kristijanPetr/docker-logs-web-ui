// /**
//  * Created by eduardo on 20/10/15.
//  */

// var module = angular.module('DockerApp', []).factory('socket', function ($rootScope) {

//   var socket = io();

//   return {
//     connect: function(url) {
//       if(!!url)
//         socket = io(url);
//       else
//         socket = io();
//     },
//     on: function (eventName, callback) {
//       socket.on(eventName, function () {
//         var args = arguments;
//         $rootScope.$apply(function () {
//           callback.apply(socket, args);
//         });
//       });
//     },
//     emit: function (eventName, data, callback) {
//       socket.emit(eventName, data, function () {
//         var args = arguments;
//         $rootScope.$apply(function () {
//           if (callback) {
//             callback.apply(socket, args);
//           }
//         });
//       })
//     }
//   };
// });

// module.controller("ContainersController", function($rootScope, $scope, $window, $http, socket){

//   $rootScope.socketUrl = 'http://localhost';

//   $scope.container = {};
//   $scope.containersList = [];
//   $scope.modalIsOpen = false;

//   $scope.disconnected = false;

//   var logDiv = angular.element( document.querySelector('#log') );

//   $scope.getContainersList = function() {
//     $http({
//       method: 'GET',
//       url: '/refresh'
//     }).then(function successCallback(response) {
//     }, function errorCallback(response) {
//     });
//   };

//   $scope.openContainer = function(container) {
//     var win = window.open('http://' + container.id + ':8080', '_blank');
//     win.focus();
//   };

//   $scope.closeLog = function(){

//     $scope.modalIsOpen = false;

//     logDiv.html('');

//     //socket.emit('forceDisconnect');
//   };

//   $scope.showLog = function(container) {

//     $scope.container = container;
//     $scope.modalIsOpen = true;

//     $http({
//       method: 'GET',
//       url: 'http://' + container.id + ':9001/tail/50'
//     }).then(function successCallback(response) {

//       logDiv.append(response.data);
//       logDiv[0].scrollTop = logDiv[0].scrollHeight;

//     }, function errorCallback(response) {
//     });

//     socket.connect('http://' + container.id + ':9001', function(err) {
//       console.debug('Success connecting to server');
//     });

//     socket.on('log', function(log){

//       logDiv.append('<br/>' + log);
//       logDiv[0].scrollTop = logDiv[0].scrollHeight;

//     });

//     setInterval(function(){

//       var text = logDiv.html();

//       if(text.length > 50000) {
//         logDiv.html(text.slice(text.length/2));
//       }

//     }, 1000);

//     console.debug(container);
//   };

//   socket.on('connect_error', function(err) {
//     console.debug('Error connecting to server');
//     $scope.containersList = [];
//     $scope.disconnected = true;
//   });

//   socket.on('connect', function(err) {
//     console.debug('Success connecting to server');
//     $scope.getContainersList();
//     $scope.disconnected = false;
//   });

//   socket.on('refresh', function(containersList){
//     $scope.containersList = containersList;
//   });

//   $scope.getContainersList();
// });
var CLICKED_ID = "";
var socket;
$(function() {
  // socketHandler();
  loadContainers();
  console.log("On Start");
  setInterval(function() {
    console.log("execute interval");
    loadContainers();
  }, 10000);

  $("body").on("click", ".log-btn", function() {
    var containerName = $(this).attr("contName");
    var id = $(this).attr("id");
    CLICKED_ID = id;
    $(
      $(".modalDialog")
        .find("h2")
        .get(0)
    ).html("Log - " + containerName);
    $(".modalDialog").show();
    appendTableData(id);

    return false;
  });
  $(".close").on("click", function() {
    $(".modalDialog").hide();
    // socket.leave("log");
    $("#log").html("");
    socket.emit("kill", { id: CLICKED_ID });
    $(
      $(".modalDialog")
        .find("h2")
        .get(0)
    ).html("Log - ");
  });

  $(".full-log").on("click", function(e) {
    e.preventDefault();
    console.log("clicked");

    appendTableData(CLICKED_ID);
    return false;
  });
});

function appendTableData(id) {
  $.get("http://62.69.69.165:4000/container/" + id + "", function(
    data,
    status
  ) {
    console.log(data);
    socket = socketHandler();
    //socket.join("log");
    socket.on("log", function(data) {
      // var parsedData = JSON.parse(data.data);
      var log = data.data;
      console.log("Received log", log.toString());
      $("#log").append(log);
    });
    // $('#log').append(data.join('\n'));
    $("#log").html(data.join("\n"));
    $("#log").animate({ scrollTop: 1e10 }, 2000);
  });
}

function loadContainers() {
  $.get("http://62.69.69.165:4000/containers", function(data, status) {
    if (data) {
      $(".table > tbody").html("");
    }
    data.map(function(item) {
      $(".table > tbody").append(
        "<tr> \
  <td>" +
          item.id +
          "</td>\
  <td>" +
          item.image +
          "</td>\
  <td>" +
          item.created +
          '</td>\
  <td><a class="log-btn" id=' +
          item.id +
          " contName=" +
          item.image +
          " >Log</a></td>\
  </tr>"
      );
    });
  });
}

function socketHandler() {
  var socket = io("http://localhost/");
  socket.on("connect", function() {
    console.log("Connected!");
    socket.emit("watch", { msg: "hello" });
  });
  socket.on("server", function(data) {
    console.log("Received pong!!!", data);
  });

  socket.on("disconnect", function() {
    console.log("disconected");
  });
  socket.on("error", function() {
    console.log("error!");
  });
  return socket;
}
