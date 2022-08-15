import { NativeEventEmitter, NativeModules } from 'react-native';
import base64 from 'base64-js';

import {
  IDirectCdnStreamingEventHandler,
  IMetadataObserver,
  IRtcEngineEventHandler,
  Metadata,
} from '../IAgoraRtcEngine';
import { IMediaPlayer } from '../IAgoraMediaPlayer';
import { RtcEngineInternal } from './RtcEngineInternal';
import {
  processIDirectCdnStreamingEventHandler,
  processIMetadataObserver,
  processIRtcEngineEventHandler,
} from '../impl/IAgoraRtcEngineImpl';
import { MediaPlayerInternal } from './MediaPlayerInternal';
import { processIMediaPlayerSourceObserver } from '../impl/IAgoraMediaPlayerSourceImpl';
import { Buffer } from 'buffer';
import { MediaEngineInternal } from './MediaEngineInternal';
import {
  processIAudioFrameObserver,
  processIAudioFrameObserverBase,
  processIAudioSpectrumObserver,
  processIMediaRecorderObserver,
  processIVideoEncodedFrameObserver,
  processIVideoFrameObserver,
} from '../impl/AgoraMediaBaseImpl';
import { MediaRecorderInternal } from './MediaRecorderInternal';
import { processIAudioEncodedFrameObserver } from '../impl/AgoraBaseImpl';
import {
  processIMediaPlayerAudioFrameObserver,
  processIMediaPlayerVideoFrameObserver,
} from '../impl/IAgoraMediaPlayerImpl';
import { AudioFrame, AudioSpectrumData, VideoFrame } from 'src/AgoraMediaBase';

const {
  /**
   * @ignore
   */
  ReactNativeAgoraRtcNg,
} = NativeModules;
/**
 * @ignore
 */
const EventEmitter = new NativeEventEmitter(ReactNativeAgoraRtcNg);

