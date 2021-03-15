const el = document.documentElement;
document.fullscreenEnabled = document.fullscreenEnabled ||
document.webkitFullscreenEnabled ||
document.mozFullScreenEnabled ||
document.msFullscreenEnabled;
document.exitFullscreen = document.exitFullscreen ||
document.webkitExitFullscreen ||
document.mozCancelFullScreen ||
document.msExitFullscreen;
el.requestFullscreen = el.requestFullscreen ||
el.webkitRequestFullscreen ||
el.mozRequestFullScreen ||
el.msRequestFullScreen;
const ToggleFullScreen = () => {
  // full-screen available?
  if (document.fullscreenEnabled) {
    // are we full-screen?
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ? document.exitFullscreen() : el.requestFullscreen();
  }
};
export default ToggleFullScreen;
