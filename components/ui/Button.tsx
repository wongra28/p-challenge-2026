import { Pressable, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { colors, spacing, radius, type as typeStyles } from '../../lib/theme';

type Hierarchy = 'primary' | 'secondary-gray' | 'secondary-color' | 'tertiary' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  label: string;
  onPress: () => void;
  hierarchy?: Hierarchy;
  size?: Size;
  disabled?: boolean;
  fullWidth?: boolean;
}

const HEIGHT: Record<Size, number> = { sm: 36, md: 40, lg: 44, xl: 48 };

const PADDING_H: Record<Size, number> = { sm: 14, md: 16, lg: 18, xl: 22 };

function getContainerStyle(hierarchy: Hierarchy, disabled: boolean): ViewStyle {
  if (disabled) {
    return { backgroundColor: colors.bgDisabled, borderWidth: 0 };
  }
  switch (hierarchy) {
    case 'primary':
      return { backgroundColor: colors.bgBrandSolid, borderWidth: 0 };
    case 'secondary-gray':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.borderPrimary,
      };
    case 'secondary-color':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.borderBrand,
      };
    case 'tertiary':
      return { backgroundColor: 'transparent', borderWidth: 0 };
    case 'link':
      return { backgroundColor: 'transparent', borderWidth: 0 };
  }
}

function getTextStyle(hierarchy: Hierarchy, disabled: boolean): TextStyle {
  if (disabled) {
    return { color: colors.textDisabled };
  }
  switch (hierarchy) {
    case 'primary':
      return { color: colors.textWhite };
    case 'secondary-gray':
      return { color: colors.textPrimary };
    case 'secondary-color':
      return { color: colors.textBrand };
    case 'tertiary':
      return { color: colors.textSecondary };
    case 'link':
      return { color: colors.textBrand };
  }
}

export function Button({
  label,
  onPress,
  hierarchy = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const isLink = hierarchy === 'link';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        {
          height: isLink ? undefined : HEIGHT[size],
          paddingHorizontal: isLink ? 0 : PADDING_H[size],
          borderRadius: isLink ? 0 : radius.md,
          opacity: pressed && !disabled ? 0.8 : 1,
        },
        getContainerStyle(hierarchy, disabled),
        fullWidth && styles.fullWidth,
      ]}
    >
      <Text
        style={[
          size === 'sm' ? typeStyles.labelSm : typeStyles.labelMd,
          getTextStyle(hierarchy, disabled),
          isLink && styles.linkText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});
