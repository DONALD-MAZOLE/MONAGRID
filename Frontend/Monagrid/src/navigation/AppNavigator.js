import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import SingleAnalysisScreen from '../screens/SingleAnalysisScreen';
import BatchAnalysisScreen from '../screens/BatchAnalysisScreen';
import AboutScreen from '../screens/AboutScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: Colors.black, borderBottomWidth: 0, elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { color: Colors.white, fontWeight: '800', fontSize: 18 },
        headerTintColor: Colors.white,
        tabBarStyle: {
          backgroundColor: Colors.cardBg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.green,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Single') iconName = focused ? 'scan' : 'scan-outline';
          else if (route.name === 'Batch') iconName = focused ? 'albums' : 'albums-outline';
          else iconName = focused ? 'information-circle' : 'information-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Single"
        component={SingleAnalysisScreen}
        options={{ title: 'Single Analysis', tabBarLabel: 'Single' }}
      />
      <Tab.Screen
        name="Batch"
        component={BatchAnalysisScreen}
        options={{ title: 'Batch Analysis', tabBarLabel: 'Batch' }}
      />
      <Tab.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'About Monagrid', tabBarLabel: 'About' }}
      />
    </Tab.Navigator>
  );
}
