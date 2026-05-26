import React from 'react';
import { Text, View, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { styles } from '../estilos';

interface FormularioConvidadoProps {
  userName: string;
  userPhone: string;
  onUserNameChange: (name: string) => void;
  onUserPhoneChange: (phone: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}

export function FormularioConvidado({
  userName,
  userPhone,
  onUserNameChange,
  onUserPhoneChange,
  onConfirm,
  onBack,
  loading,
}: FormularioConvidadoProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Identificação do Cliente</Text>
      <Text style={styles.sectionSubtitle}>Preencha seus dados para receber o agendamento</Text>

      <View style={styles.guestForm}>
        {/* Campo Nome */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Seu Nome</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: Carlos Silva"
            placeholderTextColor="#52525b"
            value={userName}
            onChangeText={onUserNameChange}
            autoCapitalize="words"
          />
        </View>

        {/* Campo Telefone */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Celular / WhatsApp para contato</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex: (69) 99999-9999"
            placeholderTextColor="#52525b"
            value={userPhone}
            onChangeText={onUserPhoneChange}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.stepFooterBtns}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>VOLTAR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextBtn, { flex: 1, marginTop: 0 }]}
          onPress={onConfirm}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#0a0a0c" />
          ) : (
            <Text style={styles.nextBtnText}>CONFIRMAR AGENDAMENTO</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
