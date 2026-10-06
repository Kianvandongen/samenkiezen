import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, Easing, AccessibilityInfo } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const COLS = ['#7b4dff', '#12b981', '#f59e0b', '#ef4560', '#2f7de1', '#ff6ec4'];

export default function Confetti({ count = 70 }) {
  const parts = useRef(Array.from({ length: count }, (_, i) => ({
    x: Math.random() * W, drift: (Math.random() - 0.5) * 160, delay: Math.random() * 500,
    w: 6 + Math.random() * 6, col: COLS[i % COLS.length], spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
    v: new Animated.Value(0),
  }))).current;
  useEffect(() => {
    let on = true;
    AccessibilityInfo.isReduceMotionEnabled().then(rm => {
      if (rm || !on) return;
      Animated.parallel(parts.map(p => Animated.timing(p.v, { toValue: 1, duration: 2600 + Math.random() * 1200, delay: p.delay, easing: Easing.out(Easing.quad), useNativeDriver: true }))).start();
    });
    return () => { on = false; };
  }, []);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, zIndex: 50 }}>
      {parts.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: p.x, top: -20, width: p.w, height: p.w / 2, backgroundColor: p.col, borderRadius: 1,
          opacity: p.v.interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, H * 0.9] }) },
            { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
            { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', p.spin + 'deg'] }) },
          ],
        }} />
      ))}
    </View>
  );
}
