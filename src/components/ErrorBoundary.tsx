import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Text, View } from 'react-native';

import { AppButton } from '@/design-system/AppButton';
import { captureException } from '@/observability/telemetry';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, {
      area: 'app-shell',
      operation: 'react-error-boundary',
      errorCode: error.name,
    });

    if (__DEV__) {
      console.error('React component stack:', errorInfo.componentStack);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMsg: '' });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View
          accessibilityRole="alert"
          className="flex-1 bg-white dark:bg-zinc-900 items-center justify-center px-6"
        >
          <Text className="text-4xl mb-4">!</Text>
          <Text className="text-2xl font-bold text-black dark:text-white mb-2 text-center">
            Ein unerwarteter Fehler ist aufgetreten
          </Text>
          <Text className="text-zinc-500 text-center mb-8 leading-6">
            Diese Ansicht konnte nicht korrekt dargestellt werden. Es wird kein
            erfolgreicher Vorgang vorgetäuscht.
          </Text>

          {__DEV__ ? (
            <View className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl mb-8 w-full">
              <Text className="text-red-500 font-mono text-xs text-center">
                {this.state.errorMsg || 'Unbekannter Fehler'}
              </Text>
            </View>
          ) : null}

          <View className="w-full">
            <AppButton
              label="Ansicht erneut versuchen"
              accessibilityLabel="Fehleransicht zurücksetzen und erneut versuchen"
              onPress={this.handleReset}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
