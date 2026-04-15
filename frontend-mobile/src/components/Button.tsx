import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const palette = stylesByVariant[variant];

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        palette.button,
        style,
        pressed && !disabled && !loading ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.spinnerColor} />
      ) : (
        <Text style={[styles.label, palette.label]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

const stylesByVariant: Record<
  NonNullable<ButtonProps["variant"]>,
  {
    button: ViewStyle;
    label: TextStyle;
    spinnerColor: string;
  }
> = {
  primary: {
    button: {
      backgroundColor: "#146356",
    },
    label: {
      color: "#f7f5ef",
    },
    spinnerColor: "#f7f5ef",
  },
  secondary: {
    button: {
      backgroundColor: "#efe7d7",
      borderWidth: 1,
      borderColor: "#d7ccb7",
    },
    label: {
      color: "#20332d",
    },
    spinnerColor: "#20332d",
  },
  ghost: {
    button: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: "#c9bda6",
    },
    label: {
      color: "#20332d",
    },
    spinnerColor: "#20332d",
  },
};
