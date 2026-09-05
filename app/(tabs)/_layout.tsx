import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

const TAB_BAR_HEIGHT = 60;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              tint="dark"
              intensity={80}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="series"
        options={{
          title: 'Mis Series',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'tv' : 'tv-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    ...(Platform.OS === 'web'
      ? {
          position: 'fixed' as any,
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)' as any,
          width: 440,
          maxWidth: '90%',
          borderRadius: 28,
          backgroundColor: 'rgba(15, 15, 24, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTopWidth: 1,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 35px -10px rgba(0,0,0,0.8), 0 0 20px rgba(124, 90, 243, 0.2)',
          paddingBottom: 0,
          height: 62,
          zIndex: 1000,
        }
      : {
          position: 'absolute',
          height: TAB_BAR_HEIGHT + 20,
          backgroundColor: 'rgba(10,10,15,0.96)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.06)',
          elevation: 8,
          shadowOpacity: 0.3,
          paddingBottom: 10,
        }),
  },
  tabItem: {
    paddingVertical: Platform.OS === 'web' ? 6 : 4,
  },
  label: {
    fontFamily: Platform.OS === 'web' ? 'Inter, sans-serif' : 'Inter_600SemiBold',
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },
});
