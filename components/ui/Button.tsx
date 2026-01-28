import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
}: ButtonProps) {
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 16 },
    md: { paddingVertical: 12, paddingHorizontal: 24 },
    lg: { paddingVertical: 16, paddingHorizontal: 32 },
  };

  const textSizeStyles = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={{
          width: fullWidth ? '100%' : undefined,
          backgroundColor: '#fff',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          ...sizeStyles[size],
        }}
      >
        {loading ? (
          <ActivityIndicator color="#9CA3AF" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {icon}
            <Text
              style={{
                fontFamily: 'InstrumentSans_600SemiBold',
                fontSize: textSizeStyles[size],
                color: disabled ? '#9CA3AF' : '#000',
              }}
            >
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  const variantStyles = {
    secondary: { backgroundColor: '#F3F4F6' },
    outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#fd6b03' },
    ghost: { backgroundColor: 'transparent' },
  };

  const textVariantColors = {
    secondary: '#000',
    outline: '#fd6b03',
    ghost: '#000',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        width: fullWidth ? '100%' : undefined,
        opacity: disabled ? 0.5 : 1,
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#fd6b03' : '#000'} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text
            style={{
              fontFamily: 'InstrumentSans_600SemiBold',
              fontSize: textSizeStyles[size],
              color: textVariantColors[variant],
            }}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
