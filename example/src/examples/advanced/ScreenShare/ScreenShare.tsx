import React from 'react';
import {
  PermissionsAndroid,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngineEventHandler,
  IRtcEngineEx,
  LocalVideoStreamError,
  LocalVideoStreamState,
  RtcSurfaceView,
  VideoContentHint,
  VideoSourceType,
} from 'react-native-agora-rtc-ng';

import {
  BaseComponent,
  BaseVideoComponentState,
  Divider,
  STYLES,
} from '../../../components/BaseComponent';
import Config from '../../../config/agora.config.json';
import { PickerView } from '../../../components/PickerView';
import { ActionItem } from '../../../components/ActionItem';

interface State extends BaseVideoComponentState {
  token2: string;
  uid2: number;
  captureAudio: boolean;
  sampleRate: number;
  channels: number;
  captureSignalVolume: number;
  captureVideo: boolean;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  contentHint: VideoContentHint;
  startScreenCapture: boolean;
}

export default class ScreenShare
  extends BaseComponent<{}, State>
  implements IRtcEngineEventHandler
{
  // @ts-ignore
  protected engine?: IRtcEngineEx;

  protected createState(): State {
    return {
      appId: Config.appId,
      enableVideo: true,
      channelId: Config.channelId,
      token: Config.token,
      uid: Config.uid,
      joinChannelSuccess: false,
      remoteUsers: [],
      startPreview: false,
      token2: '',
      uid2: 0,
      captureAudio: false,
      sampleRate: 16000,
      channels: 2,
      captureSignalVolume: 100,
      captureVideo: true,
      width: 1280,
      height: 720,
      frameRate: 15,
      bitrate: 0,
      contentHint: VideoContentHint.ContentHintMotion,
      startScreenCapture: false,
    };
  }

  /**
   * Step 1: initRtcEngine
   */
  protected async initRtcEngine() {
    const { appId } = this.state;
    if (!appId) {
      console.error(`appId is invalid`);
    }

    this.engine = createAgoraRtcEngine() as IRtcEngineEx;
    this.engine.registerEventHandler(this);
    this.engine.initialize({
      appId,
      // Should use ChannelProfileLiveBroadcasting on most of cases
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });

    if (Platform.OS === 'android') {
      // Need granted the microphone and camera permission
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }

    // Must call after initialize and before joinChannel
    if (Platform.OS === 'android') {
      this.engine?.loadExtensionProvider('agora_screen_capture_extension');
    }

    // Need to enable video on this case
    // If you only call `enableAudio`, only relay the audio stream to the target channel
    this.engine.enableVideo();

    // Start preview before joinChannel
    this.engine.startPreview();
    this.setState({ startPreview: true });
  }

  /**
   * Step 2: joinChannel
   */
  protected joinChannel() {
    const { channelId, token, uid } = this.state;
    if (!channelId) {
      console.error('channelId is invalid');
      return;
    }
    if (uid < 0) {
      console.error('uid is invalid');
      return;
    }

    // start joining channel
    // 1. Users can only see each other after they join the
    // same channel successfully using the same app id.
    // 2. If app certificate is turned on at dashboard, token is needed
    // when joining channel. The channel name and uid used to calculate
    // the token has to match the ones used for channel join
    // this.engine?.joinChannel(token, channelId, '', uid);
    this.engine?.joinChannelWithOptions(token, channelId, uid, {
      // Make myself as the broadcaster to send stream to remote
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    });
  }

  /**
   * Step 3-1: startScreenCapture
   */
  startScreenCapture = () => {
    const {
      captureAudio,
      sampleRate,
      channels,
      captureSignalVolume,
      captureVideo,
      width,
      height,
      frameRate,
      bitrate,
      contentHint,
    } = this.state;
    this.engine?.startScreenCapture({
      captureAudio,
      audioParams: {
        sampleRate,
        channels,
        captureSignalVolume,
      },
      captureVideo,
      videoParams: {
        dimensions: { width, height },
        frameRate,
        bitrate,
        contentHint,
      },
    });
    this.engine?.startPreview(VideoSourceType.VideoSourceScreen);
  };

  /**
   * Step 3-2: publishScreenCapture
   */
  publishScreenCapture = () => {
    const { channelId, token2, uid2 } = this.state;
    if (!channelId) {
      console.error('channelId is invalid');
      return;
    }
    if (uid2 <= 0) {
      console.error('uid2 is invalid');
      return;
    }

    // publish media player stream
    this.engine?.joinChannelEx(
      token2,
      { channelId, localUid: uid2 },
      {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishScreenCaptureAudio: true,
        publishScreenCaptureVideo: true,
      }
    );
  };

  /**
   * Step 3-3: stopScreenCapture
   */
  stopScreenCapture = () => {
    this.engine?.stopScreenCapture();
  };

  /**
   * Step 4: leaveChannel
   */
  protected leaveChannel() {
    this.engine?.leaveChannel();
  }

  /**
   * Step 5: releaseRtcEngine
   */
  protected releaseRtcEngine() {
    this.engine?.unregisterEventHandler(this);
    this.engine?.release();
  }

  onLocalVideoStateChanged(
    source: VideoSourceType,
    state: LocalVideoStreamState,
    error: LocalVideoStreamError
  ) {
    this.info(
      'onLocalVideoStateChanged',
      'source',
      source,
      'state',
      state,
      'error',
      error
    );
    if (source === VideoSourceType.VideoSourceScreen) {
      switch (state) {
        case LocalVideoStreamState.LocalVideoStreamStateStopped:
        case LocalVideoStreamState.LocalVideoStreamStateFailed:
          if (
            error ===
            LocalVideoStreamError.LocalVideoStreamErrorDeviceNoPermission
          ) {
            this.stopScreenCapture();
          }
          this.setState({ startScreenCapture: false });
          break;
        case LocalVideoStreamState.LocalVideoStreamStateCapturing:
        case LocalVideoStreamState.LocalVideoStreamStateEncoding:
          this.setState({ startScreenCapture: true });
          break;
      }
    }
  }

  protected renderVideo(): React.ReactNode {
    const { startScreenCapture } = this.state;
    return (
      <>
        {super.renderVideo()}
        {startScreenCapture ? (
          <RtcSurfaceView
            style={STYLES.video}
            canvas={{
              uid: 0,
              sourceType: VideoSourceType.VideoSourceScreen,
            }}
          />
        ) : undefined}
      </>
    );
  }

  protected renderBottom(): React.ReactNode {
    const {
      uid2,
      captureAudio,
      sampleRate,
      channels,
      captureSignalVolume,
      captureVideo,
      width,
      height,
      frameRate,
      bitrate,
      contentHint,
    } = this.state;
    return (
      <>
        <TextInput
          style={STYLES.input}
          onChangeText={(text) => {
            if (isNaN(+text)) return;
            this.setState({ uid2: +text });
          }}
          keyboardType={'numeric'}
          placeholder={`uid2 (must > 0)`}
          placeholderTextColor={'gray'}
          value={uid2 > 0 ? uid2.toString() : ''}
        />
        <ActionItem
          title={`captureAudio`}
          isShowSwitch={true}
          switchValue={captureAudio}
          onSwitchValueChange={(value) => {
            this.setState({ captureAudio: value });
          }}
        />
        <Divider />
        {captureAudio ? (
          <>
            <TextInput
              style={STYLES.input}
              onChangeText={(text) => {
                if (isNaN(+text)) return;
                this.setState({ sampleRate: +text });
              }}
              keyboardType={'numeric'}
              placeholder={`sampleRate (defaults: ${sampleRate})`}
              placeholderTextColor={'gray'}
              value={
                sampleRate === this.createState().sampleRate
                  ? ''
                  : sampleRate.toString()
              }
            />
            <TextInput
              style={STYLES.input}
              onChangeText={(text) => {
                if (isNaN(+text)) return;
                this.setState({ channels: +text });
              }}
              keyboardType={'numeric'}
              placeholder={`channels (defaults: ${channels})`}
              placeholderTextColor={'gray'}
              value={
                channels === this.createState().channels
                  ? ''
                  : channels.toString()
              }
            />
            {this.renderSlider(
              'captureSignalVolume',
              captureSignalVolume,
              0,
              100
            )}
            <Divider />
          </>
        ) : undefined}
        <ActionItem
          title={`captureVideo`}
          isShowSwitch={true}
          switchValue={captureVideo}
          onSwitchValueChange={(value) => {
            this.setState({ captureVideo: value });
          }}
        />
        <Divider />
        {captureVideo ? (
          <>
            <View style={styles.container}>
              <TextInput
                style={STYLES.input}
                onChangeText={(text) => {
                  if (isNaN(+text)) return;
                  this.setState({ width: +text });
                }}
                keyboardType={'numeric'}
                placeholder={`width (defaults: ${width})`}
                placeholderTextColor={'gray'}
                value={
                  width === this.createState().width ? '' : width.toString()
                }
              />
              <TextInput
                style={STYLES.input}
                onChangeText={(text) => {
                  if (isNaN(+text)) return;
                  this.setState({ height: +text });
                }}
                keyboardType={'numeric'}
                placeholder={`height (defaults: ${height})`}
                placeholderTextColor={'gray'}
                value={
                  height === this.createState().height ? '' : height.toString()
                }
              />
            </View>
            <TextInput
              style={STYLES.input}
              onChangeText={(text) => {
                if (isNaN(+text)) return;
                this.setState({ frameRate: +text });
              }}
              keyboardType={'numeric'}
              placeholder={`frameRate (defaults: ${frameRate})`}
              placeholderTextColor={'gray'}
              value={
                frameRate === this.createState().frameRate
                  ? ''
                  : frameRate.toString()
              }
            />
            <TextInput
              style={STYLES.input}
              onChangeText={(text) => {
                if (isNaN(+text)) return;
                this.setState({ bitrate: +text });
              }}
              keyboardType={'numeric'}
              placeholder={`bitrate (defaults: ${bitrate})`}
              placeholderTextColor={'gray'}
              value={
                bitrate === this.createState().bitrate ? '' : bitrate.toString()
              }
            />
            <View style={styles.container}>
              <PickerView
                title={'contentHint'}
                type={VideoContentHint}
                selectedValue={contentHint}
                onValueChange={(value: VideoContentHint) => {
                  this.setState({ contentHint: value });
                }}
              />
            </View>
          </>
        ) : undefined}
      </>
    );
  }

  protected renderFloat(): React.ReactNode {
    const { startScreenCapture } = this.state;
    return (
      <>
        <ActionItem
          title={`${startScreenCapture ? 'stop' : 'start'} Screen Capture`}
          onPress={
            startScreenCapture
              ? this.stopScreenCapture
              : this.startScreenCapture
          }
        />
        <ActionItem
          disabled={!startScreenCapture}
          title={`publish Screen Capture`}
          onPress={this.publishScreenCapture}
        />
      </>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
