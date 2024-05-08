const path = window.location.pathname;
const tabs = document.querySelectorAll(".link");
for(let i = 0; i < tabs.length; i++){
    if(tabs[i].classList.contains("active")){
        tabs[i].classList.remove("active");
    }
}

if(path === "/courses"){
    document.getElementById("courses").classList.add("active")
}else if(path === "/clubs"){
    document.getElementById("clubs").classList.add("active")
}else if(path === "/progess"){
    document.getElementById("progress").classList.add("active")
}else if(path === "/tests"){
    document.getElementById("tests").classList.add("active")
}else if(path === "/resources"){
    document.getElementById("resources").classList.add("active")
}else if(path === "/courses/view"){
    document.getElementById("courses").classList.add("active")
}else if(path === "/courses/view/units"){
    document.getElementById("courses").classList.add("active")
}