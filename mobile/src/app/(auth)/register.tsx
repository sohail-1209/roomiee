import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/use-theme';

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'TENANT' | 'OWNER'>('TENANT');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      alert('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, phone, password, role });
      router.replace('/');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.logo, { color: theme.text }]}>Roomiee</Text>
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Join the community of verified owners and roommates
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rahul Kumar"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. rahul@example.com"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Phone Number (Optional)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 9876543210"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>I want to register as a:</Text>
            <View style={[styles.roleContainer, { backgroundColor: theme.backgroundElement }]}>
              <TouchableOpacity
                onPress={() => setRole('TENANT')}
                style={[styles.roleTab, role === 'TENANT' && styles.roleTabActive]}
              >
                <Text style={[styles.roleText, role === 'TENANT' && styles.roleTextActive]}>
                  Tenant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRole('OWNER')}
                style={[styles.roleTab, role === 'OWNER' && styles.roleTabActive]}
              >
                <Text style={[styles.roleText, role === 'OWNER' && styles.roleTextActive]}>
                  Owner
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={styles.registerButton}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={{ color: theme.textSecondary }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'Outfit',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    marginBottom: 18,
  },
  roleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  roleTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60646c',
  },
  roleTextActive: {
    color: '#4f46e5',
  },
  registerButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  linkText: {
    color: '#4f46e5',
    fontWeight: 'bold',
  },
});
