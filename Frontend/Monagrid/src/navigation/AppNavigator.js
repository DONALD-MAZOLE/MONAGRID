import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import SingleAnalysisScreen from '../screens/SingleAnalysisScreen';
import BatchAnalysisScreen from '../screens/BatchAnalysisScreen';
import AboutScreen from '../screens/AboutScreen';

const Tab = createBottomTabNavigator();

const LogoHeader = () => (
  <View style={{ paddingLeft: 6, justifyContent: 'center' }}>
    <Image
      source={require('../../assets/Monagrid.png')}
      style={{ width: 1000, height: 80 }}
      resizeMode="contain"
    />
  </View>
);

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: Colors.black,
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 70,              // taller header so logo is not clipped
        },
        headerTitle: () => <LogoHeader />,
        headerTitleAlign: 'left',
        headerTitleContainerStyle: { left: 0, right: 0 },
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
        options={{ tabBarLabel: 'Single' }}
      />
      <Tab.Screen
        name="Batch"
        component={BatchAnalysisScreen}
        options={{ tabBarLabel: 'Batch' }}
      />
      <Tab.Screen
        name="About"
        component={AboutScreen}
        options={{ tabBarLabel: 'About' }}
      />
    </Tab.Navigator>
  );
}
