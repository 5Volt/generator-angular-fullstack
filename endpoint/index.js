'use strict';
var path = require('path');
var yeoman = require('yeoman-generator');
var util = require('util');
var ngUtil = require('../util');
var ScriptBase = require('../script-base.js');
var fs = require('fs');

var Generator = module.exports = function Generator() {
  ScriptBase.apply(this, arguments);
};

util.inherits(Generator, ScriptBase);

Generator.prototype.askFor = function askFor() {
  var done = this.async();
  var name = this.name;

  var base = this.config.get('routesBase') || '/api/';
  if(base.charAt(base.length-1) !== '/') {
    base = base + '/';
  }

  // pluralization defaults to true for backwards compat
  if (this.config.get('pluralizeRoutes') !== false) {
    name = name + 's';
  }

  var prompts = [
    {
      name: 'route',
      message: 'What will the url of your endpoint be?',
      default: base + name
    }
  ];

  this.prompt(prompts, function (props) {
    if(props.route.charAt(0) !== '/') {
      props.route = '/' + props.route;
    }

    var routeParts = props.route.split('/');
    this.endpoint = routeParts[routeParts.length-1];

    this.route = props.route;
    done();
  }.bind(this));
};

Generator.prototype.registerEndpoint = function registerEndpoint() {

  var dest = this.config.get('endpointDirectory') || 'server/api/' + this.name;

  var endpointRoutesConfig = {
    file: dest + '/index.js',
    needle: this.config.get('routesNeedle'),
    splicable: [
      "router.get('/"+this.endpoint+"', controller."+this.endpoint+");"
    ]
  };

  var endpointConfig = {
    file:dest + '/'+this.name+'.controller.js',
    needle: this.config.get('endpointsNeedle'),
    splicable: [
      "exports."+this.endpoint+" = function(req, res){\n"+
      "  //TODO(1)@unimplemented: auto-generated Method\n"+
      "  res.status(500).send('unimplemented');\n"+
      "};\n"
    ]
  };

  var testConfig = {
    file:dest + '/'+this.name+'.spec.js',
    needle:this.config.get('testNeedle'),
    splicable: ["it.skip('#"+this.endpoint+"', function(done) {\n"+
    "    done(new Error('unimplemented test'));\n"+
    "  });\n"]
  }
  try{
    ngUtil.rewriteFile(endpointRoutesConfig);
    ngUtil.rewriteFile(endpointConfig);
    ngUtil.rewriteFile(testConfig);
  }catch(e){
    if (this.config.get('insertRoutes')) {
      var routeConfig = {
        file: this.config.get('registerRoutesFile'),
        needle: this.config.get('routesNeedle'),
        splicable: [
          "app.use(\'" + this.route + "\', require(\'./api/" + this.name + "\'));"
        ]
      };
      ngUtil.rewriteFile(routeConfig);
    }
  }

  if (this.filters.socketio) {
    if(this.config.get('insertSockets')) {
      var socketConfig = {
        file: this.config.get('registerSocketsFile'),
        needle: this.config.get('socketsNeedle'),
        splicable: [
          "require(\'../api/" + this.name + '/' + this.name + ".socket\').register(socket);"
        ]
      };
      ngUtil.rewriteFile(socketConfig);
    }
  }
};

Generator.prototype.createFiles = function createFiles() {
  var dest = this.config.get('endpointDirectory') || 'server/api/' + this.name;
  this.sourceRoot(path.join(__dirname, './templates'));
  if(!fs.existsSync(dest))
    ngUtil.processDirectory(this, '.', dest);
};