EventEmitter.addListener('onEvent', function (args) {
  // console.info('onEvent', args);
  let event: string = args.event;
  let data: any;
  try {
    data = JSON.parse(args.data) ?? {};
  } catch (e) {
    data = {};
  }
  const buffers: string[] = args.buffers;

  if (event.startsWith('AudioFrameObserver_')) {
    event = event.replace('AudioFrameObserver_', '');
    if (data.audioFrame) {
      (data.audioFrame as AudioFrame).buffer = Buffer.from(
        buffers[0],
        'base64'
      );
    }
    MediaEngineInternal._audio_frame_observers.forEach((value) => {
      processIAudioFrameObserver(value, event, data);
      processIAudioFrameObserverBase(value, event, data);
    });
  } else if (event.startsWith('VideoFrameObserver_')) {
    event = event.replace('VideoFrameObserver_', '');
    if (data.videoFrame) {
      (data.videoFrame as VideoFrame).yBuffer = Buffer.from(
        buffers[0],
        'base64'
      );
      (data.videoFrame as VideoFrame).uBuffer = Buffer.from(
        buffers[1],
        'base64'
      );
      (data.videoFrame as VideoFrame).vBuffer = Buffer.from(
        buffers[2],
        'base64'
      );
      // (data.videoFrame as VideoFrame).metadata_buffer = Buffer.from(buffers[3], 'base64');
      // (data.videoFrame as VideoFrame).alphaBuffer = Buffer.from(buffers[4], 'base64');
    }
    MediaEngineInternal._video_frame_observers.forEach((value) => {
      processIVideoFrameObserver(value, event, data);
    });
  } else if (event.indexOf('AudioSpectrumObserver_') >= 0) {
    if (
      data.data &&
      ((data.data as AudioSpectrumData).audioSpectrumData ?? []).indexOf(
        // @ts-ignore
        null
      ) >= 0
    ) {
      console.warn('onEvent', args);
      return;
    }
    event = event.replace('AudioSpectrumObserver_', '');
    // if (data.data) {
    //   (data.data as AudioSpectrumData).audioSpectrumData = Buffer.from(buffers[0], 'base64');
    // }
    if (event.startsWith('RtcEngine_')) {
      event = event.replace('RtcEngine_', '');
      RtcEngineInternal._audio_spectrum_observers.forEach((value) => {
        processIAudioSpectrumObserver(value, event, data);
      });
    } else if (event.startsWith('MediaPlayer_')) {
      event = event.replace('MediaPlayer_', '');
      MediaPlayerInternal._audio_spectrum_observers
        .get(data.playerId)
        ?.forEach((value) => {
          processIAudioSpectrumObserver(value, event, data);
        });
    }
  } else if (event.startsWith('AudioEncodedFrameObserver_')) {
    event = event.replace('AudioEncodedFrameObserver_', '');
    switch (event) {
      case 'OnRecordAudioEncodedFrame':
      case 'OnPlaybackAudioEncodedFrame':
      case 'OnMixedAudioEncodedFrame':
        (data.frameBuffer as Uint8Array) = Buffer.from(buffers[0], 'base64');
        break;
    }
    RtcEngineInternal._audio_encoded_frame_observers.forEach((value) => {
      processIAudioEncodedFrameObserver(value, event, data);
    });
  } else if (event.startsWith('VideoEncodedFrameObserver_')) {
    event = event.replace('VideoEncodedFrameObserver_', '');
    switch (event) {
      case 'OnEncodedVideoFrameReceived':
        (data.imageBuffer as Uint8Array) = Buffer.from(buffers[0], 'base64');
        break;
    }
    MediaEngineInternal._video_encoded_frame_observers.forEach((value) => {
      processIVideoEncodedFrameObserver(value, event, data);
    });
  } else if (event.startsWith('MediaPlayerSourceObserver_')) {
    event = event.replace('MediaPlayerSourceObserver_', '');
    MediaPlayerInternal._source_observers
      .get(data.playerId)
      ?.forEach((value) => {
        processIMediaPlayerSourceObserver(value, event, data);
      });
  }
  if (event.startsWith('MediaPlayerAudioFrameObserver_')) {
    event = event.replace('MediaPlayerAudioFrameObserver_', '');
    // if (data.frame) {
    //   (data.frame as AudioPcmFrame).data_ = Buffer.from(buffers[0], 'base64');
    // }
    MediaPlayerInternal._audio_frame_observers
      .get(data.playerId)
      ?.forEach((value) => {
        processIMediaPlayerAudioFrameObserver(value, event, data);
      });
  } else if (event.startsWith('MediaPlayerVideoFrameObserver_')) {
    event = event.replace('MediaPlayerVideoFrameObserver_', '');
    if (data.frame) {
      (data.frame as VideoFrame).yBuffer = Buffer.from(buffers[0], 'base64');
      (data.frame as VideoFrame).uBuffer = Buffer.from(buffers[1], 'base64');
      (data.frame as VideoFrame).vBuffer = Buffer.from(buffers[2], 'base64');
      (data.frame as VideoFrame).metadata_buffer = Buffer.from(
        buffers[3],
        'base64'
      );
      (data.frame as VideoFrame).alphaBuffer = Buffer.from(
        buffers[4],
        'base64'
      );
    }
    MediaPlayerInternal._video_frame_observers
      .get(data.playerId)
      ?.forEach((value) => {
        processIMediaPlayerVideoFrameObserver(value, event, data);
      });
  } else if (event.indexOf('MediaRecorderObserver_') >= 0) {
    event = event.replace('MediaRecorderObserver_', '');
    const key = (data.connection.channelId ?? '') + data.connection.localUid;
    if (MediaRecorderInternal._observers.has(key)) {
      processIMediaRecorderObserver(
        MediaRecorderInternal._observers.get(key)!,
        event,
        data
      );
    }
  } else if (event.startsWith('MetadataObserver_')) {
    event = event.replace('MetadataObserver_', '');
    switch (event) {
      case 'onMetadataReceived':
        if (data.metadata) {
          (data.metadata as Metadata).buffer = Buffer.from(
            buffers[0],
            'base64'
          );
        }
        break;
    }
    RtcEngineInternal._handlers.forEach((value) => {
      processIMetadataObserver(value as IMetadataObserver, event, data);
    });
  } else if (event.startsWith('DirectCdnStreamingEventHandler_')) {
    event = event.replace('DirectCdnStreamingEventHandler_', '');
    RtcEngineInternal._handlers.forEach((value) => {
      processIDirectCdnStreamingEventHandler(
        value as IDirectCdnStreamingEventHandler,
        event,
        data
      );
    });
  } else {
    switch (event) {
      case 'onStreamMessage':
      case 'onStreamMessageEx':
        data.data = Buffer.from(buffers[0], 'base64');
        break;
    }
    RtcEngineInternal._handlers.forEach((value) => {
      if (event.endsWith('Ex')) {
        event = event.replace('Ex', '');
      }
      processIRtcEngineEventHandler(
        value as IRtcEngineEventHandler,
        event,
        data
      );
    });
  }
});

