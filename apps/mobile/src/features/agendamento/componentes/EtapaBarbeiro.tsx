import React from 'react';
import { Text, View, TouchableOpacity, FlatList, Image } from 'react-native';
import { BarberItem } from '../tipos';
import { styles } from '../estilos';
// @ts-ignore
import { Feather } from '@expo/vector-icons';

interface EtapaBarbeiroProps {
  barbers: BarberItem[];
  selectedBarber: BarberItem | null;
  onSelectBarber: (barber: BarberItem) => void;
  onNext: () => void;
  onBack: () => void;
}

export function EtapaBarbeiro({
  barbers,
  selectedBarber,
  onSelectBarber,
  onNext,
  onBack,
}: EtapaBarbeiroProps) {
  const getBarberIcon = (name: string): "scissors" | "user" | "award" | "smile" => {
    const lower = name.toLowerCase();
    if (lower.includes('carlos') || lower.includes('corte') || lower.includes('cabelo')) return 'scissors';
    if (lower.includes('barba') || lower.includes('navalha')) return 'award';
    return 'user';
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Escolha o Barbeiro</Text>
      <Text style={styles.sectionSubtitle}>Selecione o profissional de sua preferência</Text>

      {barbers.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum barbeiro ativo no momento.</Text>
      ) : (
        <FlatList
          data={barbers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.barberCard,
                selectedBarber?.id === item.id && styles.selectedCard,
              ]}
              onPress={() => onSelectBarber(item)}
              activeOpacity={0.8}
            >
              <View style={styles.barberInfo}>
                <View style={styles.barberAvatarBadge}>
                  {item.avatar_url && item.avatar_url.startsWith('http') ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.barberAvatarImage as any} />
                  ) : (
                    <Feather name={getBarberIcon(item.name)} size={20} color="#d4af37" />
                  )}
                </View>
                <View style={styles.barberTextContent}>
                  <Text style={styles.barberName}>{item.name}</Text>
                  {item.bio && <Text style={styles.barberBio}>{item.bio}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.stepFooterBtns}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>VOLTAR</Text>
        </TouchableOpacity>
        {selectedBarber && (
          <TouchableOpacity
            style={[styles.nextBtn, { flex: 1, marginTop: 0 }]}
            onPress={onNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>VER DATAS</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
