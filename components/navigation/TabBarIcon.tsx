import { FontAwesome } from "@expo/vector-icons";
import { StyleSheet } from "react-native";

interface TabBarIconProps {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}

export function TabBarIcon(props: TabBarIconProps) {
  return (
    <FontAwesome size={28} style={styles.tabBarIcon} {...props} />
  );
}

const styles = StyleSheet.create({
  tabBarIcon: {
    marginBottom: -3,
  },
});
