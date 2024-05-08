const myGrid = document.querySelector(".my");
// const myCourses = myGrid.querySelectorAll(".card");

const runningGrid = document.querySelector(".running");
// const runningCourses = runningGrid.querySelectorAll(".card");
const courses = document.querySelectorAll(".card");


for(let i = 0; i < courses.length; i++){
    courses[i].addEventListener("click", function(event){
        const button = event.target;
        if(button.classList.contains("join")){
            button.innerHTML = "View Course";
            button.classList.add("view");
            button.classList.remove("join");
            const card = event.target.parentElement.parentElement;
            console.log(card);
            myGrid.appendChild(card);
        }
    });
}

function togglePopup() { 
    const overlay = document.getElementById('popupOverlay'); 
    overlay.classList.toggle('show'); 
} 