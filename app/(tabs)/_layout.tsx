import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { MaterialIcons } from '@expo/vector-icons';
import { EcoColors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: EcoColors.primary,
        tabBarInactiveTintColor: EcoColors.outlineVariant,
        tabBarStyle: {
          backgroundColor: EcoColors.surfaceContainerLowest,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: EcoColors.onSurface,
          shadowOpacity: 0.05,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: -10 },
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ecosistema',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="eco" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="history" color={color} />,
        }}
      />
    </Tabs>
  );
}
