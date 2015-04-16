var net = require('net');
var config = require('./hyperflowMonitoringPlugin.config.js');

var MonitoringPlugin = function () {
};

MonitoringPlugin.prototype.sendMetrics = function () {
    var that = this;
    //TODO: Create connection once and then try to reuse it
    var parts = config.metricCollector.split(':');
    var host = parts[0];
    var port = 9001;
    if (parts.length > 1) {
        port = parseInt(parts[1]);
    }
    var client = net.connect({host: host, port: port}, function () {
        var timestamp = parseInt(Date.now() / 1000);

        var tasksLeft =         config.serverName + ' nTasksLeft '      + that.getTasksLeft() + ' ' + timestamp + '\r\n';
        var outputsLeft =       config.serverName + ' nOutputsLeft '    + that.getOutputsLeft() + ' ' + timestamp + '\r\n';
        var tasksProcessed =    config.serverName + ' nTasksProcessed ' + that.getTasksProcessed() + ' ' + timestamp + '\r\n';
        var tasks =             config.serverName + ' nTasks '          + that.getTasks() + ' ' + timestamp + '\r\n';

        client.write(tasksLeft);
        client.write(outputsLeft);
        client.write(tasksProcessed);
        client.write(tasks);
        client.destroy();
    });
};

MonitoringPlugin.prototype.getTasksLeft = function () {
    return this.engine.nTasksLeft;
};

MonitoringPlugin.prototype.getOutputsLeft = function () {
    return this.engine.nWfOutsLeft;
};

MonitoringPlugin.prototype.getTasksProcessed = function () {
    return this.engine.trace.split(',').length;
};

MonitoringPlugin.prototype.getTasks = function () {
    return this.engine.tasks.length;
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