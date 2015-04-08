var MonitoringPlugin = function() {

};

MonitoringPlugin.prototype.init = function(rcl, wflib, engine) {
    this.rcl = rcl;
    this.wflib = wflib;
    this.engine = engine;

    console.log("Hello world!");
};

module.exports = MonitoringPlugin;