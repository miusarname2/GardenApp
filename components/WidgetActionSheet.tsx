import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { WidgetItem } from '@/contexts/widget-preferences-context';

interface WidgetActionSheetProps {
  visible: boolean;
  selectedWidget: WidgetItem | null;
  activeWidgets: WidgetItem[];
  availableWidgets: WidgetItem[];
  activeWidgetCount: number;
  maxWidgets: number;
  onClose: () => void;
  onAdd: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onToggleSize: (id: string) => void;
  onRemove: (id: string) => void;
}

export function WidgetActionSheet({
  visible,
  selectedWidget,
  activeWidgets,
  availableWidgets,
  activeWidgetCount,
  maxWidgets,
  onClose,
  onAdd,
  onMove,
  onToggleSize,
  onRemove,
}: WidgetActionSheetProps) {
  const atLimit = activeWidgetCount >= maxWidgets;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.heading}>
            <View style={styles.headingIcon}>
              <MaterialIcons
                name={selectedWidget ? 'widgets' : 'dashboard-customize'}
                size={22}
                color="#206223"
              />
            </View>
            <View style={styles.headingText}>
              <ThemedText style={styles.title}>
                {selectedWidget ? selectedWidget.title : 'Personalizar widgets'}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {selectedWidget
                  ? 'Elige una acción para este widget'
                  : 'Añade información a tu pantalla'}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} accessibilityLabel="Cerrar opciones">
              <MaterialIcons name="close" size={22} color="#53614e" />
            </Pressable>
          </View>

          {selectedWidget ? (
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onToggleSize(selectedWidget.id);
                  onClose();
                }}
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              >
                <View style={styles.actionIcon}>
                  <MaterialIcons
                    name={selectedWidget.size === 'large' ? 'fit-screen' : 'aspect-ratio'}
                    size={22}
                    color="#206223"
                  />
                </View>
                <View style={styles.actionText}>
                  <ThemedText style={styles.actionTitle}>
                    {selectedWidget.size === 'large' ? 'Ver en formato compacto' : 'Dar más espacio'}
                  </ThemedText>
                  <ThemedText style={styles.actionSubtitle}>
                    {selectedWidget.size === 'large'
                      ? 'Ocupa menos espacio en la pantalla'
                      : 'Mostrar este widget en una tarjeta amplia'}
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#899584" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onRemove(selectedWidget.id);
                  onClose();
                }}
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              >
                <View style={[styles.actionIcon, styles.removeIcon]}>
                  <MaterialIcons name="visibility-off" size={21} color="#9b4038" />
                </View>
                <View style={styles.actionText}>
                  <ThemedText style={[styles.actionTitle, styles.removeText]}>Quitar de la pantalla</ThemedText>
                  <ThemedText style={styles.actionSubtitle}>
                    Puedes volver a añadirlo cuando quieras
                  </ThemedText>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#899584" />
              </Pressable>
            </View>
          ) : (
            <ScrollView style={styles.widgetList} showsVerticalScrollIndicator={false}>
              {activeWidgets.length > 0 && (
                <ThemedText style={styles.sectionTitle}>En tu pantalla</ThemedText>
              )}
              {activeWidgets.map((widget, index) => (
                <View key={widget.id} style={styles.widgetRow}>
                  <View style={styles.actionIcon}>
                    <MaterialIcons name="widgets" size={20} color="#206223" />
                  </View>
                  <View style={styles.actionText}>
                    <ThemedText style={styles.actionTitle} numberOfLines={1}>{widget.title}</ThemedText>
                    <ThemedText style={styles.actionSubtitle}>
                      {widget.size === 'large' ? 'Formato amplio' : 'Formato compacto'}
                    </ThemedText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Mover ${widget.title} hacia arriba`}
                    accessibilityState={{ disabled: index === 0 }}
                    disabled={index === 0}
                    onPress={() => onMove(widget.id, 'up')}
                    style={({ pressed }) => [
                      styles.orderButton,
                      pressed && styles.pressed,
                      index === 0 && styles.disabledOrderButton,
                    ]}
                  >
                    <MaterialIcons name="keyboard-arrow-up" size={25} color={index === 0 ? '#aab2a4' : '#385832'} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Mover ${widget.title} hacia abajo`}
                    accessibilityState={{ disabled: index === activeWidgets.length - 1 }}
                    disabled={index === activeWidgets.length - 1}
                    onPress={() => onMove(widget.id, 'down')}
                    style={({ pressed }) => [
                      styles.orderButton,
                      pressed && styles.pressed,
                      index === activeWidgets.length - 1 && styles.disabledOrderButton,
                    ]}
                  >
                    <MaterialIcons name="keyboard-arrow-down" size={25} color={index === activeWidgets.length - 1 ? '#aab2a4' : '#385832'} />
                  </Pressable>
                </View>
              ))}

              {availableWidgets.length > 0 && (
                <ThemedText style={[styles.sectionTitle, styles.addSectionTitle]}>Añadir widgets</ThemedText>
              )}
              {availableWidgets.length === 0 ? (
                activeWidgets.length === 0 && (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="task-alt" size={28} color="#6d8063" />
                    <ThemedText style={styles.emptyText}>Ya tienes todos los widgets disponibles.</ThemedText>
                  </View>
                )
              ) : (
                availableWidgets.map((widget) => (
                  <Pressable
                    key={widget.id}
                    accessibilityRole="button"
                    disabled={atLimit}
                    onPress={() => onAdd(widget.id)}
                    style={({ pressed }) => [
                      styles.action,
                      pressed && !atLimit && styles.pressed,
                      atLimit && styles.disabledAction,
                    ]}
                  >
                    <View style={styles.actionIcon}>
                      <MaterialIcons name="add" size={22} color="#206223" />
                    </View>
                    <View style={styles.actionText}>
                      <ThemedText style={styles.actionTitle}>{widget.title}</ThemedText>
                      <ThemedText style={styles.actionSubtitle}>
                        {atLimit ? `Límite de ${maxWidgets} widgets alcanzado` : 'Toca para añadir a tu pantalla'}
                      </ThemedText>
                    </View>
                    <MaterialIcons name="add-circle-outline" size={22} color={atLimit ? '#aab2a4' : '#206223'} />
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}

          <ThemedText style={styles.footerHint}>
            Usa las flechas para reordenar con una mano, o mantén pulsado un widget para arrastrarlo.
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 26, 15, 0.34)',
  },
  sheet: {
    maxHeight: '78%',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#f8fbf4',
  },
  handle: {
    width: 38,
    height: 4,
    alignSelf: 'center',
    marginBottom: 18,
    borderRadius: 2,
    backgroundColor: '#c7d0c0',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headingIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#e7f1df',
  },
  headingText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#20291d',
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 3,
    color: '#707a6c',
    fontSize: 12,
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#edf2e8',
  },
  actions: {
    gap: 8,
  },
  widgetList: {
    flexGrow: 0,
  },
  sectionTitle: {
    marginBottom: 8,
    marginTop: 2,
    marginLeft: 4,
    color: '#66745f',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  addSectionTitle: {
    marginTop: 16,
  },
  widgetRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  action: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  pressed: {
    backgroundColor: '#edf4e9',
  },
  orderButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    borderRadius: 14,
    backgroundColor: '#eaf2e4',
  },
  disabledOrderButton: {
    backgroundColor: '#f1f3ef',
  },
  disabledAction: {
    opacity: 0.62,
  },
  actionIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#eaf2e4',
  },
  removeIcon: {
    backgroundColor: '#f8e9e6',
  },
  actionText: {
    flex: 1,
    marginHorizontal: 12,
  },
  actionTitle: {
    color: '#263122',
    fontSize: 14,
    fontWeight: '700',
  },
  removeText: {
    color: '#8f3b35',
  },
  actionSubtitle: {
    marginTop: 3,
    color: '#768171',
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  emptyText: {
    color: '#596653',
    fontSize: 13,
    textAlign: 'center',
  },
  footerHint: {
    marginTop: 16,
    color: '#7b8675',
    fontSize: 11,
    textAlign: 'center',
  },
});
