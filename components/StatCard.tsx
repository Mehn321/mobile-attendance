import { View, Text, StyleSheet } from "react-native";

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: string;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
}: StatCardProps) => {
  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#999",
  },
});
