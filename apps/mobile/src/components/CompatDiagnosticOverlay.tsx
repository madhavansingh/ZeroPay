import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Clipboard,
  Platform
} from 'react-native';
import Constants from 'expo-constants';

export function CompatDiagnosticOverlay() {
  const [dismissed, setDismissed] = useState(false);

  // Constants.executionEnvironment can be 'storeClient' (Expo Go), 'standalone', or 'bare'
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  
  // Only display alert on native Android/iOS running inside Expo Go store client
  const shouldShow = isExpoGo && Platform.OS !== 'web' && !dismissed;

  if (!shouldShow) return null;

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    alert('Command copied to clipboard!');
  };

  return (
    <Modal
      transparent={true}
      visible={true}
      animationType="slide"
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.alertIcon}>⚠</Text>
            <Text style={styles.title}>Expo Go Sandbox Warning</Text>
          </View>
          
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.description}>
              ZeroPay relies on secure hardware key storage (<Text style={styles.codeText}>expo-secure-store</Text>), 
              native SQLite database sync adapters, and hardware haptic response loops. 
              These custom modules are not supported in the default Expo Go application sandbox.
            </Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>How to Assemble a Native Dev Build:</Text>
            
            <Text style={styles.stepText}>
              1. Install EAS CLI globally if you haven't already:
            </Text>
            <TouchableOpacity 
              style={styles.commandBox}
              onPress={() => copyToClipboard('npm install -g eas-cli')}
            >
              <Text style={styles.commandText}>npm install -g eas-cli</Text>
              <Text style={styles.copyBadge}>Copy</Text>
            </TouchableOpacity>

            <Text style={styles.stepText}>
              2. Build the local development build binary:
            </Text>
            <TouchableOpacity 
              style={styles.commandBox}
              onPress={() => copyToClipboard('npx eas-cli build --profile development --platform android')}
            >
              <Text style={styles.commandText}>
                npx eas-cli build --profile development --platform android
              </Text>
              <Text style={styles.copyBadge}>Copy</Text>
            </TouchableOpacity>
            <Text style={styles.subtext}>
              * Swap <Text style={styles.codeText}>android</Text> for <Text style={styles.codeText}>ios</Text> if building for Apple simulator or testflight.
            </Text>

            <Text style={styles.stepText}>
              3. Install the generated app build onto your device, and start the development server:
            </Text>
            <TouchableOpacity 
              style={styles.commandBox}
              onPress={() => copyToClipboard('npx expo start --dev-client')}
            >
              <Text style={styles.commandText}>npx expo start --dev-client</Text>
              <Text style={styles.copyBadge}>Copy</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.dismissButton} 
              onPress={() => setDismissed(true)}
            >
              <Text style={styles.dismissButtonText}>Proceed in Sandbox Mode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(11, 13, 19, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: Platform.OS === 'ios' ? 44 : 30,
  },
  card: {
    backgroundColor: '#131622',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  alertIcon: {
    fontSize: 22,
    color: '#F59E0B',
    marginRight: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 12,
  },
  stepText: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 6,
  },
  commandBox: {
    backgroundColor: '#0B0D13',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commandText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#34D399',
    flex: 1,
    marginRight: 10,
  },
  copyBadge: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subtext: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 6,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#FFFFFF',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#0D0F18',
  },
  dismissButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
});
