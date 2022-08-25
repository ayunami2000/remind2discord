//https://accounts.google.com/b/3/DisplayUnlockCaptcha

/*require("http").createServer((req,res)=>{
  res.writeHead(200,{"Content-Type":"text/plain"});
  res.write("h");
  res.end();
}).listen(process.env.PORT||3000);*/

var SimpleImap = require("simple-node-imap"),
    fetch = require("node-fetch");

var simpleImap;

function createImap(){
  simpleImap = new SimpleImap({
    username: process.env.GMAILUSER,
    password: process.env.GMAILPASS,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    connTimeout: 10000,
    authTimeout: 5000,
    //debug: console.log,
    tlsOptions: {
      rejectUnauthorized: false,
      servername: "imap.gmail.com"
    },
    mailbox: "INBOX",
    searchFilter: ['UNSEEN',['HEADER','FROM','@mail.remind.com']],
    markSeen: true,
    fetchUnreadOnStart: true,
    mailParserOptions: {
      streamAttachments: true
    },
    attachments: false
  });

  simpleImap.on("server:connected", () => {
    console.error("connected");
  });

  simpleImap.on("server:disconnected", () => {
    console.error("disconnected, waiting 30min until next attempt");
    simpleImap.stop();
    setTimeout(createImap,1800000);//30min cooldown upon disconnect
  });

  simpleImap.on("error", err => {
    console.log(err);
  });

  simpleImap.on("message", message => {
    var msgData={
      from: message.headers.get("from").value[0].name,
      subject: message.headers.get("subject"),
      body: message.body.text
    };
    console.log(msgData.subject);
    console.log(msgData.body);
    console.log(msgData.from);
    var discordJson={
      "content": "<@&770639345509597214>",
      "embeds": [
        {
          "description": msgData.body.replace(/(\\|_|\*|~|`|\||<|>|@|:)/g,'\\$1').replace(/(^|\s)rmd\.me\//g,"$1https://rmd.me/"),
          "color": 4884956,
          "author": {
            "name": msgData.subject,
            "icon_url": "https://i.ibb.co/2sygFx5/remind-arrow.png"
          },
          "footer": {
            "text": msgData.from,
            "icon_url": "https://i.ibb.co/gD3K7M2/512x512.png"
          }
        }
      ]
    };
    fetch(process.env.WEBHOOKURL,{method:'post',headers:{'Content-Type':'application/json'},body:JSON.stringify(discordJson)});
  });

  simpleImap.start();
}

createImap();