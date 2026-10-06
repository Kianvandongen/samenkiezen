import { Tabs, Redirect } from 'expo-router';
import { useStore } from '../../lib/store';
import Feather from '@expo/vector-icons/Feather';
import { useC, F } from '../../components/ui';

export default function TabLayout() {
  const c = useC(), S = useStore();
  if (!S.authed) return <Redirect href="/" />;
  const icon = n => ({ color }) => <Feather name={n} size={22} color={color} />;
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: c.purpleInk, tabBarInactiveTintColor: c.muted, tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line }, tabBarLabelStyle: { fontFamily: F.semi, fontSize: 11 }, sceneStyle: { backgroundColor: c.bg } }}>
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="groups" options={{ title: 'Groepen', tabBarIcon: icon('users') }} />
      <Tabs.Screen name="saved" options={{ title: 'Later', tabBarIcon: icon('bookmark') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profiel', tabBarIcon: icon('user') }} />
    </Tabs>
  );
}
