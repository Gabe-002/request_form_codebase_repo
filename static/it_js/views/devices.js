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
                <div class="search-options">
                    <input id="device-search">
                    <button id="all-devices">All</button>
                    <button id="allocated-devices">Allocated</button>
                    <button id="free-devices">Free</button>
                </div>
            </div>
        `;
    }
}