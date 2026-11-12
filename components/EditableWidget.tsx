import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleProp,
  StyleSheet,
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

interface WidgetCenter {
  x: number;
  y: number;
}

interface DragReorderResult {
  layoutDeltaX: number;
  layoutDeltaY: number;
}

interface EditableWidgetProps {
  widget: WidgetItem;
  positionVersion?: number;
  style?: StyleProp<ViewStyle>;
  onPosition: (id: string, bounds: WidgetBounds) => void;
  onLongPress: (widget: WidgetItem) => void;
  onDrag: (id: string, x: number, y: number) => DragReorderResult | null;
  onDragEnd: () => void;
  children: React.ReactNode;
}

const LONG_PRESS_DELAY = 250;
const DRAG_THRESHOLD = 10;

export function EditableWidget({
  widget,
  positionVersion = 0,
  style,
  onPosition,
  onLongPress,
  onDrag,
  onDragEnd,
  children,
}: EditableWidgetProps) {
  const widgetRef = useRef<View>(null);
  const dragOffset = useRef(new Animated.ValueXY()).current;
  const dragOffsetValue = useRef({ x: 0, y: 0 });
  const floatOffset = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const dragBaseline = useRef({ x: 0, y: 0 });
  const dragCenter = useRef<WidgetCenter>({ x: 0, y: 0 });
  const dragOffsetAnchor = useRef({ x: 0, y: 0 });
  const bounds = useRef<WidgetBounds | null>(null);
  const isDraggingRef = useRef(false);
  const floatAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartedAt = useRef<number | null>(null);
  const touchEligible = useRef(false);
  const longPressReady = useRef(false);
  const dragStarted = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const callbacks = useRef({ onPosition, onLongPress, onDrag, onDragEnd, id: widget.id, widget });
  callbacks.current = { onPosition, onLongPress, onDrag, onDragEnd, id: widget.id, widget };

  const reportPosition = useCallback((animateLayout = true) => {
    widgetRef.current?.measureInWindow((x, y, width, height) => {
      const previous = bounds.current;
      bounds.current = { x, y, width, height };
      callbacks.current.onPosition(callbacks.current.id, { x, y, width, height });

      if (animateLayout && previous && !isDraggingRef.current) {
        const deltaX = previous.x - x;
        const deltaY = previous.y - y;
        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          dragOffset.setValue({ x: deltaX, y: deltaY });
          Animated.spring(dragOffset, {
            toValue: { x: 0, y: 0 },
            damping: 19,
            stiffness: 190,
            mass: 0.8,
            useNativeDriver: true,
          }).start();
        }
      }
    });
  }, [dragOffset]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: (_, gesture) => {
        const moved = Math.abs(gesture.dx) > DRAG_THRESHOLD || Math.abs(gesture.dy) > DRAG_THRESHOLD;
        if (!moved) return false;
        if (longPressReady.current) {
          dragStarted.current = true;
          return true;
        }
        clearLongPressTimer();
        touchEligible.current = false;
        return false;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragBaseline.current = { x: 0, y: 0 };
        dragOffsetValue.current = { x: 0, y: 0 };
        dragOffsetAnchor.current = { x: 0, y: 0 };
        isDraggingRef.current = true;
        floatAnimation.current?.stop();
        floatOffset.setValue(0);
        if (bounds.current) {
          dragCenter.current = {
            x: bounds.current.x + bounds.current.width / 2,
            y: bounds.current.y + bounds.current.height / 2,
          };
        }
        setIsDragging(true);
        Animated.spring(scale, { toValue: 1.035, useNativeDriver: true, speed: 24 }).start();
      },
      onPanResponderMove: (_, gesture) => {
        const reorder = callbacks.current.onDrag(
          callbacks.current.id,
          dragCenter.current.x + gesture.dx - dragBaseline.current.x,
          dragCenter.current.y + gesture.dy - dragBaseline.current.y,
        );
        if (reorder) {
          dragOffsetValue.current = {
            x: dragOffsetAnchor.current.x + gesture.dx - dragBaseline.current.x - reorder.layoutDeltaX,
            y: dragOffsetAnchor.current.y + gesture.dy - dragBaseline.current.y - reorder.layoutDeltaY,
          };
          dragOffsetAnchor.current = dragOffsetValue.current;
          dragOffset.setValue(dragOffsetValue.current);
          dragCenter.current = {
            x: dragCenter.current.x + gesture.dx - dragBaseline.current.x,
            y: dragCenter.current.y + gesture.dy - dragBaseline.current.y,
          };
          dragBaseline.current = { x: gesture.dx, y: gesture.dy };
        } else {
          dragOffsetValue.current = {
            x: dragOffsetAnchor.current.x + gesture.dx - dragBaseline.current.x,
            y: dragOffsetAnchor.current.y + gesture.dy - dragBaseline.current.y,
          };
          dragOffset.setValue(dragOffsetValue.current);
        }
      },
      onPanResponderRelease: () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        dragOffsetValue.current = { x: 0, y: 0 };
        dragOffsetAnchor.current = { x: 0, y: 0 };
        Animated.parallel([
          Animated.spring(dragOffset, {
            toValue: { x: 0, y: 0 },
            damping: 15,
            stiffness: 170,
            mass: 0.8,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            damping: 13,
            stiffness: 220,
            useNativeDriver: true,
          }),
        ]).start(() => floatAnimation.current?.start());
        callbacks.current.onDragEnd();
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        dragOffsetValue.current = { x: 0, y: 0 };
        dragOffsetAnchor.current = { x: 0, y: 0 };
        Animated.parallel([
          Animated.spring(dragOffset, {
            toValue: { x: 0, y: 0 },
            damping: 15,
            stiffness: 170,
            mass: 0.8,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            damping: 13,
            stiffness: 220,
            useNativeDriver: true,
          }),
        ]).start(() => floatAnimation.current?.start());
        callbacks.current.onDragEnd();
      },
    }),
    [dragOffset, scale],
  );

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatOffset, { toValue: -2.5, duration: 1700, useNativeDriver: true }),
        Animated.timing(floatOffset, { toValue: 0, duration: 1700, useNativeDriver: true }),
      ]),
    );
    floatAnimation.current = float;
    float.start();
    return () => {
      float.stop();
      floatAnimation.current = null;
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, [floatOffset]);

  useEffect(() => {
    reportPosition(false);
  }, [widget.size, positionVersion, reportPosition]);

  const clearLongPressTimer = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const handleTouchStart = () => {
    clearLongPressTimer();
    touchStartedAt.current = Date.now();
    touchEligible.current = true;
    longPressReady.current = false;
    dragStarted.current = false;
    longPressTimer.current = setTimeout(() => {
      if (touchEligible.current) {
        longPressReady.current = true;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }, LONG_PRESS_DELAY);
  };

  const handleTouchEnd = () => {
    clearLongPressTimer();
    const heldLongEnough = touchStartedAt.current !== null &&
      Date.now() - touchStartedAt.current >= LONG_PRESS_DELAY;
    if (touchEligible.current && (longPressReady.current || heldLongEnough) && !dragStarted.current) {
      if (!longPressReady.current) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      callbacks.current.onLongPress(callbacks.current.widget);
    }
    touchStartedAt.current = null;
    touchEligible.current = false;
    longPressReady.current = false;
    dragStarted.current = false;
  };

  const handleTouchCancel = () => {
    clearLongPressTimer();
    touchStartedAt.current = null;
    touchEligible.current = false;
    longPressReady.current = false;
    dragStarted.current = false;
  };

  const translateY = Animated.add(dragOffset.y, floatOffset);

  return (
    <Animated.View
      ref={widgetRef}
      onLayout={() => reportPosition()}
      onTouchStartCapture={handleTouchStart}
      onTouchEndCapture={handleTouchEnd}
      onTouchCancelCapture={handleTouchCancel}
      style={[
        style,
        styles.widget,
        isDragging && styles.draggingWidget,
        {
          transform: [
            { translateX: dragOffset.x },
            { translateY },
            { scale },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {children}
      {isDragging && (
        <View pointerEvents="none" style={styles.dragHint}>
          <MaterialIcons name="open-with" size={16} color="#fff" />
          <ThemedText style={styles.dragHintText}>Suelta para colocar</ThemedText>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  widget: {
    zIndex: 1,
  },
  draggingWidget: {
    zIndex: 20,
    elevation: 18,
    shadowColor: '#171d14',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  dragHint: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(23, 29, 20, 0.78)',
  },
  dragHintText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
