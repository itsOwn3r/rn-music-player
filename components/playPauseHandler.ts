import axios from "axios";
import { toast } from "sonner-native";

export const playPauseHandler = async (action: "play" | "pause") => {
  try {
    await axios.post("http://192.168.1.108:3001/api/music/action", { action });
  } catch (error) {
    toast.error(`"Change Position failed: ", ${error}`);
  }
};
