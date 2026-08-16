import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

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
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMsg: '' });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-white dark:bg-zinc-900 items-center justify-center px-6">
          <Text className="text-5xl mb-4">💥</Text>
          <Text className="text-2xl font-bold text-black dark:text-white mb-2 text-center">
            Oops, das hätte nicht passieren dürfen!
          </Text>
          <Text className="text-zinc-500 text-center mb-8">
            Unser KI-Stylist ist wohl kurz gestolpert. Keine Sorge, deine Daten sind sicher.
          </Text>
          <View className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl mb-8 w-full">
             <Text className="text-red-500 font-mono text-xs text-center">
               Error: {this.state.errorMsg || 'Unbekannter Fehler'}
             </Text>
          </View>
          <TouchableOpacity 
            onPress={this.handleReset}
            className="bg-black dark:bg-white px-8 py-4 rounded-2xl w-full items-center shadow-lg"
          >
            <Text className="text-white dark:text-black font-bold text-lg">App neu laden</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
