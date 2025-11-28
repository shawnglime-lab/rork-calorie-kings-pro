import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, X } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  initialDate?: string;
  title?: string;
  minDate?: string;
  maxDate?: string;
}

export default function DatePicker({
  visible,
  onClose,
  onSelect,
  initialDate,
  title = "Select Date",
}: DatePickerProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const [dateInput, setDateInput] = useState("");

  useEffect(() => {
    if (visible && initialDate) {
      setDateInput(initialDate);
    } else if (visible) {
      const today = new Date();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const yyyy = today.getFullYear();
      setDateInput(`${mm}/${dd}/${yyyy}`);
    }
  }, [visible, initialDate]);

  const formatDateInput = (text: string) => {
    const digitsOnly = text.replace(/\D/g, "");
    
    let formatted = "";
    if (digitsOnly.length > 0) {
      formatted = digitsOnly.substring(0, 2);
      if (digitsOnly.length >= 3) {
        formatted += "/" + digitsOnly.substring(2, 4);
      }
      if (digitsOnly.length >= 5) {
        formatted += "/" + digitsOnly.substring(4, 8);
      }
    }
    return formatted;
  };

  const handleTextChange = (text: string) => {
    const formatted = formatDateInput(text);
    setDateInput(formatted);
  };

  const handleConfirm = () => {
    if (dateInput.length === 10) {
      const [month, day, year] = dateInput.split("/").map(Number);
      if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          onSelect(dateInput);
          onClose();
          return;
        }
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
            <TouchableWithoutFeedback>
              <View style={[styles.container, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                    <X color={colors.textSecondary} size={24} />
                  </TouchableOpacity>
                  <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                  <TouchableOpacity onPress={handleConfirm} style={styles.headerButton}>
                    <Check color={colors.primary} size={24} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Enter date (MM/DD/YYYY)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={dateInput}
                    onChangeText={handleTextChange}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    maxLength={10}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleConfirm}
                  />
                  <Text style={[styles.hint, { color: colors.textTertiary }]}>Example: 03/15/2024</Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
  },
  inputContainer: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  input: {
    fontSize: 24,
    fontWeight: "600" as const,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    textAlign: "center" as const,
    letterSpacing: 2,
  },
  hint: {
    fontSize: 13,
    marginTop: 12,
    textAlign: "center" as const,
  },
});
