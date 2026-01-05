import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { darkTheme } from '@/constants/theme';

type Props = {
  hide: boolean;
  onHidden: () => void;
};

const LOGO_SOURCE = require('../assets/images/Untitled (1536 x 1024 px).png');

export function SplashOverlay({ hide, onHidden }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.96)).current;

  const logoAspectRatio = useMemo(() => {
    const resolved = Image.resolveAssetSource(LOGO_SOURCE);
    if (!resolved?.width || !resolved?.height) return 1;
    return resolved.width / resolved.height;
  }, []);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduceMotion(Boolean(value));
      })
      .catch(() => {
        // ignore
      });

    const subscription: any = (AccessibilityInfo as any).addEventListener?.(
      'reduceMotionChanged',
      (value: boolean) => setReduceMotion(Boolean(value))
    );

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      logoOpacity.setValue(1);
      logoScale.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoScale, reduceMotion]);

  useEffect(() => {
    if (!hide) return;

    if (reduceMotion) {
      overlayOpacity.setValue(0);
      onHidden();
      return;
    }

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onHidden();
    });
  }, [hide, onHidden, overlayOpacity, reduceMotion]);

  const styles = StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#0B1220',
      justifyContent: 'center',
      alignItems: 'center',
    },
    gradientWash: {
      ...StyleSheet.absoluteFillObject,
      opacity: 1,
    },
    edgeGlow: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.16,
    },
    logoWrap: {
      width: '60%',
      maxWidth: 320,
      alignItems: 'center',
      justifyContent: 'center',
    },
    glowPlate: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 28,
      opacity: 0.22,
    },
    glowShadow: {
      ...(Platform.OS === 'ios'
        ? {
            shadowColor: darkTheme.colors.accent,
            shadowOpacity: 0.26,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 0 },
          }
        : null),
    },
    logo: {
      width: '100%',
      maxWidth: 320,
      aspectRatio: logoAspectRatio,
      resizeMode: 'contain',
    },
  });

  return (
    <Animated.View pointerEvents="auto" style={[styles.overlay, { opacity: overlayOpacity }]}>
      <LinearGradient
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={darkTheme.tiles.primaryGradient}
        style={styles.gradientWash}
      />
      <LinearGradient
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={darkTheme.tiles.edgeGlow}
        style={styles.edgeGlow}
      />

      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <View style={[styles.logoWrap, styles.glowShadow]}>
          <LinearGradient
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            colors={darkTheme.tiles.edgeGlow}
            style={styles.glowPlate}
          />
          <Image source={LOGO_SOURCE} style={styles.logo} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}
