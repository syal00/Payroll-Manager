import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Runs before paint to avoid light-mode flash when dark is saved. */
export function ThemeScript() {
  const script = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"){document.documentElement.setAttribute("data-theme","dark")}}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
