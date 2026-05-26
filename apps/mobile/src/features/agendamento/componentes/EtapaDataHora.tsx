import React from 'react';
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { styles } from '../estilos';

interface EtapaDataHoraProps {
  next7Days: Date[];
  selectedDate: Date | null;
  selectedSlot: string | null;
  availableSlots: string[];
  loading: boolean;
  onSelectDate: (date: Date) => void;
  onSelectSlot: (slot: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function EtapaDataHora({
  next7Days,
  selectedDate,
  selectedSlot,
  availableSlots,
  loading,
  onSelectDate,
  onSelectSlot,
  onConfirm,
  onBack,
}: EtapaDataHoraProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Data e Horário</Text>
      <Text style={styles.sectionSubtitle}>Escolha a data e um horário livre</Text>

      {/* Date Horizontal Selector */}
      <View style={styles.dateSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {next7Days.map((date, idx) => {
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
            const dayNum = date.getDate();
            const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dateBtn, isSelected && styles.dateBtnSelected]}
                onPress={() => onSelectDate(date)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>{dayName}</Text>
                <Text style={[styles.dateDayNum, isSelected && styles.dateTextSelected]}>{dayNum}</Text>
                <Text style={[styles.dateMonthName, isSelected && styles.dateTextSelected]}>{monthName}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Available Hour Slots */}
      <View style={styles.slotsContainer}>
        {loading ? (
          <ActivityIndicator size="small" color="#d4af37" style={{ marginTop: 24 }} />
        ) : !selectedDate ? (
          <Text style={styles.selectDatePrompt}>Selecione um dia acima para buscar horários.</Text>
        ) : availableSlots.length === 0 ? (
          <Text style={styles.emptyText}>Não há horários disponíveis para este profissional nesta data.</Text>
        ) : (
          <FlatList
            data={availableSlots}
            keyExtractor={(item) => item}
            numColumns={4}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.slotBtn,
                  selectedSlot === item && styles.slotBtnSelected,
                ]}
                onPress={() => onSelectSlot(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.slotText, selectedSlot === item && styles.slotTextSelected]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            columnWrapperStyle={styles.slotRow}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.stepFooterBtns}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>VOLTAR</Text>
        </TouchableOpacity>
        {selectedSlot && (
          <TouchableOpacity
            style={[styles.nextBtn, { flex: 1, marginTop: 0 }]}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>CONFIRMAR</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
