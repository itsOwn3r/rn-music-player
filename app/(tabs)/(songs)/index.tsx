// app/(tabs)/(songs)/index.tsx
import React, { useEffect } from "react";

import LoadingScreen from "@/components/LoadingScreen";
import MusicList from "@/components/MusicList";
import { usePlayerStore } from "@/tools/store/usePlayerStore";

export default function SongsScreen() {
  // const { files, pickFolder, isLoading, currentSong } = usePlayerStore();
  const files = usePlayerStore((s) => s.files);
  const pickFolder = usePlayerStore((s) => s.pickFolder);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const currentSong = usePlayerStore((s) => s.currentSong);

  useEffect(() => {
    pickFolder();
  }, []);

  if (isLoading) return <LoadingScreen />;

  return <MusicList files={files} currentSong={currentSong} />;
}

// TODO

// const [search, setSearch] = useState("");

// const filteredTracks = useMemo(() => {
//   if (search.trim() === "") {
//     return [];
//   }
//   const lowercasedSearch = search.toLowerCase();
//   return library.filter(
//     (track) =>
//       track.title.toLowerCase().includes(lowercasedSearch) ||
//       (track.artist && track.artist.toLowerCase().includes(lowercasedSearch))
//   );
// }, [search]);

// const scrollY = useRef(new Animated.Value(0)).current;

// const insets = useSafeAreaInsets();

// useEffect(() => {
//   const sub = AppState.addEventListener("change", (state) => {
//     if (state === "active") {
//       scrollY.stopAnimation();
//       scrollY.setValue(0);
//     }
//   });
//   return () => sub.remove();
// }, [scrollY]);

// const AnimatedTracksList = Animated.createAnimatedComponent(TracksList);

// return (
//   <View className="flex-1 bg-black">
//     <Animated.View
//       className="absolute left-0 right-0 bg-neutral-900 px-4 pb-2 z-10"
//       style={{
//         paddingTop: insets.top,
//         elevation: 8,
//       }}
//     >
//       <View className="flex-row items-center w-full bg-neutral-800 rounded-lg px-3">
//         <TextInput
//           className="text-white text-base flex-1 py-2"
//           placeholder="Find in songs"
//           placeholderTextColor="#999"
//           value={search}
//           onChangeText={setSearch}
//         />
//         {search ? (
//           <TouchableOpacity
//             className="pl-2 py-2"
//             onPress={() => setSearch("")}
//           >
//             <Ionicons name="close" color="red" size={20} />
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity className="pl-2 py-2">
//             <Ionicons name="search" color="#fff" size={20} />
//           </TouchableOpacity>
//         )}
//       </View>
//     </Animated.View>

//     <AnimatedTracksList
//       tracks={library}
//       contentContainerStyle={{
//         paddingTop: 72,
//         paddingBottom: 128,
//       }}
//       scrollEventThrottle={16}
//       onScroll={Animated.event(
//         [{ nativeEvent: { contentOffset: { y: scrollY } } }],
//         { useNativeDriver: true }
//       )}
//       removeClippedSubviews
//       initialNumToRender={12}
//       windowSize={11}
//       extraData={
//         !search && filteredTracks.length === 0 ? null : filteredTracks
//       }
//     />
//   </View>
// );
// };

// export default SongsScreen;
