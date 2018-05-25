var Application = require('spectron').Application
var assert = require('assert')

var app = new Application({
  env: { RUNNING_IN_SPECTRON: '1' },
  path: '../dist/linux-unpacked/ovis'
})

const chaiAsPromised = require("chai-as-promised")
const chai = require("chai")
chai.should()
chai.use(chaiAsPromised)

app.start().then(function () {
  // Check if the window is visible
  return app.browserWindow.isVisible()
}).then(function (isVisible) {
  // Verify the window is visible
  assert.equal(isVisible, true)
}).then(function () {
  // Get the window's title
  return app.client.getTitle()
}).then(function (title) {
  // Verify the window's title
  assert.equal(title, 'OpenMDAO Visualization')
}).then(function () {
  // Verify our open button is rendered to page
  let openButton = app.client.element('#openButton');
  assert.notEqual(openButton, null);
}).then(function () {
  // Stop the application
  console.log("Closing application...");
  return app.stop()
}).catch(function (error) {
  // Log any failures
  console.error('Test failed', error.message)
})

// app.start().then(function() {
//   app.client.element('#openButton').click();
//   // assert.equal(true, true, "button was not clicked");
// }).then(function() {
//   return app.stop();
// })
