let notRaiseAlert = document.getElementById("not-raise-alert")
const backToPortalBtn = document.getElementById("return-to-portal-button").addEventListener("click", () => {
    if (notRaiseAlert) {
        window.location.href = "/requests/";
    }
    else {
        const confirmation = confirm("Any filled in information will be lost. Do you wish to proceed back to the portal?");
        if(!confirmation) return;
        window.location.href = "/requests/";
    }
})