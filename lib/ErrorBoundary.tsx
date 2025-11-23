import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to terminal
    console.error('🔴 REACT ERROR BOUNDARY CAUGHT:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);

    // Also ensure it shows in terminal with emphasis
    const errorMessage = `
╔════════════════════════════════════════╗
║     ⚠️  CRITICAL ERROR ON PHONE        ║
╚════════════════════════════════════════╝
Error: ${error.message}
Stack: ${error.stack}
Component: ${errorInfo.componentStack}
    `.trim();
    
    console.error(errorMessage);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.container}>
          <View style={styles.errorBox}>
            <Text style={styles.title}>⚠️ Application Error</Text>
            <ScrollView style={styles.scroll}>
              <Text style={styles.errorText}>
                {this.state.error.message}
              </Text>
              <Text style={styles.stackText}>
                {this.state.error.stack}
              </Text>
            </ScrollView>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorBox: {
    backgroundColor: '#ff5252',
    borderRadius: 8,
    padding: 20,
    maxHeight: '90%',
    width: '100%',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scroll: {
    maxHeight: '100%',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 20,
  },
  stackText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'monospace',
    opacity: 0.9,
    lineHeight: 16,
  },
});
