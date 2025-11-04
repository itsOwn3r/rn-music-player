import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
} from "react-native-track-player";

export async function setupPlayer() {
  await TrackPlayer.setupPlayer();

  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.ContinuePlayback,
    },
    capabilities: [
      Capability.JumpBackward,
      Capability.Play,
      Capability.JumpForward,
      Capability.SeekTo,
    ],
    compactCapabilities: [
      Capability.JumpBackward,
      Capability.Play,
      Capability.JumpForward,
      Capability.SeekTo,
    ],
    notificationCapabilities: [
      Capability.JumpBackward,
      Capability.Play,
      Capability.JumpForward,
      Capability.SeekTo,
    ],
  });
}
