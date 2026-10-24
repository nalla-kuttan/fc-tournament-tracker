// Runs inline in <head> before the first paint, so the opening intro plays once
// per browser session (a new tab or a PWA launch) and never on a reload after
// that. If storage is blocked it just plays every time; it's short.
export const SPLASH_SCRIPT = "try{var k='fc-splash-seen';if(sessionStorage.getItem(k)){document.documentElement.dataset.splash='off'}else{sessionStorage.setItem(k,'1')}}catch(e){}";
