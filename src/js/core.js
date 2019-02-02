// simple button click event handler
function btnHandler(selector, eventType, callback) {
  var btn = document.querySelector(selector);
  if(!btn) { return; }
  btn.addEventListener(eventType, function(event) {
    event.preventDefault();
    callback(event);
  }, false);
}

