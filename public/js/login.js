function AvoidSpace(event) {
  var k = event ? event.which : window.event.keyCode;
  if (k == 32) return false;
}

function openPage(evt, user) {
    let i, info, tablinks;
    info = document.getElementsByClassName("details");
    for (i = 0; i < info.length; i++) {
      info[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(user).style.display = "block";
    evt.currentTarget.className += " active";
  }
  
  // Get the element with id="defaultOpen" and click on it
  setTimeout(() => {
    document.getElementById("defaultOpen").click();
  }, 100);
