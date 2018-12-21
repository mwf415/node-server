// A simple Express app demonstrating CAS authentication.
// Login is required for the "/login" URL, but not for
// the home page. The home page is aware of logins and
// can display the username.
//
// Copy this to a folder of your own and be sure to run
// "npm install express" and "npm install connect-cas".

var express = require('express');
var cas = require('connect-cas');
var url = require('url');
var session = require('express-session')
var proxyMiddleware = require('http-proxy-middleware')

var PROTO_PATH = __dirname + '/proto/DeviceFixService.proto';
var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var device = grpc.loadPackageDefinition(packageDefinition).device;
var client = new device.CheckNewOrderService('192.168.31.145:9763',
                                       grpc.credentials.createInsecure());

// Your CAS server's hostname
cas.configure({ 'host': 'cas.neepp.net',port:80,protocol:"http",paths:{ validate: '/validate',serviceValidate: '/serviceValidate',proxyValidate: '/proxyValidate',proxy: '/proxy',login: '/login',logout: '/logout' } });
console.log(cas.configure());
var app = express();
//app.use('/**.js',express.static('static'))
//app.use('/**.css',express.static('static'))
app.set('trust proxy', 1)
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))
var proxypath = 'http://192.168.31.206:9003';
var nodeSession=null;
var options = {
    target: proxypath,
    changeOrigin: true,
	onProxyReq:function(proxyReq, req, res){
		//cas.serviceValidate()(req,res,function(){
			//cas.authenticate(req,res,function(){
				//if(req.session){
				if(nodeSession){
					proxyReq.setHeader('gd-user', nodeSession.cas.user);
				}
				//}else{
				//	res.redirect('/login');
				//}
			//})
		//});
	}
}
//app.use(proxyMiddleware([ //代理路径
	//	'/rest/service/routing'
	//], options))


// Use cookie sessions for simplicity, you can use something else
//app.use(express.cookieParser('this should be random and secure'));
//app.use(express.cookieSession());
app.get('/cas_security_check', cas.serviceValidate(), cas.authenticate(), function(req, res) {
  console.log("==============");
  if (nodeSession && nodeSession.cas && nodeSession.cas.user) {
    //return res.send('<p>You are logged in. Your username is ' + nodeSession.cas.user + '. <a href="/logout">Log Out</a></p>');
	
	//res.cookie("JSESSIONID", req.cookies.CASTGC);
	return res.redirect("/src/views/index.html");
  } else {
    return res.redirect('/login');
  }
});

// This route has the serviceValidate middleware, which verifies
// that CAS authentication has taken place, and also the
// authenticate middleware, which requests it if it has not already
// taken place.

//app.get('/rest/service/routing/**', cas.serviceValidate(), cas.authenticate(), proxyMiddleware([ //代理路径
//		'/rest/service/routing'
//	], options))

app.all('/rest/service/routing/**', cas.serviceValidate(), cas.authenticate(), function (req, res) {
	client.getMsg({supplierId:1}, function(err, feature) {
		  if (err) {
			console.log(err);
		  } else {
			 res.send(JSON.stringify(feature));
			//console.log('------------------>'+feature.reply);
		  }
	})

	//res.send()
})
app.get('/**.html', cas.serviceValidate(), cas.authenticate(), function (req, res) {
	//console.log("!?!");
	//return res.sendFile(__dirname+'/static/'+req.path.substring(req.path.lastIndexOf("/")));
	if (nodeSession && nodeSession.cas && nodeSession.cas.user) {
		return res.sendFile(__dirname+'/static/'+req.path);
	  } else {
		return res.redirect('/login');
	  }
})
app.get('/**.js', function (req, res) {
	//console.log("!?!");
	//return res.sendFile(__dirname+'/static/'+req.path.substring(req.path.lastIndexOf("/")));
	if (nodeSession && nodeSession.cas && nodeSession.cas.user) {
		return res.sendFile(__dirname+'/static/'+req.path);
	  } else {
		return res.redirect('/login');
	  }
})
app.get('/**.css', function (req, res) {
	//console.log("!?!");
	//return res.sendFile(__dirname+'/static/'+req.path.substring(req.path.lastIndexOf("/")));
	if (nodeSession && nodeSession.cas && nodeSession.cas.user) {
		return res.sendFile(__dirname+'/static/'+req.path);
	  } else {
		return res.redirect('/login');
	  }
})
app.get('/**.ttf', function (req, res) {
	//console.log("!?!");
	//return res.sendFile(__dirname+'/static/'+req.path.substring(req.path.lastIndexOf("/")));
	if (nodeSession && nodeSession.cas && nodeSession.cas.user) {
		return res.sendFile(__dirname+'/static/'+req.path);
	  } else {
		return res.redirect('/login');
	  }
})
app.get('/**.woff', function (req, res) {
	//console.log("!?!");
	//return res.sendFile(__dirname+'/static/'+req.path.substring(req.path.lastIndexOf("/")));
	if (nodeSession && nodeSession.cas && nodeSession.cas.user) {
		return res.sendFile(__dirname+'/static/'+req.path);
	  } else {
		return res.redirect('/login');
	  }
})
//app.get('/**.js', cas.serviceValidate(), cas.authenticate(), function (req, res) {
	//console.log(__dirname);
	//return res.sendFile(__dirname+'/static/'+req.path.substring(req.path.lastIndexOf("/")));
	/*if (nodeSession.cas && nodeSession.cas.user) {
		return res.redirect(req.path.substring.lastIndexOf("/"));
	  } else {
		return res.send('<p>You are not logged in. <a href="/login">Log in now.</a><p>');
	  }*/
//})
app.get('/login', cas.serviceValidate(), cas.authenticate(), function(req, res) {
  // Great, we logged in, now redirect back to the home page.
	nodeSession=req.session;
	return res.redirect('/cas_security_check');

});

app.get('/logout', function(req, res) {
  if (!nodeSession) {
    return res.redirect('/');
  }
  // Forget our own login session
  if (nodeSession.destroy) {
    nodeSession.destroy();
  } else {
    // Cookie-based sessions have no destroy()
    nodeSession = null;
  }
  // Send the user to the official campus-wide logout URL
  var options = cas.configure();
  options.pathname = options.paths.logout;
  return res.redirect(url.format(options));
});




app.listen(3000);
