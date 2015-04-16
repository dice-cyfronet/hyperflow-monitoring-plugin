var METRIC_COLLECTOR = process.env.METRIC_COLLECTOR ? process.env.METRIC_COLLECTOR : 'localhost:9001';
var SERVER_NAME = process.env.SERVER_NAME ? process.env.SERVER_NAME : 'HyperFlow';


module.exports = {
    metricCollector: METRIC_COLLECTOR,
    serverName: SERVER_NAME
};