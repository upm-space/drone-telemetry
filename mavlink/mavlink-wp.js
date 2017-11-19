class MavlinkWP {
  constructor() {
    this.wpsInAutopilot = 0;
    this.currentWp = 0;
  }
  setWpsInAutopilot(wpCount) {
    this.wpsInAutopilot = wpCount;
  }
  getWpsInAutopilot() {
    return this.wpsInAutopilot;
  }
  setCurrentWp(currWp) {
    this.currentWp = currWp;
  }
  getCurrentWp() {
    return this.currentWp;
  }
}

module.exports.MavlinkWP = MavlinkWP;
