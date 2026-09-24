import TrackPlayer, { Event, State } from "react-native-track-player";
import { usePlayerStore } from "./tools/store/usePlayerStore";
import { updateMusicWidget } from "./tools/services/widgetService";

export default async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, async () => {
    const state = await TrackPlayer.getPlaybackState();
    if (state.state === State.Stopped || state.state === State.None) {
      await usePlayerStore.getState().playPauseMusic();
    } else {
      await TrackPlayer.play();
    }
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

  TrackPlayer.addEventListener(Event.PlaybackState, (data) => {
    const isPlaying = data.state === State.Playing;
    usePlayerStore.setState({ isPlaying });
    const currentSong = usePlayerStore.getState().currentSong;
    updateMusicWidget(currentSong, isPlaying);
  });

  TrackPlayer.addEventListener(
    Event.PlaybackProgressUpdated,
    ({ position, duration }) => {
      usePlayerStore.setState({ position, duration });
    }
  );

  TrackPlayer.addEventListener(Event.RemoteSeek, async ({ position }) => {
    await TrackPlayer.seekTo(position);
    usePlayerStore.setState({ position });
  });

  TrackPlayer.addEventListener(Event.RemoteJumpForward, async () => {
    const { position, duration } = usePlayerStore.getState();
    await TrackPlayer.seekTo(Math.min(position + 10, duration));
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async () => {
    const { position } = usePlayerStore.getState();
    await TrackPlayer.seekTo(Math.max(position - 10, 0));
  });

  TrackPlayer.addEventListener(Event.RemoteNext, async () => {
    usePlayerStore.getState().playAnotherSongInQueue("next");
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
    usePlayerStore.getState().playAnotherSongInQueue("previous");
  });

  TrackPlayer.addEventListener(
    Event.PlaybackActiveTrackChanged,
    async (Event) => {
      if (Event.lastPosition && !Event.index) {
        const currentSong = await usePlayerStore.getState().currentSong;
        await usePlayerStore
          .getState()
          .setProgress(Event.lastPosition, currentSong?.duration || 1);
      }

      // Handeling end of track here.
      // In order to have the Next Button on Notification bar:
      //  We're always passing a fake second array item to 'TrackPlayer.add([])'

      if (Event.index) {
        if (Event.index > 0) {
          await TrackPlayer.pause();
          await TrackPlayer.stop();
          await usePlayerStore
            .getState()
            .playAnotherSongInQueue("next", "update");
        }
      }
    }
  );
}
