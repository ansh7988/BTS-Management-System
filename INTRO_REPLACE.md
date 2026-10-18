# Replace the intro with your original HTML/CSS/JS
1. Copy your files into `public/intro/` (for example `intro.html`, `intro.css`, `intro.js`, images, fonts). Use relative links like `./intro.css`.
2. In `src/intro/config.js` set `mode:'custom-html'` (change `customUrl` if your file has another name).
3. Optional: when your animation finishes, add this line to your JS so the app moves on at that moment:
   `parent.postMessage({type:'bts-intro-done'},'*')`
   Without it the app moves on after `maxMs` (6 seconds).
4. The "ENTER →" button always works, and the intro is shown once per browser session.
Note: the intro runs inside a sandboxed frame (scripts allowed, no access to the app or its data). To go back, set `mode:'built-in'`.
