#!/usr/bin/env node
// usage : node graburls.js some.hostname.com path ( no http:// )

// this script tries to grab all html urls from a given website ( dumb regexp of html, no redirection or anything else )
// the purpose is to show asynchronous connexions ; every time an url is found a new connection is made, even when current download is not finished ( up to 5 simultaneous connection by default )

if (process.argv.length < 3) {
    console.log("which host ?");
    return;
}
var options = {
    host: process.argv[2],
    port: 80,
    path: process.argv[3] || "/"
};

var found = {};
var regexplink = /href=["'](.+?)['"]/mg; // not perfect, indeed
http = require("http");

function graburls(options) {
    var path = options["path"];
    var request = http.request(options, function (connection) {
        var lastdata = ""; // lastdata is the remainder of the last chunk
        connection.setEncoding("utf8");
        connection.on('data', function (chunk) {
            process.nextTick(function () { // can't abort outside nextTick. Don't know why.
                if (!/^text\/x?html/.test(connection.headers["content-type"])) { 
                    request.abort(); 
                    return ;
                }
                if (path) {
                    console.log(path); // output found url only if html
                    path = null ; // prevent displaying on next chunk
                }

                chunk = lastdata + chunk;

                var res;
                while (res = regexplink.exec(chunk)) {
                    var link = res[1].split("#")[0];
                    if (link && !found[link] && !/^[a-zA-Z]+:/.test(link)) {
                        found[link] = true ;
                        options["path"] = link;
                        graburls(options);
                    }
                }
                lastdata = chunk.substr(regexplink.lastIndex);
            });
        });
    });

    request.end();
}
graburls(options);
