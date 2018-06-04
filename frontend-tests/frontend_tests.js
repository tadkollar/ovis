const Application = require("spectron").Application;
const path = require("path");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

// Determine which app to use
// var path = "../dist/";
// switch (process.platform) {
//   case "darwin":
//     path += "mac-x64/OVis.app/Contents/MacOS/OVis";
//     break;
//   case "win32":
//     path += "win-unpacked/OVis.exe";
//     break;
//   case "linux":
//     path += "linux-unpacked/ovis";
//     break;
// }

// var app = new Application({
//   env: { RUNNING_IN_SPECTRON: "1" },
//   path: path
// });

var electronPath = path.join(
  __dirname,
  "..",
  "node_modules",
  ".bin",
  "electron"
);

if (process.platform === "win32") {
  electronPath += ".cmd";
}

var appPath = path.join(__dirname, "..");

var app = new Application({
  env: { RUNNING_IN_SPECTRON: "1" },
  path: electronPath,
  args: [appPath]
});

global.before(function() {
  chai.should();
  chai.use(chaiAsPromised);
});

describe("Test OVis", () => {
  beforeEach(function() {
    return app.start();
  });

  afterEach(function() {
    return app.stop();
  });

  it("opens a window", function() {
    return app.client
      .waitUntilWindowLoaded()
      .getWindowCount()
      .should.eventually.equal(1);
  });

  it("tests the title", function() {
    return app.client
      .waitUntilWindowLoaded()
      .getTitle()
      .should.eventually.equal("OpenMDAO Visualization");
  });
});

// app
//   .start()
//   .then(function() {
//     // Check if the window is visible
//     return app.browserWindow.isVisible();
//   })
//   .then(function(isVisible) {
//     // Verify the window is visible
//     assert.equal(isVisible, true);
//   })
//   .then(function() {
//     // Get the window's title
//     return app.client.getTitle();
//   })
//   .then(function(title) {
//     // Verify the window's title
//     assert.equal(title, "OpenMDAO Visualization");
//   })
//   .then(function() {
//     // Verify our open button is rendered to page
//     let openButton = app.client.element("#openButton");
//     assert.notEqual(openButton, null);
//   })
//   .then(function() {
//     // Stop the application
//     console.log("Closing application...");
//     return app.stop();
//   })
//   .catch(function(error) {
//     // Log any failures
//     console.error("Test failed", error.message);
//   });

// app.start().then(function() {
//   app.client.element('#openButton').click();
//   // assert.equal(true, true, "button was not clicked");
// }).then(function() {
//   return app.stop();
// })
