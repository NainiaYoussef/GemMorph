import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Asset } from 'expo-asset';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ModelViewer } from '@/components/model-viewer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.View;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMorphing, setIsMorphing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [morphedModelUrl, setMorphedModelUrl] = useState<string | null>(null);

  // Section refs for scrolling
  const transformSectionRef = React.useRef<View>(null);
  const howToUseSectionRef = React.useRef<View>(null);
  const aboutSectionRef = React.useRef<View>(null);
  const contactSectionRef = React.useRef<View>(null);
  
  // Store section positions
  const [sectionPositions, setSectionPositions] = React.useState<{
    transform: number;
    'how-to-use': number;
    about: number;
    contact: number;
  }>({
    transform: 0,
    'how-to-use': 0,
    about: 0,
    contact: 0,
  });

  // Animation values
  const heroOpacity = useSharedValue(1);
  const uploadScale = useSharedValue(1);
  const morphButtonScale = useSharedValue(1);
  const navOpacity = useSharedValue(1);
  const searchFocus = useSharedValue(0);
  const menuTranslateX = useSharedValue(-300); // Start off-screen

  const colors = Colors[colorScheme ?? 'light'];

  // Load the 3D model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Load the ring model - Metro should now handle .glb files
        const modelAsset = Asset.fromModule(require('@/assets/RingN080111.glb'));
        await modelAsset.downloadAsync();
        const modelUri = modelAsset.localUri || modelAsset.uri;
        console.log('✅ RING MODEL LOADED! URI:', modelUri);
        setMorphedModelUrl(modelUri);
      } catch (error: any) {
        console.error('❌ ERROR LOADING RING:', error);
        console.error('Make sure you restarted the dev server after creating metro.config.js');
        // Don't show duck - show error instead
        alert('Ring model failed to load. Check console. Make sure to restart: npx expo start --clear');
      }
    };
    loadModel();
  }, []);

  const searchAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      searchFocus.value,
      [0, 1],
      [1, 1.01],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  const handleImagePick = async () => {
    try {
      setIsUploading(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
        setIsUploading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImage(result.assets[0].uri);
        uploadScale.value = withSequence(
          withSpring(0.95, { damping: 12 }),
          withSpring(1, { damping: 12 })
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMorphGem = async () => {
    if (!uploadedImage) return;

    setIsMorphing(true);
    morphButtonScale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1.05, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );

    try {
      // TODO: Replace this with your actual backend API call
      // const formData = new FormData();
      // formData.append('image', { uri: uploadedImage, type: 'image/jpeg', name: 'jewelry.jpg' });
      // const response = await fetch('YOUR_BACKEND_API_URL/morph', { method: 'POST', body: formData });
      // const { modelUrl } = await response.json();
      // setMorphedModelUrl(modelUrl);
      
      // For now: Load local model file from assets
      // Using your Ring model file
      const modelAsset = Asset.fromModule(require('@/assets/RingN080111.glb'));
      await modelAsset.downloadAsync();
      
      // Get the local URI for the model
      const modelUri = modelAsset.localUri || modelAsset.uri;
      setMorphedModelUrl(modelUri);
    } catch (error) {
      console.error('Error loading model:', error);
      // Fallback to demo model if local file fails
      setMorphedModelUrl('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb');
    } finally {
      setIsMorphing(false);
    }
  };

  const handleSearchFocus = () => {
    searchFocus.value = withSpring(1);
  };

  const handleSearchBlur = () => {
    searchFocus.value = withSpring(0);
  };

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    setShowMenu(false); // Close menu when section is clicked
    
    // Close menu animation
    menuTranslateX.value = withTiming(-300, { duration: 300 });

    // Scroll to section position
    setTimeout(() => {
      const position = sectionPositions[section as keyof typeof sectionPositions];
      if (position !== undefined && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: position - 100, // Offset for navbar
          animated: true,
        });
      }
    }, 100);
  };

  const handleSectionLayout = (section: string, event: any) => {
    const { y } = event.nativeEvent.layout;
    setSectionPositions((prev) => ({
      ...prev,
      [section]: y,
    }));
  };

  const toggleMenu = () => {
    const newShowMenu = !showMenu;
    setShowMenu(newShowMenu);
    menuTranslateX.value = withTiming(newShowMenu ? 0 : -300, { duration: 300 });
  };

  const menuAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: menuTranslateX.value }],
    };
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        {/* Minimal Navigation Bar - Cartier Style */}
        <AnimatedView
          entering={FadeIn.duration(800)}
          style={[
            styles.navBar,
            {
              backgroundColor: colors.background,
              paddingTop: insets.top + 12,
              borderBottomColor: colors.border,
            },
          ]}>
          <View style={styles.navContent}>
            {/* Logo - Left aligned like Cartier */}
            <View style={styles.logoContainer}>
              <ThemedText
                style={[
                  styles.logoText,
                  {
                    color: colors.text,
                    fontFamily: Platform.select({
                      ios: 'Georgia',
                      android: 'serif',
                      web: 'Georgia, serif',
                      default: 'serif',
                    }),
                  },
                ]}>
                GemMorph
              </ThemedText>
            </View>


            {/* Right side - Search and Menu */}
            <View style={styles.rightNav}>
              <AnimatedView style={searchAnimatedStyle}>
                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    {
                      backgroundColor: 'transparent',
                    },
                  ]}
                  onPress={handleSearchFocus}>
                  <IconSymbol name="magnifyingglass" size={20} color={colors.text} />
                </TouchableOpacity>
              </AnimatedView>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={toggleMenu}>
                <View style={[styles.menuIcon, { backgroundColor: colors.text }]} />
                <View style={[styles.menuIcon, { backgroundColor: colors.text }]} />
                <View style={[styles.menuIcon, { backgroundColor: colors.text }]} />
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedView>

        {/* Side Menu Overlay */}
        {showMenu && (
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={toggleMenu}
          />
        )}

        {/* Side Menu Drawer */}
        <AnimatedView
          style={[
            styles.sideMenu,
            {
              backgroundColor: colors.background,
              borderRightColor: colors.border,
              paddingTop: insets.top + 20,
            },
            menuAnimatedStyle,
          ]}>
          <View style={[styles.menuHeader, { borderBottomColor: colors.border }]}>
            <ThemedText
              style={[
                styles.menuTitle,
                {
                  color: colors.text,
                  fontFamily: Platform.select({
                    ios: 'Georgia',
                    android: 'serif',
                    web: 'Georgia, serif',
                    default: 'serif',
                  }),
                },
              ]}>
              Menu
            </ThemedText>
            <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.menuItems}>
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeSection === 'transform' && {
                  backgroundColor: colors.accent,
                },
              ]}
              onPress={() => scrollToSection('transform')}>
              <ThemedText
                style={[
                  styles.menuItemText,
                  {
                    color: colors.text,
                    fontFamily: Platform.select({
                      ios: 'Georgia',
                      android: 'serif',
                      web: 'Georgia, serif',
                      default: 'serif',
                    }),
                  },
                ]}>
                Transform
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeSection === 'how-to-use' && {
                  backgroundColor: colors.accent,
                },
              ]}
              onPress={() => scrollToSection('how-to-use')}>
              <ThemedText
                style={[
                  styles.menuItemText,
                  {
                    color: colors.text,
                    fontFamily: Platform.select({
                      ios: 'Georgia',
                      android: 'serif',
                      web: 'Georgia, serif',
                      default: 'serif',
                    }),
                  },
                ]}>
                How To Use
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeSection === 'about' && {
                  backgroundColor: colors.accent,
                },
              ]}
              onPress={() => scrollToSection('about')}>
              <ThemedText
                style={[
                  styles.menuItemText,
                  {
                    color: colors.text,
                    fontFamily: Platform.select({
                      ios: 'Georgia',
                      android: 'serif',
                      web: 'Georgia, serif',
                      default: 'serif',
                    }),
                  },
                ]}>
                About Us
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.menuItem,
                activeSection === 'contact' && {
                  backgroundColor: colors.accent,
                },
              ]}
              onPress={() => scrollToSection('contact')}>
              <ThemedText
                style={[
                  styles.menuItemText,
                  {
                    color: colors.text,
                    fontFamily: Platform.select({
                      ios: 'Georgia',
                      android: 'serif',
                      web: 'Georgia, serif',
                      default: 'serif',
                    }),
                  },
                ]}>
                Contact
              </ThemedText>
            </TouchableOpacity>
          </View>
        </AnimatedView>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          {/* Full-Screen Hero Section - Cartier Style */}
          <AnimatedView
            ref={transformSectionRef}
            onLayout={(e) => handleSectionLayout('transform', e)}
            entering={FadeIn.delay(200).duration(1000)}
            style={[
              styles.heroSection,
              {
                minHeight: SCREEN_HEIGHT * 0.7,
                backgroundColor: colors.background,
              },
            ]}>
            <View style={styles.heroContent}>
              <AnimatedView entering={FadeInDown.delay(400).duration(1000)}>
                <ThemedText
                  style={[
                    styles.heroTitle,
                    {
                      color: colors.text,
                      fontFamily: Platform.select({
                        ios: 'Georgia',
                        android: 'serif',
                        web: 'Georgia, serif',
                        default: 'serif',
                      }),
                    },
                  ]}>
                  Transform
                </ThemedText>
              </AnimatedView>
              <AnimatedView entering={FadeInDown.delay(600).duration(1000)}>
                <ThemedText
                  style={[
                    styles.heroTitle,
                    {
                      color: colors.primary,
                      fontFamily: Platform.select({
                        ios: 'Georgia',
                        android: 'serif',
                        web: 'Georgia, serif',
                        default: 'serif',
                      }),
                    },
                  ]}>
                  Your Jewelry
                </ThemedText>
              </AnimatedView>
              <AnimatedView entering={FadeInDown.delay(800).duration(1000)}>
                <ThemedText
                  style={[
                    styles.heroSubtitle,
                    {
                      color: colors.text,
                      opacity: 0.6,
                      fontFamily: Platform.select({
                        ios: 'Georgia',
                        android: 'serif',
                        web: 'Georgia, serif',
                        default: 'serif',
                      }),
                    },
                  ]}>
                  From 2D to 3D
                </ThemedText>
              </AnimatedView>
              
              {/* 3D Model Viewer */}
              {morphedModelUrl && (
                <AnimatedView 
                  entering={FadeIn.delay(1000).duration(800)}
                  style={[
                    styles.heroModelContainer,
                    {
                      marginTop: 48,
                      backgroundColor: colors.accent,
                      borderColor: colors.border,
                    },
                  ]}>
                  <ModelViewer
                    modelUrl={morphedModelUrl}
                    style={styles.heroModelViewer}
                    autoRotate={false}
                    cameraControls={true}
                  />
                </AnimatedView>
              )}
            </View>
          </AnimatedView>

          {/* Upload Section - Elegant Cartier Style */}
          <AnimatedView
            entering={FadeIn.delay(1000).duration(800)}
            style={[
              styles.uploadSection,
              {
                backgroundColor: colors.background,
                minHeight: SCREEN_HEIGHT * 0.6,
              },
            ]}>
            <View style={styles.uploadContent}>
              <ThemedText
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                    fontFamily: Platform.select({
                      ios: 'Georgia',
                      android: 'serif',
                      web: 'Georgia, serif',
                      default: 'serif',
                    }),
                  },
                ]}>
                Upload Your Piece
              </ThemedText>
              <ThemedText
                style={[
                  styles.sectionDescription,
                  {
                    color: colors.text,
                    opacity: 0.5,
                  },
                ]}>
                Select a high-quality photograph of your jewelry
              </ThemedText>

              <AnimatedView style={[styles.uploadAreaContainer, { transform: [{ scale: uploadScale.value }] }]}>
                <TouchableOpacity
                  style={[
                    styles.uploadArea,
                    {
                      backgroundColor: uploadedImage ? 'transparent' : colors.accent,
                      borderColor: colors.border,
                      borderWidth: uploadedImage ? 0 : 1,
                    },
                  ]}
                  onPress={handleImagePick}
                  disabled={isUploading}
                  activeOpacity={0.8}>
                  {isUploading ? (
                    <View style={styles.uploadLoading}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <ThemedText
                        style={[
                          styles.uploadText,
                          {
                            color: colors.text,
                            opacity: 0.6,
                            marginTop: 16,
                          },
                        ]}>
                        Processing...
                      </ThemedText>
                    </View>
                  ) : uploadedImage ? (
                    <View style={styles.uploadedImageContainer}>
        <Image
                        source={{ uri: uploadedImage }}
                        style={styles.uploadedImage}
                        contentFit="cover"
                      />
                      <TouchableOpacity
                        style={[
                          styles.removeImageButton,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() => {
                          setUploadedImage(null);
                          uploadScale.value = withSpring(0.95);
                        }}>
                        <IconSymbol name="xmark" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <View
                        style={[
                          styles.uploadIconContainer,
                          {
                            backgroundColor: colors.accent,
                            borderColor: colors.border,
                          },
                        ]}>
                        <IconSymbol name="photo" size={48} color={colors.primary} />
                      </View>
                      <ThemedText
                        style={[
                          styles.uploadText,
                          {
                            color: colors.text,
                            marginTop: 24,
                            fontFamily: Platform.select({
                              ios: 'Georgia',
                              android: 'serif',
                              web: 'Georgia, serif',
                              default: 'serif',
                            }),
                          },
                        ]}>
                        Tap to Upload
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.uploadHint,
                          {
                            color: colors.text,
                            opacity: 0.4,
                            marginTop: 8,
                          },
                        ]}>
                        JPG, PNG up to 10MB
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              </AnimatedView>
            </View>
          </AnimatedView>

          {/* Morph Button - Cartier Elegant Style */}
          {uploadedImage && (
            <AnimatedView
              entering={FadeIn.duration(600)}
              style={[
                styles.morphSection,
                {
                  backgroundColor: colors.background,
                  minHeight: SCREEN_HEIGHT * 0.4,
                },
              ]}>
              <View style={styles.morphContent}>
                <ThemedText
                  style={[
                    styles.morphTitle,
                    {
                      color: colors.text,
                      fontFamily: Platform.select({
                        ios: 'Georgia',
                        android: 'serif',
                        web: 'Georgia, serif',
                        default: 'serif',
                      }),
                    },
                  ]}>
                  Ready to Transform
                </ThemedText>
                <AnimatedTouchable
                  style={[
                    styles.morphButton,
                    {
                      backgroundColor: colors.primary,
                      transform: [{ scale: morphButtonScale.value }],
                    },
                  ]}
                  onPress={handleMorphGem}
                  disabled={isMorphing}
                  activeOpacity={0.9}>
                  {isMorphing ? (
                    <View style={styles.morphButtonContent}>
                      <ActivityIndicator size="small" color={colors.white} />
                      <ThemedText
                        style={[
                          styles.morphButtonText,
                          {
                            color: colors.white,
                            marginLeft: 12,
                            fontFamily: Platform.select({
                              ios: 'Georgia',
                              android: 'serif',
                              web: 'Georgia, serif',
                              default: 'serif',
                            }),
                          },
                        ]}>
                        Transforming...
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.morphButtonContent}>
                      <ThemedText
                        style={[
                          styles.morphButtonText,
                          {
                            color: colors.white,
                            fontFamily: Platform.select({
                              ios: 'Georgia',
                              android: 'serif',
                              web: 'Georgia, serif',
                              default: 'serif',
                            }),
                          },
                        ]}>
                        Morph the Gem Now
        </ThemedText>
                      <IconSymbol
                        name="arrow.right"
                        size={20}
                        color={colors.white}
                        style={{ marginLeft: 12 }}
                      />
                    </View>
                  )}
                </AnimatedTouchable>
              </View>
            </AnimatedView>
          )}


          {/* How To Use Section */}
          <AnimatedView
            ref={howToUseSectionRef}
            onLayout={(e) => handleSectionLayout('how-to-use', e)}
            entering={FadeIn.delay(1200).duration(800)}
            style={[
              styles.infoSection,
              {
                backgroundColor: colors.background,
                minHeight: SCREEN_HEIGHT * 0.6,
              },
            ]}>
            <View style={styles.infoContent}>
              <ThemedText
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                    fontFamily: Platform.select({
                      ios: 'Georgia',
                      android: 'serif',
                      web: 'Georgia, serif',
                      default: 'serif',
                    }),
                  },
                ]}>
                How To Use
              </ThemedText>
              <View style={styles.stepsContainer}>
                {[
                  {
                    number: '01',
                    title: 'Upload Your Photo',
                    description: 'Select a high-quality photograph of your jewelry piece from your device.',
                  },
                  {
                    number: '02',
                    title: 'Review & Adjust',
                    description: 'Ensure your image is clear and well-lit for the best transformation results.',
                  },
                  {
                    number: '03',
                    title: 'Transform',
                    description: 'Click "Morph the Gem Now" and watch as AI transforms your 2D image into a 3D model.',
                  },
                  {
                    number: '04',
                    title: 'Download & Share',
                    description: 'Download your 3D model and share it with others or use it for your projects.',
                  },
                ].map((step, index) => (
                  <AnimatedView
                    key={index}
                    entering={FadeInDown.delay(1400 + index * 200).duration(600)}
                    style={[
                      styles.stepCard,
                      {
                        backgroundColor: colors.accent,
                        borderColor: colors.border,
                      },
                    ]}>
                    <ThemedText
                      style={[
                        styles.stepNumber,
                        {
                          color: colors.primary,
                          fontFamily: Platform.select({
                            ios: 'Georgia',
                            android: 'serif',
                            web: 'Georgia, serif',
                            default: 'serif',
                          }),
                        },
                      ]}>
                      {step.number}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.stepTitle,
                        {
                          color: colors.text,
                          fontFamily: Platform.select({
                            ios: 'Georgia',
                            android: 'serif',
                            web: 'Georgia, serif',
                            default: 'serif',
                          }),
                        },
                      ]}>
                      {step.title}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.stepDescription,
                        {
                          color: colors.text,
                          opacity: 0.6,
                        },
                      ]}>
                      {step.description}
                    </ThemedText>
                  </AnimatedView>
                ))}
              </View>
            </View>
          </AnimatedView>

          {/* About Us Section */}
          <AnimatedView
            ref={aboutSectionRef}
            onLayout={(e) => handleSectionLayout('about', e)}
            entering={FadeIn.delay(2000).duration(800)}
            style={[
              styles.infoSection,
              {
                backgroundColor: colorScheme === 'dark' ? '#0A0A0A' : '#FAFAFA',
                minHeight: SCREEN_HEIGHT * 0.5,
              },
            ]}>
            <View style={styles.infoContent}>
              <ThemedText
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                    fontFamily: Platform.select({
                      ios: 'Georgia',
                      android: 'serif',
                      web: 'Georgia, serif',
                      default: 'serif',
                    }),
                  },
                ]}>
                About Us
              </ThemedText>
              <View style={styles.aboutContent}>
                <ThemedText
                  style={[
                    styles.aboutText,
                    {
                      color: colors.text,
                      opacity: 0.7,
                      fontFamily: Platform.select({
                        ios: 'Georgia',
                        android: 'serif',
                        web: 'Georgia, serif',
                        default: 'serif',
                      }),
                    },
                  ]}>
                  GemMorph represents the future of jewelry visualization. We combine cutting-edge
                  artificial intelligence with elegant design to transform your two-dimensional
                  jewelry photographs into stunning three-dimensional models.
                </ThemedText>
                <ThemedText
                  style={[
                    styles.aboutText,
                    {
                      color: colors.text,
                      opacity: 0.7,
                      marginTop: 24,
                      fontFamily: Platform.select({
                        ios: 'Georgia',
                        android: 'serif',
                        web: 'Georgia, serif',
                        default: 'serif',
                      }),
                    },
                  ]}>
                  Our mission is to bridge the gap between traditional jewelry photography and
                  modern 3D visualization, making it accessible to everyone. Whether you're a
                  designer, collector, or enthusiast, GemMorph brings your jewelry to life.
                </ThemedText>
                <View style={styles.statsContainer}>
                  {[
                    { number: '10K+', label: 'Transformations' },
                    { number: '5K+', label: 'Users' },
                    { number: '99%', label: 'Accuracy' },
                  ].map((stat, index) => (
                    <View key={index} style={styles.statItem}>
                      <ThemedText
                        style={[
                          styles.statNumber,
                          {
                            color: colors.primary,
                            fontFamily: Platform.select({
                              ios: 'Georgia',
                              android: 'serif',
                              web: 'Georgia, serif',
                              default: 'serif',
                            }),
                          },
                        ]}>
                        {stat.number}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.statLabel,
                          {
                            color: colors.text,
                            opacity: 0.5,
                          },
                        ]}>
                        {stat.label}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </AnimatedView>

          {/* Contact Section */}
          <AnimatedView
            ref={contactSectionRef}
            onLayout={(e) => handleSectionLayout('contact', e)}
            entering={FadeIn.delay(2400).duration(800)}
            style={[
              styles.infoSection,
              {
                backgroundColor: colors.background,
                minHeight: SCREEN_HEIGHT * 0.5,
              },
            ]}>
            <View style={styles.infoContent}>
              <ThemedText
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.text,
                    fontFamily: Platform.select({
                      ios: 'Georgia',
                      android: 'serif',
                      web: 'Georgia, serif',
                      default: 'serif',
                    }),
                  },
                ]}>
                Contact
              </ThemedText>
              <View style={styles.contactContent}>
                <ThemedText
                  style={[
                    styles.contactDescription,
                    {
                      color: colors.text,
                      opacity: 0.6,
                      textAlign: 'center',
                      marginBottom: 48,
                    },
                  ]}>
                  We'd love to hear from you. Get in touch with our team.
                </ThemedText>
                <View style={styles.contactMethods}>
                  {[
                    {
                      icon: 'paperplane.fill',
                      title: 'Email',
                      value: 'hello@gemmorph.com',
                      action: () => {
                        // Handle email
                      },
                    },
                    {
                      icon: 'house.fill',
                      title: 'Phone',
                      value: '+1 (555) 123-4567',
                      action: () => {
                        // Handle phone
                      },
                    },
                    {
                      icon: 'cube',
                      title: 'Address',
                      value: '123 Design Street\nNew York, NY 10001',
                      action: () => {
                        // Handle address
                      },
                    },
                  ].map((method, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.contactCard,
                        {
                          backgroundColor: colors.accent,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={method.action}>
                      <IconSymbol name={method.icon as any} size={32} color={colors.primary} />
                      <ThemedText
                        style={[
                          styles.contactTitle,
                          {
                            color: colors.text,
                            marginTop: 16,
                            fontFamily: Platform.select({
                              ios: 'Georgia',
                              android: 'serif',
                              web: 'Georgia, serif',
                              default: 'serif',
                            }),
                          },
                        ]}>
                        {method.title}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.contactValue,
                          {
                            color: colors.text,
                            opacity: 0.6,
                            marginTop: 8,
                            textAlign: 'center',
                          },
                        ]}>
                        {method.value}
        </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </AnimatedView>

          {/* Footer - Minimal Cartier Style */}
          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
              },
            ]}>
            <ThemedText
              style={[
                styles.footerText,
                {
                  color: colors.text,
                  opacity: 0.4,
                  fontFamily: Platform.select({
                    ios: 'Georgia',
                    android: 'serif',
                    web: 'Georgia, serif',
                    default: 'serif',
                  }),
                },
              ]}>
              GemMorph © 2024
        </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flex: 1,
    flexGrow: 1,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: 2,
  },
  navLink: {
    paddingVertical: 8,
  },
  navLinkText: {
    fontSize: Platform.select({ web: 14, default: 12 }),
    fontWeight: '400',
    letterSpacing: 1,
  },
  rightNav: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 20,
  },
  searchButton: {
    padding: 8,
  },
  menuButton: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 18,
    width: 24,
    padding: 0,
  },
  menuIcon: {
    width: 24,
    height: 1.5,
    marginVertical: 2.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
  },
  heroSection: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
  },
  heroTitle: {
    fontSize: 72,
    fontWeight: '300',
    lineHeight: 84,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 16,
    textTransform: 'uppercase',
  },
  heroModelContainer: {
    width: '100%',
    maxWidth: 600,
    height: 400,
    borderRadius: 2,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 48,
  },
  heroModelViewer: {
    width: '100%',
    height: '100%',
  },
  uploadSection: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 80,
    alignItems: 'center',
  },
  uploadContent: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 48,
  },
  uploadAreaContainer: {
    width: '100%',
  },
  uploadArea: {
    width: '100%',
    minHeight: 400,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  uploadIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 1,
  },
  uploadHint: {
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  uploadLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedImageContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morphSection: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morphContent: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
  },
  morphTitle: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 48,
  },
  morphButton: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  morphButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  morphButtonText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footer: {
    width: '100%',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 40,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 1,
  },
  infoSection: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 80,
    alignItems: 'center',
  },
  infoContent: {
    width: '100%',
    maxWidth: 1000,
    alignItems: 'center',
  },
  stepsContainer: {
    width: '100%',
    marginTop: 48,
    gap: 24,
  },
  stepCard: {
    width: '100%',
    padding: 32,
    borderRadius: 2,
    borderWidth: 1,
    marginBottom: 16,
  },
  stepNumber: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 1,
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  aboutContent: {
    width: '100%',
    marginTop: 32,
  },
  aboutText: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: 0.5,
    lineHeight: 32,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 64,
    paddingTop: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 2,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  contactContent: {
    width: '100%',
    marginTop: 32,
  },
  contactDescription: {
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  contactMethods: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  contactCard: {
    flex: 1,
    minWidth: 200,
    padding: 32,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 1,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  modelSection: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 80,
    alignItems: 'center',
  },
  modelContent: {
    width: '100%',
    maxWidth: 1000,
    alignItems: 'center',
  },
  modelViewerContainer: {
    width: '100%',
    height: 500,
    borderRadius: 2,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 32,
  },
  modelViewer: {
    width: '100%',
    height: '100%',
  },
  modelActions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 0,
    borderWidth: 1,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  shareButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 0,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 200,
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 280,
    height: '100%',
    zIndex: 300,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: 2,
  },
  closeButton: {
    padding: 8,
  },
  menuItems: {
    gap: 8,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 2,
    marginBottom: 4,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 1,
  },
});
