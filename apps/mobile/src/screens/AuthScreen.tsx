import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { z } from 'zod';
import { FONT_DISPLAY, FONT_BODY, COLOR_BG_BASE, COLOR_BG_CARD, COLOR_BORDER, COLOR_GOLD, COLOR_TIJOLO } from '../lib/typography';

const signUpSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  phone: z.string().min(10, { message: 'Telefone inválido (mínimo 10 dígitos)' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
});

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Active Focus fields for visual borders
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleAuth = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate with Zod
        const result = signUpSchema.safeParse({ name, email, phone, password });
        if (!result.success) {
          const firstError = result.error.errors[0]?.message || 'Dados inválidos';
          throw new Error(firstError);
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              phone,
              role: 'client', // Clients signing up on mobile are clients
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          setSuccessMessage('Cadastro realizado com sucesso! Faça login para entrar.');
          setName('');
          setPhone('');
          setEmail('');
          setPassword('');
          setIsSignUp(false);
        }
      } else {
        if (!email || !password) {
          throw new Error('Preencha o e-mail e a senha');
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Visual */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoLetter}>Q</Text>
            </View>
            <Text style={styles.title}>SR. QUIN</Text>
            <Text style={styles.subtitle}>BARBEARIA</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isSignUp ? 'Criar Conta' : 'Acesso do Cliente'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {isSignUp
                ? 'Insira seus dados para começar a agendar'
                : 'Entre com seus dados para gerenciar seus horários'}
            </Text>

            {/* Error Message */}
            {errorMessage && (
              <View style={[styles.alert, styles.alertError]}>
                <Text style={styles.alertTextError}>⚠️ {errorMessage}</Text>
              </View>
            )}

            {/* Success Message */}
            {successMessage && (
              <View style={[styles.alert, styles.alertSuccess]}>
                <Text style={styles.alertTextSuccess}>✓ {successMessage}</Text>
              </View>
            )}

            <View style={styles.form}>
              {isSignUp && (
                <>
                  {/* Name Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nome Completo</Text>
                    <TextInput
                      style={[
                        styles.input,
                        focusedField === 'name' && styles.inputFocused,
                      ]}
                      placeholder="Ex: João da Silva"
                      placeholderTextColor="#52525b"
                      value={name}
                      onChangeText={setName}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="words"
                    />
                  </View>

                  {/* Phone Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Celular</Text>
                    <TextInput
                      style={[
                        styles.input,
                        focusedField === 'phone' && styles.inputFocused,
                      ]}
                      placeholder="Ex: (69) 99999-9999"
                      placeholderTextColor="#52525b"
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              )}

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'email' && styles.inputFocused,
                  ]}
                  placeholder="Ex: joao@email.com"
                  placeholderTextColor="#52525b"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'password' && styles.inputFocused,
                  ]}
                  placeholder="Sua senha secreta"
                  placeholderTextColor="#52525b"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#0a0a0c" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isSignUp ? 'REALIZAR CADASTRO' : 'ENTRAR NO TEMPLO'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Toggle State Footer */}
            <View style={styles.toggleFooter}>
              <Text style={styles.toggleText}>
                {isSignUp ? 'Já tem uma conta?' : 'Ainda não é cliente?'}{' '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                <Text style={styles.toggleLink}>
                  {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
                </Text>
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
    backgroundColor: COLOR_BG_BASE,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 4,
    borderWidth: 2,
    borderRightWidth: 4.5,
    borderBottomWidth: 4.5,
    borderColor: COLOR_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_BG_CARD,
    marginBottom: 16,
  },
  logoLetter: {
    fontSize: 28,
    fontWeight: '800',
    color: COLOR_GOLD,
    fontFamily: FONT_DISPLAY,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 4,
    color: '#f3f4f6',
    textAlign: 'center',
    fontFamily: FONT_DISPLAY,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 6,
    color: COLOR_GOLD,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: FONT_DISPLAY,
  },
  card: {
    backgroundColor: COLOR_BG_CARD,
    borderRadius: 4,
    borderWidth: 1.5,
    borderRightWidth: 4.5,
    borderBottomWidth: 4.5,
    borderColor: COLOR_BORDER,
    padding: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f3f4f6',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: FONT_DISPLAY,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    fontFamily: FONT_BODY,
  },
  alert: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1.5,
    borderRightWidth: 3.5,
    borderBottomWidth: 3.5,
    marginBottom: 16,
  },
  alertError: {
    backgroundColor: 'rgba(127, 29, 29, 0.1)',
    borderColor: COLOR_TIJOLO,
  },
  alertSuccess: {
    backgroundColor: 'rgba(20, 83, 45, 0.1)',
    borderColor: 'rgba(21, 128, 61, 0.4)',
  },
  alertTextError: {
    color: '#f87171',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FONT_BODY,
  },
  alertTextSuccess: {
    color: '#4ade80',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: FONT_BODY,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#a1a1aa',
    fontWeight: '500',
    fontFamily: FONT_BODY,
  },
  input: {
    height: 48,
    backgroundColor: COLOR_BG_BASE,
    borderWidth: 1.5,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    paddingHorizontal: 16,
    color: '#f3f4f6',
    fontSize: 14,
    fontFamily: FONT_BODY,
  },
  inputFocused: {
    borderColor: COLOR_GOLD,
  },
  submitBtn: {
    height: 48,
    backgroundColor: COLOR_GOLD,
    borderRadius: 4,
    borderWidth: 1.5,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: COLOR_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#0f0e0d',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: FONT_BODY,
  },
  toggleFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: COLOR_BORDER,
  },
  toggleText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontFamily: FONT_BODY,
  },
  toggleLink: {
    fontSize: 12,
    fontWeight: '600',
    color: COLOR_GOLD,
    fontFamily: FONT_BODY,
  },
});
