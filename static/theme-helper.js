function initThemeHelper() {
  function getTheme() {
    const theme = localStorage.getItem("theme");
    return theme || "";
  }

  function setTheme(theme) {
    if (theme === "system") theme = "";

    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }

  window.getTheme = getTheme;
  window.setTheme = setTheme;

  const theme = getTheme();
  setTheme(theme);
}

initThemeHelper();
