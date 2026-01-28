import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const conversations = [
  {
    id: '1',
    name: 'sarah',
    lastMessage: 'that coffee spot looks amazing! want to go tomorrow?',
    time: '2m',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    unread: 2,
    online: true,
  },
  {
    id: '2',
    name: 'alex',
    lastMessage: "hey! just matched. saw you're also in lisbon",
    time: '1h',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    unread: 1,
    online: true,
  },
  {
    id: '3',
    name: 'jordan',
    lastMessage: 'thanks for the coworking recommendation!',
    time: 'yesterday',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    unread: 0,
    online: false,
  },
];

export default function MessagesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
        <Text
          className="text-2xl text-black"
          style={{ fontFamily: 'InstrumentSans_700Bold' }}
        >
          messages
        </Text>
        <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
          <Ionicons name="create-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {conversations.length === 0 ? (
          <View className="items-center py-20 px-6">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" />
            </View>
            <Text
              className="text-xl text-black text-center mb-2"
              style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
            >
              no messages yet
            </Text>
            <Text
              className="text-gray-500 text-center"
              style={{ fontFamily: 'InstrumentSans_400Regular' }}
            >
              when you match with someone, you can start a conversation here.
            </Text>
          </View>
        ) : (
          conversations.map((convo) => (
            <TouchableOpacity
              key={convo.id}
              className="flex-row items-center px-6 py-4 border-b border-gray-100"
              activeOpacity={0.7}
            >
              <View className="relative">
                <Image
                  source={{ uri: convo.photo }}
                  className="w-14 h-14 rounded-full"
                  resizeMode="cover"
                />
                {convo.online && (
                  <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                )}
              </View>

              <View className="flex-1 ml-4">
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-black text-base"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {convo.name}
                  </Text>
                  <Text
                    className={`text-sm ${convo.unread > 0 ? 'text-black' : 'text-gray-500'}`}
                    style={{ fontFamily: convo.unread > 0 ? 'InstrumentSans_600SemiBold' : 'InstrumentSans_400Regular' }}
                  >
                    {convo.time}
                  </Text>
                </View>
                <Text
                  className={`text-sm mt-0.5 ${convo.unread > 0 ? 'text-black' : 'text-gray-500'}`}
                  style={{ fontFamily: convo.unread > 0 ? 'InstrumentSans_500Medium' : 'InstrumentSans_400Regular' }}
                  numberOfLines={1}
                >
                  {convo.lastMessage}
                </Text>
              </View>

              {convo.unread > 0 && (
                <View className="w-6 h-6 rounded-full items-center justify-center ml-2" style={{ backgroundColor: '#fd6b03' }}>
                  <Text
                    className="text-white text-xs"
                    style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
                  >
                    {convo.unread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
