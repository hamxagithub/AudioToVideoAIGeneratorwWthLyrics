import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { UserAccountProjectManagement } from '../modules/UserAccountProjectManagement';
import { PaymentSubscriptionModule } from '../modules/PaymentSubscriptionModule';

interface AuthScreenProps {
  userManagement: UserAccountProjectManagement;
  paymentModule: PaymentSubscriptionModule;
  onAuthenticated: (user: any) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({
  userManagement,
  paymentModule,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const user = await userManagement.login({ email: email.trim(), password });
      onAuthenticated(user);
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const user = await userManagement.register(
        { email: email.trim(), password },
        name.trim()
      );
      Alert.alert(
        'Welcome!',
        'Your account has been created successfully.',
        [{ text: 'OK', onPress: () => onAuthenticated(user) }]
      );
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await userManagement.resetPassword(email.trim());
      Alert.alert(
        'Reset Email Sent',
        'Check your email for password reset instructions.',
        [{ text: 'OK', onPress: () => setMode('login') }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    // In a real implementation, you would integrate with the respective social login SDKs
    Alert.alert(
      'Social Login',
      `${provider.charAt(0).toUpperCase() + provider.slice(1)} login will be implemented with the respective SDK integration.`
    );
  };

  const handleGuestMode = () => {
    Alert.alert(
      'Guest Mode',
      'You can try the app with limited features, but your projects won\'t be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue as Guest',
          onPress: () => onAuthenticated({ 
            id: 'guest', 
            name: 'Guest User', 
            email: 'guest@example.com',
            subscription: 'free',
            projects: [],
            createdAt: new Date()
          })
        }
      ]
    );
  };

  const renderLoginForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue creating amazing videos</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode('forgot')}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialButtons}>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => handleSocialLogin('google')}
        >
          <Text style={styles.socialButtonText}>🔍 Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => handleSocialLogin('facebook')}
        >
          <Text style={styles.socialButtonText}>📘 Facebook</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('apple')}
          >
            <Text style={styles.socialButtonText}>🍎 Apple</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.switchMode}>
        <Text style={styles.switchText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => setMode('register')}>
          <Text style={styles.switchLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.guestButton} onPress={handleGuestMode}>
        <Text style={styles.guestButtonText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegisterForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join thousands creating AI videos</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Text>
      </TouchableOpacity>

      <View style={styles.terms}>
        <Text style={styles.termsText}>
          By creating an account, you agree to our{'\n'}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>

      <View style={styles.switchMode}>
        <Text style={styles.switchText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => setMode('login')}>
          <Text style={styles.switchLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderForgotForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        onPress={handleForgotPassword}
        disabled={isLoading}
      >
        <Text style={styles.primaryButtonText}>
          {isLoading ? 'Sending...' : 'Send Reset Email'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode('login')}>
        <Text style={styles.linkText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.appTitle}>🎬 AI Video Generator</Text>
          <Text style={styles.appSubtitle}>Transform audio into stunning videos with AI</Text>
        </View>

        {mode === 'login' && renderLoginForm()}
        {mode === 'register' && renderRegisterForm()}
        {mode === 'forgot' && renderForgotForm()}

        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Why Choose Our AI Video Generator?</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={styles.featureText}>AI-powered transcription and visuals</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureText}>Fast processing and rendering</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎨</Text>
              <Text style={styles.featureText}>Multiple visual themes and styles</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📱</Text>
              <Text style={styles.featureText}>Optimized for social media platforms</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: 14,
    color: '#333',
  },
  switchMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchText: {
    color: '#666',
    fontSize: 14,
  },
  switchLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  guestButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#666',
    fontSize: 14,
  },
  terms: {
    marginVertical: 15,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#007AFF',
  },
  features: {
    backgroundColor: 'white',
    margin: 20,
    padding: 25,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresList: {
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default AuthScreen;
