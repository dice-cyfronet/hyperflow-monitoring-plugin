var net = require('net');

var METRIC_COLLECTOR = 'localhost:9001';
var SERVER = 'HyperFlow';

var MonitoringPlugin = function () {
};

MonitoringPlugin.prototype.sendMetrics = function () {
    var that = this;
    //TODO: Create connection once and then try to reuse it
    var client = net.connect({host: 'localhost', port: 9001}, function () {
        var metricReport = SERVER + ' nTasksLeft ' + that.getTasksLeft() + ' ' + parseInt(Date.now()/1000) + '\r\n';
        client.write(metricReport);
        client.destroy();
    });
};

MonitoringPlugin.prototype.getTasksLeft = function () {
    return this.engine.nTasksLeft;
};

MonitoringPlugin.prototype.init = function (rcl, wflib, engine) {
    if (this.hasOwnProperty('initialized') && this.initialized === true) {
        return;
    }
    this.rcl = rcl;
    this.wflib = wflib;
    this.engine = engine;

    var that = this;
    setInterval(function () {
        that.sendMetrics();
    }, 1000);

    this.initialized = true;
};

module.exports = MonitoringPlugin;