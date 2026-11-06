import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { WidgetItem } from '@/contexts/widget-preferences-context';

export interface WidgetBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EditableWidgetProps {
  widget: WidgetItem;
  editing: boolean;
  positionVersion?: number;
  style?: StyleProp<ViewStyle>;
  onPosition: (id: string, bounds: WidgetBounds) => void;
  onDrag: (id: string, x: number, y: number) => void;
  onDragEnd: () => void;
  onToggleSize: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}

export function EditableWidget({
  widget,
  editing,
  positionVersion = 0,
  style,
  onPosition,
  onDrag,
  onDragEnd,
  onToggleSize,
  onRemove,
  children,
}: EditableWidgetProps) {
  const widgetRef = useRef<View>(null);
  const lift = useRef(new Animated.Value(0)).current;
  const callbacks = useRef({ onPosition, onDrag, onDragEnd, editing, id: widget.id });
  callbacks.current = { onPosition, onDrag, onDragEnd, editing, id: widget.id };

  const reportPosition = useCallback(() => {
    widgetRef.current?.measureInWindow((x, y, width, height) => {
      callbacks.current.onPosition(callbacks.current.id, { x, y, width, height });
    });
  }, []);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        callbacks.current.editing && (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5),
      onPanResponderGrant: () => {
        Animated.spring(lift, { toValue: -8, useNativeDriver: true, speed: 24 }).start();
      },
      onPanResponderMove: (_, gesture) => {
        callbacks.current.onDrag(callbacks.current.id, gesture.moveX, gesture.moveY);
      },
      onPanResponderRelease: () => {
        Animated.spring(lift, { toValue: 0, useNativeDriver: true, speed: 24 }).start();
        callbacks.current.onDragEnd();
      },
      onPanResponderTerminate: () => {
        Animated.spring(lift, { toValue: 0, useNativeDriver: true, speed: 24 }).start();
        callbacks.current.onDragEnd();
      },
    }),
    [lift],
  );

  useEffect(() => {
    if (editing) reportPosition();
  }, [editing, widget.size, positionVersion, reportPosition]);

  return (
    <Animated.View
      ref={widgetRef}
      onLayout={reportPosition}
      style={[
        style,
        editing && styles.editingWidget,
        editing && { transform: [{ translateY: lift }] },
      ]}
    >
      {editing && (
        <View style={styles.toolbar}>
          <View style={styles.dragHandle} {...panResponder.panHandlers}>
            <MaterialIcons name="drag-indicator" size={22} color="#206223" />
            <ThemedText style={styles.dragLabel}>Arrastra</ThemedText>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onToggleSize}
              accessibilityRole="button"
              accessibilityLabel={widget.size === 'large' ? `Reducir ${widget.title}` : `Ampliar ${widget.title}`}
              style={styles.actionButton}
            >
              <MaterialIcons
                name={widget.size === 'large' ? 'fullscreen-exit' : 'fullscreen'}
                size={20}
                color="#206223"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel={`Ocultar ${widget.title}`}
              style={styles.actionButton}
            >
              <MaterialIcons name="remove-circle-outline" size={20} color="#8f3b35" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  editingWidget: {
    zIndex: 2,
    elevation: 8,
    shadowColor: '#171d14',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  toolbar: {
    minHeight: 38,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#e7f1df',
  },
  dragHandle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  dragLabel: {
    color: '#206223',
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
