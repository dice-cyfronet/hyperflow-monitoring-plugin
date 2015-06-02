var net = require('net');
var http = require('http');
var url = require('url');
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

    //TODO: change to waterfall
    that.getConsumersCount(function (err, consumersCount) {
        var timestamp = parseInt(Date.now() / 1000);

        var consumers = null;
        if (!err) {
            consumers = config.serverName + ' nConsumers ' + consumersCount + ' ' + timestamp + '\r\n';
        } else {
            //probabbly rabbit is down, silently ignore
            //console.log(err);
        }

        var client = net.connect({host: host, port: port}, function () {

            var tasksLeft = config.serverName + ' nTasksLeft ' + that.getTasksLeft() + ' ' + timestamp + '\r\n';
            var outputsLeft = config.serverName + ' nOutputsLeft ' + that.getOutputsLeft() + ' ' + timestamp + '\r\n';
            var tasksProcessed = config.serverName + ' nTasksProcessed ' + that.getTasksProcessed() + ' ' + timestamp + '\r\n';
            var tasks = config.serverName + ' nTasks ' + that.getTasks() + ' ' + timestamp + '\r\n';
            var stage = config.serverName + ' stage ' + that.getStage() + ' ' + timestamp + '\r\n';

            client.write(tasksLeft);
            client.write(outputsLeft);
            client.write(tasksProcessed);
            client.write(tasks);
            client.write(stage);
            if (consumers !== null) {
                client.write(consumers);
            }
            client.destroy();
        });
    });
};

MonitoringPlugin.prototype.getStage = function () {
    var level = 0;
    this.engine.tasks.forEach(function(task) {
        if(task.logic.firingId != 0) {
            var taskLevel = task.logic.fullInfo.level;
            if(taskLevel !== undefined) {
                if (level < taskLevel) {
                    level = taskLevel;
                }
            }
        }
    });
    return level;
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

MonitoringPlugin.prototype.getConsumersCount = function (cb) {
    //query rabbitmq for consumers no. on hyperflow.jobs, resutn null if anything goes wrong

    var amqpUrl = url.parse(config.amqpURL);
    var user = config.rabbitmqUser;
    var password = config.rabbitmqPassword;

    var options = {
        method: 'GET',
        hostname: amqpUrl.hostname,
        port: 15672,
        path: '/api/queues',
        auth: user + ':' + password
    };

    var request = http.request(options, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        }).on('end', function () {
            var consumers = null;
            var queues = JSON.parse(data);
            queues.forEach(function (queue) {
                if (queue.name == 'hyperflow.jobs') {
                    consumers = queue.consumers;
                }
            });
            if (consumers !== null) {
                cb(null, consumers);
            } else {
                cb(new Error('no consumer data for hyperflow.jobs'));
            }
        }).on('error', function (e) {
            cb(e);
        });
    }).on('error', function (e) {
        cb(e);
    });
    request.end();
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