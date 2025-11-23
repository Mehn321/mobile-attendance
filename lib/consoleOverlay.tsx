import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogEntry {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: string;
  stack?: string;
}

const MAX_LOGS = 100;
let logs: LogEntry[] = [];
let listeners: ((logs: LogEntry[]) => void)[] = [];

// Override console methods
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
const originalInfo = console.info;

export function setupConsoleOverlay() {
  if (Platform.OS === 'web') return;

  console.log = (...args: any[]) => {
    originalLog(...args);
    addLog('log', args.join(' '));
  };

  console.warn = (...args: any[]) => {
    originalWarn(...args);
    originalWarn('⚠️  WARNING ON PHONE:', args[0]); // Duplicate warning output to terminal
    addLog('warn', args.join(' '));
  };

  console.error = (...args: any[]) => {
    originalError(...args);
    originalError('🔴 ERROR DETECTED ON PHONE:', args[0]); // Duplicate error output to terminal
    const message = args[0];
    const stack = args[1]?.stack || args[1];
    addLog('error', message?.toString() || JSON.stringify(args), stack?.toString());
  };

  console.info = (...args: any[]) => {
    originalInfo(...args);
    addLog('info', args.join(' '));
  };

  // Global error handler for uncaught errors
  if (typeof ErrorUtils !== 'undefined') {
    const originalErrorHandler = ErrorUtils.getGlobalHandler?.();
    ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
      originalError('🔴 UNCAUGHT ERROR:', error, '\nisFatal:', isFatal);
      originalError(error?.stack || error);
      addLog('error', `UNCAUGHT: ${error?.message || JSON.stringify(error)}`, error?.stack);
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }
    });
  }

  // Handle unhandled promise rejections
  const originalWarn2 = originalWarn;
  if (typeof Promise !== 'undefined') {
    Promise.onPossiblyUnhandledRejection = (id: string, rejection: any) => {
      originalError('🔴 UNHANDLED PROMISE REJECTION:', rejection);
      addLog('error', `Unhandled Promise: ${rejection?.message || JSON.stringify(rejection)}`, rejection?.stack);
    };
  }
}

function addLog(type: 'log' | 'warn' | 'error' | 'info', message: string, stack?: string) {
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random()}`,
    type,
    message: message.substring(0, 500),
    timestamp: new Date().toLocaleTimeString(),
    stack,
  };

  logs.unshift(entry);
  if (logs.length > MAX_LOGS) logs.pop();

  listeners.forEach((listener) => listener([...logs]));
}

export function useConsoleLogs() {
  const [displayLogs, setDisplayLogs] = useState<LogEntry[]>(logs);

  useEffect(() => {
    const listener = (newLogs: LogEntry[]) => {
      setDisplayLogs([...newLogs]);
    };

    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return displayLogs;
}

export function ConsoleOverlay() {
  const logs = useConsoleLogs();
  const [expanded, setExpanded] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const hasErrors = logs.some((log) => log.type === 'error');

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [logs]);

  if (logs.length === 0) {
    return null;
  }

  const getLogColor = (type: string) => {
    switch (type) {
      case 'error':
        return '#ff5252';
      case 'warn':
        return '#ffc107';
      case 'info':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  if (expanded) {
    return (
      <View style={styles.expandedContainer}>
        <View style={[styles.header, hasErrors && styles.headerError]}>
          <Text style={styles.headerTitle}>Console ({logs.length})</Text>
          <TouchableOpacity onPress={() => setExpanded(false)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {selectedLog ? (
          <View style={styles.detailView}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedLog(null)}
            >
              <Ionicons name="arrow-back" size={20} color="#007AFF" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={[styles.logDetailCard, { borderLeftColor: getLogColor(selectedLog.type) }]}>
              <View style={styles.detailHeader}>
                <Text style={[styles.logType, { color: getLogColor(selectedLog.type) }]}>
                  {selectedLog.type.toUpperCase()}
                </Text>
                <Text style={styles.timestamp}>{selectedLog.timestamp}</Text>
              </View>

              <Text style={styles.detailMessage}>{selectedLog.message}</Text>

              {selectedLog.stack && (
                <View style={styles.stackContainer}>
                  <Text style={styles.stackTitle}>Stack Trace:</Text>
                  <Text style={styles.stackText}>{selectedLog.stack}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <ScrollView ref={scrollViewRef} style={styles.logsList}>
            {logs.map((log) => (
              <TouchableOpacity
                key={log.id}
                style={[
                  styles.logCard,
                  {
                    borderLeftColor: getLogColor(log.type),
                    backgroundColor:
                      log.type === 'error' ? '#ffebee' : log.type === 'warn' ? '#fff3e0' : '#fff',
                  },
                ]}
                onPress={() => setSelectedLog(log)}
              >
                <View style={styles.logCardContent}>
                  <View style={styles.logCardHeader}>
                    <Text style={[styles.logType, { color: getLogColor(log.type) }]}>
                      {log.type.toUpperCase()}
                    </Text>
                    <Text style={styles.timestamp}>{log.timestamp}</Text>
                  </View>
                  <Text style={styles.logMessage} numberOfLines={2}>
                    {log.message}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.floatingButton,
        hasErrors && styles.floatingButtonError,
      ]}
      onPress={() => setExpanded(true)}
    >
      <Ionicons
        name={hasErrors ? 'alert-circle' : 'terminal'}
        size={24}
        color="#fff"
      />
      <Text style={styles.floatingButtonText}>{logs.length}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButtonError: {
    backgroundColor: '#ff5252',
  },
  floatingButtonText: {
    position: 'absolute',
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    bottom: 2,
    right: 4,
  },
  expandedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Dimensions.get('window').height * 0.6,
    backgroundColor: '#f5f5f5',
    zIndex: 9999,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  header: {
    backgroundColor: '#333',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerError: {
    backgroundColor: '#ff5252',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logsList: {
    flex: 1,
    padding: 8,
  },
  logCard: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  logCardContent: {
    flex: 1,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logType: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  logMessage: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  detailView: {
    flex: 1,
    padding: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backText: {
    color: '#007AFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  logDetailCard: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailMessage: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  stackContainer: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  stackTitle: {
    fontWeight: '600',
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
  },
  stackText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
