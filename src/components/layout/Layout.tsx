import React, { ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  View,
  StyleSheet,
} from 'react-native';
import Header from '../common/Header';
import Bottom from '../common/Bottom';
import { useRoute } from '@react-navigation/native';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRoute()
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} 
      >
        <View style={styles.flex}>
          <Header />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          <Bottom activeTab={router?.name} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff', 
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, 
  },
});
