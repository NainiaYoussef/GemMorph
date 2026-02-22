import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Platform, Dimensions } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Conditional import for WebView (not available on web)
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('WebView not available');
  }
}

interface ModelViewerProps {
  modelUrl: string;
  style?: any;
  autoRotate?: boolean;
  cameraControls?: boolean;
}

export function ModelViewer({
  modelUrl,
  style,
  autoRotate = true,
  cameraControls = true,
}: ModelViewerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const containerRef = useRef<any>(null);

  // HTML template for model-viewer (web component)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: 100%;
            height: 100vh;
            background: ${colors.background};
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          }
          model-viewer {
            width: 100%;
            height: 100%;
            background: ${colors.background};
          }
        </style>
      </head>
      <body>
        <model-viewer
          src="${modelUrl}"
          alt="3D Jewelry Model"
          auto-rotate="${autoRotate}"
          camera-controls="${cameraControls}"
          interaction-policy="allow-when-focused"
          style="width: 100%; height: 100%;"
          shadow-intensity="1"
          environment-image="neutral"
          exposure="1"
          ar
          ar-modes="webxr scene-viewer quick-look"
        >
        </model-viewer>
      </body>
    </html>
  `;

  useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current) {
      // Inject model-viewer script and element for web
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(script);

      const modelViewer = document.createElement('model-viewer');
      modelViewer.setAttribute('src', modelUrl);
      modelViewer.setAttribute('alt', '3D Jewelry Model');
      modelViewer.setAttribute('auto-rotate', String(autoRotate));
      modelViewer.setAttribute('camera-controls', String(cameraControls));
      modelViewer.setAttribute('style', 'width: 100%; height: 100%; background: ' + colors.background + ';');
      modelViewer.setAttribute('shadow-intensity', '1');
      modelViewer.setAttribute('environment-image', 'neutral');
      modelViewer.setAttribute('exposure', '1');

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(modelViewer);
      }

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [modelUrl, autoRotate, cameraControls, colors.background]);

  if (Platform.OS === 'web') {
    // For web, use a div that will be populated by useEffect
    return (
      <View style={[styles.container, style]}>
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colors.background,
          }}
        />
      </View>
    );
  }

  // For native platforms, use WebView
  if (!WebView) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholder}>
          <ThemedText>3D Viewer not available on this platform</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="always"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 500,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webview: {
    backgroundColor: 'transparent',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
