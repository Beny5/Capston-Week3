// Modified by GC Shin, reference the following
/*
 * 2018/3/23 Kyuho Kim
 * ekyuho@gmail.com
 * GET으로 호출하는 경우.
 * http://localhost:8080/log?device=202&unit=3&type=T&value=24.2&seq=34
*/

var express = require('express');
var app = express();

mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'me',
    password: 'mypassword',
    database: 'mydb'
})
connection.connect();

/*
function insert_sensor(device, unit, type, value, seq, ip) {
  obj = {};
  obj.seq = seq;
  obj.device = device;
  obj.unit = unit;
  obj.type = type;
  obj.value = value
  obj.ip = ip.replace(/^.*:/, '')

  var query = connection.query('insert into sensors set ?', obj, function(err, rows, cols) {
    if (err) throw err;
    console.log("database insertion ok= %j", obj);
    //console.log("databse insertion ok = %j %j %j", obj.seq, obj.type, obj.ip);
  });
}
*/

function insert_sensor(temperature,ip) {
  obj = {};
  obj.temperature = temperature
  obj.ip = ip.replace(/^.*:/, '')

  var query = connection.query('insert into sensors set ?', obj, function(err, rows, cols) {
    if (err) throw err;
    console.log("database insertion ok= %j", obj);
    //console.log("databse insertion ok = %j %j %j", obj.seq, obj.type, obj.ip);
  });
}
app.get('/', function(req, res) {
  res.end('Nice to meet you');
});

app.get('/log', function(req, res){
  r = req.query;
  console.log("GET %j", r);//<-print {"temperature":"22.25"}
  console.log("Get? %j", r.temperature);
  insert_sensor(r.temperature,req.connection.remoteAddress);
  //insert_sensor(r.url, r.payload,req.connection.remoteAddress);
  res.end('OK:' + JSON.stringify(req.query));
});


//#5
app.get("/data", function(req, res) {
  console.log("param=" + req.query);

  var qstr = 'select * from sensors ';
  connection.query(qstr, function(err, rows, cols) {
    if (err) {
      throw err;
      res.send('query error: '+ qstr);
      return;
    }

    console.log("Got "+ rows.length +" records");
    html = ""
    for (var i=0; i< rows.length; i++) {
      html += JSON.stringify(rows[i]);
    }
    res.send(html);
  });

});


  var server = app.listen(9000,function () {
  var host = server.address().address
  var port = server.address().port
  console.log('listening at http://%s:%s', host, port)
});

