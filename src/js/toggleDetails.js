
btnHandler('#source', 'change', function(event) {
  var index = event.target.selectedIndex;
  var option = event.target.options[index].value;
  var input = document.querySelector('.source-other');
  if(option == "Other") {
    input.classList.remove("nope");
  } else {
    input.classList.add("nope");
  }
});
