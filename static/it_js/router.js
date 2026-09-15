import { dashboardView } from "./views/dashboard.js";
import { devicesView } from "./views/devices.js";

const routes = [
    {path: "/", view: dashboardView},
    {path: "/devices", view: devicesView}
];

const app = document.getElementById("app")

// Finds the correct js file given the route
function matchRoute(path) {
    const route = routes.find((r) => r.path === path.replace('/infotech', ''));
    if (!route) return null;
    return {view: route.view, params: {}}
}

// navigate is responsible for changing the url
export function navigate(path) {
    // history.pushState({}, "", path);
    render(path);
}

// This is responsible for passing the element id of where rendered results go
function render(path) {
    const match = matchRoute(path);
    if (match){
        match.view.mount(app)
    } else {
        app.innerHTML = `<p>Not found<p>`
    }
}

document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-link]");
    if (!link) return;
    e.preventDefault();

    console.log(link.getAttribute("href"))

    navigate(link.getAttribute("href"));
});

// window.addEventListener("popstate", () => render(location.pathname));

render(location.pathname)