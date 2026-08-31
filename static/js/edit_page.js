const commitEditBtn = document.getElementById("commit-edit")
const cancelEditBtn = document.getElementById("cancel-edit")

cancelEditBtn.addEventListener('click', () => {
    history.back();
});