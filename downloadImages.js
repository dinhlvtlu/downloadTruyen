/**
 * Created by dinhlv on 4/14/16.
 */
var fs = require('fs');
var request = require('request');
var folderUpload = __dirname + "/uploads";
var dialog = require('dialog');
var childFolder;
var cheerio = require('cheerio');
var url = require('url');
var http = require('http');
var path = require('path');
var port = 8081;
var arrEx = ['png','jpeg','jpg','gif','tiff'];
var host = "127.0.0.1";
var server = http.createServer();
server.on('request',function(request,response) {
    response.writeHead(200, {'Content-type': 'text/html'});
    var urlRequest = request.url;
    if (urlRequest == "/") {
        var filePath = __dirname + '/home.html';
        fs.readFile(filePath, function (error, data) {
            if (error) {
                response.writeHead(400, {'Content-type': 'text/plain'});
                response.end('Sorry, The page not found');
            }
            else {
                response.writeHead(200, {'Content-type': 'text/html'});
                response.write(data);
                response.end();
            }
        })
    }
    var body = "";
    request.on('data', function (data){
        //console.log(data.toString());
        body+=data;
        body = body.split('&');
        var className = body[0].slice(10, body[0].length);
        var URL = body[1].substring(7, body[1].length);
        //var URL = body[1].substring(7, body.length);
        URL = decodeURIComponent(URL);
        console.log(URL);
        console.time('download');
        getURL(URL,className);
    })
    request.on('end',function(){

    })
    request.on('error',function(err){
        console.log(err);
    })
});



server.listen(port,host,function(){
    var address = server.address();
    console.log("Server run: " , address);
});

function downloadImage(src,callback)
{
    var pathName = url.parse(src).pathname;
    var filename = path.basename(pathName);
    console.log("File : " + filename);
    console.log('------------');
    var download = request.get(src);

    fs.exists(childFolder +"/"+ filename, function (exists) {
        if (!exists) {
            console.log("Downloading " + src + " ...")
            return request({
                url: src,
                encoding: 'binary'
            }, function (err, response, body) {
                if (err) {
                    return callback(err)
                }
                fs.writeFile(childFolder +"/"+ filename, body, 'binary', function (err) {
                    if (err) {
                        return callback(err)
                    }
                    callback(null, filename, true)
                })

            })
        }
        callback('File Existed');
    })
}

function getURL(URL, className){
    className = 'div.' + className + ' img';
    childFolder = folderUpload + "/" + URL.split('/').pop();
    request(URL,function(req,response, body){
        if (!fs.existsSync(folderUpload)){
            fs.mkdirSync(folderUpload);
            if(!fs.existsSync(childFolder)){
                fs.mkdirSync(childFolder);
                console.log(childFolder);
            }
            console.log(1);
        }
        else{
            if(!fs.existsSync(childFolder)){
                fs.mkdirSync(childFolder);
                console.log(childFolder);
            }
        }
        var $ = cheerio.load(body);
        var arrImg = $(className);
        var concurrency = 2,
            running = 0,
            completed = 0,
            index = 0;
        function next() {
            while (running < concurrency && index < arrImg.length) {
                var item = arrImg[index++];
                var src = $(item).attr('src');
                downloadImage(src, function (err, filename) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log(filename + ' downloaded');
                    completed++, running--;
                    if(completed === arrImg.length) {
                        console.timeEnd('download');
                        dialog.info('Done!!',"Download.....");
                    }
                    next();
                });
                running++;
            }
        }
        next();
    });
}