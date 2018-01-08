var express = require("express"),
  app = express(),
  http = require("http").Server(app),
  io = require("socket.io")(http);

app.use(express.static("public"));

app.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type,Accept, Authorization,Origin"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

io.on("connection", function(socket) {
  console.log("a user connected");
  socket.on("watch", function(data) {
    console.log(data);
    socket.emit("server", { msg: "HI Client!" });
  });
  socket.on("disconnect", function() {
    console.log("user disconnected");
  });
});

app.get("/", function(req, res) {
  res.sendFile("index.html");
});

app.get("/refresh", function(req, res) {
  var containersList = [];
  var exec = require("child_process").exec;
  exec("docker ps", function(error, stdout, stderr) {
    var output = stdout.split("\n");
    for (var index in output) {
      var arr = output[index].split(/\s+/g);
      if (index != 0 && arr[0] != "") {
        containersList.push({
          id: arr[0],
          image: arr[1],
          name: arr[arr.length - 2],
          created: arr[3] + " " + arr[4] + " " + arr[5]
        });
      }
    }
    io.emit("refresh", containersList);
    res.send("0");
  });
});

app.get("/containers", function(req, res) {
  var containersList = [];
  var exec = require("child_process").exec;
  exec("docker ps", function(error, stdout, stderr) {
    var output = stdout.split("\n");
    for (var index in output) {
      var arr = output[index].split(/\s\s+/g);
      if (index != 0 && arr[0] != "") {
        containersList.push({
          id: arr[0],
          image: arr[1],
          name: arr[arr.length - 1],
          created: arr[3],
          running: arr[4]
        });
      }
    }
    res.send(containersList);
  });
});

app.get("/container/:container", function(req, res) {
  console.log("requested container", req.params.container);
  var conId = req.params.container;
  var containersList = [];
  readStream(conId);
  var exec = require("child_process").exec;
  exec("docker logs " + conId + "", function(error, stdout, stderr) {
    var output = stdout.split("\n");
    for (var index in output) {
      var arr = output[index];
      if (arr != "") {
        containersList.push(arr);
      }
    }
    res.send(containersList);
  });
});

app.get("/listen/:container", function(req, res) {
  var filename = "431132423c27";
  var spawn = require("child_process").spawn;
  var ls = spawn("docker", ["logs", "-f", filename]);

  ls.stdout.on("data", data => {
    console.log(`stdout: ${data}`);
    res.write("" + data);
  });

  ls.stderr.on("data", data => {
    console.log(`stderr: ${data}`);
    res.send({ error: data });
  });

  ls.on("close", code => {
    console.log(`child process exited with code ${code}`);
    res.send({ error: code });
  });
});

http.listen(4000, function() {
  console.log("Server listening on *:4000");
});

function readStream(id) {
  //id = "431132423c27";
  var exec = require("child_process").exec;
  exec(`docker inspect --format='{{.LogPath}}' ${id}`, function(
    error,
    stdout,
    stderr
  ) {
    var output = stdout.split("\n");
    var contId = output[0];
    watchFile(contId);
  });
}

function watchFile(path) {
  var spawn = require("child_process").spawn;
  var tail = spawn("tail", ["-f", path]);

  tail.stdout.on("data", function(data) {
    //response.write('' + data);
    console.log(data.toString());
    io.emit("log", { data: data.toString() });
  });
}
