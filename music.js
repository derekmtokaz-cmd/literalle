/* ---------------- MUSIC CONTROLS ---------------- */

const musicTracks = [
  {
    floor: 1,
    src: "music/Sovereign Quarter.mp3",
    attribution:
      "\"Sovereign Quarter\" Kevin MacLeod (incompetech.com)\n" +
      "Licensed under Creative Commons: By Attribution 4.0 License\n" +
      "http://creativecommons.org/licenses/by/4.0/"
  },
  {
    floor: 2,
    src: "music/Blue Feather.mp3",
    attribution:
      "\"Blue Feather\" Kevin MacLeod (incompetech.com)\n" +
      "Licensed under Creative Commons: By Attribution 4.0 License\n" +
      "http://creativecommons.org/licenses/by/4.0/"
  }
];

let currentMusicTrack = null;

function initializeMusicControls() {
  if (
    !backgroundMusic ||
    !musicToggleButton ||
    !musicVolumeControl ||
    !musicInfoButton
  ) {
    return;
  }

  syncMusicToCurrentFloor();
  backgroundMusic.volume = Number(musicVolumeControl.value) / 100;
  updateMusicToggleButton();

  musicToggleButton.addEventListener("click", toggleBackgroundMusic);
  musicVolumeControl.addEventListener("input", updateMusicVolume);
  backgroundMusic.addEventListener("play", updateMusicToggleButton);
  backgroundMusic.addEventListener("pause", updateMusicToggleButton);
  backgroundMusic.addEventListener("ended", restartCurrentMusicTrack);
}

function getMusicTrackForCurrentFloor() {
  const exactTrack = musicTracks.find((track) => {
    return track.floor === gameState.currentFloor;
  });

  if (exactTrack) {
    return exactTrack;
  }

  return musicTracks[musicTracks.length - 1] || null;
}

function syncMusicToCurrentFloor() {
  if (!backgroundMusic || !musicInfoButton) {
    return;
  }

  const nextTrack = getMusicTrackForCurrentFloor();

  if (!nextTrack || currentMusicTrack?.src === nextTrack.src) {
    return;
  }

  const shouldKeepPlaying = !backgroundMusic.paused;

  currentMusicTrack = nextTrack;
  backgroundMusic.src = nextTrack.src;
  musicInfoButton.dataset.attribution = nextTrack.attribution;

  if (shouldKeepPlaying) {
    tryPlayBackgroundMusic();
  }
}

function tryPlayBackgroundMusic() {
  const playAttempt = backgroundMusic.play();

  if (playAttempt && typeof playAttempt.catch === "function") {
    playAttempt.catch(() => {
      updateMusicToggleButton();
    });
  }
}

function restartCurrentMusicTrack() {
  syncMusicToCurrentFloor();
  backgroundMusic.currentTime = 0;
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
  const isPaused = backgroundMusic.paused;

  musicToggleButton.textContent = isPaused ? "▶" : "⏸";
  musicToggleButton.setAttribute("aria-label", isPaused ? "Play music" : "Pause music");
  musicToggleButton.classList.toggle("music-paused", isPaused);
  musicToggleButton.classList.toggle("music-playing", !isPaused);

  if (musicInfoButton?.dataset.attribution) {
    musicToggleButton.dataset.attribution = musicInfoButton.dataset.attribution;
  }
}
