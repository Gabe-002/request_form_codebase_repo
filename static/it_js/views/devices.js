export const devicesView = {
    async mount(container) {
        container.innerHTML = `
            <div class="dashboard-header">
                <div class="site-heading">
                <h2>Devices Panel</h2>
                <p>Manage devices</p>
                </div>
                <div class="quick-buttons">
                    <button id="add-device" type="button">+ Add Device</button>
                </div>
            </div>
            <div>
                <div class="search-options" id="search-options">
                    <input id="device-search">
                    <button id="all-devices" class="selected">All</button>
                    <button id="allocated-devices">Allocated</button>
                    <button id="free-devices">Free</button>
                </div>
            </div>
        `;
        const buttons = document.querySelectorAll('.search-options button')
        monitorButtons(buttons);
    }
}



function monitorButtons(buttons) {
    const searchOptions = document.getElementById("search-options")
    searchOptions.addEventListener('click', (event) => {
        if (!event.target.matches('button')) return
        buttons.forEach(btn => btn.classList.remove('selected'))
        event.target.classList.add('selected')
    })
}