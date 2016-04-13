var METRIC_COLLECTOR = process.env.METRIC_COLLECTOR ? process.env.METRIC_COLLECTOR : 'localhost:9002';
var METRIC_COLLECTOR_TYPE = process.env.METRIC_COLLECTOR ? process.env.METRIC_COLLECTOR_TYPE : 'visor';
var SERVER_NAME = process.env.SERVER_NAME ? process.env.SERVER_NAME : 'HyperFlow';
var AMQP_URL = process.env.AMQP_URL ? process.env.AMQP_URL : "amqp://localhost:5672";
var RABBITMQ_USER = process.env.RABBITMQ_USER ? process.env.RABBITMQ_USER : "guest";
var RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD ? process.env.RABBITMQ_PASSWORD : "guest";

module.exports = {
    metricCollector: METRIC_COLLECTOR,
    metricCollectorType: METRIC_COLLECTOR_TYPE,
    serverName: SERVER_NAME,
    amqpURL: AMQP_URL,
    rabbitmqUser: RABBITMQ_USER,
    rabbitmqPassword: RABBITMQ_PASSWORD
};