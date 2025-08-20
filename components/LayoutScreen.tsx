import { musicData } from "@/data/music";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { SafeAreaView } from "react-native";
import MusicList from "./MusicList";
import Playing from "./Playing";

const LayoutScreen = () => {
  const [tabSelected, setTabSelected] = useState<"list" | "playing">("playing");
  return (
    <>
      <LinearGradient colors={["#212528", "#111315"]} className="bg-[#111315]">
        <SafeAreaView>
          {tabSelected === "list" ? (
            <MusicList musicData={musicData} setTabSelected={setTabSelected} />
          ) : (
            <Playing setTabSelected={setTabSelected} />
          )}
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

export default LayoutScreen;
