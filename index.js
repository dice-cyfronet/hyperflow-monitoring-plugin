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
    var port = 9002;
    if (parts.length > 1) {
        port = parseInt(parts[1]);
    }

    //TODO: change to waterfall
    that.getConsumersCount(function (err, consumersCount) {
        var timestamp = parseInt(Date.now() / 1000);

        var consumers = -1;
        if (!err) {
            consumers = consumersCount;
        } else {
            //probabbly rabbit is down, silently ignore
            //console.log(err);
        }

        var tasksLeft = that.getTasksLeft();
        var outputsLeft = that.getOutputsLeft();
        var tasksProcessed = that.getTasksProcessed();
        var tasks = that.getTasks();
        var stage = that.getStage();

        if (config.metricCollectorType == 'visor') {
            var client = net.createConnection({host: host, port: port}, function () {

                var tasksLeftText = config.serverName + '.nTasksLeft ' + tasksLeft + ' ' + timestamp + '\r\n';
                var outputsLeftText = config.serverName + '.nOutputsLeft ' + outputsLeft + ' ' + timestamp + '\r\n';
                var tasksProcessedText = config.serverName + '.nTasksProcessed ' + tasksProcessed + ' ' + timestamp + '\r\n';
                var tasksText = config.serverName + '.nTasks ' + tasks + ' ' + timestamp + '\r\n';
                var stageText = config.serverName + '.stage ' + stage + ' ' + timestamp + '\r\n';
                var consumersText = config.serverName + '.nConsumers ' + consumers + ' ' + timestamp + '\r\n';

                client.write(tasksLeftText);
                client.write(outputsLeftText);
                client.write(tasksProcessedText);
                client.write(tasksText);
                client.write(stageText);
                client.write(consumersText);
                client.end();
            });
            client.on('error', function () {
                console.log('Monitoring plugin is unable to connect to: ' + config.metricCollector);
            });
        } else if (config.metricCollectorType == 'influxdb') {
            var metrics = {
                'tasksLeft': tasksLeft,
                'outputsLeft': outputsLeft,
                'tasksProcessed': tasksProcessed,
                'tasks': tasks,
                'stage': stage,
                'consumersCount': consumersCount
            };
            that.writeToInfluxDB(metrics, function (err) {
                if (err) {
                    console.log("error writting to influxdb!");
                    console.log(err);
                }
            });
        } else {
            console.log('Monitoring plugin is unable to write to unknown metric collector type: ' + config.metricCollectorType);
        }
    });
};

MonitoringPlugin.prototype.getStage = function () {
    var level = 0;
    this.engine.tasks.forEach(function (task) {
        if (task.logic.firingId != 0) {
            var taskLevel = task.logic.fullInfo.level;
            if (taskLevel !== undefined) {
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

MonitoringPlugin.prototype.writeToInfluxDB = function (metrics, cb) {
    var influxdbUrl = url.parse(config.metricCollector);
    var data = 'hyperflow ';
    var metric_items = [];
    for (field in metrics) {
        if (metrics.hasOwnProperty(field)) {
            metric_items.push(field + '=' + metrics[field]);
        }
    }

    data += metric_items.join(',');

    request = http.request({
        hostname: influxdbUrl.hostname,
        port: influxdbUrl.port,
        path: 'write?db=hyperflow',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
    }, function (res) {
        if (res.statusCode != 204) {
            cb(new Error('Error, response of the server was: ' + res.statusCode + ' ' + res.statusMessage));
            return;
        }
        cb(null);
    });
    request.on('error', function (e) {
        cb(e);
    });
};

MonitoringPlugin.prototype.getConsumersCount = function (cb) {
    //query rabbitmq for consumers no. on hyperflow.jobs, return null if anything goes wrong

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