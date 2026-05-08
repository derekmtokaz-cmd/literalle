/* ---------------- MUSIC CONTROLS ---------------- */

const musicPlaylist = [
  {
    src: "music/Sovereign Quarter.mp3",
    attribution:
      "\"Blue Feather\" Kevin MacLeod (incompetech.com)\n" +
      "Licensed under Creative Commons: By Attribution 4.0 License\n" +
      "http://creativecommons.org/licenses/by/4.0/"
  }
];

let currentMusicTrackIndex = 0;

function initializeMusicControls() {
  if (
    !backgroundMusic ||
    !musicToggleButton ||
    !musicVolumeControl ||
    !musicInfoButton
  ) {
    return;
  }

  loadCurrentMusicTrack();
  backgroundMusic.volume = Number(musicVolumeControl.value) / 100;
  updateMusicToggleButton();

  musicToggleButton.addEventListener("click", toggleBackgroundMusic);
  musicVolumeControl.addEventListener("input", updateMusicVolume);
  backgroundMusic.addEventListener("play", updateMusicToggleButton);
  backgroundMusic.addEventListener("pause", updateMusicToggleButton);
  backgroundMusic.addEventListener("ended", playNextMusicTrack);
}

function loadCurrentMusicTrack() {
  const currentTrack = musicPlaylist[currentMusicTrackIndex];

  backgroundMusic.src = currentTrack.src;
  musicInfoButton.dataset.attribution = currentTrack.attribution;
}

function tryPlayBackgroundMusic() {
  const playAttempt = backgroundMusic.play();

  if (playAttempt && typeof playAttempt.catch === "function") {
    playAttempt.catch(() => {
      updateMusicToggleButton();
    });
  }
}

function playNextMusicTrack() {
  currentMusicTrackIndex = (currentMusicTrackIndex + 1) % musicPlaylist.length;
  loadCurrentMusicTrack();
  tryPlayBackgroundMusic();
}

function toggleBackgroundMusic() {
  if (backgroundMusic.paused) {
    tryPlayBackgroundMusic();
    return;
  }

  backgroundMusic.pause();
}

function updateMusicVolume() {
  backgroundMusic.volume = Number(musicVolumeControl.value) / 100;
}

function updateMusicToggleButton() {
  musicToggleButton.textContent = backgroundMusic.paused ? "Play" : "Pause";
}
