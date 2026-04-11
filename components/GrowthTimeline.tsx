import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { EcoColors } from '@/constants/theme';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

interface GrowthTimelineProps {
  events: TimelineEvent[];
}

export const GrowthTimeline = ({ events }: GrowthTimelineProps) => {
  return (
    <View style={styles.container}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        
        return (
          <View key={event.id} style={styles.eventRow}>
            {/* Timeline Track & Node */}
            <View style={styles.trackColumn}>
              <View style={styles.node}>
                {event.icon && (
                  <MaterialIcons name={event.icon} size={14} color={EcoColors.surfaceContainerLowest} />
                )}
              </View>
              {!isLast && <View style={styles.trackLine} />}
            </View>

            {/* Event Content */}
            <View style={styles.contentColumn}>
              <View style={styles.header}>
                <ThemedText type="labelMedium" style={styles.date}>{event.date}</ThemedText>
                <ThemedText type="titleMedium" style={styles.title}>{event.title}</ThemedText>
              </View>
              <ThemedText type="bodyMedium" style={styles.description}>
                {event.description}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  eventRow: {
    flexDirection: 'row',
  },
  trackColumn: {
    width: 40,
    alignItems: 'center',
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: EcoColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 4,
    borderColor: EcoColors.background,
  },
  trackLine: {
    width: 2,
    flex: 1,
    backgroundColor: EcoColors.outlineVariant + '4D', // 30% opacity
    marginTop: -8,
    marginBottom: -8,
    zIndex: 1,
  },
  contentColumn: {
    flex: 1,
    paddingBottom: 32,
    paddingLeft: 8,
    marginTop: -2,
  },
  header: {
    marginBottom: 4,
  },
  date: {
    color: EcoColors.outline,
    marginBottom: 2,
  },
  title: {
    color: EcoColors.onSurface,
    fontWeight: 'bold',
  },
  description: {
    color: EcoColors.onSurfaceVariant,
    lineHeight: 20,
  },
});
