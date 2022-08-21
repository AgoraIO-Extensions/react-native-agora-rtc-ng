import React, { Component, ReactNode, useState } from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ErrorCodeType,
  IRtcEngine,
  IRtcEngineEventHandler,
  RtcConnection,
  RtcStats,
  RtcSurfaceView,
  UserOfflineReasonType,
} from 'react-native-agora-rtc-ng';
import {
  copyFileAssets,
  exists,
  ExternalCachesDirectoryPath,
  MainBundlePath,
} from 'react-native-fs';
import { StackScreenProps } from '@react-navigation/stack/src/types';

import { AgoraDivider, AgoraStyle, AgoraTextInput } from './ui';
import { LogSink } from './LogSink';

const Header = ({ getData }: { getData: () => Array<string> }) => {
  const [visible, setVisible] = useState(false);

  const toggleOverlay = () => {
    setVisible(!visible);
  };

  return (
    <>
      <Button title="Logs" onPress={toggleOverlay} />
      <LogSink
        visible={visible}
        data={getData()}
        onBackdropPress={toggleOverlay}
      />
    </>
  );
};

export interface BaseComponentState {
  appId: string;
  enableVideo: boolean;
  channelId?: string;
  token?: string;
  uid?: number;
  joinChannelSuccess?: boolean;
  remoteUsers?: number[];
  startPreview?: boolean;
}

export interface BaseAudioComponentState extends BaseComponentState {
  channelId: string;
  token: string;
  uid: number;
  joinChannelSuccess: boolean;
  remoteUsers: number[];
}

export interface BaseVideoComponentState extends BaseAudioComponentState {
  startPreview: boolean;
}

