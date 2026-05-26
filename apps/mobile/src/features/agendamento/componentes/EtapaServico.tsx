import React from 'react';
import { Text, View, TouchableOpacity, FlatList } from 'react-native';
import { ServiceItem } from '../tipos';
import { styles } from '../estilos';

interface EtapaServicoProps {
  services: ServiceItem[];
  selectedService: ServiceItem | null;
  onSelectService: (service: ServiceItem) => void;
  onNext: () => void;
}

export function EtapaServico({
  services,
  selectedService,
  onSelectService,
  onNext,
}: EtapaServicoProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Escolha o Serviço</Text>
      <Text style={styles.sectionSubtitle}>Selecione um corte ou tratamento clássico</Text>

      {services.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.serviceCard,
                selectedService?.id === item.id && styles.selectedCard,
              ]}
              onPress={() => onSelectService(item)}
              activeOpacity={0.8}
            >
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.servicePrice}>R$ {Number(item.price).toFixed(2)}</Text>
              </View>
              {item.description && (
                <Text style={styles.serviceDesc}>{item.description}</Text>
              )}
              <View style={styles.serviceFooter}>
                <Text style={styles.serviceDuration}>⏳ Duração: {item.duration_minutes} min</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedService && (
        <TouchableOpacity style={styles.nextBtn} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>SELECIONAR BARBEIRO</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
