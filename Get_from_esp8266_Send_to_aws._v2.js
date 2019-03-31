// Modified by GC Shin, reference following
/*
 * 2018/3/23 Kyuho Kim
 * ekyuho@gmail.com
 * GET으로 호출하는 경우.
 * http://localhost:8080/log?device=202&unit=3&type=T&value=24.2&seq=34
*/

var express = require('express');
var app = express();
fs = require('fs');
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
       /*try to change time but it failed lol
       var string = JSON.stringify(rows[i]);
       for(var j=0;;j++){
           if(string[j]=='T')
               break;
           else
               html+=string[j];
       }
       var n10,n1;
            n10= string[j+1]*10;
            n1 = string[j+2]*1;
       if(n10+n1+18<24)
       {
         string[j+1] = (n10+n1+18)/10;
         string[j+1] = '2';
         string[j+2] = (n10+n1+18)%10;
         string[j+2] = '3';


       }

       while(string[j]!='}')
            {
                    html+=string[j];
                    j++;


            }
       */

    }
    res.send(html);
  });

});

app.get('/graph', function (req, res) {
    console.log('got app.get(graph)');
    var html = fs.readFile('./graph.html', function (err, html) {
    html = " "+ html
    console.log('read file');

    var qstr = 'select * from sensors ';
    connection.query(qstr, function(err, rows, cols) {
      if (err) throw err;

      var data = "";
      var comma = ""
      var temp = 1;
      var las =""
      for (var i=380; i< rows.length; i++) {
         r = rows[i];
         //r.id = r.id/10;
         r.id+=32.5;

         data += comma + "[new Date(2019,02,31,07,"+ r.id*2 +",00),"+ r.temperature +"]";
         /*rmon = String(Number(r.time.getMonth()))
         if (Number(rmon)<10) rmon = "0"+rmon;
         data += comma + "[new date(" + r.time.getFullYear() + ","
                       + rmon + "," + r.time.getDate() + ","
                       + r.time.getHours() + "," + r.time.getMinutes()
                       + "," + r.time.getSeconds() + ")" + ","
                       +r.temperature + "]";
         */
         comma = ",";
         if(i== rows.length-1)
         {
                 las += r.time.getFullYear() + "-" + r.time.getMonth() + "-" +
                        r.time.getDate() + " " + r.time.getHours() +":" +
                        r.time.getMinutes() + ":" + r.time.getSeconds() ;


         }
      }
      var header = "data.addColumn('date', 'Time');"
      header += "data.addColumn('number', 'Temp');"
      html = html.replace("<%HEADER%>", header);
      html = html.replace("<%DATA%>", data);
      html = html.replace("<%LAST%>",las);

      res.writeHeader(200, {"Content-Type": "text/html"});
      res.write(html);
      res.end();
    });
  });
})


  var server = app.listen(9000,function () {
  var host = server.address().address
  var port = server.address().port
  console.log('listening at http://%s:%s', host, port)
});



