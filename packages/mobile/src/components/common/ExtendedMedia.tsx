import React, { useEffect, useRef, useState } from 'react';
import Video, {
  LoadError,
  OnLoadData,
  OnProgressData,
  OnSeekData,
  VideoProperties,
} from 'react-native-video';
import {
  TouchableWithoutFeedback,
  TouchableHighlight,
  PanResponder,
  StyleSheet,
  Animated,
  SafeAreaView,
  Easing,
  View,
  Text,
  Modal,
  StyleProp,
  ViewStyle,
} from 'react-native';
import padStart from 'lodash/padStart';

import {
  ArrowsInSimple,
  ArrowsOutSimple,
  Pause,
  Play,
  SpeakerSimpleHigh,
} from 'phosphor-react-native';
import { DISABLED, GRAY100, GRAY800, WHITE } from 'shared/src/colors';
import { Media as MediaType } from 'shared/graphql/fragments/post';
import AsyncStorage from '@react-native-async-storage/async-storage';

const iconSize = 22;
const controlAnimationTiming = 500;
const doubleTapTime = 300;
const volumeWidth = 150;
const GLOBAL_VOLUME_POSITION = 'GLOBAL_VOLUME_POSITION';

enum SeekerStatus {
  Grant,
  Move,
  Release,
  Cancel,
}

interface ExtendedMediaProps {
  media: MediaType;
  mediaUrl: string;
  resizeMode?: 'contain' | 'cover';
  showOnStart?: boolean;
  paused?: boolean;
  showHours?: boolean;
  onLoad?: VideoProperties['onLoad'];
  onEnd?: VideoProperties['onEnd'];
  containerStyle?: StyleProp<ViewStyle>;
  videoStyle?: StyleProp<ViewStyle>;
  setPaused?: React.Dispatch<React.SetStateAction<boolean>>;
  togglePause?: () => void;
  controls?: boolean;
}

