import React from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  AudioMixingReasonType,
  AudioMixingStateType,
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngineEventHandler,
} from 'react-native-agora-rtc-ng';

import { ActionItem } from '../../../components/ActionItem';
import {
  BaseComponent,
  BaseAudioComponentState,
  Divider,
  STYLES,
  Input,
} from '../../../components/BaseComponent';
import Config from '../../../config/agora.config.json';

interface State extends BaseAudioComponentState {
  filePath: string;
  loopback: boolean;
  cycle: number;
  startPos: number;
  startAudioMixing: boolean;
  pauseAudioMixing: boolean;
}

export default class AudioMixing
  extends BaseComponent<{}, State>
  implements IRtcEngineEventHandler
{
  protected createState(): State {
    return {
      appId: Config.appId,
      enableVideo: false,
      channelId: Config.channelId,
      token: Config.token,
      uid: Config.uid,
      joinChannelSuccess: false,
      remoteUsers: [],
      filePath: this.getAssetPath('Sound_Horizon.mp3'),
      loopback: false,
      cycle: -1,
      startPos: 0,
      startAudioMixing: false,
      pauseAudioMixing: false,
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

    this.engine = createAgoraRtcEngine();
    this.engine.registerEventHandler(this);
    this.engine.initialize({
      appId,
      // Should use ChannelProfileLiveBroadcasting on most of cases
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });

    if (Platform.OS === 'android') {
      // Need granted the microphone permission
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
    }

    // Only need to enable audio on this case
    this.engine.enableAudio();
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
    this.engine?.joinChannelWithOptions(token, channelId, uid, {
      // Make myself as the broadcaster to send stream to remote
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    });
  }

  /**
   * Step 3-1: startAudioMixing
   */
  startAudioMixing = () => {
    const { filePath, loopback, cycle, startPos } = this.state;
    if (!filePath) {
      console.error('filePath is invalid');
      return;
    }
    if (cycle < -1) {
      console.error('cycle is invalid');
      return;
    }
    if (startPos < 0) {
      console.error('startPos is invalid');
      return;
    }

    this.engine?.startAudioMixing(filePath, loopback, cycle, startPos);
  };

  /**
   * Step 3-2 (Optional): pauseAudioMixing
   */
  pauseAudioMixing = () => {
    this.engine?.pauseAudioMixing();
  };

  /**
   * Step 3-3 (Optional): resumeAudioMixing
   */
  resumeAudioMixing = () => {
    this.engine?.resumeAudioMixing();
  };

  /**
   * Step 3-4 (Optional): getAudioMixingCurrentPosition
   */
  getAudioMixingCurrentPosition = () => {
    const position = this.engine?.getAudioMixingCurrentPosition();
    const duration = this.engine?.getAudioMixingDuration();
    this.debug(
      'getAudioMixingCurrentPosition',
      'position',
      position,
      'duration',
      duration
    );
  };

  /**
   * Step 3-5: stopAudioMixing
   */
  stopAudioMixing = () => {
    this.engine?.stopAudioMixing();
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
    this.engine?.release();
  }

  onAudioMixingStateChanged(
    state: AudioMixingStateType,
    reason: AudioMixingReasonType
  ) {
    this.info('onAudioMixingStateChanged', 'state', state, 'reason', reason);
    switch (state) {
      case AudioMixingStateType.AudioMixingStatePlaying:
        this.setState({ startAudioMixing: true, pauseAudioMixing: false });
        break;
      case AudioMixingStateType.AudioMixingStatePaused:
        this.setState({ pauseAudioMixing: true });
        break;
      case AudioMixingStateType.AudioMixingStateStopped:
      case AudioMixingStateType.AudioMixingStateFailed:
        this.setState({ startAudioMixing: false });
        break;
    }
  }

  onAudioMixingFinished() {
    this.info('AudioMixingFinished');
  }

  protected renderBottom(): React.ReactNode {
    const { filePath, loopback, cycle, startPos } = this.state;
    return (
      <>
        <Input
          style={STYLES.input}
          onEndEditing={({ nativeEvent: { text } }) => {
            this.setState({ filePath: text });
          }}
          placeholder={'filePath'}
          value={filePath}
        />
        <ActionItem
          title={'loopback'}
          isShowSwitch={true}
          switchValue={loopback}
          onSwitchValueChange={(value) => {
            this.setState({ loopback: value });
          }}
        />
        <Divider />
        <Input
          style={STYLES.input}
          onEndEditing={({ nativeEvent: { text } }) => {
            if (isNaN(+text)) return;
            this.setState({ cycle: +text });
          }}
          keyboardType={
            Platform.OS === 'android' ? 'numeric' : 'numbers-and-punctuation'
          }
          placeholder={`cycle (defaults: ${this.createState().cycle})`}
          value={cycle === this.createState().cycle ? '' : cycle.toString()}
        />
        <Input
          style={STYLES.input}
          onEndEditing={({ nativeEvent: { text } }) => {
            console.log('onEndEditing', text);
            if (isNaN(+text)) return;
            this.setState({ startPos: +text });
          }}
          keyboardType={
            Platform.OS === 'android' ? 'numeric' : 'numbers-and-punctuation'
          }
          placeholder={`startPos (defaults: ${this.createState().startPos})`}
          value={
            startPos === this.createState().startPos ? '' : startPos.toString()
          }
        />
      </>
    );
  }

  protected renderFloat(): React.ReactNode {
    const { startAudioMixing, pauseAudioMixing } = this.state;
    return (
      <>
        <ActionItem
          title={`${startAudioMixing ? 'stop' : 'start'} Audio Mixing`}
          onPress={
            startAudioMixing ? this.stopAudioMixing : this.startAudioMixing
          }
        />
        <ActionItem
          disabled={!startAudioMixing}
          title={`${pauseAudioMixing ? 'resume' : 'pause'} Audio Mixing`}
          onPress={
            pauseAudioMixing ? this.resumeAudioMixing : this.pauseAudioMixing
          }
        />
        <ActionItem
          disabled={!startAudioMixing}
          title={`get Audio Mixing Current Position`}
          onPress={this.getAudioMixingCurrentPosition}
        />
      </>
    );
  }
}
