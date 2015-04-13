var MonitoringPlugin = function () {
};

MonitoringPlugin.prototype.sendMetrics = function () {
    console.log('Im running:', this.engine.nTasksLeft.toString(), 'tasks');
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