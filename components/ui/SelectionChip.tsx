import { TouchableOpacity, Text } from 'react-native';

interface SelectionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  emoji?: string;
}

export function SelectionChip({ label, selected, onPress, emoji }: SelectionChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`py-3 px-5 rounded-full border-2 mr-2 mb-2 ${
        selected ? 'bg-orange-50 border-orange-primary' : 'bg-white border-transparent'
      }`}
      activeOpacity={0.7}
    >
      <Text
        className={`text-base ${selected ? 'text-orange-primary' : 'text-black'}`}
        style={{ fontFamily: 'InstrumentSans_500Medium' }}
      >
        {emoji ? `${emoji} ${label}` : label}
      </Text>
    </TouchableOpacity>
  );
}
