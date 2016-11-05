# Hyperflow monitoring plugin

## Description

This is a simple monitoring plugin for HyperFlow (https://github.com/dice-cyfronet/hyperflow/tree/develop <- 
you need this branch).

## Usage

### start a dummy visor server
which responds to requests at $PUBLIC_IP:31415/monitors with visor compatible monitor data, an example is located here:
https://gist.github.com/mpawlik/aa58841c51f10a35325f79194100425f
monitor information should point to port specified below (host address is ignored).

### start a dummy message aggregator
`while :; do nc -l -p 49152; done`

`while` is required because nc exits after the connection is closed, current version of plugin sends each message in a
separate connection.

### install this plugin
Monitoring plugin needs to be in scope of hyperflow's `require`, there are several ways of achieving this, in case of
development it's most convenient to have `hyperflow-monitoring-plugin` cloned in $HOME, and then do any of the following:

* make a symbolic link to `hyperflow-monitoring-plugin` directory in $HOME/node_modules/ (this is the preferred way for
development)
* do `npm install hyperflow-monitoring-plugin` in $HOME

### check configuration

The plugin requires a proper config, it needs to know where to find a metric collector and a rabbitmq-server. All values
 can be set by environment variables. RabbitMQ needs to have rest interface enabled.

### start workflow
In HyperFlow directory:
`./bin/hflow run examples/Montage143/workflow.json -s -p hyperflow-monitoring-plugin`
and observe the message flow in nc.
