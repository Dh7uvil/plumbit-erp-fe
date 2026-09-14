export const THEME_STORAGE_KEY = "plumbit-theme";

export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`;