export abstract class BaseComponent<
    P = {},
    S extends BaseComponentState = BaseComponentState
  >
  extends Component<P & StackScreenProps<{}>, S>
  implements IRtcEngineEventHandler
{
  protected engine?: IRtcEngine;
  private _data: Array<string> = [];

  protected constructor(props: P & StackScreenProps<{}>) {
    super(props);
    this.state = this.createState();
    props.navigation.setOptions({
      headerRight: () => <Header getData={() => this._data} />,
    });
  }

  componentDidMount() {
    this.initRtcEngine();
  }

  componentWillUnmount() {
    this.releaseRtcEngine();
  }

  protected abstract createState(): S;

  protected abstract initRtcEngine(): void;

  protected joinChannel() {}

  protected leaveChannel() {}

  protected abstract releaseRtcEngine(): void;

  onError(err: ErrorCodeType, msg: string) {
    this.error('onError', 'err', err, 'msg', msg);
  }

  onJoinChannelSuccess(connection: RtcConnection, elapsed: number) {
    this.info(
      'onJoinChannelSuccess',
      'connection',
      connection,
      'elapsed',
      elapsed
    );
    this.setState({ joinChannelSuccess: true });
  }

  onLeaveChannel(connection: RtcConnection, stats: RtcStats) {
    this.info('onLeaveChannel', 'connection', connection, 'stats', stats);
    this.setState(this.createState());
  }

  onUserJoined(connection: RtcConnection, remoteUid: number, elapsed: number) {
    this.info(
      'onUserJoined',
      'connection',
      connection,
      'remoteUid',
      remoteUid,
      'elapsed',
      elapsed
    );
    const { remoteUsers } = this.state;
    if (remoteUsers === undefined) return;
    this.setState({
      remoteUsers: [...remoteUsers!, remoteUid],
    });
  }

  onUserOffline(
    connection: RtcConnection,
    remoteUid: number,
    reason: UserOfflineReasonType
  ) {
    this.info(
      'onUserOffline',
      'connection',
      connection,
      'remoteUid',
      remoteUid,
      'reason',
      reason
    );
    const { remoteUsers } = this.state;
    if (remoteUsers === undefined) return;
    this.setState({
      remoteUsers: remoteUsers!.filter((value) => value !== remoteUid),
    });
  }

  render() {
    const { route } = this.props;
    const { enableVideo } = this.state;
    const bottom = this.renderBottom();
    return (
      <KeyboardAvoidingView
        style={AgoraStyle.fullSize}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={AgoraStyle.fullWidth}>{this.renderTop()}</View>
        {enableVideo ? (
          <View style={AgoraStyle.videoLarge}>{this.renderVideo()}</View>
        ) : undefined}
        {bottom ? (
          <>
            <AgoraDivider />
            <Text style={styles.title}>The Configuration of {route.name}</Text>
            <AgoraDivider />
            <ScrollView style={AgoraStyle.fullSize}>{bottom}</ScrollView>
          </>
        ) : undefined}
        <View style={AgoraStyle.float}>{this.renderFloat()}</View>
      </KeyboardAvoidingView>
    );
  }

  protected renderTop(): ReactNode {
    const { channelId, joinChannelSuccess } = this.state;
    return (
      <>
        <AgoraTextInput
          onChangeText={(text) => {
            this.setState({ channelId: text });
          }}
          placeholder={`channelId`}
          value={channelId}
        />
        <Button
          title={`${joinChannelSuccess ? 'leave' : 'join'} Channel`}
          onPress={() => {
            joinChannelSuccess ? this.leaveChannel() : this.joinChannel();
          }}
        />
      </>
    );
  }

  protected renderVideo(): ReactNode {
    const { startPreview, joinChannelSuccess, remoteUsers } = this.state;
    return (
      <>
        {startPreview || joinChannelSuccess ? (
          <RtcSurfaceView style={AgoraStyle.videoLarge} canvas={{ uid: 0 }} />
        ) : undefined}
        {remoteUsers !== undefined && remoteUsers.length > 0 ? (
          <ScrollView horizontal={true} style={AgoraStyle.videoContainer}>
            {remoteUsers.map((value, index) => (
              <RtcSurfaceView
                key={`${value}-${index}`}
                style={AgoraStyle.videoSmall}
                zOrderMediaOverlay={true}
                canvas={{ uid: value }}
              />
            ))}
          </ScrollView>
        ) : undefined}
      </>
    );
  }

  protected renderBottom(): ReactNode {
    return undefined;
  }

  protected renderFloat(): ReactNode {
    return undefined;
  }

  private _logSink(
    level: 'debug' | 'log' | 'info' | 'warn' | 'error',
    message?: any,
    ...optionalParams: any[]
  ): string {
    if (level === 'error' && !__DEV__) {
      Alert.alert(message);
    } else {
      console[level](message, optionalParams);
    }
    const content = `${optionalParams.map((v) => JSON.stringify(v))}`;
    this._data.splice(0, 0, `[${level}] ${message} ${content}`);
    return content;
  }

  protected debug(message?: any, ...optionalParams: any[]): void {
    Alert.alert(message, this._logSink('debug', message, optionalParams));
  }

  protected log(message?: any, ...optionalParams: any[]): void {
    this._logSink('log', message, optionalParams);
  }

  protected info(message?: any, ...optionalParams: any[]): void {
    this._logSink('info', message, optionalParams);
  }

  protected warn(message?: any, ...optionalParams: any[]): void {
    this._logSink('warn', message, optionalParams);
  }

  protected error(message?: any, ...optionalParams: any[]): void {
    this._logSink('error', message, optionalParams);
  }

  protected getAssetPath(fileName: string): string {
    if (Platform.OS === 'android') {
      return `/assets/${fileName}`;
    }
    return `${MainBundlePath}/${fileName}`;
  }

  protected async getAbsolutePath(filePath: string): Promise<string> {
    if (Platform.OS === 'android') {
      if (filePath.startsWith('/assets/')) {
        // const fileName = filePath;
        const fileName = filePath.replace('/assets/', '');
        const destPath = `${ExternalCachesDirectoryPath}/${fileName}`;
        if (!(await exists(destPath))) {
          await copyFileAssets(fileName, destPath);
        }
        return destPath;
      }
    }
    return filePath;
  }
}

const styles = StyleSheet.create({
  title: {
    marginVertical: 10,
    fontWeight: 'bold',
  },
});
