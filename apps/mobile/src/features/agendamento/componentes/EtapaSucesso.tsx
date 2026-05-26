import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { ServiceItem, BarberItem } from '../tipos';
import { styles } from '../estilos';

interface EtapaSucessoProps {
  selectedService: ServiceItem | null;
  selectedBarber: BarberItem | null;
  selectedDate: Date | null;
  selectedSlot: string | null;
  onSuccess: () => void;
}

export function EtapaSucesso({
  selectedService,
  selectedBarber,
  selectedDate,
  selectedSlot,
  onSuccess,
}: EtapaSucessoProps) {
  return (
    <View style={[styles.stepContainer, styles.successContainer]}>
      <View style={styles.successBadge}>
        <Text style={styles.successEmoji}>🎉</Text>
      </View>
      <Text style={styles.successTitle}>Reserva Confirmada!</Text>
      <Text style={styles.successDesc}>
        Seu horário foi agendado com sucesso e já está integrado à agenda do templo.
      </Text>

      <View style={styles.receipt}>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Serviço:</Text>
          <Text style={styles.receiptValue}>{selectedService?.name}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Profissional:</Text>
          <Text style={styles.receiptValue}>{selectedBarber?.name}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Data/Hora:</Text>
          <Text style={styles.receiptValue}>
            {selectedDate && selectedSlot
              ? `${selectedDate.toLocaleDateString('pt-BR')} às ${selectedSlot}`
              : ''}
          </Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Valor total:</Text>
          <Text style={[styles.receiptValue, { color: '#d4af37', fontWeight: 'bold' }]}>
            R$ {Number(selectedService?.price || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.nextBtn, { width: '100%' }]} onPress={onSuccess} activeOpacity={0.8}>
        <Text style={styles.nextBtnText}>VER MINHAS RESERVAS</Text>
      </TouchableOpacity>
    </View>
  );
}
