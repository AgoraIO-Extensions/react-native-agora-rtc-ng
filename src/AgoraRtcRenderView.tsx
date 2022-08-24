import { HostComponent, requireNativeComponent } from 'react-native';

import IAgoraRtcRenderView from './internal/IAgoraRtcRenderView';
import { VideoCanvas } from './AgoraBase';
import { RtcConnection } from './IAgoraRtcEngineEx';

const AgoraRtcSurfaceView = requireNativeComponent<{ callApi: object }>(
  'AgoraRtcSurfaceView'
);
const AgoraRtcTextureView = requireNativeComponent<{ callApi: object }>(
  'AgoraRtcTextureView'
);

/**
 * @ignore
 */
export interface RtcRendererViewProps {
  /**
   * @ignore
   */
  canvas: VideoCanvas;

  /**
   * @ignore
   */
  connection?: RtcConnection;
}

/**
 * Properties of the RtcSurfaceView.
 */
export interface RtcSurfaceViewProps extends RtcRendererViewProps {
  /**
   * Controls whether to place the surface of the RtcSurfaceView on top of the window: true: Place it on top of the window.
   * false: Do not place it on top of another RtcSurfaceView in the window.
   */
  zOrderOnTop?: boolean;

  /**
   * Controls whether to place the surface of the RtcSurfaceView on top of another RtcSurfaceView in the window (but still behind the window): true: Place it on top of another RtcSurfaceView in the window.
   * false: Do not place it on top of another RtcSurfaceView in the window.
   */
  zOrderMediaOverlay?: boolean;
}

export class RtcSurfaceView extends IAgoraRtcRenderView<RtcSurfaceViewProps> {
  get view(): HostComponent<{ callApi: object }> {
    return AgoraRtcSurfaceView;
  }
}

export class RtcTextureView extends IAgoraRtcRenderView<RtcRendererViewProps> {
  get view(): HostComponent<{ callApi: object }> {
    return AgoraRtcTextureView;
  }
}
