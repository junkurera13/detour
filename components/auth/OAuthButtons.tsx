import { useState } from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

interface OAuthButtonsProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function OAuthButtons({ onSuccess, onError }: OAuthButtonsProps) {
  useWarmUpBrowser();

  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: appleOAuth } = useOAuth({ strategy: 'oauth_apple' });

  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoadingProvider(provider);

    try {
      const oauthFlow = provider === 'google' ? googleOAuth : appleOAuth;
      const redirectUrl = Linking.createURL('oauth-callback');
      console.log('OAuth redirect URL:', redirectUrl);

      const { createdSessionId, setActive } = await oauthFlow({
        redirectUrl,
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        onSuccess();
      }
    } catch (err: any) {
      console.error(`OAuth ${provider} error:`, err);
      // Don't show error for user cancellation
      if (!err?.message?.includes('cancelled')) {
        onError(`Failed to sign in with ${provider}`);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View className="gap-3">
      <TouchableOpacity
        onPress={() => handleOAuth('google')}
        disabled={loadingProvider !== null}
        className="w-full flex-row items-center justify-center bg-white py-4 px-8 rounded-full"
        style={{ opacity: loadingProvider !== null ? 0.7 : 1 }}
      >
        {loadingProvider === 'google' ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Ionicons name="logo-google" size={20} color="#000" />
        )}
        <Text
          className="text-black text-lg ml-3"
          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
        >
          google
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleOAuth('apple')}
        disabled={loadingProvider !== null}
        className="w-full flex-row items-center justify-center bg-white py-4 px-8 rounded-full"
        style={{ opacity: loadingProvider !== null ? 0.7 : 1 }}
      >
        {loadingProvider === 'apple' ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Ionicons name="logo-apple" size={22} color="#000" />
        )}
        <Text
          className="text-black text-lg ml-3"
          style={{ fontFamily: 'InstrumentSans_600SemiBold' }}
        >
          apple
        </Text>
      </TouchableOpacity>
    </View>
  );
}
