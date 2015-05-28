# Hyperflow monitoring plugin

## Description

This is a simple monitoring plugin for HyperFlow (https://github.com/dice-cyfronet/hyperflow/tree/feature/plugins <- 
you need this branch).

## Usage

### start a dummy message aggregator
`while :; do nc -l -p 9001; done`

`while` is required as nc exits after the connection is closed, current version of plugin sends each message in
separate connection.

### install this plugin
Monitoring plugin needs to be in scope of hyperflow's `require`, there are several ways of achieving this, first of it is required
to have `hyperflow-monitoring-plugin` cloned in $HOME, then do any of the following:

* make a symbolic link to `hyperflow-monitoring-plugin` directory in $HOME/node_modules/ (this is the preffered way for
development)
* do `npm install hyperflow-monitoring-plugin` while beeing in $HOME

### start workflow
In HyperFlow directory:
`./bin/hflow run examples/Montage143/workflow.json -s -p hyperflow-monitoring-plugin`
and observe the message flow in nc.