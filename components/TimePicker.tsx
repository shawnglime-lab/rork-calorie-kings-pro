import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { X, Check } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { convert12To24, convert24To12 } from "@/utils/time";

interface TimePickerProps {
  visible: boolean;
  initialTime?: string;
  onConfirm: (time: string) => void;
  onCancel: () => void;
  title?: string;
  use24Hour?: boolean;
}

export default function TimePicker({
  visible,
  initialTime = "12:00",
  onConfirm,
  onCancel,
  title = "Select Time",
  use24Hour = false,
}: TimePickerProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const [hours, minutes] = initialTime.split(":").map(Number);
  const { hours: display12Hour, period: initialPeriod } = convert24To12(hours);
  
  const [selectedHour, setSelectedHour] = useState<number>(use24Hour ? hours : display12Hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(minutes);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(initialPeriod);

  const handleConfirm = () => {
    const hour24 = use24Hour ? selectedHour : convert12To24(selectedHour, selectedPeriod);
    const timeString = `${String(hour24).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    onConfirm(timeString);
  };

  const hourOptions = use24Hour 
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {hourOptions.map((hour) => (
                  <TouchableOpacity
                    key={`hour-${hour}`}
                    onPress={() => setSelectedHour(hour)}
                    style={[
                      styles.pickerItem,
                      selectedHour === hour && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        { color: colors.text },
                        selectedHour === hour && styles.selectedText,
                      ]}
                    >
                      {use24Hour ? String(hour).padStart(2, "0") : String(hour)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={[styles.separator, { color: colors.text }]}>:</Text>

            <View style={styles.pickerColumn}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {minuteOptions.map((minute) => (
                  <TouchableOpacity
                    key={`minute-${minute}`}
                    onPress={() => setSelectedMinute(minute)}
                    style={[
                      styles.pickerItem,
                      selectedMinute === minute && {
                        backgroundColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        { color: colors.text },
                        selectedMinute === minute && styles.selectedText,
                      ]}
                    >
                      {String(minute).padStart(2, "0")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {!use24Hour && (
              <View style={styles.pickerColumn}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {["AM", "PM"].map((period) => (
                    <TouchableOpacity
                      key={period}
                      onPress={() => setSelectedPeriod(period as "AM" | "PM")}
                      style={[
                        styles.pickerItem,
                        selectedPeriod === period && {
                          backgroundColor: colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          { color: colors.text },
                          selectedPeriod === period && styles.selectedText,
                        ]}
                      >
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.button, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <Check color="#FFFFFF" size={20} />
              <Text style={[styles.buttonText, styles.confirmButtonText]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  closeButton: {
    padding: 4,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    height: "100%",
  },
  scrollContent: {
    paddingVertical: 80,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    alignItems: "center",
  },
  pickerText: {
    fontSize: 24,
    fontWeight: "500" as const,
  },
  selectedText: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  separator: {
    fontSize: 28,
    fontWeight: "700" as const,
    marginHorizontal: 8,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  confirmButtonText: {
    color: "#FFFFFF",
  },
});
