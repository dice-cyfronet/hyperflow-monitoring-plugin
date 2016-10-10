var net = require('net');
var http = require('http');
var url = require('url');
var config = require('./hyperflowMonitoringPlugin.config.js');

// Visor Destination

var VisorDestination = function () {
};

VisorDestination.prototype.init = function (cb) {
    var that = this;
    that.appName = config.appName;

    http.get('http://' + config.visorPublicIp + ':31415/monitors', function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        }).on('end', function () {
            var monitors = JSON.parse(data);
            data.forEach(function (monitor) {
                if (monitor.metric_name == "tasks") {
                    that.port = monitor.port;
                    that.host = config.visorCloudIp;
                    cb();
                }
            });
            cb(new Error('No monitor looks like hyperflow-visor endpoint!'));
        }).on('error', function (e) {
            cb(e);
        });
    }).on('error', function (e) {
        cb(e);
    });
};

VisorDestination.prototype.handleMetrics = function (cb, metrics) {
    var that = this;
    var timestamp = parseInt(Date.now() / 1000);

    var client = net.createConnection({host: that.host, port: that.port}, function () {

        for (var metricName in Object.keys(metrics)) {
            var metricLine = that.appName + '.' + metricName + ' ' + metrics[metricName] + ' ' + timestamp + '\r\n';
            client.write(metricLine);
        }
        client.end();
    });
    client.on('error', function (err) {
        console.log('Monitoring plugin is unable to connect to visor located at: ' + that.hostname + ':' + that.port);
        console.log(err);
        cb(err);
    });
    client.on('end', function () {
        cb()
    });
};


// InfluxDB Destination

var InfluxDBDestination = function () {
};

InfluxDBDestination.prototype.init = function (cb) {
    this.influxDBURL = config.influxDBURI;
    cb();
};

InfluxDBDestination.prototype.handleMetrics = function (cb, metrics) {
    var influxdbUrl = url.parse(this.influxDBURL);
    var data = 'hyperflow ';
    var metric_items = [];
    for (var metricName in Object.keys(metrics)) {
        metric_items.push(metricName + '=' + metrics[metricName]);
    }

    data += metric_items.join(',');

    var request = http.request({
        hostname: influxdbUrl.hostname,
        port: influxdbUrl.port,
        path: influxdbUrl.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
    }, function (res) {
        res.on('data', function () {
        }).on('end', function () {
            cb();
        }).on('error', function (err) {
            cb(new Error('Error, response of the server was: ' + err));
        });
        if (res.statusCode != 204) {
            cb(new Error('Error, response of the server was: ' + res.statusCode + ' ' + res.statusMessage));
        }
    });
    request.on('error', function (e) {
        cb(e);
    });
    request.write(data);
    request.end();
};

// Plugin prototype

var MonitoringPlugin = function () {
};

MonitoringPlugin.prototype.gatherMetrics = function () {
    var that = this;

    that.getConsumersCount(function (err, consumersCount) {
        var consumers = -1;
        if (!err && consumersCount != undefined) {
            consumers = consumersCount;
        } else {
            //probabbly rabbit is down, silently ignore
            //console.log(err);
        }

        var metrics = {
            tasksLeft: that.getTasksLeft(),
            outputsLeft: that.getOutputsLeft(),
            tasksProcessed: that.getTasksProcessed(),
            tasks: that.getTasks(),
            stage: that.getStage(),
            nConsumers: consumers
        };

        that.metricDestination.handleMetrics(metrics);
    });
};

// Getters of metrics

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

MonitoringPlugin.prototype.getConsumersCount = function (cb) {
    //query rabbitmq for consumers no. on hyperflow.jobs, return null if anything goes wrong

    var rabbitMQURL = url.parse(config.rabbitMQURL);
    var user = config.rabbitmqUser;
    var password = config.rabbitmqPassword;

    var options = {
        method: 'GET',
        hostname: rabbitMQURL.hostname,
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

// Plugin initialization

MonitoringPlugin.prototype.init = function (rcl, wflib, engine) {
    if (this.hasOwnProperty('initialized') && this.initialized === true) {
        return;
    }
    this.rcl = rcl;
    this.wflib = wflib;
    this.engine = engine;

    var that = this;

    if (config.metricCollectorType == 'visor') {
        that.metricDestination = new VisorDestination();
    } else if (config.metricCollectorType == 'influxdb') {
        that.metricDestination = new InfluxDBDestination();
    } else {
        console.log("Unknown metric destination type!");
        return;
    }

    that.metricDestination.init(function (err) {
        if (!err) {
            setInterval(function () {
                that.gatherMetrics();
            }, 1000);
        } else {
            console.log('Unable to initialize metric destination!');
            console.log(err);
        }
    });

    this.initialized = true;
};

module.exports = MonitoringPlugin;