export function callIrisApi<T>(funcName: string, params: any): any {
  try {
    const buffers: string[] = [];

    if (funcName.startsWith('MediaEngine_')) {
      switch (funcName) {
        case 'MediaEngine_pushAudioFrame':
        case 'MediaEngine_pushCaptureAudioFrame':
        case 'MediaEngine_pushReverseAudioFrame':
        case 'MediaEngine_pushDirectAudioFrame':
          // frame.buffer
          buffers.push(base64.fromByteArray(params.frame.buffer));
          break;
        case 'MediaEngine_pushVideoFrame':
          // frame.buffer
          buffers.push(base64.fromByteArray(params.frame.buffer));
          // frame.eglContext
          buffers.push(base64.fromByteArray(Buffer.from('')));
          // frame.metadata_buffer
          buffers.push(base64.fromByteArray(Buffer.from('')));
          break;
        case 'MediaEngine_pushEncodedVideoImage':
          // imageBuffer
          buffers.push(base64.fromByteArray(params.imageBuffer));
          break;
      }
    } else if (funcName.startsWith('MediaPlayer_')) {
      // @ts-ignore
      params.mediaPlayerId = (this as IMediaPlayer).getMediaPlayerId();
      const json = params.toJSON?.call();
      params.toJSON = function () {
        return { ...json, playerId: params.mediaPlayerId };
      };
    } else if (funcName.startsWith('RtcEngine_')) {
      switch (funcName) {
        case 'RtcEngine_initialize':
          ReactNativeAgoraRtcNg.newIrisApiEngine();
          break;
        case 'RtcEngine_release':
          ReactNativeAgoraRtcNg.callApi({
            funcName,
            params: JSON.stringify(params),
            buffers,
          });
          ReactNativeAgoraRtcNg.destroyIrisApiEngine();
          return;
        case 'RtcEngine_sendMetaData':
          // metadata.buffer
          buffers.push(base64.fromByteArray(params.metadata.buffer));
          break;
        case 'RtcEngine_sendStreamMessage':
        case 'RtcEngine_sendStreamMessageEx':
          // data
          buffers.push(base64.fromByteArray(params.data));
          break;
        case 'RtcEngine_destroyMediaPlayer':
          // @ts-ignore
          params.mediaPlayerId = params.media_player.getMediaPlayerId();
          params.toJSON = function () {
            return { playerId: params.mediaPlayerId };
          };
          break;
      }
    }

    let ret = ReactNativeAgoraRtcNg.callApi({
      funcName,
      params: JSON.stringify(params),
      buffers,
    });
    if (ret) {
      ret = JSON.parse(ret) ?? {};
      if (typeof ret.result === 'number' && ret.result < 0) {
        console.error('callApi', funcName, JSON.stringify(params), ret);
      } else {
        console.debug('callApi', funcName, JSON.stringify(params), ret);
      }
      return ret;
    }
  } catch (e) {
    console.error(e);
  }
}