const ExtendedMedia: React.FC<ExtendedMediaProps> = ({
  media,
  mediaUrl,
  resizeMode = 'contain',
  paused = true,
  showHours = false,
  onEnd = () => console.log('onEnd'),
  containerStyle = {},
  videoStyle = {},
  setPaused,
  togglePause,
  controls = false,
  showOnStart = false,
  ...props
}) => {
  const initialValue = showOnStart ? 1 : 0;
  const scrubbingTimeStep = 0;
  const tapAnywhereToPause = false;

  const [state, setState] = useState({
    // Video
    resizeMode,
    paused,

    // Controls
    isFullscreen: false,
    showTimeRemaining: true,
    showHours,
    seekerFillWidth: 0,
    showControls: showOnStart,
    seekerPosition: 0,
    seeking: false,
    originallyPaused: false,
    scrubbing: false,
    loading: false,
    currentTime: 0,
    duration: 0,
  });

  const [soundMuted, setSoundMuted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [seekerStatus, setSeekerStatus] = useState({
    status: SeekerStatus.Cancel,
    position: 0,
  });
  const [seekerOffset, setSeekerOffset] = useState(0);

  const tapActionTimeout = useRef<NodeJS.Timeout | null>();
  const controlTimeout = useRef<NodeJS.Timeout | null>();
  const playerRef = useRef<Video | null>();
  const [seekerWidth, setSeekerWidth] = useState(0);

  const [volumeState, setVolumeState] = useState({
    volume: 1,
    volumeTrackWidth: 0,
    volumeFillWidth: 0,
    volumePosition: 0,
    volumeOffset: 0,
  });

  const [vSeekerStatus, setVSeekerStatus] = useState({
    status: SeekerStatus.Cancel,
    position: 0,
  });

  const _onEnd = (): void => {
    onEnd();
    setState((s) => ({
      ...s,
      paused: true,
      originallyPaused: true,
      currentTime: 0,
      seekerFillWidth: 0,
      seekerPosition: 0,
    }));

    setSeekerOffset(0);

    setTimeout(() => {
      playerRef?.current?.seek(0);
    }, 150);
  };

  const seekPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setSeekerStatus({
          status: SeekerStatus.Grant,
          position: evt.nativeEvent.locationX,
        });
      },

      /**
       * When panning, update the seekbar position, duh.
       */
      onPanResponderMove: (_evt, gestureState) => {
        setSeekerStatus({
          status: SeekerStatus.Move,
          position: gestureState.dx,
        });
      },

      onPanResponderRelease: () => {
        setSeekerStatus({
          ...seekerStatus,
          status: SeekerStatus.Release,
        });
      },
    }),
  ).current;

  const volumePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_evt, _gestureState) => true,
      onMoveShouldSetPanResponder: (_evt, _gestureState) => true,
      onPanResponderGrant: (evt, _gestureState) => {
        setVSeekerStatus({
          status: SeekerStatus.Grant,
          position: evt.nativeEvent.locationX,
        });
      },

      /**
       * Update the volume as we change the position.
       * If we go to 0 then turn on the mute prop
       * to avoid that weird static-y sound.
       */
      onPanResponderMove: (_evt, gestureState) => {
        setVSeekerStatus({
          status: SeekerStatus.Move,
          position: gestureState.dx,
        });
      },

      /**
       * Update the offset...
       */
      onPanResponderRelease: (_evt, gestureState) => {
        setVSeekerStatus({
          status: SeekerStatus.Release,
          position: gestureState.dx,
        });
      },
    }),
  ).current;

  useEffect(() => {
    switch (vSeekerStatus.status) {
      case SeekerStatus.Grant: {
        clearControlTimeout();
        break;
      }
      case SeekerStatus.Move: {
        const position = volumeState.volumeOffset + vSeekerStatus.position;

        setVolumePosition(position);
        const volume = calculateVolumeFromVolumePosition();
        setVolumeState((v) => ({ ...v, volume }));
        setSoundMuted(volume <= 0);

        break;
      }
      case SeekerStatus.Release: {
        setVolumeState((v) => ({ ...v, volumeOffset: v.volumePosition }));
        setControlTimeout();

        AsyncStorage.setItem(
          GLOBAL_VOLUME_POSITION,
          `${volumeState.volumePosition}`,
        );

        setSeekerStatus({ ...seekerStatus, status: SeekerStatus.Cancel });
        break;
      }
      default: {
        break;
      }
    }
  }, [vSeekerStatus]);

  const setVolumePosition = (position = 0, vOffset: number | null = null) => {
    const pos = constrainToVolumeMinMax(position);

    const volumeTrackWidth = volumeWidth - pos;
    setVolumeState((v) => ({
      ...v,
      volumePosition: pos,
      volumeFillWidth: Math.max(pos, 0),
      volumeTrackWidth: Math.min(volumeTrackWidth, 150),
      ...(vOffset ? { volumeOffset: vOffset } : {}),
    }));
  };

  const calculateVolumeFromVolumePosition = () => {
    return volumeState.volumePosition / volumeWidth;
  };

  const constrainToVolumeMinMax = (val = 0) => {
    if (val <= 0) {
      return 0;
    } else if (val >= volumeWidth + 9) {
      return volumeWidth + 9;
    }
    return val;
  };

  useEffect(() => {
    setState((s) => ({ ...s, paused }));
  }, [paused]);

  useEffect(() => {
    if (setPaused) {
      setPaused(state.paused);
    }
  }, [state.paused]);

  const animations = useRef({
    bottomControl: {
      marginBottom: new Animated.Value(0),
      opacity: new Animated.Value(initialValue),
    },
    topControl: {
      marginTop: new Animated.Value(0),
      opacity: new Animated.Value(initialValue),
    },
    video: {
      opacity: new Animated.Value(1),
    },
    loader: {
      rotate: new Animated.Value(0),
      MAX_VALUE: 360,
    },
  }).current;

  const _onLoadStart = (): void => {
    loadAnimation();
    setState((s) => ({ ...s, loading: true }));
  };

  const _onLoad = (data: OnLoadData): void => {
    setState((s) => ({ ...s, duration: data.duration, loading: false }));

    if (state.showControls) {
      setControlTimeout();
    }

    if (typeof props.onLoad === 'function') {
      props.onLoad(data);
    }
  };

  const _onProgress = (data: OnProgressData): void => {
    if (!state.scrubbing) {
      if (!state.seeking) {
        const position = calculateSeekerPosition();
        setSeekerPosition(position);
      }

      setState((s) => ({ ...s, currentTime: data.currentTime }));
    }
  };

  const _onSeek = (data: OnSeekData): void => {
    if (state.scrubbing) {
      if (!state.seeking) {
        setControlTimeout();
      }

      setState((s) => ({
        ...s,
        scrubbing: false,
        currentTime: data.currentTime,
        ...(!state.seeking ? { paused: state.originallyPaused } : {}),
      }));
    }
  };

  const _onError = (_err: LoadError): void => {
    setState((s) => ({ ...s, loading: false }));
  };

  const handleResizeMode = () => {
    if (state.isFullscreen) {
      setState((s) => ({
        ...s,
        resizeMode: state.resizeMode === 'cover' ? 'contain' : 'cover',
      }));
    } else {
      toggleFullscreen();
    }
  };

  const handleControlVisibility = () => {
    if (tapAnywhereToPause && state.showControls) {
      togglePlayPause();
      resetControlTimeout();
    } else {
      toggleControls();
    }
  };

  const _onScreenTouch = (): void => {
    initVolume();

    if (tapActionTimeout.current) {
      clearTimeout(tapActionTimeout.current);
      tapActionTimeout.current = null;
      handleResizeMode();
      if (state.showControls) {
        resetControlTimeout();
      }
    } else {
      tapActionTimeout.current = setTimeout(() => {
        handleControlVisibility();
        tapActionTimeout.current = null;
      }, doubleTapTime);
    }
  };

  const initVolume = () => {
    AsyncStorage.getItem(GLOBAL_VOLUME_POSITION).then((vp) => {
      const pos = vp != null ? Number(vp) : 1;
      setVolumePosition(pos, pos);
    });
  };

  const setControlTimeout = (): void => {
    controlTimeout.current = setTimeout(() => {
      _hideControls();
    }, 15000);
  };

  const clearControlTimeout = (): void => {
    if (controlTimeout.current) {
      clearTimeout(controlTimeout.current);
    }
  };

  const resetControlTimeout = (): void => {
    clearControlTimeout();
    setControlTimeout();
  };

  const hideControlAnimation = (): void => {
    Animated.parallel([
      Animated.timing(animations.topControl.opacity, {
        toValue: 0,
        duration: controlAnimationTiming,
        useNativeDriver: false,
      }),
      Animated.timing(animations.topControl.marginTop, {
        toValue: -100,
        duration: controlAnimationTiming,
        useNativeDriver: false,
      }),
      Animated.timing(animations.bottomControl.opacity, {
        toValue: 0,
        duration: controlAnimationTiming,
        useNativeDriver: false,
      }),
      Animated.timing(animations.bottomControl.marginBottom, {
        toValue: -100,
        duration: controlAnimationTiming,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const showControlAnimation = (): void => {
    Animated.parallel([
      Animated.timing(animations.topControl.opacity, {
        toValue: 1,
        useNativeDriver: false,
        duration: controlAnimationTiming,
      }),
      Animated.timing(animations.topControl.marginTop, {
        toValue: 0,
        useNativeDriver: false,
        duration: controlAnimationTiming,
      }),
      Animated.timing(animations.bottomControl.opacity, {
        toValue: 1,
        useNativeDriver: false,
        duration: controlAnimationTiming,
      }),
      Animated.timing(animations.bottomControl.marginBottom, {
        toValue: 0,
        useNativeDriver: false,
        duration: controlAnimationTiming,
      }),
    ]).start();
  };

  const loadAnimation = (): void => {
    if (state.loading) {
      Animated.sequence([
        Animated.timing(animations.loader.rotate, {
          toValue: animations.loader.MAX_VALUE,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(animations.loader.rotate, {
          toValue: 0,
          duration: 0,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]).start(loadAnimation);
    }
  };

  const _hideControls = (): void => {
    if (mounted) {
      hideControlAnimation();

      setState((s) => ({ ...s, showControls: false }));
    }
  };

  const toggleControls = (): void => {
    if (!state.showControls) {
      showControlAnimation();
      setControlTimeout();
    } else {
      hideControlAnimation();
      clearControlTimeout();
    }

    setState((s) => ({ ...s, showControls: !state.showControls }));
  };

  const toggleFullscreen = (): void => {
    setState((s) => ({
      ...s,
      isFullscreen: !state.isFullscreen,
    }));

    const time = calculateTimeFromSeekerPosition();
    setTimeout(() => {
      playerRef?.current?.seek(time, scrubbingTimeStep);
    }, 150);
  };

  const togglePlayPause = (): void => {
    const time = calculateTimeFromSeekerPosition();
    if (time >= state.duration) {
      playerRef?.current?.seek(0);
    }
    setState((s) => ({ ...s, paused: !state.paused }));
    if (togglePause) {
      togglePause();
    }
  };

  const toggleTimer = (): void => {
    setState((s) => ({ ...s, showTimeRemaining: !state.showTimeRemaining }));
  };

  const calculateTime = (): string => {
    if (state.showTimeRemaining) {
      const time = state.duration - state.currentTime;
      return `-${formatTime(time)}`;
    }

    return formatTime(state.currentTime);
  };

  const formatTime = (time = 0): string => {
    time = Math.min(Math.max(time, 0), state.duration);

    if (!state.showHours) {
      const formattedMins = padStart(Math.floor(time / 60).toFixed(0), 2, '0');
      const formattedSecs = padStart(Math.floor(time % 60).toFixed(0), 2, '0');

      return `${formattedMins}:${formattedSecs}`;
    }

    const formattedHours = padStart(Math.floor(time / 3600).toFixed(0), 2, '0');
    const formattedMinutes = padStart(
      (Math.floor(time / 60) % 60).toFixed(0),
      2,
      '0',
    );
    const formattedSeconds = padStart(Math.floor(time % 60).toFixed(0), 2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  };

  const setSeekerPosition = (p = 0): void => {
    const position = constrainToSeekerMinMax(p);

    if (!state.seeking) {
      setSeekerOffset(position);
    }

    setState((s) => ({
      ...s,
      seekerFillWidth: position,
      seekerPosition: position,
    }));
  };

  const constrainToSeekerMinMax = (val = 0): number => {
    if (val <= 0) {
      return 0;
    } else if (val >= seekerWidth) {
      return seekerWidth;
    }
    return val;
  };

  const calculateSeekerPosition = (): number => {
    const percent = state.currentTime / state.duration;
    return seekerWidth * percent;
  };

  const calculateTimeFromSeekerPosition = (): number => {
    if (seekerWidth === 0) {
      return 0;
    }
    const percent = state.seekerPosition / seekerWidth;
    return state.duration * percent;
  };

  const seekTo = (time = 0): void => {
    playerRef?.current?.seek(time);
    setState((s) => ({ ...s, currentTime: time }));
  };

  useEffect(() => {
    setMounted(true);
    initVolume();

    return () => {
      clearControlTimeout();
    };
  }, []);

  useEffect(() => {
    switch (seekerStatus.status) {
      case SeekerStatus.Grant: {
        clearControlTimeout();
        setSeekerPosition(seekerStatus.position);
        setState((s) => ({
          ...s,
          seeking: true,
          originallyPaused: state.paused,
          scrubbing: false,
          pause: true,
        }));
        break;
      }
      case SeekerStatus.Move: {
        setSeekerPosition(seekerOffset + seekerStatus.position);

        if (scrubbingTimeStep > 0 && !state.loading && !state.scrubbing) {
          const time = calculateTimeFromSeekerPosition();
          const timeDifference = Math.abs(state.currentTime - time) * 1000;

          if (time < state.duration && timeDifference >= scrubbingTimeStep) {
            setState((s) => ({ ...s, scrubbing: true }));
            setTimeout(() => {
              playerRef?.current?.seek(time, scrubbingTimeStep);
            }, 1);
          }
        }
        break;
      }
      case SeekerStatus.Release: {
        const time = calculateTimeFromSeekerPosition();
        if (time >= state.duration && !state.loading) {
          _onEnd();
        } else if (state.scrubbing) {
          setState((s) => ({ ...s, seeking: false }));
        } else {
          seekTo(time);
          setControlTimeout();
          setState((s) => ({
            ...s,
            paused: state.originallyPaused,
            seeking: false,
          }));
        }
        setSeekerStatus({ ...seekerStatus, status: SeekerStatus.Cancel });
        break;
      }
      default: {
        break;
      }
    }
  }, [seekerStatus]);

  const renderControl = (
    children: JSX.Element,
    callback: () => void,
    style = {},
  ): JSX.Element => {
    return (
      <TouchableHighlight
        underlayColor="transparent"
        activeOpacity={0.3}
        onPress={() => {
          resetControlTimeout();
          callback();
        }}
        style={[styles.controls.control, style]}>
        {children}
      </TouchableHighlight>
    );
  };

  const renderTopControls = (): JSX.Element => {
    const volumeControl = () => (
      <View style={styles.volume.container}>
        <View style={styles.volume.subContainer}>
          <View
            style={[styles.volume.fill, { width: volumeState.volumeFillWidth }]}
          />
          <View
            style={[
              styles.volume.track,
              { width: volumeState.volumeTrackWidth },
            ]}
          />
          <View
            style={[styles.volume.handle, { left: volumeState.volumePosition }]}
            {...volumePanResponder.panHandlers}>
            <SpeakerSimpleHigh size={iconSize} color={WHITE} weight={'fill'} />
          </View>
        </View>
      </View>
    );

    return (
      <Animated.View
        style={[
          styles.controls.top,
          {
            opacity: animations.topControl.opacity,
            marginTop: animations.topControl.marginTop,
          },
        ]}>
        <View style={[styles.controls.column]}>
          <SafeAreaView style={styles.controls.topControlGroup}>
            {renderFullscreen()}
            {volumeControl()}
          </SafeAreaView>
        </View>
      </Animated.View>
    );
  };

  const renderFullscreen = (): JSX.Element => {
    return renderControl(
      <View style={styles.controls.button}>
        {state.isFullscreen ? (
          <ArrowsInSimple size={iconSize} color={WHITE} weight={'fill'} />
        ) : (
          <ArrowsOutSimple size={iconSize} color={WHITE} weight={'fill'} />
        )}
      </View>,
      toggleFullscreen,
      styles.controls.fullscreen,
    );
  };

  const renderBottomControls = (): JSX.Element => {
    return (
      <Animated.View
        style={[
          styles.controls.bottom,
          {
            opacity: animations.bottomControl.opacity,
            marginBottom: animations.bottomControl.marginBottom,
          },
        ]}>
        <SafeAreaView>
          <View
            style={[
              styles.controls.row,
              styles.controls.bottomControlGroup,
              styles.controls.button,
            ]}>
            {renderPlayPause()}
            <View style={{ flex: 1 }}>{renderSeekbar()}</View>
            {renderTimer()}
          </View>
        </SafeAreaView>
      </Animated.View>
    );
  };

  const renderSeekbar = (): JSX.Element => {
    return (
      <View
        style={[styles.seekbar.container]}
        collapsable={false}
        {...seekPanResponder.panHandlers}>
        <View
          style={styles.seekbar.track}
          onLayout={(event) => setSeekerWidth(event.nativeEvent.layout.width)}
          pointerEvents={'none'}>
          <View
            style={[
              styles.seekbar.fill,
              {
                width: state.seekerFillWidth,
                backgroundColor: '#FFF',
              },
            ]}
            pointerEvents={'none'}
          />
        </View>
        <View
          style={[styles.seekbar.handle, { left: state.seekerPosition }]}
          pointerEvents={'none'}>
          <View
            style={[styles.seekbar.circle, { backgroundColor: '#FFF' }]}
            pointerEvents={'none'}
          />
        </View>
      </View>
    );
  };

  const renderPlayPause = (): JSX.Element => {
    return renderControl(
      state.paused ? (
        <Play size={iconSize} color={WHITE} weight={'fill'} />
      ) : (
        <Pause size={iconSize} color={WHITE} weight={'fill'} />
      ),
      togglePlayPause,
      styles.controls.playPause,
    );
  };

  const renderTimer = (): JSX.Element => {
    return renderControl(
      <Text style={styles.controls.timerText}>{calculateTime()}</Text>,
      toggleTimer,
      styles.controls.timer,
    );
  };

  const renderVideoPlayer = () => (
    <TouchableWithoutFeedback
      onPress={_onScreenTouch}
      style={[styles.player.container, containerStyle]}>
      <View style={[styles.player.container, containerStyle]}>
        <Video
          {...props}
          ref={(videoPlayer) => (playerRef.current = videoPlayer)}
          source={{ uri: media.url.includes('/') ? media.url : mediaUrl }}
          resizeMode={state.resizeMode}
          paused={state.paused}
          muted={soundMuted}
          volume={volumeState.volume}
          rate={1}
          onLoadStart={_onLoadStart}
          onProgress={_onProgress}
          onError={_onError}
          onLoad={_onLoad}
          onEnd={_onEnd}
          onSeek={_onSeek}
          style={[styles.player.video, videoStyle]}
          playInBackground={false}
          repeat={false}
          playWhenInactive={false}
        />
        {controls && renderTopControls()}
        {controls && renderBottomControls()}
      </View>
    </TouchableWithoutFeedback>
  );

  return (
    <View>
      {!state.isFullscreen && renderVideoPlayer()}
      <Modal
        presentationStyle={'fullScreen'}
        visible={state.isFullscreen}
        transparent={false}
        style={{ backgroundColor: 'black' }}>
        <View style={{ backgroundColor: 'black', flex: 1 }}>
          {renderVideoPlayer()}
        </View>
      </Modal>
    </View>
  );
};

export default ExtendedMedia;

const styles = {
  player: StyleSheet.create({
    container: {
      backgroundColor: 'black',
      alignSelf: 'stretch',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
    },
    video: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  }),
  error: StyleSheet.create({
    container: {
      backgroundColor: 'rgba( 0, 0, 0, 0.5 )',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      marginBottom: 16,
    },
    text: {
      backgroundColor: 'transparent',
      color: '#f27474',
    },
  }),
  loader: StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
  controls: StyleSheet.create({
    button: {
      backgroundColor: GRAY800,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    column: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    vignette: {
      resizeMode: 'stretch',
    },
    control: {
      padding: 12,
    },
    text: {
      backgroundColor: 'transparent',
      color: '#FFF',
      fontSize: 14,
      textAlign: 'center',
    },
    pullRight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    top: {
      flex: 1,
      alignItems: 'stretch',
      justifyContent: 'flex-start',
    },
    bottom: {
      alignItems: 'stretch',
      flex: 2,
      justifyContent: 'flex-end',
    },
    topControlGroup: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexDirection: 'row',
      margin: 12,
      marginBottom: 18,
    },
    bottomControlGroup: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginLeft: 12,
      marginRight: 12,
      marginBottom: 0,
    },
    volume: {
      flexDirection: 'row',
    },
    fullscreen: {
      flexDirection: 'row',
      paddingLeft: 0,
    },
    playPause: {
      position: 'relative',
      padding: 6,
      zIndex: 0,
    },
    title: {
      alignItems: 'center',
      flex: 0.6,
      flexDirection: 'column',
      padding: 0,
    },
    titleText: {
      textAlign: 'center',
    },
    timer: {
      width: 60,
      padding: 6,
    },
    timerText: {
      backgroundColor: 'transparent',
      color: '#FFF',
      fontSize: 11,
      textAlign: 'right',
    },
  }),
  volume: StyleSheet.create({
    container: {
      backgroundColor: GRAY800,
      borderRadius: 10,
      paddingRight: 8,
      paddingVertical: 2,
    },
    subContainer: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexDirection: 'row',
      height: 36,
      marginLeft: 20,
      marginRight: 20,
      width: 150,
    },
    track: {
      backgroundColor: DISABLED,
      height: 1,
      marginLeft: 7,
    },
    fill: {
      backgroundColor: '#FFF',
      height: 1,
    },
    handle: {
      position: 'absolute',
      marginTop: -24,
      marginLeft: -24,
      padding: 16,
    },
    icon: {
      marginLeft: 7,
    },
  }),
  seekbar: StyleSheet.create({
    container: {
      alignSelf: 'stretch',
      height: 28,
      marginLeft: 8,
      marginRight: 8,
    },
    track: {
      backgroundColor: DISABLED,
      height: 5,
      position: 'relative',
      top: 11,
      width: '100%',
      borderRadius: 4,
    },
    fill: {
      backgroundColor: GRAY100,
      height: 5,
      width: '100%',
      borderRadius: 4,
    },
    handle: {
      position: 'absolute',
      marginLeft: -7,
      height: 28,
      width: 28,
    },
    circle: {
      borderRadius: 12,
      position: 'relative',
      top: 8,
      left: 0,
      height: 12,
      width: 12,
    },
  }),
};
