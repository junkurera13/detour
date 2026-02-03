import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TouchableOpacity, View } from 'react-native';
import { logError } from '@/lib/errorLogging';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError(error, { componentStack: info.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              fontFamily: 'InstrumentSans_700Bold',
              fontSize: 20,
              color: '#111827',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontFamily: 'InstrumentSans_400Regular',
              fontSize: 14,
              color: '#6B7280',
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            We hit an unexpected issue. Try again or restart the app.
          </Text>
          <TouchableOpacity
            onPress={this.handleReset}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#fd6b03',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 14,
            }}
          >
            <Text
              style={{
                fontFamily: 'InstrumentSans_600SemiBold',
                color: '#fff',
                fontSize: 16,
              }}
            >
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}
