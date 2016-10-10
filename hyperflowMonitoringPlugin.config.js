var METRIC_COLLECTOR_TYPE = process.env.METRIC_COLLECTOR ? process.env.METRIC_COLLECTOR_TYPE : 'visor';
var APP_NAME = process.env.SERVER_NAME ? process.env.SERVER_NAME : 'HyperFlow';

var METRIC_COLLECTOR_URI = process.env.METRIC_COLLECTOR ? process.env.METRIC_COLLECTOR : 'localhost:9002';

var VISOR_PUBLIC_IP = process.env.PUBLIC_IP ? process.env.PUBLIC_IP : '127.0.0.1';
var VISOR_CLOUD_IP = process.env.CLOUD_IP ? process.env.CLOUD_IP : '127.0.0.1';

var RABBITMQ_URL = process.env.AMQP_URL ? process.env.AMQP_URL : "amqp://localhost:5672";
var RABBITMQ_USER = process.env.RABBITMQ_USER ? process.env.RABBITMQ_USER : "guest";
var RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD ? process.env.RABBITMQ_PASSWORD : "guest";

module.exports = {
    metricCollectorType: METRIC_COLLECTOR_TYPE,
    appName: APP_NAME,
    metricCollectorUri: METRIC_COLLECTOR_URI,
    visorPublicIp: VISOR_PUBLIC_IP,
    visorCloudIp: VISOR_CLOUD_IP,
    rabbitMQURL: RABBITMQ_URL,
    rabbitmqUser: RABBITMQ_USER,
    rabbitmqPassword: RABBITMQ_PASSWORD
};