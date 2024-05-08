const pluses = document.querySelectorAll(".plus");
const minuses = document.querySelectorAll(".minus");

for (let i = 0; i < pluses.length; i++) {
  pluses[i].addEventListener("click", function () {
    pluses[i].parentElement.querySelector(".attended").innerHTML++;
  });
}

for (let i = 0; i < minuses.length; i++) {
  minuses[i].addEventListener("click", function () {
    minuses[i].parentElement.querySelector(".attended").innerHTML--;
  });
}

const presentAll = document.querySelector(".present");
presentAll.addEventListener("click", () => {
  for (let i = 0; i < pluses.length; i++) {
    pluses[i].parentElement.querySelector(".attended").innerHTML++;
  }
});

const absentAll = document.querySelector(".absent");
absentAll.addEventListener("click", () => {
  for (let i = 0; i < minuses.length; i++) {
    minuses[i].parentElement.querySelector(".attended").innerHTML--;
  }
});

document.querySelector(".save").addEventListener("click", function () {
  var tableData = [];
  var rows = document.querySelectorAll(".wp-table tbody tr");
  for (let i = 1; i < rows.length; i++) {
    var rowData = {
      id: rows[i].cells[0].innerText,
      name: rows[i].cells[1].innerText,
      attended: rows[i].querySelector(".attended").innerText,
      total: rows[i].querySelector(".total").innerText,
      percentage: rows[i].cells[3].innerText,
    };
    tableData.push(rowData);
  }

  console.log(tableData);

  // Send tableData to server using AJAX
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/submit-table");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onload = function () {
    if (xhr.status === 200) {
      console.log(xhr.responseText);
      // Handle success response
    } else {
      console.error(xhr.statusText);
      // Handle error response
    }
  };
  xhr.send(JSON.stringify(tableData));
});
