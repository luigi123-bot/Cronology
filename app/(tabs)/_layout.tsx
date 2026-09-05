import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View, Text, Pressable } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: 'sparkles', inactive: 'sparkles-outline' },
  series: { active: 'tv', inactive: 'tv-outline' },
  search: { active: 'search', inactive: 'search-outline' },
};

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;
          const icons = TAB_ICONS[route.name] || { active: 'square', inactive: 'square-outline' };
          const iconName = isFocused ? icons.active : icons.inactive;
          const color = isFocused ? '#c084fc' : '#94a3b8';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              style={[styles.tabButton, isFocused && styles.tabButtonActive]}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              <Ionicons name={iconName} size={19} color={color} />
              <Text style={[styles.label, { color }]}>
                {typeof label === 'string' ? label : route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorar',
        }}
      />
      <Tabs.Screen
        name="series"
        options={{
          title: 'Mis Series',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none' as any,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: 420,
    maxWidth: '92%',
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(15, 15, 24, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 14,
    ...(Platform.OS === 'web'
      ? {
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 20px 35px -10px rgba(0,0,0,0.8), 0 0 20px rgba(124, 90, 243, 0.25)',
        }
      : {}),
  } as any,
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '84%',
    borderRadius: 22,
    cursor: 'pointer' as any,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
  },
  label: {
    fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'Inter_600SemiBold',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
