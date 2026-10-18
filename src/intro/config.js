// ===== INTRO SETTINGS (edit here) =====
export const INTRO={
 mode:'built-in',            // 'built-in' = the screen in BuiltInIntro.jsx   |   'custom-html' = your own files in /public/intro/
 customUrl:'/intro/intro.html',
 minMs:1800,                 // how long the built-in intro stays (about 1.8 seconds)
 maxMs:6000,                 // custom intro: moves on after this time even if it never says it is finished
 reducedMotionMs:900,        // shorter intro for people who turn animations off
 oncePerSession:false        // show the intro once each time the app is opened, not on every screen change
}
