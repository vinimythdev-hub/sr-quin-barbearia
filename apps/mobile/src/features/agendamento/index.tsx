import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BookingScreenProps } from './tipos';
import { styles } from './estilos';
import { useAgendamento } from './hooks/useAgendamento';
import { EtapaServico } from './componentes/EtapaServico';
import { EtapaBarbeiro } from './componentes/EtapaBarbeiro';
import { EtapaDataHora } from './componentes/EtapaDataHora';
import { FormularioConvidado } from './componentes/FormularioConvidado';
import { EtapaSucesso } from './componentes/EtapaSucesso';

export default function TelaAgendamento({ onBack, onSuccess }: BookingScreenProps) {
  const agendamento = useAgendamento(onSuccess);

  const next7Days = agendamento.getNext7Days();

  return (
    <View style={styles.container}>
      {/* Header com indicador de etapa */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.headerBackText}>✕ Cancelar</Text>
        </TouchableOpacity>
        {agendamento.step < 4 && (
          <Text style={styles.stepIndicator}>Etapa {agendamento.step} de 3</Text>
        )}
      </View>

      {/* Loading e Mensagens */}
      {agendamento.loading && agendamento.step !== 3 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#d4af37" />
        </View>
      )}

      {agendamento.errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {agendamento.errorMessage}</Text>
        </View>
      )}

      {/* renderização de etapas */}
      <View style={styles.body}>
        {agendamento.step === 1 && (
          <EtapaServico
            services={agendamento.services}
            selectedService={agendamento.selectedService}
            onSelectService={agendamento.setSelectedService}
            onNext={agendamento.fetchBarbers}
          />
        )}
        {agendamento.step === 2 && (
          <EtapaBarbeiro
            barbers={agendamento.barbers}
            selectedBarber={agendamento.selectedBarber}
            onSelectBarber={agendamento.setSelectedBarber}
            onNext={() => agendamento.setStep(3)}
            onBack={() => agendamento.setStep(1)}
          />
        )}
        {agendamento.step === 3 && agendamento.showGuestForm && (
          <FormularioConvidado
            userName={agendamento.userName}
            userPhone={agendamento.userPhone}
            onUserNameChange={agendamento.setUserName}
            onUserPhoneChange={agendamento.setUserPhone}
            onConfirm={agendamento.handleConfirmBooking}
            onBack={() => agendamento.setShowGuestForm(false)}
            loading={agendamento.loading}
          />
        )}
        {agendamento.step === 3 && !agendamento.showGuestForm && (
          <EtapaDataHora
            next7Days={next7Days}
            selectedDate={agendamento.selectedDate}
            selectedSlot={agendamento.selectedSlot}
            availableSlots={agendamento.availableSlots}
            loading={agendamento.loading}
            onSelectDate={(date) => {
              agendamento.setSelectedDate(date);
              agendamento.calculateAvailableSlots(date);
            }}
            onSelectSlot={agendamento.setSelectedSlot}
            onConfirm={() => {
              if (agendamento.isUserAnonymous && (!agendamento.userName.trim() || !agendamento.userPhone.trim())) {
                agendamento.setShowGuestForm(true);
              } else {
                agendamento.handleConfirmBooking();
              }
            }}
            onBack={() => agendamento.setStep(2)}
          />
        )}
        {agendamento.step === 4 && (
          <EtapaSucesso
            selectedService={agendamento.selectedService}
            selectedBarber={agendamento.selectedBarber}
            selectedDate={agendamento.selectedDate}
            selectedSlot={agendamento.selectedSlot}
            onSuccess={onSuccess}
          />
        )}
      </View>
    </View>
  );
}
