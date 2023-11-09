// Get all modal elements
var modals = document.querySelectorAll(".modal");

// Get all trigger buttons
var buttons = document.querySelectorAll(".myBtn");

// Get all close buttons
var closeButtons = document.querySelectorAll(".close");

// Loop through each trigger button to attach the click event
for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener("click", function (event) {
    // Show the corresponding modal
    var modal = event.target.nextElementSibling;
    modal.style.display = "block";
  });
}

// Loop through each close button to attach the click event
for (var i = 0; i < closeButtons.length; i++) {
  closeButtons[i].addEventListener("click", function (event) {
    // Close the modal when the close button is clicked
    var modal = event.target.parentElement.parentElement;
    modal.style.display = "none";
  });
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  for (var i = 0; i < modals.length; i++) {
    if (event.target == modals[i]) {
      modals[i].style.display = "none";
    }
  }
};
