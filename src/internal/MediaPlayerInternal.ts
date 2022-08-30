import { IMediaPlayerSourceObserver } from '../IAgoraMediaPlayerSource';
import { ErrorCodeType } from '../AgoraBase';
import { IAudioSpectrumObserver } from '../AgoraMediaBase';
import { IMediaPlayerImpl } from '../impl/IAgoraMediaPlayerImpl';
import {
  IMediaPlayerAudioFrameObserver,
  IMediaPlayerVideoFrameObserver,
} from '../IAgoraMediaPlayer';

export class MediaPlayerInternal extends IMediaPlayerImpl {
  static _source_observers: Map<number, IMediaPlayerSourceObserver[]> = new Map<
    number,
    IMediaPlayerSourceObserver[]
  >();
  static _audio_frame_observers: Map<number, IMediaPlayerAudioFrameObserver[]> =
    new Map<number, IMediaPlayerAudioFrameObserver[]>();
  static _video_frame_observers: Map<number, IMediaPlayerVideoFrameObserver[]> =
    new Map<number, IMediaPlayerVideoFrameObserver[]>();
  static _audio_spectrum_observers: Map<number, IAudioSpectrumObserver[]> =
    new Map<number, IAudioSpectrumObserver[]>();
  private readonly _mediaPlayerId: number;

  constructor(mediaPlayerId: number) {
    super();
    this._mediaPlayerId = mediaPlayerId;
  }

  getMediaPlayerId(): number {
    return this._mediaPlayerId;
  }

  registerPlayerSourceObserver(observer: IMediaPlayerSourceObserver): number {
    let observers = MediaPlayerInternal._source_observers.get(
      this._mediaPlayerId
    );
    if (observers === undefined) {
      observers = [];
      MediaPlayerInternal._source_observers.set(this._mediaPlayerId, observers);
    }
    if (!observers.find((value) => value === observer)) {
      observers.push(observer);
    }
    return super.registerPlayerSourceObserver(observer);
  }

  unregisterPlayerSourceObserver(observer: IMediaPlayerSourceObserver): number {
    let observers = MediaPlayerInternal._source_observers.get(
      this._mediaPlayerId
    );
    if (observers === undefined) return -ErrorCodeType.ErrFailed;
    MediaPlayerInternal._source_observers.set(
      this._mediaPlayerId,
      observers.filter((value) => value !== observer)
    );
    return super.unregisterPlayerSourceObserver(observer);
  }

  registerAudioFrameObserver(observer: IMediaPlayerAudioFrameObserver): number {
    let observers = MediaPlayerInternal._audio_frame_observers.get(
      this._mediaPlayerId
    );
    if (observers === undefined) {
      observers = [];
      MediaPlayerInternal._audio_frame_observers.set(
        this._mediaPlayerId,
        observers
      );
    }
    if (!observers.find((value) => value === observer)) {
      observers.push(observer);
    }
    return super.registerAudioFrameObserver(observer);
  }

  unregisterAudioFrameObserver(
    observer: IMediaPlayerAudioFrameObserver
  ): number {
    let observers = MediaPlayerInternal._audio_frame_observers.get(
      this._mediaPlayerId
    );
    if (observers === undefined) return -ErrorCodeType.ErrFailed;
    MediaPlayerInternal._audio_frame_observers.set(
      this._mediaPlayerId,
      observers.filter((value) => value !== observer)
    );
    return super.unregisterAudioFrameObserver(observer);
  }

  registerVideoFrameObserver(observer: IMediaPlayerVideoFrameObserver): number {
    let observers = MediaPlayerInternal._video_frame_observers.get(
      this._mediaPlayerId
    );
    if (observers === undefined) {
      observers = [];
      MediaPlayerInternal._video_frame_observers.set(
        this._mediaPlayerId,
        observers
      );
    }
    if (!observers.find((value) => value === observer)) {
      observers.push(observer);
    }
    return super.registerVideoFrameObserver(observer);
  }

  unregisterVideoFrameObserver(
    observer: IMediaPlayerVideoFrameObserver
  ): number {
    let observers = MediaPlayerInternal._video_frame_observers.get(
      this._mediaPlayerId
    );
    if (observers === undefined) return -ErrorCodeType.ErrFailed;
    MediaPlayerInternal._video_frame_observers.set(
      this._mediaPlayerId,
      observers.filter((value) => value !== observer)
    );
    return super.unregisterVideoFrameObserver(observer);
  }

  registerMediaPlayerAudioSpectrumObserver(
    observer: IAudioSpectrumObserver,
    intervalInMS: number
  ): number {
    let observers = MediaPlayerInternal._audio_spectrum_observers.get(
      this._mediaPlayerId
    );
    if (observers === undefined) {
      observers = [];
      MediaPlayerInternal._audio_spectrum_observers.set(
        this._mediaPlayerId,
        observers
      );
    }
    if (!observers.find((value) => value === observer)) {
      observers.push(observer);
    }
    return super.registerMediaPlayerAudioSpectrumObserver(
      observer,
      intervalInMS
    );
  }

  unregisterMediaPlayerAudioSpectrumObserver(
    observer: IAudioSpectrumObserver
  ): number {
    let observers = MediaPlayerInternal._audio_spectrum_observers.get(
      this._mediaPlayerId
    );
    if (observers === undefined) return -ErrorCodeType.ErrFailed;
    MediaPlayerInternal._audio_spectrum_observers.set(
      this._mediaPlayerId,
      observers.filter((value) => value !== observer)
    );
    return super.unregisterMediaPlayerAudioSpectrumObserver(observer);
  }

  protected getApiTypeFromSetPlayerOptionInInt(
    key: string,
    value: number
  ): string {
    return 'MediaPlayer_setPlayerOption';
  }

  protected getApiTypeFromSetPlayerOptionInString(
    key: string,
    value: string
  ): string {
    return 'MediaPlayer_setPlayerOption2';
  }
}
